// "Use the example pack": the fictional Rally Ten pack and booklet from the demo,
// copied into an org's own rows for it to edit. Never a real organisation's content.

import { CURRICULUM, STICKER_AREAS } from '@/data/impact/demo-data'
import type { Booklet, PackItem } from './packs'

type ExampleItem = Pick<PackItem, 'name' | 'kind' | 'price_pence' | 'has_sizes' | 'sizes' | 'sort'>

export const EXAMPLE_ITEMS: ExampleItem[] = [
  { name: 'T-shirt', kind: 'included', price_pence: null, has_sizes: true, sizes: ['5-6', '7-8', '9-10', '11-12'], sort: 0 },
  { name: 'Ball', kind: 'included', price_pence: null, has_sizes: false, sizes: [], sort: 1 },
  { name: 'Activity Booklet', kind: 'included', price_pence: null, has_sizes: false, sizes: [], sort: 2 },
  { name: 'Racket', kind: 'paid', price_pence: 1000, has_sizes: false, sizes: [], sort: 3 },
]

const sentence = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()

/** One entry per week: a block written as "1 & 2" becomes weeks 1 and 2. */
export const exampleBooklet = (): Booklet => ({
  title: 'Activity Booklet',
  intro: 'Ten weeks of skills, games and challenges. Collect a sticker for each area as you go.',
  weeks: CURRICULUM.flatMap(block => block.weeks.split('&').map(w => ({
    week: Number(w.trim()), title: sentence(block.skill), focus: `This week’s skill: ${block.skill.toLowerCase()}.`, home_task: 'Try it at home, as a family.',
    top_tip: block.tip, did_you_know: block.didYouKnow, video: block.skill.toLowerCase().replace(/[^a-z0-9]+/g, '-'), scorecard: Number(w.trim()) === 10,
  }))),
  notes_prompt: 'List what you practised this week.',
  stickers: STICKER_AREAS.map(s => ({ id: s.id, label: s.label, description: s.desc })),
})
