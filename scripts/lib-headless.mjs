// Opens a page in headless Chrome with a throwaway profile and waits, in real time, for
// its text to match. (--dump-dom with a virtual clock can catch the page mid-load.)
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
export const haveChrome = existsSync(CHROME)
const wait = ms => new Promise(r => setTimeout(r, ms))

/** → { text, ms, matched }: the page's visible text once `until` matched (or at timeout). `settle` waits on afterwards; `init` runs before the page's own scripts. */
export async function openPage(url, until, { timeout = 30000, settle = 2000, init = '' } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'lumio-chrome-'))
  const proc = spawn(CHROME, [`--user-data-dir=${dir}`, '--headless=new', '--disable-gpu', '--mute-audio', '--no-first-run', '--remote-debugging-port=0', 'about:blank'], { stdio: 'ignore' })
  const exited = new Promise(r => proc.once('exit', r))
  try {
    const file = join(dir, 'DevToolsActivePort')
    for (let i = 0; i < 150 && !(existsSync(file) && readFileSync(file, 'utf8').includes('\n')); i++) await wait(100)
    const port = readFileSync(file, 'utf8').split('\n')[0]
    const page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page')
    const ws = new WebSocket(page.webSocketDebuggerUrl)
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
    let n = 0
    const call = (method, params = {}) => new Promise(r => {
      const id = ++n
      const on = e => { const m = JSON.parse(e.data); if (m.id === id) { ws.removeEventListener('message', on); r(m.result) } }
      ws.addEventListener('message', on)
      ws.send(JSON.stringify({ id, method, params }))
    })
    const read = async () => (await call('Runtime.evaluate', { expression: `(document.body?.innerText ?? '') + '\\n' + [...document.querySelectorAll('a')].map(a => a.getAttribute('href')).join(' ') + '\\n' + [...document.querySelectorAll('input')].map(i => 'input:' + i.type).join(' ')`, returnByValue: true }))?.result?.value ?? ''
    if (init) { await call('Page.enable'); await call('Page.addScriptToEvaluateOnNewDocument', { source: init }) }
    const start = Date.now()
    await call('Page.navigate', { url })
    let text = '', matched = false
    while (!matched && Date.now() - start < timeout) { await wait(150); text = await read(); matched = until.test(text) }
    const ms = Date.now() - start
    await wait(settle)
    text = await read()
    ws.close()
    return { text, ms, matched: until.test(text) }
  } finally {
    proc.kill()
    await exited
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
}
