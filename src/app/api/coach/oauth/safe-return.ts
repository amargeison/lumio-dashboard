// Where a coach is sent back to after connecting a calendar.
//
// The value comes from the address bar (and then a cookie), so anybody can put
// anything in it. Left unchecked, a link to this site would forward a signed-in
// coach to whatever site the link named — a ready-made way to dress a phishing
// page up as Lumio. Only a path on this site is accepted; anything else goes to
// the home page.
export function safeReturnPath(value: string | null | undefined): string {
  const v = (value || '').trim()
  // One leading slash, then not another slash or a backslash ("//host" and
  // "/\\host" are both read by browsers as a different site), and nothing a
  // browser would strip before reading it.
  if (!/^\/(?![\/\\])/.test(v)) return '/'
  if (/[\\\u0000-\u001f\u007f]/.test(v)) return '/'
  return v
}
