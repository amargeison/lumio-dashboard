import { inflateSync } from 'zlib'

// Is this really a photo?
//
// The upload routes used to look at the first few bytes only, so the eight-byte
// PNG signature followed by a web page was stored as a child's photo. There is
// no image library in this project, so the file's own structure is checked
// instead, for the three kinds a browser produces:
//
//   PNG   every chunk's length and checksum, a proper header first, the image
//         data actually unpacked and the right size for the picture, the end
//         marker last and nothing after it.
//   JPEG  every segment walked from the first marker to the end-of-image
//         marker, a frame header with sane dimensions, picture data present,
//         and nothing after the end.
//   WebP  the container's stated size matches the file, a picture chunk with
//         sane dimensions, and every chunk accounted for.
//
// Anything else — including a real image with extra bytes tacked on the end —
// is refused. Returns what the bytes are, or null.

export type ImageInfo = { kind: 'jpeg' | 'png' | 'webp'; width: number; height: number }

// Bigger than any photo we keep (they are shrunk to a few hundred pixels before
// upload); a header claiming more is not a profile photo.
const MAX_SIDE = 12_000
const MAX_PIXELS = 50_000_000
const saneSize = (w: number, h: number) => w >= 1 && h >= 1 && w <= MAX_SIDE && h <= MAX_SIDE && w * h <= MAX_PIXELS

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

// The checksum PNG uses on every chunk (CRC-32). Written out here because
// older Node versions do not have one built in.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 }
  return t
})()
function crc32(b: Buffer): number {
  let c = 0xffffffff
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function checkPng(b: Buffer): ImageInfo | null {
  let at = 8
  let width = 0, height = 0, depth = 0, colour = 0, interlace = 0
  let seenHeader = false, seenEnd = false
  const data: Buffer[] = []
  while (at + 12 <= b.length) {
    const len = b.readUInt32BE(at)
    const type = b.subarray(at + 4, at + 8).toString('latin1')
    const end = at + 12 + len
    if (!/^[A-Za-z]{4}$/.test(type) || end > b.length) return null
    if (crc32(b.subarray(at + 4, at + 8 + len)) !== b.readUInt32BE(at + 8 + len)) return null
    const body = b.subarray(at + 8, at + 8 + len)
    if (!seenHeader) {
      // The header must come first and be exactly thirteen bytes.
      if (type !== 'IHDR' || len !== 13) return null
      width = body.readUInt32BE(0); height = body.readUInt32BE(4)
      depth = body[8]; colour = body[9]; interlace = body[12]
      const depths: Record<number, number[]> = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] }
      if (!depths[colour]?.includes(depth) || body[10] !== 0 || body[11] !== 0 || interlace > 1 || !saneSize(width, height)) return null
      seenHeader = true
    } else if (type === 'IHDR') {
      return null
    } else if (type === 'IDAT') {
      data.push(body)
    } else if (type === 'IEND') {
      if (len !== 0) return null
      seenEnd = true
      at = end
      break
    }
    at = end
  }
  // The end marker has to be there, and be the last thing in the file.
  if (!seenHeader || !seenEnd || at !== b.length || !data.length) return null
  // Unpack the picture and check it is exactly as big as the header says. Each
  // row is one filter byte plus its pixels; an interlaced image is seven
  // smaller passes, each laid out the same way.
  const channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 } as Record<number, number>)[colour]
  const pass = (w: number, h: number) => (w > 0 && h > 0 ? h * (1 + Math.ceil((w * channels * depth) / 8)) : 0)
  const expected = interlace
    ? [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]]
        .reduce((n, [x, y, dx, dy]) => n + pass(Math.ceil((width - x) / dx), Math.ceil((height - y) / dy)), 0)
    : pass(width, height)
  try {
    const raw = inflateSync(Buffer.concat(data), { maxOutputLength: expected + 1 })
    if (raw.length !== expected) return null
  } catch { return null }
  return { kind: 'png', width, height }
}

function checkJpeg(b: Buffer): ImageInfo | null {
  let at = 2
  let width = 0, height = 0
  let seenFrame = false, seenScan = false
  while (at + 2 <= b.length) {
    if (b[at] !== 0xff) return null
    // Padding: any number of 0xFF bytes may come before a marker.
    while (at < b.length && b[at + 1] === 0xff) at++
    const marker = b[at + 1]
    if (marker === undefined) return null
    if (marker === 0xd9) {
      // End of image: there must have been a picture, and nothing may follow.
      return seenFrame && seenScan && at + 2 === b.length ? { kind: 'jpeg', width, height } : null
    }
    if (marker === 0x00 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) return null
    if (at + 4 > b.length) return null
    const len = b.readUInt16BE(at + 2)
    if (len < 2 || at + 2 + len > b.length) return null
    const isFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
    if (isFrame) {
      if (seenFrame || len < 8) return null
      height = b.readUInt16BE(at + 5); width = b.readUInt16BE(at + 7)
      const parts = b[at + 9]
      if (![1, 3, 4].includes(parts) || len !== 8 + parts * 3 || !saneSize(width, height)) return null
      seenFrame = true
    }
    at += 2 + len
    if (marker === 0xda) {
      // Start of scan: the picture data runs until the next real marker. Inside
      // it 0xFF is always followed by 0x00 or a restart marker.
      if (!seenFrame) return null
      seenScan = true
      const from = at
      while (at < b.length) {
        if (b[at] !== 0xff) { at++; continue }
        const next = b[at + 1]
        if (next === 0x00 || (next !== undefined && next >= 0xd0 && next <= 0xd7)) { at += 2; continue }
        break
      }
      if (at === from) return null   // a scan with no data in it
    }
  }
  return null
}

function checkWebp(b: Buffer): ImageInfo | null {
  // RIFF <size> WEBP — the size is everything after those first eight bytes.
  if (b.length < 30 || b.readUInt32LE(4) + 8 !== b.length) return null
  let at = 12
  let info: ImageInfo | null = null
  let hasPicture = false
  let first = true
  while (at + 8 <= b.length) {
    const type = b.subarray(at, at + 4).toString('latin1')
    const len = b.readUInt32LE(at + 4)
    const body = at + 8
    if (body + len > b.length) return null
    if (first && !['VP8 ', 'VP8L', 'VP8X'].includes(type)) return null
    if (type === 'VP8X' && first) {
      if (len < 10) return null
      info = { kind: 'webp', width: 1 + b.readUIntLE(body + 4, 3), height: 1 + b.readUIntLE(body + 7, 3) }
    } else if (type === 'VP8 ') {
      // A key frame: three bytes of frame tag, then the start code 9D 01 2A.
      if (len < 10 || (b[body] & 1) !== 0 || b[body + 3] !== 0x9d || b[body + 4] !== 0x01 || b[body + 5] !== 0x2a) return null
      hasPicture = true
      if (!info) info = { kind: 'webp', width: b.readUInt16LE(body + 6) & 0x3fff, height: b.readUInt16LE(body + 8) & 0x3fff }
    } else if (type === 'VP8L') {
      if (len < 5 || b[body] !== 0x2f) return null
      hasPicture = true
      const bits = b.readUInt32LE(body + 1)
      if (!info) info = { kind: 'webp', width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) }
    } else if (type === 'ANMF') {
      hasPicture = true
    }
    first = false
    at = body + len + (len & 1)   // chunks are padded to an even length
  }
  if (at !== b.length && at !== b.length + 1) return null
  return info && hasPicture && saneSize(info.width, info.height) ? info : null
}

export function checkImage(b: Buffer): ImageInfo | null {
  try {
    if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return checkJpeg(b)
    if (b.length > 8 && b.subarray(0, 8).equals(PNG_SIG)) return checkPng(b)
    if (b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return checkWebp(b)
  } catch { /* a file that cannot be read through is not a photo */ }
  return null
}

/** The content type to serve a stored photo with, from its first bytes only
    (cheap — for reading back something that was checked when it was stored). */
export function imageTypeOf(b: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.length > 8 && b.subarray(0, 8).equals(PNG_SIG)) return 'image/png'
  if (b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp'
  return null
}
