// "Export everything" (Settings → Data): the ZIP writer, the CSV rules, which tables go
// in, and when the scheduler expires an export. The routes, the requester-only link and
// the 7-day deletion against the real bucket are in scripts/impact-settings-test.mjs.
import test from 'node:test'
import assert from 'node:assert/strict'
import { inflateRawSync } from 'node:zlib'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import './brackenmoor.mjs'   // registers the @/ import hooks

const Z = await import('../../src/lib/impact/zip.ts')
const E = await import('../../src/lib/impact/exports.ts')

/** Reads a ZIP back through its central directory, checking each CRC. */
function unzip(buf) {
  const end = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  const n = buf.readUInt16LE(end + 10), dirAt = buf.readUInt32LE(end + 16)
  const out = {}
  for (let i = 0, p = dirAt; i < n; i++) {
    assert.equal(buf.readUInt32LE(p), 0x02014b50)
    const crc = buf.readUInt32LE(p + 16), size = buf.readUInt32LE(p + 20), nameLen = buf.readUInt16LE(p + 28), local = buf.readUInt32LE(p + 42)
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8')
    const lname = buf.readUInt16LE(local + 26), lextra = buf.readUInt16LE(local + 28)
    const data = inflateRawSync(buf.subarray(local + 30 + lname + lextra, local + 30 + lname + lextra + size))
    assert.equal(Z.crc32(data), crc, `CRC of ${name}`)
    out[name] = data.toString('utf8')
    p += 46 + nameLen
  }
  return out
}

test('zip: round trip, UTF-8 names and text, CRC-32 known value', () => {
  assert.equal(Z.crc32(Buffer.from('123456789')), 0xcbf43926)
  const zip = Z.createZip([{ name: 'README.txt', data: 'hello' }, { name: 'tp_families.csv', data: 'name\r\nZoë Ó’Brien\r\n' }, { name: 'empty.csv', data: '' }])
  const files = unzip(zip)
  assert.deepEqual(Object.keys(files), ['README.txt', 'tp_families.csv', 'empty.csv'])
  assert.equal(files['tp_families.csv'], 'name\r\nZoë Ó’Brien\r\n')
  assert.equal(files['empty.csv'], '')
  // The system's own unzip agrees, where there is one.
  try {
    const dir = mkdtempSync(join(tmpdir(), 'zip-')), f = join(dir, 'a.zip'); writeFileSync(f, zip)
    assert.match(execFileSync('unzip', ['-t', f]).toString(), /No errors detected/)
  } catch (e) { if (e.code !== 'ENOENT') throw e }
})

test('csv: quoting, JSON cells, formula-looking text defused, numbers left alone', () => {
  assert.equal(E.csvCell(null), '')
  assert.equal(E.csvCell('plain'), 'plain')
  assert.equal(E.csvCell('a,b'), '"a,b"')
  assert.equal(E.csvCell('say "hi"'), '"say ""hi"""')
  assert.equal(E.csvCell('line\nbreak'), '"line\nbreak"')
  assert.equal(E.csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`)
  assert.equal(E.csvCell('+44 7700'), "'+44 7700")
  assert.equal(E.csvCell('@sum'), "'@sum")
  assert.equal(E.csvCell(-5), '-5')
  assert.equal(E.csvCell({ a: [1, 2] }), '"{""a"":[1,2]}"')
  assert.equal(E.csvCell(true), 'true')
  const csv = E.toCsv([{ id: 1, name: 'A' }, { id: 2, extra: 'x' }])
  assert.equal(csv, '﻿id,name,extra\r\n1,A,\r\n2,,x\r\n')
})

test('tables: every one is org-scoped and none holds a login token', () => {
  const names = E.EXPORT_TABLES.map(t => t.table)
  assert.equal(new Set(names).size, names.length, 'no table twice')
  for (const n of E.NOT_EXPORTED) assert.ok(!names.includes(n), `${n} is left out`)
  for (const must of ['tp_families', 'tp_children', 'tp_attendance', 'impact_messages', 'impact_settings_log', 'impact_orgs']) assert.ok(names.includes(must), must)
  for (const t of E.EXPORT_TABLES) assert.ok(t.order.length >= 1, `${t.table} has a paging order`)
})

test('expiry: ready past 7 days → expire; stuck build → fail; the rest left', () => {
  const now = new Date('2026-12-10T12:00:00Z')
  const row = (status, created, expires, path = 'h/x.zip') => ({ id: 'x', hq_id: 'h', status, path, created_at: created, expires_at: expires })
  assert.equal(E.exportAction(row('ready', '2026-12-03T11:00:00Z', '2026-12-10T11:00:00Z'), now), 'expire')
  assert.equal(E.exportAction(row('ready', '2026-12-03T13:00:00Z', '2026-12-10T13:00:00Z'), now), null, 'not yet')
  assert.equal(E.exportAction(row('building', '2026-12-10T10:30:00Z', '2026-12-17T10:30:00Z', null), now), 'fail')
  assert.equal(E.exportAction(row('building', '2026-12-10T11:30:00Z', '2026-12-17T11:30:00Z', null), now), null, 'still building')
  assert.equal(E.exportAction(row('expired', '2026-11-01T00:00:00Z', '2026-11-08T00:00:00Z', null), now), null)
  assert.equal(E.exportAction(row('failed', '2026-11-01T00:00:00Z', '2026-11-08T00:00:00Z', null), now), null, 'no file to delete')
  assert.equal(E.EXPORT_DAYS, 7)
})

test('limits: one at a time, a gap between, a daily cap', () => {
  const now = new Date('2026-12-10T12:00:00Z'), ago = m => new Date(now.getTime() - m * 60_000).toISOString()
  assert.equal(E.exportAllowed([], now).ok, true)
  assert.equal(E.exportAllowed([{ status: 'building', created_at: ago(30) }], now).ok, false)
  assert.equal(E.exportAllowed([{ status: 'ready', created_at: ago(5) }], now).ok, false)
  assert.equal(E.exportAllowed([{ status: 'ready', created_at: ago(15) }], now).ok, true)
  assert.equal(E.exportAllowed(Array.from({ length: 5 }, (_, i) => ({ status: 'ready', created_at: ago(60 * (i + 1)) })), now).ok, false)
  assert.equal(E.exportAllowed(Array.from({ length: 5 }, (_, i) => ({ status: 'ready', created_at: ago(60 * 25 + i) })), now).ok, true, 'yesterday’s don’t count')
})

test('email: the link, the expiry date, no data in it', () => {
  const m = E.exportEmail({ org: 'Ten <Project>', link: 'https://www.lumiosports.com/api/impact/settings/export/abc', expires: new Date('2026-12-17T12:00:00Z') })
  assert.match(m.subject, /data export is ready/)
  assert.match(m.html, /href="https:\/\/www\.lumiosports\.com\/api\/impact\/settings\/export\/abc"/)
  assert.match(m.html, /Thursday 17 December/)
  assert.match(m.html, /Ten &lt;Project&gt;/)
  assert.match(m.html, /signed in/)
})
