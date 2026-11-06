// "Import booklet JSON": checks a file before anything is saved, and says what's wrong
// in plain words. Pure: no database, no browser. Keys it doesn't know, such as "source",
// are left out. The PDF is uploaded separately, and video links stay as they are unless
// the file has its own.

import type { Booklet, BookletSticker, BookletWarmUp, BookletWeek } from './packs'

export const MAX_BOOKLET_JSON_BYTES = 256 * 1024
const MAX_TEXT = 4000
const VIDEO_KEY = /^[a-z0-9-]{1,40}$/

export const httpsUrl = (v: unknown): v is string => {
  if (typeof v !== 'string') return false
  try { return new URL(v).protocol === 'https:' } catch { return false }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

export function readBookletJson(raw: string): { booklet: Booklet | null; problems: string[] } {
  let d: unknown
  try { d = JSON.parse(raw) } catch { return { booklet: null, problems: ['That file isn’t valid JSON.'] } }
  if (!isObject(d)) return { booklet: null, problems: ['That file isn’t a booklet: it should be one object with a title, weeks and stickers.'] }

  const problems: string[] = []
  const text = (o: Record<string, unknown>, key: string, where: string) => {
    const v = o[key]
    if (v === undefined || v === null) return ''
    if (typeof v !== 'string') { problems.push(`${where}: ${key} should be text.`); return '' }
    if (v.length > MAX_TEXT) { problems.push(`${where}: ${key} is too long.`); return '' }
    return v.trim()
  }

  const title = text(d, 'title', 'Booklet')
  if (!title) problems.push('The booklet needs a title.')

  const weeks: BookletWeek[] = []
  if (!Array.isArray(d.weeks) || !d.weeks.length) problems.push('The booklet needs a list of weeks.')
  else if (d.weeks.length > 10) problems.push('The booklet has more than ten weeks.')
  else d.weeks.forEach((w: unknown, i: number) => {
    const where = `Week entry ${i + 1}`
    if (!isObject(w)) { problems.push(`${where} isn’t a week.`); return }
    const n = w.week
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > 10) { problems.push(`${where}: week should be a number from 1 to 10.`); return }
    if (weeks.some(x => x.week === n)) { problems.push(`Week ${n} is in the file twice.`); return }
    const video = text(w, 'video', `Week ${n}`)
    if (video && !VIDEO_KEY.test(video)) problems.push(`Week ${n}: video should be a short key such as "forehand".`)
    if (w.scorecard !== undefined && typeof w.scorecard !== 'boolean') problems.push(`Week ${n}: scorecard should be true or false.`)
    weeks.push({
      week: n, title: text(w, 'title', `Week ${n}`), focus: text(w, 'focus', `Week ${n}`), home_task: text(w, 'home_task', `Week ${n}`),
      top_tip: text(w, 'top_tip', `Week ${n}`), did_you_know: text(w, 'did_you_know', `Week ${n}`), video, scorecard: w.scorecard === true,
    })
  })

  const stickers: BookletSticker[] = []
  if (!Array.isArray(d.stickers)) problems.push('The booklet needs a list of stickers.')
  else if (d.stickers.length > 20) problems.push('The booklet has more than twenty stickers.')
  else d.stickers.forEach((s: unknown, i: number) => {
    const where = `Sticker ${i + 1}`
    if (!isObject(s)) { problems.push(`${where} isn’t a sticker.`); return }
    const id = text(s, 'id', where), label = text(s, 'label', where)
    if (!id || !label) { problems.push(`${where} needs an id and a label.`); return }
    if (stickers.some(x => x.id === id)) { problems.push(`Sticker id "${id}" is in the file twice.`); return }
    stickers.push({ id, label, description: text(s, 'description', where) })
  })

  let warm_up: BookletWarmUp = {}
  if (d.warm_up !== undefined && d.warm_up !== null) {
    if (!isObject(d.warm_up)) problems.push('warm_up should be an object.')
    else {
      const facts = d.warm_up.did_you_know ?? []
      if (!Array.isArray(facts) || facts.some(f => typeof f !== 'string' || f.length > MAX_TEXT)) problems.push('warm_up: did_you_know should be a list of text.')
      else warm_up = { title: text(d.warm_up, 'title', 'warm_up'), text: text(d.warm_up, 'text', 'warm_up'), did_you_know: facts.map(f => (f as string).trim()).filter(Boolean) }
    }
  }

  let videos: Record<string, string> | undefined
  if (d.videos !== undefined && d.videos !== null) {
    if (!isObject(d.videos)) problems.push('videos should be an object of key and link.')
    else {
      videos = {}
      for (const [k, v] of Object.entries(d.videos)) {
        if (!VIDEO_KEY.test(k) || !httpsUrl(v)) problems.push(`videos: "${k}" needs an https link.`)
        else videos[k] = v
      }
    }
  }

  const booklet: Booklet = {
    title, intro: text(d, 'intro', 'Booklet'), motto: text(d, 'motto', 'Booklet'), values: text(d, 'values', 'Booklet'),
    website: text(d, 'website', 'Booklet'), hashtag: text(d, 'hashtag', 'Booklet'), warm_up,
    completion: text(d, 'completion', 'Booklet'), tenors: text(d, 'tenors', 'Booklet'), notes_prompt: text(d, 'notes_prompt', 'Booklet'),
    weeks: [...weeks].sort((a, b) => a.week - b.week), stickers, ...(videos ? { videos } : {}),
  }
  return problems.length ? { booklet: null, problems } : { booklet, problems: [] }
}
