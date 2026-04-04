export type SchoolRole = 'slt_admin' | 'slt' | 'senco' | 'dsl' | 'pastoral' | 'teacher' | 'finance_admin' | 'finance' | 'admin' | 'it' | 'facilities' | 'governor'

export const SCHOOL_ROLES: Record<SchoolRole, {
  label: string
  icon: string
  description: string
  misJobTitles: string[]
  permissions: {
    nav: string[]
    quickActions: string[]
    statsVisible: string[]
    canViewSafeguarding: boolean
    canViewFinance: boolean
    canViewHR: boolean
    canViewSLT: boolean
    canViewSEND: boolean
    canInitiateLockdown: boolean
    canApproveLeave: boolean
    canViewAllStaff: boolean
    notificationDepts: string[]
  }
}> = {
  slt_admin: {
    label: 'Headteacher',
    icon: '👑',
    description: 'Full access to all areas',
    misJobTitles: ['Headteacher', 'Principal', 'Executive Headteacher'],
    permissions: {
      nav: ['all'],
      quickActions: ['all'],
      statsVisible: ['all'],
      canViewSafeguarding: true,
      canViewFinance: true,
      canViewHR: true,
      canViewSLT: true,
      canViewSEND: true,
      canInitiateLockdown: true,
      canApproveLeave: true,
      canViewAllStaff: true,
      notificationDepts: ['all'],
    }
  },
  slt: {
    label: 'Deputy / Assistant Head',
    icon: '🏫',
    description: 'Full access minus billing and system settings',
    misJobTitles: ['Deputy Headteacher', 'Assistant Headteacher', 'Vice Principal'],
    permissions: {
      nav: ['overview', 'slt', 'curriculum', 'students', 'classes', 'send-dsl', 'safeguarding', 'hr-staff', 'finance', 'facilities', 'timetable', 'school-office', 'admissions', 'reports', 'insights', 'workflows'],
      quickActions: ['all'],
      statsVisible: ['all'],
      canViewSafeguarding: true,
      canViewFinance: true,
      canViewHR: true,
      canViewSLT: true,
      canViewSEND: true,
      canInitiateLockdown: true,
      canApproveLeave: true,
      canViewAllStaff: true,
      notificationDepts: ['all'],
    }
  },
  senco: {
    label: 'SENCO',
    icon: '🧠',
    description: 'SEND, pastoral, students, and safeguarding access',
    misJobTitles: ['SENCO', 'Inclusion Manager', 'SEN Coordinator', 'Special Educational Needs Coordinator'],
    permissions: {
      nav: ['overview', 'send-dsl', 'students', 'classes', 'safeguarding', 'curriculum', 'timetable', 'reports', 'insights'],
      quickActions: ['new-concern', 'refer-to-senco', 'behaviour-incident', 'log-absence', 'parent-contact', 'pupil-progress-note', 'send-parent-email', 'run-report', 'request-resources', 'it-support', 'book-cpd', 'claim-expenses', 'request-leave'],
      statsVisible: ['pupils', 'alerts', 'send', 'safeguarding', 'attendance'],
      canViewSafeguarding: true,
      canViewFinance: false,
      canViewHR: false,
      canViewSLT: false,
      canViewSEND: true,
      canInitiateLockdown: false,
      canApproveLeave: false,
      canViewAllStaff: true,
      notificationDepts: ['send-dsl', 'safeguarding', 'students', 'all'],
    }
  },
  dsl: {
    label: 'DSL / Safeguarding Lead',
    icon: '🛡️',
    description: 'Full safeguarding access plus pastoral',
    misJobTitles: ['Designated Safeguarding Lead', 'DSL', 'Safeguarding Lead', 'Child Protection Officer'],
    permissions: {
      nav: ['overview', 'safeguarding', 'send-dsl', 'students', 'classes', 'school-office', 'reports', 'insights'],
      quickActions: ['safeguarding-referral', 'new-concern', 'behaviour-incident', 'log-absence', 'parent-contact', 'refer-to-senco', 'pupil-progress-note', 'send-parent-email', 'run-report', 'claim-expenses', 'request-leave'],
      statsVisible: ['pupils', 'alerts', 'safeguarding', 'attendance', 'send'],
      canViewSafeguarding: true,
      canViewFinance: false,
      canViewHR: false,
      canViewSLT: false,
      canViewSEND: true,
      canInitiateLockdown: true,
      canApproveLeave: false,
      canViewAllStaff: true,
      notificationDepts: ['safeguarding', 'send-dsl', 'students', 'all'],
    }
  },
  pastoral: {
    label: 'Head of Year / Pastoral',
    icon: '💛',
    description: 'Students, classes, and pastoral access',
    misJobTitles: ['Head of Year', 'Pastoral Leader', 'Form Tutor Lead', 'Year Group Manager'],
    permissions: {
      nav: ['overview', 'students', 'classes', 'curriculum', 'timetable', 'school-office', 'reports'],
      quickActions: ['new-concern', 'behaviour-incident', 'log-absence', 'parent-contact', 'pupil-progress-note', 'send-parent-email', 'run-report', 'mark-register', 'request-resources', 'claim-expenses', 'request-leave', 'it-support', 'book-cpd'],
      statsVisible: ['pupils', 'alerts', 'attendance', 'behaviour'],
      canViewSafeguarding: false,
      canViewFinance: false,
      canViewHR: false,
      canViewSLT: false,
      canViewSEND: false,
      canInitiateLockdown: false,
      canApproveLeave: false,
      canViewAllStaff: false,
      notificationDepts: ['students', 'school-office', 'all'],
    }
  },
  teacher: {
    label: 'Teacher',
    icon: '📚',
    description: 'Own classes, timetable, and shared resources',
    misJobTitles: ['Teacher', 'Subject Teacher', 'Form Tutor', 'NQT', 'ECT', 'Cover Supervisor'],
    permissions: {
      nav: ['overview', 'curriculum', 'classes', 'timetable', 'students', 'school-office'],
      quickActions: ['new-concern', 'log-absence', 'parent-contact', 'book-cover', 'behaviour-incident', 'mark-register', 'create-lesson-plan', 'send-parent-email', 'pupil-progress-note', 'request-resources', 'it-support', 'book-cpd', 'claim-expenses', 'request-leave'],
      statsVisible: ['pupils', 'alerts', 'attendance'],
      canViewSafeguarding: false,
      canViewFinance: false,
      canViewHR: false,
      canViewSLT: false,
      canViewSEND: false,
      canInitiateLockdown: false,
      canApproveLeave: false,
      canViewAllStaff: false,
      notificationDepts: ['all'],
    }
  },
  finance_admin: {
    label: 'School Business Manager',
    icon: '💼',
    description: 'Finance full access plus HR view',
    misJobTitles: ['School Business Manager', 'Business Manager', 'Bursar'],
    permissions: {
      nav: ['overview', 'finance', 'hr-staff', 'facilities', 'school-office', 'reports'],
      quickActions: ['claim-expenses', 'purchase-request', 'run-report', 'request-leave', 'it-support'],
      statsVisible: ['staff', 'alerts', 'reports', 'finance'],
      canViewSafeguarding: false,
      canViewFinance: true,
      canViewHR: true,
      canViewSLT: false,
      canViewSEND: false,
      canInitiateLockdown: false,
      canApproveLeave: true,
      canViewAllStaff: true,
      notificationDepts: ['finance', 'hr-staff', 'facilities', 'all'],
    }
  },
  finance: {
    label: 'Finance Officer',
    icon: '💰',
    description: 'Finance department only',
    misJobTitles: ['Finance Officer', 'Accounts Officer', 'Finance Assistant'],
    permissions: {
      nav: ['overview', 'finance', 'reports'],
      quickActions: ['claim-expenses', 'purchase-request', 'run-report', 'request-leave', 'it-support'],
      statsVisible: ['alerts', 'reports'],
      canViewSafeguarding: false,
      canViewFinance: true,
      canViewHR: false,
      canViewSLT: false,
      canViewSEND: false,
      canInitiateLockdown: false,
      canApproveLeave: false,
      canViewAllStaff: false,
      notificationDepts: ['finance', 'all'],
    }
  },
  admin: {
    label: 'Admin Officer',
    icon: '🗂️',
    description: 'School office plus most departments view only',
    misJobTitles: ['Admin Officer', 'School Secretary', 'Office Manager', 'Administrator', 'Receptionist'],
    permissions: {
      nav: ['overview', 'school-office', 'students', 'timetable', 'hr-staff', 'facilities', 'admissions', 'reports'],
      quickActions: ['log-absence', 'parent-contact', 'visitor-sign-in', 'first-aid-log', 'send-announcement', 'school-lockdown', 'mark-register', 'new-admission', 'run-report', 'claim-expenses', 'request-leave', 'it-support'],
      statsVisible: ['pupils', 'staff', 'alerts', 'attendance'],
      canViewSafeguarding: false,
      canViewFinance: false,
      canViewHR: true,
      canViewSLT: false,
      canViewSEND: false,
      canInitiateLockdown: true,
      canApproveLeave: false,
      canViewAllStaff: true,
      notificationDepts: ['school-office', 'students', 'all'],
    }
  },
  it: {
    label: 'IT Technician',
    icon: '💻',
    description: 'IT and facilities access',
    misJobTitles: ['IT Technician', 'Network Manager', 'IT Manager', 'IT Support'],
    permissions: {
      nav: ['overview', 'facilities', 'school-office'],
      quickActions: ['it-support', 'log-maintenance', 'request-resources', 'claim-expenses', 'request-leave'],
      statsVisible: ['alerts'],
      canViewSafeguarding: false,
      canViewFinance: false,
      canViewHR: false,
      canViewSLT: false,
      canViewSEND: false,
      canInitiateLockdown: false,
      canApproveLeave: false,
      canViewAllStaff: false,
      notificationDepts: ['facilities', 'all'],
    }
  },
  facilities: {
    label: 'Facilities Manager',
    icon: '🔧',
    description: 'Facilities and maintenance only',
    misJobTitles: ['Facilities Manager', 'Site Manager', 'Caretaker', 'Site Supervisor'],
    permissions: {
      nav: ['overview', 'facilities'],
      quickActions: ['log-maintenance', 'room-booking', 'request-resources', 'claim-expenses', 'request-leave', 'it-support'],
      statsVisible: ['alerts'],
      canViewSafeguarding: false,
      canViewFinance: false,
      canViewHR: false,
      canViewSLT: false,
      canViewSEND: false,
      canInitiateLockdown: false,
      canApproveLeave: false,
      canViewAllStaff: false,
      notificationDepts: ['facilities', 'all'],
    }
  },
  governor: {
    label: 'Governor',
    icon: '🏛️',
    description: 'Read-only dashboard and reports',
    misJobTitles: ['Governor', 'Chair of Governors', 'Co-opted Governor'],
    permissions: {
      nav: ['overview', 'reports'],
      quickActions: [],
      statsVisible: ['pupils', 'staff', 'alerts'],
      canViewSafeguarding: false,
      canViewFinance: false,
      canViewHR: false,
      canViewSLT: false,
      canViewSEND: false,
      canInitiateLockdown: false,
      canApproveLeave: false,
      canViewAllStaff: false,
      notificationDepts: [],
    }
  },
}

export function mapMISRoleToLumioRole(jobTitle: string): SchoolRole {
  const title = jobTitle.toLowerCase()
  for (const [role, config] of Object.entries(SCHOOL_ROLES)) {
    if (config.misJobTitles.some(t => title.includes(t.toLowerCase()))) {
      return role as SchoolRole
    }
  }
  return 'teacher'
}
