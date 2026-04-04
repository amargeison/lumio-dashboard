'use client'
import { useRef, useState, useCallback } from 'react'

export type SchoolVoiceCommandResult = {
  command: string
  action: string
  response: string
  payload?: Record<string, any>
  data?: Record<string, any>
}

function extractName(text: string, prefixes: string[]): string | null {
  const lower = text.toLowerCase()
  for (const p of prefixes) {
    const idx = lower.indexOf(p)
    if (idx >= 0) { const w = text.slice(idx + p.length).trim().split(/[\s,.!?]/)[0]; if (w.length > 1) return w.charAt(0).toUpperCase() + w.slice(1) }
  }
  return null
}

const COMMANDS: { patterns: RegExp[]; action: string; response: (m: RegExpMatchArray, t: string) => string; data?: (m: RegExpMatchArray, t: string) => Record<string, any> }[] = [

  // ─── EXISTING CORE COMMANDS ───────────────────────────────────────────────────
  { patterns: [/play.*brief/i, /morning brief/i, /start brief/i], action: 'PLAY_BRIEFING', response: () => 'Starting your morning briefing now.' },
  { patterns: [/^stop$/i, /^pause$/i], action: 'STOP_AUDIO', response: () => 'Stopping.' },
  { patterns: [/i'?m ill/i, /i'?m sick/i, /i'?m not well/i, /report sick/i, /i can'?t come in/i], action: 'REPORT_SICK', response: () => "I'll log your absence and notify the cover coordinator." },
  { patterns: [/log.*concern/i, /safeguarding concern/i, /raise.*concern/i], action: 'LOG_CONCERN', response: () => 'Opening the safeguarding concern form.' },
  { patterns: [/take.*register/i, /register for (\w+)/i, /class register/i], action: 'TAKE_REGISTER', response: (_m, t) => { const c = extractName(t, ['for ', 'register ']); return c ? `Opening register for ${c}.` : 'Opening the class register.' }, data: (_m, t) => ({ className: extractName(t, ['for ', 'register ']) }) },
  { patterns: [/book cover/i, /cover for (\w+)/i, /need cover/i, /arrange cover/i], action: 'BOOK_COVER', response: (_m, t) => { const c = extractName(t, ['for ']); return c ? `Opening cover booking for ${c}.` : 'Opening the cover booking form.' }, data: (_m, t) => ({ className: extractName(t, ['for ']) }) },
  { patterns: [/parent contact/i, /contact parent/i, /message parent/i], action: 'PARENT_CONTACT', response: (_m, t) => { const n = extractName(t, ['for ', 'about ']); return n ? `Opening parent contact for ${n}.` : 'Opening parent contact form.' }, data: (_m, t) => ({ pupilName: extractName(t, ['for ', 'about ']) }) },
  { patterns: [/staff alert/i, /send.*staff/i, /alert staff/i], action: 'STAFF_ALERT', response: () => 'Opening staff alert form.' },
  { patterns: [/check attendance/i, /attendance today/i, /what.*attendance/i], action: 'CHECK_ATTENDANCE', response: () => 'Today\'s attendance is 96.2% across all year groups. Year 6 is lowest at 91.8%.' },
  { patterns: [/ehcp review/i, /ehcp for (\w+)/i], action: 'EHCP_REVIEW', response: (_m, t) => { const n = extractName(t, ['for ']); return n ? `Opening EHCP review for ${n}.` : 'Opening EHCP review form.' }, data: (_m, t) => ({ pupilName: extractName(t, ['for ']) }) },
  { patterns: [/log absence/i, /pupil absent/i, /report absence/i], action: 'LOG_ABSENCE', response: () => 'Opening the absence logging form.' },
  { patterns: [/book holiday/i, /request leave/i, /time off/i], action: 'BOOK_HOLIDAY', response: () => 'Opening the leave request form.' },
  { patterns: [/what.*time/i], action: 'TELL_TIME', response: () => `It's ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.` },

  // ─── PUPIL & STUDENT ──────────────────────────────────────────────────────────
  { patterns: [/show me the pupils/i, /show pupils/i, /open pupils/i, /go to pupils/i], action: 'NAVIGATE', response: () => 'Opening the pupils list.', data: () => ({ path: 'students' }) },
  { patterns: [/how many pupils/i, /pupil count/i, /total pupils/i], action: 'PUPIL_INFO', response: () => 'Current roll is 420 pupils across all year groups.' },
  { patterns: [/find a pupil/i, /search pupil/i, /look up pupil/i, /pupil search/i], action: 'NAVIGATE', response: () => 'Opening pupil search.', data: () => ({ path: 'students' }) },
  { patterns: [/show year two pupils/i, /show year 2 pupils/i, /year two list/i], action: 'PUPIL_FILTER', response: () => 'Filtering to Year 2 pupils.', data: () => ({ yearGroup: 2 }) },
  { patterns: [/show year three pupils/i, /show year 3 pupils/i, /year three list/i], action: 'PUPIL_FILTER', response: () => 'Filtering to Year 3 pupils.', data: () => ({ yearGroup: 3 }) },
  { patterns: [/show year four pupils/i, /show year 4 pupils/i, /year four list/i], action: 'PUPIL_FILTER', response: () => 'Filtering to Year 4 pupils.', data: () => ({ yearGroup: 4 }) },
  { patterns: [/show year five pupils/i, /show year 5 pupils/i, /year five list/i], action: 'PUPIL_FILTER', response: () => 'Filtering to Year 5 pupils.', data: () => ({ yearGroup: 5 }) },
  { patterns: [/show year six pupils/i, /show year 6 pupils/i, /year six list/i], action: 'PUPIL_FILTER', response: () => 'Filtering to Year 6 pupils.', data: () => ({ yearGroup: 6 }) },
  { patterns: [/show reception pupils/i, /reception class/i, /reception list/i], action: 'PUPIL_FILTER', response: () => 'Filtering to Reception pupils.', data: () => ({ yearGroup: 'R' }) },
  { patterns: [/show year one pupils/i, /show year 1 pupils/i, /year one list/i], action: 'PUPIL_FILTER', response: () => 'Filtering to Year 1 pupils.', data: () => ({ yearGroup: 1 }) },
  { patterns: [/show pupils with send/i, /send pupils/i, /pupils with special needs/i], action: 'PUPIL_FILTER', response: () => 'Filtering to pupils with SEND.', data: () => ({ filter: 'send' }) },
  { patterns: [/show eal pupils/i, /eal list/i, /english as additional/i], action: 'PUPIL_FILTER', response: () => 'Filtering to EAL pupils.', data: () => ({ filter: 'eal' }) },
  { patterns: [/show pupil premium pupils/i, /pupil premium list/i, /pp pupils/i], action: 'PUPIL_FILTER', response: () => 'Filtering to Pupil Premium pupils.', data: () => ({ filter: 'pupil-premium' }) },
  { patterns: [/show looked after children/i, /lac pupils/i, /children in care/i], action: 'PUPIL_FILTER', response: () => 'Filtering to looked after children.', data: () => ({ filter: 'lac' }) },
  { patterns: [/who is absent today/i, /who'?s absent/i, /absent pupils/i], action: 'ATTENDANCE_INFO', response: () => '16 pupils are absent today. 4 unauthorised.' },
  { patterns: [/show late arrivals/i, /who is late/i, /who was late/i, /late pupils/i], action: 'ATTENDANCE_INFO', response: () => '3 pupils marked late today.' },
  { patterns: [/show attendance concerns/i, /attendance below 90/i, /poor attendance/i], action: 'NAVIGATE', response: () => 'Showing pupils with attendance below 90 percent.', data: () => ({ path: 'students' }) },
  { patterns: [/show persistent absence/i, /persistent absentees/i, /below 80 percent/i], action: 'ATTENDANCE_INFO', response: () => '12 pupils are below 80 percent attendance.' },
  { patterns: [/show the class list/i, /show classes/i, /open classes/i, /class list/i], action: 'NAVIGATE', response: () => 'Opening class registers.', data: () => ({ path: 'classes' }) },
  { patterns: [/add a new pupil/i, /new pupil/i, /admit a pupil/i, /new admission/i], action: 'PUPIL_ACTION', response: () => 'Opening new pupil admission form.' },
  { patterns: [/show pupil profiles/i, /pupil profiles/i, /open profiles/i], action: 'NAVIGATE', response: () => 'Opening pupil profiles.', data: () => ({ path: 'students' }) },
  { patterns: [/show reading ages/i, /reading age tracker/i, /reading ages/i], action: 'NAVIGATE', response: () => 'Opening reading age tracker.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show interventions/i, /intervention tracker/i, /open interventions/i], action: 'NAVIGATE', response: () => 'Opening intervention tracker.', data: () => ({ path: 'send-dsl' }) },
  { patterns: [/who is on the sen register/i, /sen register/i, /show sen register/i], action: 'NAVIGATE', response: () => 'Opening the SEN register.', data: () => ({ path: 'send-dsl' }) },
  { patterns: [/show speech and language/i, /salt referrals/i, /speech and language pupils/i], action: 'PUPIL_FILTER', response: () => 'Filtering to SALT referrals.', data: () => ({ filter: 'salt' }) },
  { patterns: [/show safeguarding concerns/i, /safeguarding log/i, /open safeguarding/i], action: 'NAVIGATE', response: () => 'Opening safeguarding log.', data: () => ({ path: 'safeguarding' }) },
  { patterns: [/show medical conditions/i, /medical flags/i, /pupils with medical/i], action: 'PUPIL_INFO', response: () => 'Showing pupils with medical flags.' },
  { patterns: [/show dietary requirements/i, /dietary needs/i, /food allergies/i], action: 'PUPIL_INFO', response: () => 'Showing pupils with dietary needs.' },
  { patterns: [/show who needs a review/i, /overdue reviews/i, /reviews due/i], action: 'NAVIGATE', response: () => 'Showing pupils with overdue reviews.', data: () => ({ path: 'send-dsl' }) },

  // ─── NELI & ASSESSMENTS ──────────────────────────────────────────────────────
  { patterns: [/show me neli/i, /open neli/i, /go to neli/i], action: 'NAVIGATE', response: () => 'Opening NELI assessment section.', data: () => ({ path: 'send-dsl' }) },
  { patterns: [/show neli results/i, /neli scores/i, /neli results/i], action: 'NAVIGATE', response: () => 'Opening NELI scores.', data: () => ({ path: 'send-dsl' }) },
  { patterns: [/which pupils need neli/i, /pupils flagged for neli/i, /who needs neli/i], action: 'NELI_INFO', response: () => 'Opening pupils flagged for NELI intervention.' },
  { patterns: [/show recent assessments/i, /recent assessments/i, /latest assessments/i], action: 'NAVIGATE', response: () => 'Showing assessments completed in the last 30 days.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/who hasn'?t been assessed/i, /not been assessed/i, /missing assessments/i], action: 'NELI_INFO', response: () => '8 pupils have no recent assessment on record.' },
  { patterns: [/show assessment due dates/i, /assessment deadlines/i, /upcoming assessments/i], action: 'NAVIGATE', response: () => 'Showing upcoming assessment deadlines.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show baseline scores/i, /baseline assessment/i, /baseline data/i], action: 'NAVIGATE', response: () => 'Opening baseline assessment data.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/how many have completed neli/i, /neli completion/i, /completed neli/i], action: 'NELI_INFO', response: () => '24 pupils have completed their NELI programme this term.' },
  { patterns: [/show neli progress/i, /neli trends/i, /neli progress/i], action: 'NAVIGATE', response: () => 'Opening NELI progress trends.', data: () => ({ path: 'send-dsl' }) },
  { patterns: [/show vocabulary scores/i, /vocabulary subtest/i, /vocab scores/i], action: 'NELI_INFO', response: () => 'Opening vocabulary subtest results.' },
  { patterns: [/show narrative scores/i, /narrative subtest/i, /narrative results/i], action: 'NELI_INFO', response: () => 'Opening narrative subtest results.' },
  { patterns: [/show listening scores/i, /listening comprehension/i, /listening results/i], action: 'NELI_INFO', response: () => 'Opening listening comprehension scores.' },
  { patterns: [/run a neli session/i, /start neli session/i, /neli assessment tool/i], action: 'NELI_ACTION', response: () => 'Opening NELI assessment tool.' },
  { patterns: [/show intervention groups/i, /intervention group/i, /group assignments/i], action: 'NAVIGATE', response: () => 'Opening intervention group assignments.', data: () => ({ path: 'send-dsl' }) },
  { patterns: [/show the neli dashboard/i, /neli dashboard/i, /neli overview/i], action: 'NAVIGATE', response: () => 'Opening the NELI overview.', data: () => ({ path: 'send-dsl' }) },
  { patterns: [/which pupils are making progress/i, /pupils progressing/i, /score improvement/i], action: 'NELI_INFO', response: () => 'Showing pupils with score improvement.' },
  { patterns: [/which pupils are not progressing/i, /no score change/i, /not progressing/i], action: 'NELI_INFO', response: () => 'Flagging pupils with no score change.' },
  { patterns: [/show end of term results/i, /end of term/i, /term results/i], action: 'NAVIGATE', response: () => 'Opening end of term results.', data: () => ({ path: 'reports' }) },
  { patterns: [/show year on year progress/i, /cohort progress/i, /year on year/i], action: 'NAVIGATE', response: () => 'Opening cohort progress comparison.', data: () => ({ path: 'reports' }) },
  { patterns: [/export neli data/i, /neli export/i, /download neli/i], action: 'NELI_ACTION', response: () => 'Starting NELI data export.' },

  // ─── STAFF & HR ───────────────────────────────────────────────────────────────
  { patterns: [/show me the staff/i, /show staff/i, /open staff/i, /go to staff/i], action: 'NAVIGATE', response: () => 'Opening staff section.', data: () => ({ path: 'hr-staff' }) },
  { patterns: [/how many teachers/i, /teacher count/i, /staff count/i], action: 'STAFF_INFO', response: () => 'You have 18 teaching staff and 12 support staff.' },
  { patterns: [/show supply cover needed/i, /supply cover/i, /cover needed today/i], action: 'STAFF_INFO', response: () => 'Cover needed today: Year 4 class — supply confirmed.' },
  { patterns: [/who is off today/i, /who'?s off today/i, /staff absent/i, /staff off today/i], action: 'STAFF_INFO', response: () => '2 staff members absent today.' },
  { patterns: [/show staff timetables/i, /staff timetable/i, /teacher timetable/i], action: 'NAVIGATE', response: () => 'Opening staff timetables.', data: () => ({ path: 'timetable' }) },
  { patterns: [/show cpd records/i, /cpd tracker/i, /cpd log/i, /continuing professional/i], action: 'NAVIGATE', response: () => 'Opening CPD tracker.', data: () => ({ path: 'hr-staff' }) },
  { patterns: [/who has dbs expiring/i, /dbs expiring/i, /dbs renewal/i, /dbs due/i], action: 'STAFF_INFO', response: () => '1 DBS certificate due for renewal in the next 60 days.' },
  { patterns: [/show safeguarding training/i, /safeguarding training compliance/i, /training compliance/i], action: 'NAVIGATE', response: () => 'Opening safeguarding training compliance.', data: () => ({ path: 'safeguarding' }) },
  { patterns: [/show the staff directory/i, /staff directory/i, /staff list/i], action: 'NAVIGATE', response: () => 'Opening staff directory.', data: () => ({ path: 'hr-staff' }) },
  { patterns: [/add a new staff member/i, /new staff member/i, /onboard staff/i, /new starter/i], action: 'STAFF_ACTION', response: () => 'Opening new staff onboarding form.' },
  { patterns: [/show performance management/i, /performance management/i, /staff reviews/i, /appraisals/i], action: 'NAVIGATE', response: () => 'Opening staff review tracker.', data: () => ({ path: 'hr-staff' }) },
  { patterns: [/show cover arrangements/i, /cover planner/i, /cover arrangements/i], action: 'NAVIGATE', response: () => 'Opening cover planner.', data: () => ({ path: 'hr-staff' }) },
  { patterns: [/who is the dsl/i, /who'?s the dsl/i, /designated safeguarding lead/i], action: 'STAFF_INFO', response: () => 'The Designated Safeguarding Lead is the Headteacher. Deputies are the SENCO and Year 6 lead.' },
  { patterns: [/show the slt/i, /senior leadership/i, /open slt/i, /go to slt/i], action: 'NAVIGATE', response: () => 'Opening senior leadership team.', data: () => ({ path: 'slt' }) },
  { patterns: [/show induction status/i, /staff induction/i, /nqt induction/i, /ect induction/i], action: 'NAVIGATE', response: () => 'Showing staff in induction period.', data: () => ({ path: 'hr-staff' }) },
  { patterns: [/show teaching assistants/i, /ta list/i, /list teaching assistants/i], action: 'STAFF_INFO', response: () => 'Filtering staff by role: Teaching Assistant.' },
  { patterns: [/show contract types/i, /staff contracts/i, /contract type/i], action: 'NAVIGATE', response: () => 'Showing staff by contract type.', data: () => ({ path: 'hr-staff' }) },
  { patterns: [/show pay grades/i, /salary information/i, /pay scale/i, /pay grades/i], action: 'NAVIGATE', response: () => 'Opening salary information.', data: () => ({ path: 'hr-staff' }) },
  { patterns: [/show references due/i, /reference requests/i, /outstanding references/i], action: 'STAFF_INFO', response: () => 'No outstanding reference requests.' },
  { patterns: [/show the staff handbook/i, /staff handbook/i, /policy handbook/i], action: 'NAVIGATE', response: () => 'Opening policy and handbook section.', data: () => ({ path: 'school-office' }) },

  // ─── CURRICULUM & TIMETABLE ──────────────────────────────────────────────────
  { patterns: [/show the timetable/i, /open timetable/i, /go to timetable/i], action: 'NAVIGATE', response: () => 'Opening the school timetable.', data: () => ({ path: 'timetable' }) },
  { patterns: [/what'?s on today/i, /whats on today/i, /today'?s schedule/i, /today'?s timetable/i], action: 'NAVIGATE', response: () => 'Showing today\'s schedule.', data: () => ({ path: 'timetable' }) },
  { patterns: [/show curriculum coverage/i, /curriculum tracker/i, /curriculum coverage/i], action: 'NAVIGATE', response: () => 'Opening curriculum tracker.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show reading plans/i, /reading plans/i, /open reading plans/i], action: 'NAVIGATE', response: () => 'Opening reading plans.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show phonics progress/i, /phonics tracker/i, /phonics data/i], action: 'NAVIGATE', response: () => 'Opening phonics tracker.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show maths results/i, /maths attainment/i, /maths data/i], action: 'NAVIGATE', response: () => 'Opening maths attainment data.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show english results/i, /english attainment/i, /english data/i], action: 'NAVIGATE', response: () => 'Opening English attainment data.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show science results/i, /science attainment/i, /science data/i], action: 'NAVIGATE', response: () => 'Opening science attainment data.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show the curriculum map/i, /curriculum map/i, /open curriculum map/i], action: 'NAVIGATE', response: () => 'Opening curriculum map.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show lesson observations/i, /lesson observations/i, /observation records/i], action: 'NAVIGATE', response: () => 'Opening lesson observation records.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show book scrutiny/i, /book scrutiny/i, /book look/i], action: 'NAVIGATE', response: () => 'Opening book scrutiny log.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show planning/i, /lesson planning/i, /open planning/i], action: 'NAVIGATE', response: () => 'Opening lesson planning.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show schemes of work/i, /schemes of work/i, /scheme of work/i], action: 'NAVIGATE', response: () => 'Opening schemes of work.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show extra curricular/i, /extracurricular/i, /clubs and activities/i, /after school clubs/i], action: 'NAVIGATE', response: () => 'Opening clubs and activities.', data: () => ({ path: 'wraparound' }) },
  { patterns: [/show sports fixtures/i, /sports calendar/i, /sports fixtures/i, /fixtures/i], action: 'NAVIGATE', response: () => 'Opening sports calendar.', data: () => ({ path: 'wraparound' }) },
  { patterns: [/show trips and visits/i, /educational visits/i, /school trips/i], action: 'NAVIGATE', response: () => 'Opening educational visits log.', data: () => ({ path: 'school-office' }) },
  { patterns: [/show the library/i, /library resources/i, /open library/i], action: 'NAVIGATE', response: () => 'Opening library resources.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show homework tracker/i, /homework tracker/i, /homework log/i], action: 'NAVIGATE', response: () => 'Opening homework tracker.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show revision resources/i, /revision materials/i, /revision resources/i], action: 'NAVIGATE', response: () => 'Opening revision materials.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show the knowledge organiser/i, /knowledge organiser/i, /knowledge organisers/i], action: 'NAVIGATE', response: () => 'Opening knowledge organiser bank.', data: () => ({ path: 'curriculum' }) },

  // ─── OFSTED & COMPLIANCE ─────────────────────────────────────────────────────
  { patterns: [/show me ofsted prep/i, /ofsted prep/i, /ofsted preparation/i, /open ofsted/i], action: 'NAVIGATE', response: () => 'Opening Ofsted preparation.', data: () => ({ path: 'ofsted' }) },
  { patterns: [/what'?s our ofsted rating/i, /whats our ofsted rating/i, /ofsted rating/i, /our rating/i], action: 'OFSTED_INFO', response: () => 'Your current Ofsted rating is Good with Outstanding features.' },
  { patterns: [/show the self evaluation form/i, /self evaluation/i, /open the sef/i, /show sef/i], action: 'NAVIGATE', response: () => 'Opening the SEF.', data: () => ({ path: 'ofsted' }) },
  { patterns: [/show improvement plan/i, /school improvement plan/i, /sip/i], action: 'NAVIGATE', response: () => 'Opening the school improvement plan.', data: () => ({ path: 'ofsted' }) },
  { patterns: [/show the safeguarding audit/i, /safeguarding audit/i, /safeguarding checklist/i], action: 'NAVIGATE', response: () => 'Opening the safeguarding audit checklist.', data: () => ({ path: 'safeguarding' }) },
  { patterns: [/show policies due for review/i, /policies due/i, /policy review dates/i], action: 'NAVIGATE', response: () => 'Showing policies with upcoming review dates.', data: () => ({ path: 'school-office' }) },
  { patterns: [/is our safeguarding policy up to date/i, /safeguarding policy status/i, /safeguarding policy review/i], action: 'OFSTED_INFO', response: () => 'Safeguarding policy was last reviewed in September. Next review due March.' },
  { patterns: [/show the complaints log/i, /complaints log/i, /complaints register/i], action: 'NAVIGATE', response: () => 'Opening complaints register.', data: () => ({ path: 'school-office' }) },
  { patterns: [/show exclusions/i, /exclusions log/i, /open exclusions/i], action: 'NAVIGATE', response: () => 'Opening exclusions log.', data: () => ({ path: 'safeguarding' }) },
  { patterns: [/show fixed term exclusions/i, /fixed term exclusions/i, /fixed period exclusions/i], action: 'OFSTED_INFO', response: () => '2 fixed-term exclusions this term.' },
  { patterns: [/show the pupil premium report/i, /pupil premium report/i, /pp report/i, /pupil premium impact/i], action: 'NAVIGATE', response: () => 'Opening Pupil Premium impact report.', data: () => ({ path: 'finance' }) },
  { patterns: [/show sports premium spending/i, /pe premium/i, /sports premium/i], action: 'NAVIGATE', response: () => 'Opening PE premium tracker.', data: () => ({ path: 'finance' }) },
  { patterns: [/show send report/i, /send report/i, /send annual report/i], action: 'NAVIGATE', response: () => 'Opening SEND annual report.', data: () => ({ path: 'send-dsl' }) },
  { patterns: [/show the equality objectives/i, /equality objectives/i, /equality plan/i], action: 'NAVIGATE', response: () => 'Opening equality plan.', data: () => ({ path: 'ofsted' }) },
  { patterns: [/show governor information/i, /governor info/i, /governors section/i, /show governors/i], action: 'NAVIGATE', response: () => 'Opening governors section.', data: () => ({ path: 'trust' }) },
  { patterns: [/when is the next governor meeting/i, /next governor meeting/i, /governor meeting date/i], action: 'OFSTED_INFO', response: () => 'Next governor meeting is scheduled for the last Thursday of this month.' },
  { patterns: [/show the school development plan/i, /school development plan/i, /sdp/i], action: 'NAVIGATE', response: () => 'Opening the SDP.', data: () => ({ path: 'ofsted' }) },
  { patterns: [/show statutory returns/i, /statutory returns/i, /data returns/i], action: 'NAVIGATE', response: () => 'Showing upcoming statutory data returns.', data: () => ({ path: 'reports' }) },
  { patterns: [/show census dates/i, /school census/i, /census deadline/i], action: 'OFSTED_INFO', response: () => 'Next school census deadline is in May.' },
  { patterns: [/show the risk register/i, /risk register/i, /risk assessment/i], action: 'NAVIGATE', response: () => 'Opening risk register.', data: () => ({ path: 'ofsted' }) },

  // ─── FINANCE & BUDGET ─────────────────────────────────────────────────────────
  { patterns: [/show the school budget/i, /school budget/i, /open budget/i, /go to budget/i], action: 'NAVIGATE', response: () => 'Opening the school budget.', data: () => ({ path: 'finance' }) },
  { patterns: [/how much budget is remaining/i, /budget remaining/i, /remaining budget/i, /budget left/i], action: 'FINANCE_INFO', response: () => 'Remaining budget for this academic year is 42,000 pounds.' },
  { patterns: [/show the pp budget/i, /pupil premium budget/i, /pp budget/i], action: 'NAVIGATE', response: () => 'Opening Pupil Premium budget.', data: () => ({ path: 'finance' }) },
  { patterns: [/show sen budget/i, /send budget/i, /sen budget allocation/i], action: 'NAVIGATE', response: () => 'Opening SEND budget allocation.', data: () => ({ path: 'finance' }) },
  { patterns: [/show sports premium budget/i, /pe premium budget/i, /sports premium spend/i], action: 'NAVIGATE', response: () => 'Opening PE premium spend.', data: () => ({ path: 'finance' }) },
  { patterns: [/show budget by department/i, /department budget/i, /budget breakdown/i], action: 'NAVIGATE', response: () => 'Breaking down budget by department.', data: () => ({ path: 'finance' }) },
  { patterns: [/show grant funding/i, /grant funding/i, /additional funding/i, /grants/i], action: 'NAVIGATE', response: () => 'Opening grants and additional funding.', data: () => ({ path: 'finance' }) },
  { patterns: [/show the finance report/i, /finance report/i, /monthly finance/i], action: 'NAVIGATE', response: () => 'Opening monthly finance report.', data: () => ({ path: 'finance' }) },
  { patterns: [/show invoices to approve/i, /invoices awaiting/i, /pending invoices/i, /approve invoices/i], action: 'NAVIGATE', response: () => 'Showing invoices awaiting approval.', data: () => ({ path: 'finance' }) },
  { patterns: [/show the procurement log/i, /procurement log/i, /procurement tracker/i], action: 'NAVIGATE', response: () => 'Opening procurement tracker.', data: () => ({ path: 'finance' }) },
  { patterns: [/show catering costs/i, /catering budget/i, /catering spend/i], action: 'NAVIGATE', response: () => 'Opening catering budget.', data: () => ({ path: 'finance' }) },
  { patterns: [/show it spend/i, /it budget/i, /technology budget/i, /ict budget/i], action: 'NAVIGATE', response: () => 'Opening IT budget.', data: () => ({ path: 'finance' }) },
  { patterns: [/show building maintenance costs/i, /maintenance costs/i, /premises budget/i, /building costs/i], action: 'NAVIGATE', response: () => 'Opening premises budget.', data: () => ({ path: 'facilities' }) },
  { patterns: [/show the three year budget plan/i, /three year budget/i, /medium term financial/i, /3 year budget/i], action: 'NAVIGATE', response: () => 'Opening medium-term financial plan.', data: () => ({ path: 'finance' }) },
  { patterns: [/show salary costs/i, /staffing costs/i, /salary analysis/i, /staffing cost/i], action: 'NAVIGATE', response: () => 'Opening staffing cost analysis.', data: () => ({ path: 'finance' }) },
  { patterns: [/show income sources/i, /income breakdown/i, /school income/i], action: 'NAVIGATE', response: () => 'Showing school income breakdown.', data: () => ({ path: 'finance' }) },
  { patterns: [/show the local authority grant/i, /la funding/i, /local authority funding/i], action: 'NAVIGATE', response: () => 'Opening LA funding details.', data: () => ({ path: 'finance' }) },
  { patterns: [/show governors finance report/i, /governor finance pack/i, /governors finance/i], action: 'NAVIGATE', response: () => 'Opening governor finance pack.', data: () => ({ path: 'finance' }) },
  { patterns: [/are we in surplus or deficit/i, /surplus or deficit/i, /budget position/i], action: 'FINANCE_INFO', response: () => 'The school is currently in a small surplus of 8,200 pounds.' },
  { patterns: [/show cost per pupil/i, /cost per pupil/i, /per pupil cost/i], action: 'FINANCE_INFO', response: () => 'Cost per pupil this year is approximately 5,100 pounds.' },

  // ─── COMMUNICATIONS & PARENTS ────────────────────────────────────────────────
  { patterns: [/show parent communications/i, /parent communications/i, /parent messages/i], action: 'NAVIGATE', response: () => 'Opening parent communications.', data: () => ({ path: 'school-office' }) },
  { patterns: [/show the newsletter/i, /newsletter editor/i, /open newsletter/i, /school newsletter/i], action: 'NAVIGATE', response: () => 'Opening newsletter editor.', data: () => ({ path: 'school-office' }) },
  { patterns: [/show upcoming events/i, /upcoming events/i, /school events/i, /events calendar/i], action: 'NAVIGATE', response: () => 'Opening school events calendar.', data: () => ({ path: 'school-office' }) },
  { patterns: [/show parents evening bookings/i, /parents evening/i, /parents evening scheduler/i], action: 'NAVIGATE', response: () => 'Opening parents evening scheduler.', data: () => ({ path: 'school-office' }) },
  { patterns: [/how many parents have the app/i, /parent app adoption/i, /app adoption/i], action: 'COMMS_INFO', response: () => 'Parent app adoption rate is 78 percent.' },
  { patterns: [/show unread parent messages/i, /unread parent messages/i, /unread messages/i], action: 'COMMS_INFO', response: () => '4 unread parent messages.' },
  { patterns: [/show the school calendar/i, /school calendar/i, /open calendar/i], action: 'NAVIGATE', response: () => 'Opening the school calendar.', data: () => ({ path: 'school-office' }) },
  { patterns: [/show term dates/i, /term dates/i, /when do terms start/i], action: 'COMMS_INFO', response: () => 'Term dates for the current academic year are available in the school office.' },
  { patterns: [/when is the next inset day/i, /next inset day/i, /inset day/i], action: 'COMMS_INFO', response: () => 'Next INSET day is the first Monday after half term.' },
  { patterns: [/show the prospectus/i, /school prospectus/i, /open prospectus/i], action: 'NAVIGATE', response: () => 'Opening school prospectus.', data: () => ({ path: 'admissions' }) },
  { patterns: [/show admissions enquiries/i, /admissions enquiries/i, /new admissions/i, /admissions tracker/i], action: 'NAVIGATE', response: () => 'Opening new admissions tracker.', data: () => ({ path: 'admissions' }) },
  { patterns: [/how many applications for reception/i, /reception applications/i, /reception intake/i], action: 'COMMS_INFO', response: () => 'You have 34 reception applications for next academic year.' },
  { patterns: [/show waiting list/i, /waiting list/i, /admissions waiting/i], action: 'NAVIGATE', response: () => 'Opening admissions waiting list.', data: () => ({ path: 'admissions' }) },
  { patterns: [/send a whole school message/i, /whole school message/i, /broadcast message/i], action: 'COMMS_ACTION', response: () => 'Opening broadcast message tool.' },
  { patterns: [/show the school twitter/i, /school twitter/i, /social media/i, /school social media/i], action: 'COMMS_INFO', response: () => 'Opening social media view.' },
  { patterns: [/show consent forms outstanding/i, /consent forms/i, /outstanding consent/i], action: 'COMMS_INFO', response: () => '12 consent forms are still outstanding.' },
  { patterns: [/show the trip permission slips/i, /permission slips/i, /trip permissions/i], action: 'COMMS_INFO', response: () => '8 permission slips outstanding for the upcoming trip.' },
  { patterns: [/show free school meal applications/i, /free school meals/i, /fsm register/i, /fsm applications/i], action: 'NAVIGATE', response: () => 'Opening FSM register.', data: () => ({ path: 'school-office' }) },
  { patterns: [/show the school text log/i, /school text log/i, /sms log/i, /text messages/i], action: 'NAVIGATE', response: () => 'Opening SMS communication log.', data: () => ({ path: 'school-office' }) },

  // ─── WELLBEING & PASTORAL ─────────────────────────────────────────────────────
  { patterns: [/show pupil wellbeing/i, /pupil wellbeing/i, /wellbeing tracker/i], action: 'NAVIGATE', response: () => 'Opening wellbeing tracker.', data: () => ({ path: 'safeguarding' }) },
  { patterns: [/show the pastoral log/i, /pastoral log/i, /pastoral records/i], action: 'NAVIGATE', response: () => 'Opening pastoral records.', data: () => ({ path: 'safeguarding' }) },
  { patterns: [/show behaviour incidents today/i, /behaviour incidents/i, /behavior incidents/i, /incidents today/i], action: 'WELLBEING_INFO', response: () => '3 behaviour incidents logged today.' },
  { patterns: [/show bullying log/i, /bullying log/i, /anti.?bullying/i], action: 'NAVIGATE', response: () => 'Opening anti-bullying log.', data: () => ({ path: 'safeguarding' }) },
  { patterns: [/show the worry box/i, /worry box/i, /pupil worries/i], action: 'NAVIGATE', response: () => 'Opening pupil wellbeing submissions.', data: () => ({ path: 'safeguarding' }) },
  { patterns: [/show mental health referrals/i, /mental health referrals/i, /camhs referrals/i], action: 'NAVIGATE', response: () => 'Opening CAMHS referrals.', data: () => ({ path: 'safeguarding' }) },
  { patterns: [/who is seeing the counsellor/i, /counsellor today/i, /counselling sessions/i], action: 'WELLBEING_INFO', response: () => '2 pupils have counselling sessions today.' },
  { patterns: [/show the behaviour policy/i, /behaviour policy/i, /behavior policy/i], action: 'NAVIGATE', response: () => 'Opening behaviour policy.', data: () => ({ path: 'school-office' }) },
  { patterns: [/show reward points/i, /reward points/i, /reward system/i], action: 'NAVIGATE', response: () => 'Opening reward system.', data: () => ({ path: 'students' }) },
  { patterns: [/show house points/i, /house points/i, /house point totals/i], action: 'WELLBEING_INFO', response: () => 'House point totals: Hawks 1,240, Eagles 1,180, Falcons 1,120, Owls 1,090.' },
  { patterns: [/show exclusion risk pupils/i, /exclusion risk/i, /at risk of exclusion/i], action: 'NAVIGATE', response: () => 'Showing exclusion risk pupils.', data: () => ({ path: 'safeguarding' }) },
  { patterns: [/show the transition plan/i, /transition plan/i, /year 6 transition/i, /year six transition/i], action: 'NAVIGATE', response: () => 'Opening Year 6 transition docs.', data: () => ({ path: 'curriculum' }) },
  { patterns: [/show early help cases/i, /early help/i, /early help log/i], action: 'NAVIGATE', response: () => 'Opening early help log.', data: () => ({ path: 'safeguarding' }) },
  { patterns: [/show the family support worker/i, /family support worker/i, /fsw cases/i], action: 'NAVIGATE', response: () => 'Opening FSW cases.', data: () => ({ path: 'safeguarding' }) },
  { patterns: [/show peer mentoring/i, /peer mentoring/i, /peer mentor/i], action: 'NAVIGATE', response: () => 'Opening peer mentor programme.', data: () => ({ path: 'students' }) },
  { patterns: [/show school council/i, /school council/i, /student council/i], action: 'NAVIGATE', response: () => 'Opening school council records.', data: () => ({ path: 'students' }) },
  { patterns: [/show the nurture group/i, /nurture group/i, /nurture provision/i], action: 'NAVIGATE', response: () => 'Opening nurture provision.', data: () => ({ path: 'send-dsl' }) },
  { patterns: [/show breakfast club attendance/i, /breakfast club/i, /breakfast club register/i], action: 'NAVIGATE', response: () => 'Opening breakfast club register.', data: () => ({ path: 'wraparound' }) },
  { patterns: [/show after school club register/i, /after school club/i, /after.?school provision/i], action: 'NAVIGATE', response: () => 'Opening after-school provision.', data: () => ({ path: 'wraparound' }) },
  { patterns: [/show the pupil voice survey/i, /pupil voice/i, /pupil survey/i], action: 'NAVIGATE', response: () => 'Opening pupil survey data.', data: () => ({ path: 'insights' }) },

  // ─── GENERAL ──────────────────────────────────────────────────────────────────
  { patterns: [/^good morning$/i, /^good morning lumio$/i, /^morning$/i], action: 'PLAY_BRIEFING', response: () => 'Good morning. Starting your briefing now.' },
  { patterns: [/show the dashboard/i, /open dashboard/i, /go to dashboard/i], action: 'NAVIGATE', response: () => 'Opening the dashboard.', data: () => ({ path: 'overview' }) },
  { patterns: [/show me insights/i, /show insights/i, /open insights/i, /school insights/i], action: 'NAVIGATE', response: () => 'Opening school insights.', data: () => ({ path: 'insights' }) },
  { patterns: [/show facilities/i, /open facilities/i, /go to facilities/i], action: 'NAVIGATE', response: () => 'Opening facilities.', data: () => ({ path: 'facilities' }) },
  { patterns: [/show the settings/i, /open settings/i, /go to settings/i], action: 'NAVIGATE', response: () => 'Opening settings.', data: () => ({ path: 'settings' }) },
  { patterns: [/show workflows/i, /open workflows/i, /go to workflows/i], action: 'NAVIGATE', response: () => 'Opening workflows.', data: () => ({ path: 'workflows' }) },
  { patterns: [/show wraparound care/i, /wraparound care/i, /wraparound provision/i], action: 'NAVIGATE', response: () => 'Opening wraparound provision.', data: () => ({ path: 'wraparound' }) },
  { patterns: [/show the trust/i, /open trust/i, /go to trust/i, /trust information/i], action: 'NAVIGATE', response: () => 'Opening trust information.', data: () => ({ path: 'trust' }) },
  { patterns: [/show reports/i, /open reports/i, /go to reports/i], action: 'NAVIGATE', response: () => 'Opening reports.', data: () => ({ path: 'reports' }) },

  // ─── HELP (updated) ───────────────────────────────────────────────────────────
  { patterns: [/help/i, /what can you do/i, /commands/i], action: 'HELP', response: () => "You can say things like: show me the pupils, check attendance, who is absent, show NELI results, show the staff, book cover, log a concern, show the budget, show Ofsted prep, show the timetable, or navigate to any department. Say 'good morning' for your briefing." },
]

export function useSchoolVoiceCommands() {
  const recognitionRef = useRef<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lastCommand, setLastCommand] = useState<SchoolVoiceCommandResult | null>(null)

  const processCommand = useCallback((text: string): SchoolVoiceCommandResult => {
    for (const cmd of COMMANDS) {
      for (const pattern of cmd.patterns) {
        const match = text.match(pattern)
        if (match) return { command: text, action: cmd.action, response: cmd.response(match, text), data: cmd.data?.(match, text) }
      }
    }
    return { command: text, action: 'UNKNOWN', response: `I heard "${text}" but I'm not sure what to do. Say "help" for available commands.` }
  }, [])

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.lang = 'en-GB'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false
    recognition.onresult = (e: any) => { const text = e.results[0][0].transcript; setTranscript(text); setLastCommand(processCommand(text)) }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [processCommand])

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); setIsListening(false) }, [])

  return { isListening, transcript, lastCommand, startListening, stopListening }
}
