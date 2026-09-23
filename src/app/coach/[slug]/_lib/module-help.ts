// What each page is for, in the coach's language.
//
// Pete's eight coaches will not read a manual, and nobody rings support to ask
// what a page does — they just stop using it. So the explanation lives ON the
// page, behind an ⓘ next to the title: three short tabs, written the way you
// would explain it while walking to the courts.
//
// One file, because the alternative is help text drifting from the product in
// seventeen different components. And every word is written to be TRUE of the
// live portal — a help panel describing a feature that does not exist yet is
// worse than no help panel.

export type ModuleHelp = {
  /** One line under the title of the panel. */
  what: string
  /** The steps. Numbered in the panel — keep them in the order a coach does them. */
  how: string[]
  /** The things a coach finds out three months in. */
  worth: string[]
}

export const MODULE_HELP: Record<string, ModuleHelp> = {
  dashboard: {
    what: 'Your morning read: what is on today, what needs you, and what Lumio Coach thinks matters most.',
    how: [
      'Read the briefing first — it is written fresh through the day and leads with the one thing worth acting on.',
      'Tap a tile (This week, Players, Nothing booked, Payments due) to jump straight to it.',
      'Anything in Needs attention is a player, not a number — click through and it opens their card.',
      'Use the buttons under your name for the four things you do most: add a booking, record a payment, write a summary, send a message.',
    ],
    worth: [
      '“Nothing booked” is the quietest way to lose a player. It counts everyone on your roster with no future session.',
      'A camp that is running or coming up gets its own card, with money collected and still owed.',
      'The briefing rewrites itself every three hours — hit ↻ if you want it now.',
    ],
  },
  planner: {
    what: 'The plan for each session, and the run-sheet you actually coach from.',
    how: [
      'Every confirmed booking appears here. Open one and Lumio Coach builds the plan from that player’s history.',
      'Check the run-sheet — the timed blocks add up to the length of the lesson.',
      'On court, use the buttons at the top: record the lesson, or Finish session when you are done.',
      'Finish session asks what you actually covered and writes the lesson summary from it.',
    ],
    worth: [
      'A plan belongs to its booking. Move the session and the plan moves with it.',
      'Recording the lesson gives you a much richer write-up than ticking boxes — it hears what you said.',
      'The player sees “what you’ll cover” in their app before the session, and their coach note stays private.',
    ],
  },
  lessons: {
    what: 'Every session written up: what you covered, what to work on, and the homework.',
    how: [
      'Summaries arrive here from a recording, or from Finish session in the planner.',
      'Pick one on the left to read it. The short version is at the top — that is what a parent reads.',
      'Full session detail holds the blow-by-blow when you want it.',
      'Share with parent sends it; Export PDF prints it.',
    ],
    worth: [
      'The summary is the single thing players and parents value most — it is the proof the money is doing something.',
      'Next session focus feeds straight into the next plan, so the work carries forward.',
      'Record the lesson on your phone and the write-up does itself.',
    ],
  },
  development: {
    what: 'Where each player is, what they are working on, and how they are moving.',
    how: [
      'Pick a player. The colour is set here — that is what drives their pathway everywhere else.',
      'Tap the skill bars to grade: four bars is mastered.',
      'Set targets lets Lumio Coach pick the three things worth working on next.',
      'The goal can be chosen from the suggestions for their colour, or written yourself.',
    ],
    worth: [
      'Grading here is what makes Racket Progression work — that module only reads what you set.',
      'The colour ladder maps to the LTA Youth pathway, so a parent can place their child against something they know.',
      'Attendance and lessons on this page come from the rest of the portal — nothing to type twice.',
    ],
  },
  belts: {
    what: 'The reward ladder: nine colours, four skills each, and a certificate at every level.',
    how: [
      'Players appear here once they have a colour set in Player Development.',
      '“Ready to award” means every skill at that level is mastered.',
      'Award the racket, print the certificate, and they move up.',
      'Choose in Settings whether you supply the rewards yourself or use Lumio’s kit.',
    ],
    worth: [
      'This is a second income as much as a reward system — parents fund the junior journey.',
      'It is optional: switch the module off and the rest of the portal carries on without it.',
      'Grading happens in Player Development. This page only reads it, so the two can never disagree.',
    ],
  },
  calendar: {
    what: 'Your week across every court — lessons, groups, camps and everything already in your diary.',
    how: [
      'Click any empty slot to add a booking there.',
      'Send a booking link to let a player pick a free time themselves.',
      'Connect your calendar in Settings and your own commitments block out automatically.',
      'Camp days are striped — nothing can be booked over them.',
    ],
    worth: [
      'Free-slot suggestions honour your Lumio diary AND your connected calendar, so you cannot double-book a dentist.',
      'A booking sends the confirmation, adds the calendar link and tells the player in their app.',
      'Bookable hours and the gap you want between lessons come from Settings.',
    ],
  },
  venues: {
    what: 'Every site you coach at: contacts, courts, facilities and who is based where.',
    how: [
      'Add venues and courts in Settings → Venues; this page is where you use them.',
      'Your home base is set at onboarding and you are assigned to it automatically.',
      'Assistant coaches see the venues they are assigned to.',
      'Request a court sends a pre-written email to that venue’s contact.',
    ],
    worth: [
      'Court names on bookings match venues here — that is how a player gets the right address and map link.',
      'Coaches based here comes from the assignment on the Coaches page, not from a name typed twice.',
    ],
  },
  camps: {
    what: 'Run a camp end to end: itinerary, kit, attendees, targets, the trip hub and the money.',
    how: [
      'Create the camp with dates and a price, then work across the tabs.',
      'Coaches says who is travelling — it drives the ratio and the camp message group.',
      'Attendees is your rooming and payment list.',
      'Trip hub is what players see in their app: flights, hotel, what to bring, who to ring.',
    ],
    worth: [
      'Camp days block your calendar automatically, so nobody books a lesson while you are in Spain.',
      'A camp with dates now appears in your own Google/Outlook/iCloud calendar.',
      'Messaging the camp reaches every player and every coach on it, in one thread.',
    ],
  },
  roster: {
    what: 'Everyone you coach, with their level, contacts, consents and welcome pack.',
    how: [
      'Add a player once — everything else in the portal refers back to this record.',
      'Open a card for contact details, consents, medical notes and their history.',
      'Welcome pack prints a branded starter sheet for a new player.',
      'The photo, age and parent email matter: they decide who gets emailed and what the app shows.',
    ],
    worth: [
      'Under-16s: confirmations and summaries go to the parent, never the child. That is driven by the age on this page.',
      'If a name appears twice, use the merge panel at the top — one person should be one profile.',
    ],
  },
  messages: {
    what: 'Every conversation with your players — and, for juniors, their parents — in one place.',
    how: [
      'Send a message walks you through who, how and what — then Send as written, or let Lumio Coach tidy it.',
      'Replies from the app land here as a thread per person.',
      'Pick Camp as the audience to reach everyone on a trip at once.',
      'React to a message with an emoji to close it off without typing.',
    ],
    worth: [
      'In-app is the channel players actually read, and it cannot bounce.',
      'Email sends from your own mailbox once it is connected, so a parent recognises the sender.',
    ],
  },
  videoaudio: {
    what: 'Record a lesson and turn it into a write-up, or clips a player can watch.',
    how: [
      'Record on your phone, or upload a file you already have.',
      'Pick the player first — that is where the summary lands.',
      'Recorded in sections? Upload them all at once; they become one summary.',
      'Confirm the clips you want shared before the player sees them.',
    ],
    worth: [
      'The AI reads what you SAID, so the summary is your coaching, not a template.',
      'Long files are compressed automatically — a full hour is fine.',
    ],
  },
  gpsheatmaps: {
    what: 'XP and effort levels earned from sessions — the reward layer for how hard they work.',
    how: [
      'Log a session (or the player logs it from their app) with duration and effort.',
      'Effort, movement and consistency become XP.',
      'The leaderboard is per squad and can be switched off in Settings.',
    ],
    worth: [
      'This is separate from Racket Progression: one rewards effort, the other rewards skill.',
      'No watch needed — a logged session counts.',
    ],
  },
  equipment: {
    what: 'What kit you own, what needs replacing, and what goes in the bag.',
    how: [
      'Add your stock; mark anything low or out for repair.',
      'Camp kit lists are built from here.',
    ],
    worth: ['Anything marked low or on order shows on your dashboard, so you find out before the session, not during it.'],
  },
  resources: {
    what: 'Drills, guides and books you can recommend to a player in one click.',
    how: [
      'Browse by level or topic.',
      'Recommend one to a player and it appears in their app under their level.',
    ],
    worth: ['Recommendations are matched to the player’s colour, so a Green player is not handed a performance drill.'],
  },
  staff: {
    what: 'Your coaching team: who they are, where they work and their DBS record.',
    how: [
      'Add a coach, then assign them to venues and players.',
      'Invite them when you are ready for them to sign in.',
      'Keep DBS and safeguarding dates here — the portal flags them before they expire.',
    ],
    worth: [
      'An assistant sees only their own players and venues. Assignment here is what decides that.',
      'The head coach row is you — your details come from Settings.',
    ],
  },
  payments: {
    what: 'Packs, credits and what is outstanding.',
    how: [
      'Build your price list once; assign a pack to a player.',
      'Record a payment when money comes in, however it came in.',
      'Sessions tick down against a pack automatically.',
    ],
    worth: [
      'Card payments arrive in V2. Everything else — balances, chasers, reports — works now.',
      'Outstanding balances show on your dashboard and in the briefing.',
    ],
  },
  settings: {
    what: 'Your academy, your branding, your modules and how everything sends.',
    how: [
      'Start with your details and your home venue.',
      'Connect your mailbox and calendar — that is what makes emails and free slots real.',
      'Turn modules on or off; anything off disappears for you and for your players.',
      'Section toggles let you hide parts of a page you never use.',
    ],
    worth: [
      'Settings travel with your account, so your phone and your laptop agree.',
      'Switching a module off hides it in the player app too, not just here.',
    ],
  },
}

export const helpFor = (id: string): ModuleHelp | null => MODULE_HELP[id] ?? null
