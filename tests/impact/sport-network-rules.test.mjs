import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPanel, citationProblem, fundingHeadline, HERO_FALLBACK, missingFigure, normalise, pageText } from '../../src/lib/impact/sport-network-rules.ts'

const U = 'https://www.gov.uk/guidance'
const PAGE = 'The transition payment rises from £100 million to £150 million. Academies are paid on 9 November 2026. Network support starts from April 2027. The return closes at 5pm on 31 July 2027. £580m goes to the Network and £200m to facilities.'
const pages = new Map([[U, { text: PAGE, title: 'Guidance - GOV.UK' }]])
const current = { updatedAt: '2026-11-05', hero: { kicker: 'K', title: 'T', body: 'old' }, keyFacts: [], premium: { title: 'P', rows: [] }, timeline: [], guidance: [], sources: [] }
const q = s => ({ url: U, quote: s })
const fact = (title, body, quote) => ({ title, body, ...q(quote) })

test('normalise: money, months, punctuation', () => { assert.equal(normalise('£150 Million on 9th Sept'), '£150m on 9 sep'); assert.equal(normalise('it’s £1,000'), "it's £1000") })
test('pageText strips scripts and entities', () => assert.equal(pageText('<script>x</script><p>a &amp; b &#163;5</p>').replace(/\s+/g, ' ').trim(), 'a & b £5'))
test('figures: amount must be in the quote, not just the page', () => assert.equal(missingFigure('£580m goes to the Network', 'The payment rises from £100 million', PAGE), '£580m'))
test('figures: £1m is not £150m', () => assert.equal(missingFigure('£15m', 'costing £150m in all', PAGE), '£15m'))
test('figures: a date must be on the page', () => assert.equal(missingFigure('Partner appointed in March 2028', 'procurement is expected to begin soon', PAGE), 'mar 2028'))
test('figures: a date on the page passes without being quoted', () => assert.equal(missingFigure('Published 9 November 2026', 'procurement is expected to begin soon', PAGE), null))
test('figures: a month in the quote takes its year from the page', () => assert.equal(missingFigure('November 2027', 'bidder announced in November', 'bidder announced in November, support from April 2027'), null))
test('figures: amounts must still be quoted, even if on the page', () => assert.equal(missingFigure('£580m', 'Network support starts from April 2027', PAGE), '£580m'))
test('citation: a second quote can carry the figure', () => assert.equal(citationProblem('£580m from April 2027', { ...q('Network support starts from April 2027'), quote2: '£580m goes to the Network' }, pages), null))
test('citation: both quotes must be on the page', () => assert.equal(citationProblem('A claim', { ...q('Network support starts from April 2027'), quote2: 'this one was never there' }, pages), 'quote is not on the page'))
test('citation: quote must be on the page', () => assert.equal(citationProblem('A claim', q('this sentence is not on the page'), pages), 'quote is not on the page'))
test('citation: unfetched page refused', () => assert.equal(citationProblem('A claim', { url: 'https://www.gov.uk/other', quote: 'long enough quote here' }, pages), 'source page could not be fetched'))
test('citation: other domains refused', () => assert.equal(citationProblem('A claim', { url: 'https://example.com/a', quote: 'long enough quote here' }, pages), 'no allowed source URL'))
test('citation: curly quotes and spacing tolerated', () => assert.equal(citationProblem('Support from April 2027', q('Network  support starts from April 2027'), pages), null))
test('citation: punctuation differences allowed, added words are not', () => {
  const table = new Map([[U, { text: 'Payment date 30 October 2026 9 November 2026', title: '' }]])
  assert.equal(citationProblem('30 October 2026', q('Payment date: 30 October 2026; 9 November 2026'), table), null)
  assert.equal(citationProblem('9 November 2026', q('Payment date: 9 November 2026 [Academies]'), table), 'quote is not on the page')
})
test('figures: a leading zero on a date still matches', () => assert.equal(missingFigure('9 July 2026', 'we are increasing the funding', 'Update 09 July 2026'), null))
test('citation: listing pages are refused, however good the quote', () => {
  const l = 'https://www.youthsporttrust.org/news-listings/news?page=1'
  const p = new Map([[l, { text: PAGE, title: '' }]])
  assert.equal(citationProblem('Network support', { url: l, quote: 'Network support starts from April 2027' }, p), 'cites a listing page, not the article')
})
test('headline agrees with its parts', () => { assert.equal(fundingHeadline([580, 200, 150]), 'Almost £1bn (£930m)'); assert.equal(fundingHeadline([500, 700]), 'Around £1.2bn'); assert.equal(fundingHeadline([300, 100]), 'Around £400m') })

const rows = ['a', 'b', 'c'].map(l => ({ label: `Row ${l}`, value: '9 November 2026', ...q('Academies are paid on 9 November 2026') }))
const timeline = [
  { when: '9 November 2026', label: 'Academy payments', status: 'confirmed', ...q('Academies are paid on 9 November 2026') },
  { when: 'April 2027', label: 'Network support starts', status: 'expected', ...q('Network support starts from April 2027') },
  { when: 'Not yet announced', label: 'National Delivery Partner: procurement underway; appointment date not yet announced', status: 'not_announced', ...q('Network support starts from April 2027') },
]
const facts = [1, 2, 3].map(n => fact(`Fact ${n}`, 'Support begins from April 2027', 'Network support starts from April 2027'))
const funding = [
  { label: 'for the Network', amountM: 580, ...q('£580m goes to the Network and £200m to facilities') },
  { label: 'for facilities', amountM: 200, ...q('£580m goes to the Network and £200m to facilities') },
  { label: 'for transition', amountM: 150, ...q('The transition payment rises from £100 million to £150 million') },
]
const raw = o => ({ hero: { body: 'Support starts from April 2027', ...q('Network support starts from April 2027') }, funding, keyFacts: facts, premium: { rows }, timeline, guidance: [{ title: 'Guide', date: 'ongoing', url: U }], ...o })

test('panel: total computed from the components', () => { const { content } = buildPanel(raw({}), pages, current, '2026-11-05'); assert.equal(content.keyFacts[0].title, 'Almost £1bn (£930m)') })
test('panel: a failed component means no total at all', () => {
  const bad = [...funding.slice(0, 2), { label: 'for transition', amountM: 150, ...q('Academies are paid on 9 November 2026') }]
  const { content } = buildPanel(raw({ funding: bad }), pages, current, '2026-11-05')
  assert.ok(!content.keyFacts.some(f => /£\d+m\)|Around/.test(f.title)))
})
test('panel: a stated total outside the headline is dropped', () => {
  const { content, dropped } = buildPanel(raw({ keyFacts: [...facts, fact('Total', 'More than £1bn in all', 'Network support starts from April 2027')] }), pages, current, '2026-11-05')
  assert.ok(!content.keyFacts.some(f => f.title === 'Total')); assert.ok(dropped.some(d => /computed/.test(d.why)))
})
test('panel: unsupported date is dropped, not shown', () => {
  const t = [...timeline, { when: 'Mar 2028', label: 'National Delivery Partner appointed', status: 'confirmed', ...q('Network support starts from April 2027') }]
  const { content, dropped } = buildPanel(raw({ timeline: t }), pages, current, '2026-11-05')
  assert.ok(!content.timeline.some(x => x.when === 'Mar 2028')); assert.ok(dropped.some(d => /mar 2028/.test(d.why)))
})
test('panel: only confirmed past dates are done', () => {
  const { content } = buildPanel(raw({}), pages, current, '2026-12-01')
  assert.deepEqual(content.timeline.map(t => t.done), [true, false, false])
  assert.equal(content.timeline[2].status, 'not_announced')
})
test('panel: unsupported hero falls back to fixed text', () => { const { content } = buildPanel(raw({ hero: { body: 'Starts in 2031 for all', ...q('Network support starts from April 2027') } }), pages, current, '2026-11-05'); assert.equal(content.hero.body, HERO_FALLBACK) })
test('panel: never carries a model footnote', () => { const { content } = buildPanel(raw({ footnote: 'Everything is certain' }), pages, current, '2026-11-05'); assert.equal(content.footnote, undefined) })
test('panel: too little left means nothing replaces the panel', () => assert.equal(buildPanel(raw({ timeline: [] }), pages, current, '2026-11-05').content, null))
test('panel: expected items carry who said it, taken from the source page', () => {
  const y = 'https://www.youthsporttrust.org/news'
  const p2 = new Map([...pages, [y, { text: 'The successful bidder is announced in November. Published July 2026. Support from April 2027.', title: '' }]])
  const t = [...timeline, { when: 'November 2026', label: 'Successful bidder to be announced', status: 'expected', saidWhen: 'July 2026', url: y, quote: 'The successful bidder is announced in November' }]
  const { content } = buildPanel(raw({ timeline: t }), p2, current, '2026-11-05')
  assert.equal(content.timeline.at(-1).saidBy, 'Youth Sport Trust, July 2026')
  assert.equal(content.timeline[0].saidBy, undefined)
})
test('panel: expected key facts are tagged, confirmed ones are not', () => {
  const f = [...facts, { ...fact('Plan', 'Support begins from April 2027', 'Network support starts from April 2027'), status: 'expected', saidWhen: 'November 2026' }]
  const { content } = buildPanel(raw({ keyFacts: f }), pages, current, '2026-11-05')
  assert.equal(content.keyFacts.at(-1).saidBy, 'DfE, November 2026'); assert.equal(content.keyFacts[1].saidBy, undefined)
})
