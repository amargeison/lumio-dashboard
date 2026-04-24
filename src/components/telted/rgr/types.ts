// Payload types for /api/partners/rgr/dashboard.
// Copied verbatim from the RGR spec §5. Do not mutate on the client —
// if a shape question comes up, check scripts/rgr/RGR_DASHBOARD_SPEC.md
// first, then build_data.py.

export type Engagement = 'red' | 'amber' | 'green'
export type StudentRag = 'red' | 'amber' | 'green'
export type Phase = 0 | 1 | 2 | 3 | 4
export type AssessmentYear = '2024-25' | '2025-26'

export type KPI = {
  totalSchools: number
  active: number
  red: number
  amber: number
  green: number
  studentsTotal: number
  classesTotal: number
  assessmentsTotal: number
  assessmentsCY: number
  teachersTotal: number
  teachersTrained: number
  ragR: number
  ragA: number
  ragG: number
  drlSchools: number
  uploadedSchools: number
  accessedSchools: number
}

export type School = {
  id: string
  name: string
  code: string
  state: string
  students: number
  classes: number
  uploaded: boolean
  accessed: boolean
  portalAccess: string
  daysSincePortal: number | null
  lastAssessmentDate: string
  daysSinceAssessment: number | null
  totalAssessments: number
  assessmentsCY: number
  red: number
  amber: number
  green: number
  teachersInvited: number
  teachersFullyTrained: number
  courseCounts: Record<string, Record<string, number>>
  hasDRL: boolean
  wcMilestone: string
  psMilestone: string
  lastDRL: string
  engagement: Engagement
  phase: Phase
  phaseLabels: string[]
  nextAction: string
}

export type Teacher = {
  name: string
  school: string
  schoolFull: string
  email: string
  fullyTrained: boolean
  invitedDate: string
  lastVisit: string
  c1: TrainingStatus
  c2: TrainingStatus
  c3: TrainingStatus
  c4: TrainingStatus
  supportHub: TrainingStatus
  c1Progress?: string
  c2Progress?: string
  c3Progress?: string
  c4Progress?: string
}

export type TrainingStatus = 'Completed' | 'In progress' | 'Enrolled' | 'Not started' | ''

export type Assessment = {
  year: AssessmentYear
  codename: string
  schoolId: string
  schoolName: string
  yearGroup: string
  grade: string
  gradeOrder: number
  ageMonths: number
  assessmentDate: string
  assessmentIndex: number
  rag: StudentRag
  total: number
  ev: number
  rv: number
  lc: number
  sr: number
  gender: string
  studentId: string
}

export type Paired = {
  studentId: string
  codename: string
  year: AssessmentYear
  schoolName: string
  first: number
  last: number
  delta: number
}

export type Payload = {
  generatedAt: string
  partner: {
    name: string
    shortName: string
    accountManager?: string
    schoolsUnderManagement: number
  }
  kpi: KPI
  schools: School[]
  teachers: Teacher[]
  assessments: Assessment[]
  pairedAssessments: Paired[]
  yearMap: Record<string, string>
}
