// ═══════════════════════════════════════════════════════════════════════════════
// CENTRAL SCHOOLS DEMO DATA — single source of truth for all schools pages
// Import { SCHOOL_DEMO } everywhere. Never hardcode school stats elsewhere.
// ═══════════════════════════════════════════════════════════════════════════════

export const SCHOOL_DEMO = {
  school: {
    name: 'Margy High School',
    slug: 'margy-high-school',
    type: 'Academy',
    phase: 'Secondary',
    ofstedRating: 'Outstanding',
    lastInspection: '2023',
    capacity: 1200,
    location: 'London, UK',
    website: 'margy-high-school.co.uk',
  },

  stats: {
    pupils: 1147,
    staff: 89,
    alerts: 6,
    reports: 4,
    attendance: 96.2,
    attendanceTarget: 94,
    coverNeeded: 3,
    coverUnassigned: 2,
    safeguardingOpen: 1,
    sendPupils: 47,
    ofstedReadiness: 87,
    parentEmailsUnread: 7,
    smsUnread: 3,
    behaviourIncidentsThisWeek: 4,
    exclusionsPending: 0,
    ehcpReviewsDue: 3,
    mockResultsOutstanding: 3,
    cpdBookingDeadlineDays: 2,
  },

  staff: {
    absent: ['Mr Johnson'],
    absentCount: 1,
    leaveRequests: 1,
    expensesPending: 1,
  },

  todaySchedule: [
    { time: '08:50', title: 'Registration period', type: 'admin', duration: 10, organiser: 'admin', status: 'done' as const },
    { time: '10:00', title: 'Year 6 SATs prep', type: 'academic', duration: 60, organiser: 'Ms Clarke', status: 'upcoming' as const },
    { time: '11:30', title: 'SENCO review meeting', type: 'meeting', duration: 30, organiser: 'Mrs Patel', status: 'upcoming' as const },
    { time: '14:00', title: 'Parent consultation — J. Morris', type: 'parent', duration: 20, organiser: 'Dr Mitchell', status: 'upcoming' as const },
  ],

  notifications: [
    { id: 1, type: 'urgent', icon: '🚨', title: 'Safeguarding concern logged', body: 'Year 9 pupil — DSL review required today', time: '8 mins ago', unread: true, department: 'safeguarding', role: ['all'] },
    { id: 2, type: 'alert', icon: '📋', title: 'Cover needed — Period 3', body: 'Mr Johnson absent — Year 10 Maths unassigned', time: '14 mins ago', unread: true, department: 'timetable', role: ['all'] },
    { id: 3, type: 'info', icon: '✅', title: 'Attendance below target', body: 'Year 6 at 91.8% — 3 pupils unexplained absence', time: '22 mins ago', unread: true, department: 'students', role: ['all'] },
    { id: 4, type: 'info', icon: '📧', title: 'Parent email received', body: 'Re: Oliver Bennett — collection arrangements today', time: '31 mins ago', unread: true, department: 'school-office', role: ['all'] },
    { id: 5, type: 'alert', icon: '🧠', title: 'SENCO referral submitted', body: 'Year 7 pupil referred by Ms Clarke', time: '45 mins ago', unread: true, department: 'send', role: ['senco', 'admin', 'slt'] },
    { id: 6, type: 'info', icon: '📊', title: 'Mock results due today', body: 'Year 11 — upload to MIS by 4pm', time: '1 hr ago', unread: true, department: 'curriculum', role: ['all'] },
    { id: 7, type: 'info', icon: '🏫', title: 'Ofsted portal update', body: 'New guidance: SEND inspection framework', time: '2 hrs ago', unread: false, department: 'slt', role: ['slt', 'admin'] },
    { id: 8, type: 'info', icon: '💰', title: 'Expense claim approved', body: 'CPD travel — £42.50 approved by finance', time: '2 hrs ago', unread: false, department: 'finance', role: ['all'] },
    { id: 9, type: 'alert', icon: '🔧', title: 'IT ticket raised', body: 'Projector fault — Room 14, engineer booked Thursday', time: '3 hrs ago', unread: false, department: 'facilities', role: ['it', 'admin'] },
    { id: 10, type: 'info', icon: '📅', title: 'CPD booking confirmed', body: 'Trauma-informed teaching — 24 April, Leeds', time: '3 hrs ago', unread: false, department: 'hr', role: ['all'] },
    { id: 11, type: 'info', icon: '👤', title: 'New admission request', body: 'Year 8 — starting 14 April pending paperwork', time: 'Yesterday', unread: false, department: 'students', role: ['admin', 'slt'] },
    { id: 12, type: 'alert', icon: '📱', title: '3 unread parent SMS', body: 'Replies needed — Mrs Ahmed, Mr Singh, Mrs Taylor', time: 'Yesterday', unread: false, department: 'school-office', role: ['all'] },
    { id: 13, type: 'info', icon: '📋', title: 'Behaviour log added', body: 'Year 10 incident — isolation served, parent notified', time: 'Yesterday', unread: false, department: 'students', role: ['all'] },
    { id: 14, type: 'info', icon: '🎓', title: 'Leave request submitted', body: "Ms O'Brien — compassionate leave 7-8 April", time: 'Yesterday', unread: false, department: 'hr', role: ['admin', 'slt'] },
    { id: 15, type: 'info', icon: '📄', title: 'Risk assessment approved', body: 'Year 9 Science trip — all sign-offs complete', time: '2 days ago', unread: false, department: 'facilities', role: ['all'] },
    { id: 16, type: 'info', icon: '🏆', title: 'Ofsted readiness updated', body: 'Self-assessment now 87% — up 4% this week', time: '2 days ago', unread: false, department: 'slt', role: ['slt', 'admin'] },
    { id: 17, type: 'info', icon: '📦', title: 'Resource request fulfilled', body: 'Art supplies delivered to room 22', time: '2 days ago', unread: false, department: 'facilities', role: ['all'] },
    { id: 18, type: 'info', icon: '💬', title: 'SLT message received', body: 'Dr Mitchell: All staff briefing — Friday 3:45pm', time: '2 days ago', unread: false, department: 'slt', role: ['all'] },
    { id: 19, type: 'info', icon: '📊', title: 'Progress report generated', body: 'Year 10 mid-term report ready for review', time: '3 days ago', unread: false, department: 'curriculum', role: ['all'] },
    { id: 20, type: 'info', icon: '✅', title: 'EHCP review completed', body: 'Annual review for 3 pupils filed with LA', time: '3 days ago', unread: false, department: 'send', role: ['senco', 'admin', 'slt'] },
  ],

  departments: {
    timetable: { coverNeeded: 3, unassigned: 2, clashes: 0, changeRequests: 3 },
    hr: { absent: 1, leaveRequests: 1, cpd: 1, contractsExpiring: 0 },
    students: { admissions: 1, behaviourIncidents: 4, parentContacts: 3, exclusions: 0 },
    send: { referralsPending: 2, ehcpReviews: 3, lacCount: 1, semhConcerns: 2 },
    safeguarding: { openConcerns: 1, referralsPending: 0, actionsOverdue: 1 },
    finance: { expensesPending: 2, invoicesUnpaid: 3, budgetRemaining: 78, grantDeadlines: 1 },
    facilities: { maintenanceOpen: 4, roomBookings: 12, complianceDue: 2 },
    curriculum: { schemeGaps: 2, assessmentsDue: 1, resourceRequests: 3, moderationDue: 1 },
    classes: { registersMissed: 0, coverToday: 3, behaviourToday: 2 },
    schoolOffice: { smsUnread: 3, emailsUnread: 7, visitorsToday: 4, firstAidToday: 1 },
    slt: { ofstedReadiness: 87, governorReportDue: true, improvementActions: 5 },
  },

  channels: [
    { icon: '📱', label: 'SMS Alerts', count: 3, sub: 'unread parent texts' },
    { icon: '📞', label: 'Phone Messages', count: 1, sub: 'voicemail from parent' },
    { icon: '📧', label: 'Email Inbox', count: 7, sub: 'flagged for action' },
    { icon: '🔔', label: 'Push Notifications', count: 4, sub: 'app alerts' },
    { icon: '📋', label: 'MIS Alerts', count: 2, sub: 'from Arbor/SIMS' },
    { icon: '🏫', label: 'Ofsted Portal', count: 1, sub: 'new correspondence' },
    { icon: '💬', label: 'Teams/Slack', count: 5, sub: 'unread staff messages' },
    { icon: '📟', label: 'Announcements', count: 0, sub: 'no new broadcasts' },
  ],

  keyContacts: [
    { role: 'Headteacher', name: 'Dr Sarah Mitchell' },
    { role: 'Deputy Head', name: 'Mr James Okafor' },
    { role: 'SENCO', name: 'Mrs Linda Patel' },
    { role: 'DSL', name: 'Mr Tom Briggs' },
    { role: 'Finance', name: 'Mrs Claire Andrews' },
    { role: 'IT Support', name: 'Mr Dev Sharma' },
  ],
} as const

export type SchoolNotification = (typeof SCHOOL_DEMO.notifications)[number]
export type SchoolChannel = (typeof SCHOOL_DEMO.channels)[number]
