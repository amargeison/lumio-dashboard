// TEL Ted Program — OxEd & Assessment resource portal catalogue
// Source: resources.oxedandassessment.com → Main folder / TEL Ted Program
// Every `code` is a WebViewer short-link: https://resources.oxedandassessment.com/{code}
// Every `folder` is a portal folder id: https://resources.oxedandassessment.com/portal/oxedandassessment?folder={id}

export const PORTAL_BASE = 'https://resources.oxedandassessment.com'
export const portalDoc = (code: string) => `${PORTAL_BASE}/${code}`
export const portalFolder = (id: string) => `${PORTAL_BASE}/portal/oxedandassessment?folder=${id}`
export const portalDownload = (code: string) => `${PORTAL_BASE}/api/doc//${code}/DownloadSourceFile`

export const TELTED_FOLDERS = {
  program: '9176d09e-6450-4f79-aaa8-dea2a14cc5fd',
  wholeClass: '6d6d4ee4-dda2-43c9-9aa8-d3c2fb7a70a5',
  wcFamily: 'f40f9030-c981-4e01-970c-0b878c6f5735',
  wcSlides: '9d8c5f4b-180b-43b6-89d7-d7b182344b74',
  wcSlidesP1: '6250c637-fff5-4f4b-8924-29c5055a0fe8',
  wcSlidesP2: 'd3dd8070-ae63-4714-a788-961dcb701918',
  wcTeacherGuide: '21f78ab6-f078-40f0-aa76-2dac7ab722a0',
  wcPlanning: 'adbbb723-1064-4a75-bff0-564a031f3245',
  wcActivity: '43c3b93d-2ae3-4ec1-8da2-5a6c479a00c5',
  wcStories: '2a9413e2-1e99-4618-b1c4-61b3ff82a5bf',
  wcNarrative: '35e49b8d-5a6c-4589-9c64-c21f0ef70616',
  wcNarrativeP2: 'b802fdf1-4da2-4069-9fc4-7cb23ad4e38c',
  wcNarrativeP1: 'f030f634-0d9a-4b7e-bce0-94b32cbe4dc7',
  wcSongs: 'aba79564-5d51-484d-9483-fe85da96cc34',
  neli: '7fe0003b-aab3-4d0a-9abb-a935b192f873',
  neliFlashcards: '50528db1-1094-4a7d-92fb-14362653d59d',
  neliProgress: 'df0d35bb-883c-4d51-8469-1ab5dbb886ba',
  neliFamily: 'ddcd58d7-37db-4f34-a8c2-6c1c392cb06e',
  neliDelivery: 'c1e65398-7a89-402d-83b4-73845ca04949',
  neliTeacherGuides: '44a3217a-7d65-4e85-835f-fe472f7ff4b4',
  languageScreen: 'e8fc2510-3f40-4428-863d-3d24492bda43',
} as const

export type ResourceFile = { title: string; code: string; kind?: 'pdf' | 'audio'; group?: string }

export type ResourceItem = {
  id: string
  icon: string
  title: string
  desc: string
  badge: string
  badgeColor: string
  accent: string
  folder: string
  actionLabel?: string
  files: ResourceFile[]
}

const pdf = (title: string, code: string, group?: string): ResourceFile => ({ title, code, kind: 'pdf', group })
const audio = (title: string, code: string): ResourceFile => ({ title, code, kind: 'audio' })

// ── TEL Ted: NELI Intervention ───────────────────────────────────────────────

export const NELI_INTERVENTION_RESOURCES: ResourceItem[] = [
  {
    id: 'neli-flashcards-p1', icon: '🃏', title: 'Part 1 Flashcards',
    desc: 'Vocabulary flashcard set for TEL Ted Part 1 sessions — 10 topic areas including My Body, Things We Wear, People Who Help Us',
    badge: 'Digital Resource', badgeColor: '#0D9488', accent: '#F97316', folder: TELTED_FOLDERS.neliFlashcards,
    files: [pdf('Part 1 Flashcards', 'Rj4nvv'), pdf('Printable flashcards (all parts)', '3mV74D')],
  },
  {
    id: 'neli-guide-p1', icon: '📖', title: 'Part 1 Teacher Guide',
    desc: 'Complete delivery guide for TEL Ted Part 1 (Weeks 1–10). Session plans, vocabulary lists, activity instructions and assessment guidance — 127 pages',
    badge: 'Teacher Guide', badgeColor: '#1B3060', accent: '#F97316', folder: TELTED_FOLDERS.neliTeacherGuides,
    files: [pdf('Part 1 Teacher Guide', 'EY7cAf'), pdf('TEL Ted Quick Start Guide', 'R3NKVn')],
  },
  {
    id: 'neli-flashcards-p2', icon: '🃏', title: 'Part 2 Flashcards',
    desc: 'Vocabulary flashcard set for TEL Ted Part 2 sessions — builds on Part 1 with advanced vocabulary and narrative content',
    badge: 'Digital Resource', badgeColor: '#0D9488', accent: '#DC2626', folder: TELTED_FOLDERS.neliFlashcards,
    files: [pdf('Part 2 Flashcards', 'f6fynm'), pdf('Printable flashcards (all parts)', '3mV74D')],
  },
  {
    id: 'neli-guide-p2', icon: '📖', title: 'Part 2 Teacher Guide',
    desc: 'Complete delivery guide for TEL Ted Part 2 (Weeks 11–20). Covers phonological awareness, letter sounds, and advanced narrative activities',
    badge: 'Teacher Guide', badgeColor: '#1B3060', accent: '#DC2626', folder: TELTED_FOLDERS.neliTeacherGuides,
    files: [pdf('Part 2 Teacher Guide', '9v2Rbx'), pdf('TEL Ted Quick Start Guide', 'R3NKVn')],
  },
  {
    id: 'neli-delivery', icon: '🧰', title: 'Delivery Materials',
    desc: 'Everything needed to run group and individual sessions: session breakdowns, PEER sequence, CROWD technique, phonology activities, timeline and printable resources',
    badge: 'Session Toolkit', badgeColor: '#7C3AED', accent: '#7C3AED', folder: TELTED_FOLDERS.neliDelivery,
    files: [
      pdf('TEL Ted Timeline', '3aP78p', 'Programme'),
      pdf('Group Session Breakdown (Part 1)', 'nXAjN3', 'Group sessions'),
      pdf('Group Session Breakdown (Part 2)', 'GyUMXW', 'Group sessions'),
      pdf('Activity Sheets (Part 1)', 'nyyJxV', 'Activity sheets'),
      pdf('Activity Sheets (Part 2)', 'JtENKc', 'Activity sheets'),
      pdf('PEER Sequence', 'uDe7dM', 'Techniques'),
      pdf('CROWD Technique', 'FjRqrN', 'Techniques'),
      pdf('Beginning Activities for Phonology', '67FRzV', 'Phonology'),
      pdf('Blending Activities for Phonology', 'EDU6yk', 'Phonology'),
      pdf('Segmenting Activities for Phonology', 'cZrgty', 'Phonology'),
      pdf('Sound Effects', '4zWREU', 'Phonology'),
      pdf('Printable Resources', 'qhhYkU', 'Printables'),
    ],
  },
  {
    id: 'neli-progress', icon: '📈', title: 'Progress & Record Sheets',
    desc: 'Progress assessment and session record sheets for tracking every student across the 20-week programme',
    badge: 'Assessment', badgeColor: '#0E7490', accent: '#0E7490', folder: TELTED_FOLDERS.neliProgress,
    files: [pdf('Progress & Record Sheets', 'hTVzXk')],
  },
  {
    id: 'neli-family', icon: '👨‍👩‍👧', title: 'Family Engagement',
    desc: 'Take-home cards, family newsletters (English and Spanish) and a certificate of achievement to share progress with families',
    badge: 'Family Resources', badgeColor: '#B45309', accent: '#B45309', folder: TELTED_FOLDERS.neliFamily,
    files: [
      pdf('Take-Home Cards', 'UtE7Qk'),
      pdf('Family newsletters (English)', 'wYpN3g'),
      pdf('Family newsletters (Spanish)', 'pGNh7m'),
      pdf('Certificate of Achievement', 'tKgU9w'),
    ],
  },
  {
    id: 'neli-languagescreen', icon: '🔍', title: 'LanguageScreen Guides',
    desc: 'Administration guides for the LanguageScreen assessment app — available in English and Spanish',
    badge: 'Assessment Guide', badgeColor: '#2563EB', accent: '#2563EB', folder: TELTED_FOLDERS.languageScreen,
    files: [pdf('LanguageScreen Guides (English)', 'MmnqJF'), pdf('LanguageScreen Guides (Spanish)', 'cMMfKb')],
  },
]

// ── TEL Ted: Whole Class ─────────────────────────────────────────────────────

const ACTIVITY_SHEET_CODES: [number, string][] = [
  [1, '2QGuzf'], [2, 'uFUhFm'], [3, 'KraXUF'], [4, 'YZreQ6'], [5, 'MHDrZk'], [6, '9z3HVm'], [7, 'rG7xJV'], [8, 'wepN8a'],
  [9, 'AR6y2M'], [10, 'PgfqkD'], [11, '7YUHv6'], [12, '8QMxxY'], [13, 'Eetfzx'], [14, 'zwN23D'], [15, 'FGmkxk'], [16, 'phZ4zh'],
  [17, 'ZJbgnn'], [18, 'WHEBvm'], [19, 'GtwpnW'], [20, 'dMytkJ'], [21, '9XGdee'], [22, 'db8n7H'], [23, 'XzTdDQ'],
]

export const WHOLE_CLASS_RESOURCES: ResourceItem[] = [
  {
    id: 'wc-activity', icon: '📝', title: 'Activity Sheets',
    desc: 'Printable activity sheets for whole-class TEL Ted sessions. 23 student-facing worksheets for vocabulary and narrative activities',
    badge: 'Student Resources', badgeColor: '#15803D', accent: '#15803D', folder: TELTED_FOLDERS.wcActivity,
    files: ACTIVITY_SHEET_CODES.map(([n, code]) => pdf(`TEL Ted Activity Sheet ${String(n).padStart(2, '0')}`, code)),
  },
  {
    id: 'wc-slides', icon: '💻', title: 'Digital Slides',
    desc: 'Presentation slides covering all 6 topic areas: My Body, Things We Wear, People Who Help Us, Growing, Journey, Time. Ready to display on your classroom screen',
    badge: 'Digital Slides', badgeColor: '#2563EB', accent: '#2563EB', folder: TELTED_FOLDERS.wcSlides,
    files: [
      pdf('Topic 1: My Body', 'CEy3rw', 'Part 1'),
      pdf('Topic 2: Things We Wear', 'ZFPEKR', 'Part 1'),
      pdf('Topic 3: People Who Help Us', '79Fr4x', 'Part 1'),
      pdf('Topic 4: Growing', 'Z663RZ', 'Part 2'),
      pdf('Topic 5: Journey', '8WEhz6', 'Part 2'),
      pdf('Topic 6: Time', 'JQjXHc', 'Part 2'),
    ],
  },
  {
    id: 'wc-narrative', icon: '🎴', title: 'Narrative Sequence Cards',
    desc: 'Visual story sequence cards for developing narrative skills across 18 sessions. Children arrange cards to tell and retell stories',
    badge: 'Teaching Aid', badgeColor: '#C8960C', accent: '#C8960C', folder: TELTED_FOLDERS.wcNarrative,
    files: [
      pdf("Session 05 — Panda's Day at the Beach", 'Cr44hd', 'Part 1'),
      pdf("Session 08 — Rabbit's Birthday Present", 'EaV7BQ', 'Part 1'),
      pdf('Session 11 — The Noisy Playground', 'gJu3h3', 'Part 1'),
      pdf('Session 14 — Dragon School', 'Z7dM2b', 'Part 1'),
      pdf("Session 17 — Ted's Snowy Day", '4EkqBV', 'Part 1'),
      pdf('Session 20 — A Package for Panda', '2JyTtm', 'Part 1'),
      pdf('Session 23 — The Noisy Surprise', 'J2Degp', 'Part 1'),
      pdf('Session 26 — The Mischievious Toys', 'VCnRBM', 'Part 1'),
      pdf("Session 03 — Billy's Walk", 'dVuQ9d', 'Part 2'),
      pdf("Session 06 — Ted's Seeds", 'meVJHP', 'Part 2'),
      pdf('Session 09 — Fruit Salad', 'DGwj6A', 'Part 2'),
      pdf('Session 12 — Going to the Park', 'cFYZMm', 'Part 2'),
      pdf("Session 15 — Panda's Bus Journey", 'zmvwCy', 'Part 2'),
      pdf('Session 18 — A Very Special Vacation', 'w6DrMH', 'Part 2'),
      pdf('Session 21 — The School Day', 'U9kqZE', 'Part 2'),
      pdf("Session 24 — Mocka's Friend", 'Rk2Tgj', 'Part 2'),
      pdf("Session 27 — Don't Forget", 'pBftfY', 'Part 2'),
      pdf("Session 28 — Ted's Exciting Day", 'yMJJUf', 'Part 2'),
    ],
  },
  {
    id: 'wc-songs', icon: '🎵', title: 'Song Files',
    desc: 'Audio song files for TEL Ted whole-class sessions. 11 vocabulary songs, one per topic area — streams straight from the portal',
    badge: 'Audio Resource', badgeColor: '#7C3AED', accent: '#7C3AED', folder: TELTED_FOLDERS.wcSongs, actionLabel: 'Play / Download',
    files: [
      audio("Song 01 — Ted's A Happy Bear", 'audio-QyBnuH'),
      audio('Song 02 — The Listening Song', 'audio-MNUxgJ'),
      audio('Song 03 — Shake', 'audio-gHr8Ng'),
      audio('Song 04 — When I Move My Body', 'audio-wA8Dhb'),
      audio('Song 05 — The Wrong Way Around', 'audio-wNwFgF'),
      audio('Song 06 — The Ni-Na Song', 'audio-qWCK2n'),
      audio('Song 07 — So Many People Who Help Us', 'audio-94me7e'),
      audio('Song 08 — Spring Song', 'audio-GwXwBN'),
      audio('Song 09 — Vegetable Soup', 'audio-GXq494'),
      audio('Song 10 — Are We There Yet?', 'audio-kBxGGF'),
      audio('Song 11 — A Time For Everything', 'audio-TNd6dq'),
    ],
  },
  {
    id: 'wc-stories', icon: '📚', title: 'Story Files',
    desc: "Six narrated whole-class stories including 'The Dinosaur Park' and 'Monster Magic'. Featuring Ted the Bear — play in class or share with families",
    badge: 'Story Books', badgeColor: '#B45309', accent: '#B45309', folder: TELTED_FOLDERS.wcStories, actionLabel: 'Play / Download',
    files: [
      audio('Story 01 — The Dinosaur Park', 'audio-JG3ver'),
      audio('Story 02 — Monster Magic', 'audio-NYDGpx'),
      audio("Story 03 — Sammy's Kitten", 'audio-avVkPk'),
      audio('Story 04 — The Lost Lamb', 'audio-ZGkdTq'),
      audio('Story 05 — The Vacation Surprise', 'audio-hnAKRY'),
      audio('Story 06 — Perfect Time', 'audio-azubP2'),
    ],
  },
  {
    id: 'wc-guide', icon: '📖', title: 'Teacher Guide',
    desc: 'Complete whole-class programme delivery guide. Session structure, differentiation strategies, assessment guidance and programme overview',
    badge: 'Teacher Guide', badgeColor: '#1B3060', accent: '#1B3060', folder: TELTED_FOLDERS.wcTeacherGuide,
    files: [pdf('TEL Ted: Whole Class Teacher Guide', 'uRTpje'), pdf('TEL Ted: Whole Class Quick Start Guide', '8WZG2V')],
  },
  {
    id: 'wc-planning', icon: '📋', title: 'Template Planning & Record Sheet',
    desc: 'Blank planning and record templates. TEL Ted Whole Class planning and record sheet — print and complete for each session',
    badge: 'Planning Template', badgeColor: '#0E7490', accent: '#0E7490', folder: TELTED_FOLDERS.wcPlanning,
    files: [pdf('Planning and record sheet', 'vUJ484')],
  },
  {
    id: 'wc-family', icon: '👨‍👩‍👧', title: 'Family Engagement',
    desc: 'Take-home cards and family newsletters so parents can carry the vocabulary and stories on at home',
    badge: 'Family Resources', badgeColor: '#DB2777', accent: '#DB2777', folder: TELTED_FOLDERS.wcFamily,
    files: [pdf('Take-Home Cards', 'hDDMXQ'), pdf('Family Newsletters', 'JwXtWR')],
  },
]

export const ALL_TELTED_RESOURCES = [...NELI_INTERVENTION_RESOURCES, ...WHOLE_CLASS_RESOURCES]
export const TELTED_FILE_COUNT = ALL_TELTED_RESOURCES.reduce((n, r) => n + r.files.length, 0)
