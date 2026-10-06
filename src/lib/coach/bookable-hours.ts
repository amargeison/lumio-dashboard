// Reading the "Bookable hours" a coach types in Settings ("08:00 – 20:00",
// "8am-8pm", "07:30 to 21:00").
//
// In a file of its own because two places need the same reading: the booking
// links (on the server) use it to offer start times, and the Settings box (in
// the browser) uses it to say when what was typed cannot be read — it used to
// take "whenever" without a word and quietly offer 08:00–20:00.

/** Minutes from midnight for the start and the end, or null when the text is
    not a start time followed by a later end time. */
export function readHours(v: unknown): { start: number; end: number } | null {
  const s = String(v ?? '')
  const nums = [...s.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi)]
  if (nums.length < 2) return null
  const at = (m: RegExpMatchArray) => {
    let h = Number(m[1]) % 24
    const mm = Number(m[2] || 0)
    const ap = (m[3] || '').toLowerCase()
    if (ap === 'pm' && h < 12) h += 12
    if (ap === 'am' && h === 12) h = 0
    return h * 60 + Math.min(59, mm)
  }
  const start = at(nums[0]), end = at(nums[nums.length - 1])
  return end > start ? { start, end } : null
}
