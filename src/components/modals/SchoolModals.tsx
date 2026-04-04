'use client'
import { useState } from 'react'
import { X } from 'lucide-react'

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: '#0A0B10',
  border: '1px solid #374151',
  color: '#F9FAFB',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  outline: 'none',
  width: '100%',
}

type ModalProps = { onClose: () => void; onToast: (msg: string) => void }

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
      <div style={{ background: '#111318', border: '1px solid #1F2937', borderRadius: 16, maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
        {children}
      </div>
    </div>
  )
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 600 }}>{title}</h2>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20} /></button>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#9CA3AF', marginBottom: 6 }}>{children}</label>
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, background: value ? '#0D9488' : '#374151', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left 0.2s' }} />
    </button>
  )
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <Label>{label}</Label>
      <Toggle value={value} onChange={onChange} />
    </div>
  )
}

function SubmitBtn({ label, danger }: { label: string; danger?: boolean }) {
  return (
    <button type="submit" style={{ width: '100%', padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 600, background: danger ? '#EF4444' : '#0D9488', color: '#F9FAFB', border: 'none', cursor: 'pointer', marginTop: 12 }}>
      {label}
    </button>
  )
}

function Footer({ text }: { text: string }) {
  return <p style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>{text}</p>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><Label>{label}</Label>{children}</div>
}

function Input({ value, onChange, type, placeholder, max }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string; max?: number }) {
  return <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={max} style={INPUT_STYLE} />
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return <select value={value} onChange={e => onChange(e.target.value)} style={INPUT_STYLE}>{options.map(o => <option key={o} value={o}>{o}</option>)}</select>
}

function Textarea({ value, onChange, placeholder, rows }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows || 3} style={{ ...INPUT_STYLE, resize: 'vertical' }} />
}

const YEARS = ['Year 1','Year 2','Year 3','Year 4','Year 5','Year 6','Year 7','Year 8','Year 9','Year 10','Year 11','Year 12','Year 13']
const YEARS_ALL = ['All', ...YEARS]
const today = () => new Date().toISOString().split('T')[0]

// 1
export function LogAbsenceModal({ onClose, onToast }: ModalProps) {
  const [studentName, setStudentName] = useState('')
  const [yearGroup, setYearGroup] = useState(YEARS[0])
  const [date, setDate] = useState(today())
  const [absenceType, setAbsenceType] = useState('Illness')
  const [firstDay, setFirstDay] = useState('')
  const [expectedReturn, setExpectedReturn] = useState('')
  const [parentContacted, setParentContacted] = useState(false)
  const [notes, setNotes] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Absence logged successfully'); onClose() }}>
      <Header title="Log Absence" onClose={onClose} />
      <Field label="Student Name"><Input value={studentName} onChange={setStudentName} /></Field>
      <Field label="Year Group"><Select value={yearGroup} onChange={setYearGroup} options={YEARS} /></Field>
      <Field label="Date"><Input value={date} onChange={setDate} type="date" /></Field>
      <Field label="Absence Type"><Select value={absenceType} onChange={setAbsenceType} options={['Illness','Authorised Leave','Unauthorised','Medical Appointment','Family Holiday','Other']} /></Field>
      <Field label="First Day"><Input value={firstDay} onChange={setFirstDay} type="date" /></Field>
      <Field label="Expected Return"><Input value={expectedReturn} onChange={setExpectedReturn} type="date" /></Field>
      <ToggleRow label="Parent Contacted" value={parentContacted} onChange={setParentContacted} />
      <Field label="Notes"><Textarea value={notes} onChange={setNotes} /></Field>
      <SubmitBtn label="Log Absence" />
      <Footer text="Absence will be recorded and parent notified automatically if contact is enabled." />
    </form></Overlay>
  )
}

// 2
export function ParentContactModal({ onClose, onToast }: ModalProps) {
  const [parentName, setParentName] = useState('')
  const [studentName, setStudentName] = useState('')
  const [contactMethod, setContactMethod] = useState('Phone')
  const [dateTime, setDateTime] = useState('')
  const [reason, setReason] = useState('Absence')
  const [summary, setSummary] = useState('')
  const [followUp, setFollowUp] = useState(false)
  const [followUpAction, setFollowUpAction] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Contact log saved'); onClose() }}>
      <Header title="Parent Contact" onClose={onClose} />
      <Field label="Parent Name"><Input value={parentName} onChange={setParentName} /></Field>
      <Field label="Student Name"><Input value={studentName} onChange={setStudentName} /></Field>
      <Field label="Contact Method"><Select value={contactMethod} onChange={setContactMethod} options={['Phone','Email','In Person','Letter','Text']} /></Field>
      <Field label="Date & Time"><Input value={dateTime} onChange={setDateTime} type="datetime-local" /></Field>
      <Field label="Reason"><Select value={reason} onChange={setReason} options={['Absence','Behaviour','Academic','Safeguarding','General','Complaint','Praise']} /></Field>
      <Field label="Summary"><Textarea value={summary} onChange={setSummary} /></Field>
      <ToggleRow label="Follow-up Required" value={followUp} onChange={setFollowUp} />
      {followUp && <Field label="Follow-up Action"><Input value={followUpAction} onChange={setFollowUpAction} /></Field>}
      <SubmitBtn label="Save Contact Log" />
      <Footer text="This will be added to the student's contact history." />
    </form></Overlay>
  )
}

// 3
export function SchoolReportModal({ onClose, onToast }: ModalProps) {
  const [reportType, setReportType] = useState('Attendance Summary')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [yearGroup, setYearGroup] = useState('All')
  const [format, setFormat] = useState('PDF')
  const [includeCharts, setIncludeCharts] = useState(false)
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Report generation started'); onClose() }}>
      <Header title="Generate School Report" onClose={onClose} />
      <Field label="Report Type"><Select value={reportType} onChange={setReportType} options={['Attendance Summary','Safeguarding Overview','SEND Register','Staff Absence','Ofsted Readiness','Behaviour Log','Year Group Breakdown']} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Date From"><Input value={dateFrom} onChange={setDateFrom} type="date" /></Field>
        <Field label="Date To"><Input value={dateTo} onChange={setDateTo} type="date" /></Field>
      </div>
      <Field label="Year Group"><Select value={yearGroup} onChange={setYearGroup} options={YEARS_ALL} /></Field>
      <Field label="Format"><Select value={format} onChange={setFormat} options={['PDF','Excel','CSV']} /></Field>
      <ToggleRow label="Include Charts" value={includeCharts} onChange={setIncludeCharts} />
      <SubmitBtn label="Generate Report" />
      <Footer text="Report will be ready to download within 30 seconds." />
    </form></Overlay>
  )
}

// 4
export function NewAdmissionModal({ onClose, onToast }: ModalProps) {
  const [studentName, setStudentName] = useState('')
  const [dob, setDob] = useState('')
  const [yearGroup, setYearGroup] = useState(YEARS[0])
  const [startDate, setStartDate] = useState('')
  const [address, setAddress] = useState('')
  const [parent1Name, setParent1Name] = useState('')
  const [parent1Phone, setParent1Phone] = useState('')
  const [parent1Email, setParent1Email] = useState('')
  const [medicalNeeds, setMedicalNeeds] = useState(false)
  const [medicalDetails, setMedicalDetails] = useState('')
  const [sendNeeds, setSendNeeds] = useState(false)
  const [previousSchool, setPreviousSchool] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Admission submitted successfully'); onClose() }}>
      <Header title="New Admission" onClose={onClose} />
      <Field label="Student Name"><Input value={studentName} onChange={setStudentName} /></Field>
      <Field label="Date of Birth"><Input value={dob} onChange={setDob} type="date" /></Field>
      <Field label="Year Group"><Select value={yearGroup} onChange={setYearGroup} options={YEARS} /></Field>
      <Field label="Start Date"><Input value={startDate} onChange={setStartDate} type="date" /></Field>
      <Field label="Address"><Textarea value={address} onChange={setAddress} /></Field>
      <Field label="Parent 1 Name"><Input value={parent1Name} onChange={setParent1Name} /></Field>
      <Field label="Parent 1 Phone"><Input value={parent1Phone} onChange={setParent1Phone} type="tel" /></Field>
      <Field label="Parent 1 Email"><Input value={parent1Email} onChange={setParent1Email} type="email" /></Field>
      <ToggleRow label="Medical Needs" value={medicalNeeds} onChange={setMedicalNeeds} />
      {medicalNeeds && <Field label="Medical Details"><Textarea value={medicalDetails} onChange={setMedicalDetails} /></Field>}
      <ToggleRow label="SEND Needs" value={sendNeeds} onChange={setSendNeeds} />
      <Field label="Previous School"><Input value={previousSchool} onChange={setPreviousSchool} /></Field>
      <SubmitBtn label="Submit Admission" />
      <Footer text="A welcome pack will be sent to the parent's email automatically." />
    </form></Overlay>
  )
}

// 5
export function BookCoverModal({ onClose, onToast }: ModalProps) {
  const [cls, setCls] = useState('')
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState('')
  const [period, setPeriod] = useState('P1')
  const [absentTeacher, setAbsentTeacher] = useState('')
  const [coverTeacher, setCoverTeacher] = useState('')
  const [room, setRoom] = useState('')
  const [workSet, setWorkSet] = useState(false)
  const [instructions, setInstructions] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Cover confirmed'); onClose() }}>
      <Header title="Book Cover" onClose={onClose} />
      <Field label="Class"><Input value={cls} onChange={setCls} /></Field>
      <Field label="Subject"><Input value={subject} onChange={setSubject} /></Field>
      <Field label="Date"><Input value={date} onChange={setDate} type="date" /></Field>
      <Field label="Period"><Select value={period} onChange={setPeriod} options={['P1','P2','P3','P4','P5','P6','Morning','Afternoon']} /></Field>
      <Field label="Absent Teacher"><Input value={absentTeacher} onChange={setAbsentTeacher} /></Field>
      <Field label="Cover Teacher"><Input value={coverTeacher} onChange={setCoverTeacher} /></Field>
      <Field label="Room"><Input value={room} onChange={setRoom} /></Field>
      <ToggleRow label="Work Set" value={workSet} onChange={setWorkSet} />
      <Field label="Cover Instructions"><Textarea value={instructions} onChange={setInstructions} /></Field>
      <SubmitBtn label="Confirm Cover" />
      <Footer text="Cover teacher will be notified by email immediately." />
    </form></Overlay>
  )
}

// 6
export function AddStaffModal({ onClose, onToast }: ModalProps) {
  const [fullName, setFullName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [department, setDepartment] = useState('Teaching')
  const [startDate, setStartDate] = useState('')
  const [contractType, setContractType] = useState('Permanent')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dbsCompleted, setDbsCompleted] = useState(false)
  const [dbsReference, setDbsReference] = useState('')
  const [safeguardingTraining, setSafeguardingTraining] = useState(false)
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Staff member added'); onClose() }}>
      <Header title="Add Staff Member" onClose={onClose} />
      <Field label="Full Name"><Input value={fullName} onChange={setFullName} /></Field>
      <Field label="Job Title"><Input value={jobTitle} onChange={setJobTitle} /></Field>
      <Field label="Department"><Select value={department} onChange={setDepartment} options={['Teaching','Support','Leadership','Admin','Facilities','Other']} /></Field>
      <Field label="Start Date"><Input value={startDate} onChange={setStartDate} type="date" /></Field>
      <Field label="Contract Type"><Select value={contractType} onChange={setContractType} options={['Permanent','Fixed','Supply','Part Time']} /></Field>
      <Field label="Email"><Input value={email} onChange={setEmail} type="email" /></Field>
      <Field label="Phone"><Input value={phone} onChange={setPhone} type="tel" /></Field>
      <ToggleRow label="DBS Completed" value={dbsCompleted} onChange={setDbsCompleted} />
      {dbsCompleted && <Field label="DBS Reference"><Input value={dbsReference} onChange={setDbsReference} /></Field>}
      <ToggleRow label="Safeguarding Training" value={safeguardingTraining} onChange={setSafeguardingTraining} />
      <SubmitBtn label="Add Staff Member" />
      <Footer text="Staff member will receive a welcome email with login details." />
    </form></Overlay>
  )
}

// 7
export function LogStaffAbsenceModal({ onClose, onToast }: ModalProps) {
  const [staffMember, setStaffMember] = useState('')
  const [absenceType, setAbsenceType] = useState('Illness')
  const [firstDay, setFirstDay] = useState('')
  const [expectedReturn, setExpectedReturn] = useState('')
  const [coverArranged, setCoverArranged] = useState(false)
  const [notes, setNotes] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Staff absence logged'); onClose() }}>
      <Header title="Log Staff Absence" onClose={onClose} />
      <Field label="Staff Member"><Input value={staffMember} onChange={setStaffMember} /></Field>
      <Field label="Absence Type"><Select value={absenceType} onChange={setAbsenceType} options={['Illness','Personal','Medical','Compassionate','Unauthorised','Other']} /></Field>
      <Field label="First Day"><Input value={firstDay} onChange={setFirstDay} type="date" /></Field>
      <Field label="Expected Return"><Input value={expectedReturn} onChange={setExpectedReturn} type="date" /></Field>
      <ToggleRow label="Cover Arranged" value={coverArranged} onChange={setCoverArranged} />
      <Field label="Notes"><Textarea value={notes} onChange={setNotes} /></Field>
      <SubmitBtn label="Log Absence" />
      <Footer text="HR will be notified and cover arrangements flagged." />
    </form></Overlay>
  )
}

// 8
export function StaffReviewModal({ onClose, onToast }: ModalProps) {
  const [staffMember, setStaffMember] = useState('')
  const [reviewType, setReviewType] = useState('Probation')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [reviewerName, setReviewerName] = useState('')
  const [notes, setNotes] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Review scheduled'); onClose() }}>
      <Header title="Schedule Staff Review" onClose={onClose} />
      <Field label="Staff Member"><Input value={staffMember} onChange={setStaffMember} /></Field>
      <Field label="Review Type"><Select value={reviewType} onChange={setReviewType} options={['Probation','Annual','Performance','Return to Work','Informal']} /></Field>
      <Field label="Date"><Input value={date} onChange={setDate} type="date" /></Field>
      <Field label="Time"><Input value={time} onChange={setTime} type="time" /></Field>
      <Field label="Location"><Input value={location} onChange={setLocation} /></Field>
      <Field label="Reviewer Name"><Input value={reviewerName} onChange={setReviewerName} /></Field>
      <Field label="Notes"><Textarea value={notes} onChange={setNotes} /></Field>
      <SubmitBtn label="Schedule Review" />
      <Footer text="Staff member will receive a calendar invite automatically." />
    </form></Overlay>
  )
}

// 9
export function CreateLessonPlanModal({ onClose, onToast }: ModalProps) {
  const [subject, setSubject] = useState('')
  const [yearGroup, setYearGroup] = useState(YEARS[0])
  const [topic, setTopic] = useState('')
  const [objectives, setObjectives] = useState('')
  const [vocabulary, setVocabulary] = useState('')
  const [resources, setResources] = useState('')
  const [assessmentMethod, setAssessmentMethod] = useState('Observation')
  const [differentiation, setDifferentiation] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Lesson plan saved'); onClose() }}>
      <Header title="Create Lesson Plan" onClose={onClose} />
      <Field label="Subject"><Input value={subject} onChange={setSubject} /></Field>
      <Field label="Year Group"><Select value={yearGroup} onChange={setYearGroup} options={YEARS} /></Field>
      <Field label="Topic"><Input value={topic} onChange={setTopic} /></Field>
      <Field label="Learning Objectives"><Textarea value={objectives} onChange={setObjectives} /></Field>
      <Field label="Key Vocabulary"><Textarea value={vocabulary} onChange={setVocabulary} /></Field>
      <Field label="Resources Needed"><Textarea value={resources} onChange={setResources} /></Field>
      <Field label="Assessment Method"><Select value={assessmentMethod} onChange={setAssessmentMethod} options={['Observation','Written','Quiz','Peer','Verbal','None']} /></Field>
      <Field label="Differentiation Notes"><Textarea value={differentiation} onChange={setDifferentiation} /></Field>
      <SubmitBtn label="Save Lesson Plan" />
      <Footer text="Lesson plan will be saved to the curriculum library." />
    </form></Overlay>
  )
}

// 10
export function AssessmentTrackerModal({ onClose, onToast }: ModalProps) {
  const [subject, setSubject] = useState('')
  const [yearGroup, setYearGroup] = useState(YEARS[0])
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [assessmentType, setAssessmentType] = useState('End of Unit')
  const [avgScore, setAvgScore] = useState('')
  const [belowExpected, setBelowExpected] = useState('')
  const [atExpected, setAtExpected] = useState('')
  const [aboveExpected, setAboveExpected] = useState('')
  const [actions, setActions] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Assessment results saved'); onClose() }}>
      <Header title="Assessment Tracker" onClose={onClose} />
      <Field label="Subject"><Input value={subject} onChange={setSubject} /></Field>
      <Field label="Year Group"><Select value={yearGroup} onChange={setYearGroup} options={YEARS} /></Field>
      <Field label="Assessment Title"><Input value={title} onChange={setTitle} /></Field>
      <Field label="Date"><Input value={date} onChange={setDate} type="date" /></Field>
      <Field label="Assessment Type"><Select value={assessmentType} onChange={setAssessmentType} options={['End of Unit','Mock','Baseline','Formative','Summative']} /></Field>
      <Field label="Average Score %"><Input value={avgScore} onChange={setAvgScore} type="number" /></Field>
      <Field label="Below Expected Count"><Input value={belowExpected} onChange={setBelowExpected} type="number" /></Field>
      <Field label="At Expected Count"><Input value={atExpected} onChange={setAtExpected} type="number" /></Field>
      <Field label="Above Expected Count"><Input value={aboveExpected} onChange={setAboveExpected} type="number" /></Field>
      <Field label="Actions"><Textarea value={actions} onChange={setActions} /></Field>
      <SubmitBtn label="Save Results" />
      <Footer text="Results will feed into the year group progress overview." />
    </form></Overlay>
  )
}

// 11
export function TimetableChangeModal({ onClose, onToast }: ModalProps) {
  const [classAffected, setClassAffected] = useState('')
  const [currentSlot, setCurrentSlot] = useState('')
  const [requestedSlot, setRequestedSlot] = useState('')
  const [reason, setReason] = useState('Room Conflict')
  const [urgency, setUrgency] = useState('Immediate')
  const [notes, setNotes] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Timetable change submitted'); onClose() }}>
      <Header title="Timetable Change Request" onClose={onClose} />
      <Field label="Class Affected"><Input value={classAffected} onChange={setClassAffected} /></Field>
      <Field label="Current Slot"><Input value={currentSlot} onChange={setCurrentSlot} /></Field>
      <Field label="Requested Slot"><Input value={requestedSlot} onChange={setRequestedSlot} /></Field>
      <Field label="Reason"><Select value={reason} onChange={setReason} options={['Room Conflict','Staff Change','Cover','Exam Clash','Other']} /></Field>
      <Field label="Urgency"><Select value={urgency} onChange={setUrgency} options={['Immediate','This Week','Next Week']} /></Field>
      <Field label="Notes"><Textarea value={notes} onChange={setNotes} /></Field>
      <SubmitBtn label="Submit Request" />
      <Footer text="Timetable team will review and confirm within 24 hours." />
    </form></Overlay>
  )
}

// 12
export function RegisterClassModal({ onClose, onToast }: ModalProps) {
  const [className, setClassName] = useState('')
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState(today())
  const [period, setPeriod] = useState('P1')
  const [attendance, setAttendance] = useState('')
  const [behaviourNotes, setBehaviourNotes] = useState('')
  const [incidents, setIncidents] = useState(false)
  const [incidentDetail, setIncidentDetail] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Register submitted'); onClose() }}>
      <Header title="Register Class" onClose={onClose} />
      <Field label="Class Name"><Input value={className} onChange={setClassName} /></Field>
      <Field label="Subject"><Input value={subject} onChange={setSubject} /></Field>
      <Field label="Date"><Input value={date} onChange={setDate} type="date" /></Field>
      <Field label="Period"><Select value={period} onChange={setPeriod} options={['P1','P2','P3','P4','P5','P6']} /></Field>
      <Field label="Student Attendance"><Textarea value={attendance} onChange={setAttendance} placeholder="Paste or type student names, mark P (present) or A (absent)" /></Field>
      <Field label="Behaviour Notes"><Textarea value={behaviourNotes} onChange={setBehaviourNotes} /></Field>
      <ToggleRow label="Any Incidents" value={incidents} onChange={setIncidents} />
      {incidents && <Field label="Incident Detail"><Textarea value={incidentDetail} onChange={setIncidentDetail} /></Field>}
      <SubmitBtn label="Submit Register" />
      <Footer text="Register will be saved to the school attendance record." />
    </form></Overlay>
  )
}

// 13
export function AddPupilToClassModal({ onClose, onToast }: ModalProps) {
  const [pupilName, setPupilName] = useState('')
  const [yearGroup, setYearGroup] = useState(YEARS[0])
  const [cls, setCls] = useState('')
  const [reason, setReason] = useState('New Admission')
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [notes, setNotes] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Pupil added to class'); onClose() }}>
      <Header title="Add Pupil to Class" onClose={onClose} />
      <Field label="Pupil Name"><Input value={pupilName} onChange={setPupilName} /></Field>
      <Field label="Year Group"><Select value={yearGroup} onChange={setYearGroup} options={YEARS} /></Field>
      <Field label="Class"><Input value={cls} onChange={setCls} /></Field>
      <Field label="Reason"><Select value={reason} onChange={setReason} options={['New Admission','Set Change','Timetable','Other']} /></Field>
      <Field label="Effective From"><Input value={effectiveFrom} onChange={setEffectiveFrom} type="date" /></Field>
      <Field label="Notes"><Textarea value={notes} onChange={setNotes} /></Field>
      <SubmitBtn label="Confirm Change" />
      <Footer text="Class teacher will be notified of the change." />
    </form></Overlay>
  )
}

// 14
export function AddStudentModal({ onClose, onToast }: ModalProps) {
  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [yearGroup, setYearGroup] = useState(YEARS[0])
  const [formClass, setFormClass] = useState('')
  const [gender, setGender] = useState('Male')
  const [eal, setEal] = useState(false)
  const [firstLanguage, setFirstLanguage] = useState('')
  const [fsm, setFsm] = useState(false)
  const [lookedAfter, setLookedAfter] = useState(false)
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Student added to school roll'); onClose() }}>
      <Header title="Add Student" onClose={onClose} />
      <Field label="Full Name"><Input value={fullName} onChange={setFullName} /></Field>
      <Field label="Date of Birth"><Input value={dob} onChange={setDob} type="date" /></Field>
      <Field label="Year Group"><Select value={yearGroup} onChange={setYearGroup} options={YEARS} /></Field>
      <Field label="Form / Class"><Input value={formClass} onChange={setFormClass} /></Field>
      <Field label="Gender"><Select value={gender} onChange={setGender} options={['Male','Female','Non-binary','Prefer not to say']} /></Field>
      <ToggleRow label="EAL" value={eal} onChange={setEal} />
      {eal && <Field label="First Language"><Input value={firstLanguage} onChange={setFirstLanguage} /></Field>}
      <ToggleRow label="FSM" value={fsm} onChange={setFsm} />
      <ToggleRow label="Looked After" value={lookedAfter} onChange={setLookedAfter} />
      <SubmitBtn label="Add Student" />
      <Footer text="Student will be added to the school roll immediately." />
    </form></Overlay>
  )
}

// 15
export function StudentNoteModal({ onClose, onToast }: ModalProps) {
  const [studentName, setStudentName] = useState('')
  const [noteType, setNoteType] = useState('Academic')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [visibleTo, setVisibleTo] = useState('All Staff')
  const [requiresFollowUp, setRequiresFollowUp] = useState(false)
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Note saved'); onClose() }}>
      <Header title="Student Note" onClose={onClose} />
      <Field label="Student Name"><Input value={studentName} onChange={setStudentName} /></Field>
      <Field label="Note Type"><Select value={noteType} onChange={setNoteType} options={['Academic','Behaviour','Wellbeing','Medical','Safeguarding','Communication','Praise','Other']} /></Field>
      <Field label="Date"><Input value={date} onChange={setDate} type="date" /></Field>
      <Field label="Note"><Textarea value={note} onChange={setNote} /></Field>
      <Field label="Visible To"><Select value={visibleTo} onChange={setVisibleTo} options={['All Staff','Class Teacher','Leadership','SENCO','DSL']} /></Field>
      <ToggleRow label="Requires Follow-up" value={requiresFollowUp} onChange={setRequiresFollowUp} />
      <SubmitBtn label="Save Note" />
      <Footer text="Note will be added to the student's profile immediately." />
    </form></Overlay>
  )
}

// 16
export function BehaviourLogModal({ onClose, onToast }: ModalProps) {
  const [studentName, setStudentName] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [incidentType, setIncidentType] = useState('Low Level')
  const [location, setLocation] = useState('Classroom')
  const [staffInvolved, setStaffInvolved] = useState('')
  const [witnesses, setWitnesses] = useState('')
  const [description, setDescription] = useState('')
  const [actionTaken, setActionTaken] = useState('Verbal Warning')
  const [parentNotified, setParentNotified] = useState(false)
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Behaviour incident logged'); onClose() }}>
      <Header title="Behaviour Log" onClose={onClose} />
      <Field label="Student Name"><Input value={studentName} onChange={setStudentName} /></Field>
      <Field label="Date & Time"><Input value={dateTime} onChange={setDateTime} type="datetime-local" /></Field>
      <Field label="Incident Type"><Select value={incidentType} onChange={setIncidentType} options={['Low Level','Bullying','Physical','Verbal','Damage','Defiance','Online','Other']} /></Field>
      <Field label="Location"><Select value={location} onChange={setLocation} options={['Classroom','Corridor','Playground','Lunch Hall','Online','Off Site']} /></Field>
      <Field label="Staff Involved"><Input value={staffInvolved} onChange={setStaffInvolved} /></Field>
      <Field label="Witnesses"><Input value={witnesses} onChange={setWitnesses} /></Field>
      <Field label="Description"><Textarea value={description} onChange={setDescription} /></Field>
      <Field label="Action Taken"><Select value={actionTaken} onChange={setActionTaken} options={['Verbal Warning','Written Warning','Sent to HOY','Parent Contacted','Detention','Fixed Term Exclusion','Other']} /></Field>
      <ToggleRow label="Parent Notified" value={parentNotified} onChange={setParentNotified} />
      <SubmitBtn label="Submit Incident" />
      <Footer text="This will be logged on the student's behaviour record." />
    </form></Overlay>
  )
}

// 17
export function AddSENDRecordModal({ onClose, onToast }: ModalProps) {
  const [studentName, setStudentName] = useState('')
  const [yearGroup, setYearGroup] = useState(YEARS[0])
  const [sendCategory, setSendCategory] = useState('SEMH')
  const [ehcp, setEhcp] = useState(false)
  const [ehcpReviewDate, setEhcpReviewDate] = useState('')
  const [currentProvision, setCurrentProvision] = useState('')
  const [supportType, setSupportType] = useState('School Support')
  const [sencoAssigned, setSencoAssigned] = useState('')
  const [parentAware, setParentAware] = useState(false)
  const [notes, setNotes] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('SEND record saved'); onClose() }}>
      <Header title="Add SEND Record" onClose={onClose} />
      <Field label="Student Name"><Input value={studentName} onChange={setStudentName} /></Field>
      <Field label="Year Group"><Select value={yearGroup} onChange={setYearGroup} options={YEARS} /></Field>
      <Field label="SEND Category"><Select value={sendCategory} onChange={setSendCategory} options={['SEMH','Communication','Cognition','Sensory']} /></Field>
      <ToggleRow label="EHCP" value={ehcp} onChange={setEhcp} />
      {ehcp && <Field label="EHCP Review Date"><Input value={ehcpReviewDate} onChange={setEhcpReviewDate} type="date" /></Field>}
      <Field label="Current Provision"><Textarea value={currentProvision} onChange={setCurrentProvision} /></Field>
      <Field label="Support Type"><Select value={supportType} onChange={setSupportType} options={['School Support','EHCP','Under Assessment','Monitoring']} /></Field>
      <Field label="SENCO Assigned"><Input value={sencoAssigned} onChange={setSencoAssigned} /></Field>
      <ToggleRow label="Parent Aware" value={parentAware} onChange={setParentAware} />
      <Field label="Notes"><Textarea value={notes} onChange={setNotes} /></Field>
      <SubmitBtn label="Save SEND Record" />
      <Footer text="Record will be added to the SEND register." />
    </form></Overlay>
  )
}

// 18
export function SafeguardingConcernModal({ onClose, onToast }: ModalProps) {
  const [studentName, setStudentName] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [nature, setNature] = useState('Physical Abuse')
  const [source, setSource] = useState('Direct Disclosure')
  const [description, setDescription] = useState('')
  const [immediateRisk, setImmediateRisk] = useState(false)
  const [dslNotified, setDslNotified] = useState(false)
  const [dslName, setDslName] = useState('')
  const [actionTaken, setActionTaken] = useState('')
  const [referral, setReferral] = useState(false)
  const [agencyName, setAgencyName] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Safeguarding concern submitted'); onClose() }}>
      <Header title="Safeguarding Concern" onClose={onClose} />
      <div style={{ background: '#EF4444', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
        Do not discuss with the student or parents before speaking to the DSL.
      </div>
      <Field label="Student Name"><Input value={studentName} onChange={setStudentName} /></Field>
      <Field label="Date & Time"><Input value={dateTime} onChange={setDateTime} type="datetime-local" /></Field>
      <Field label="Nature"><Select value={nature} onChange={setNature} options={['Physical Abuse','Emotional','Sexual','Neglect','CSE','Radicalisation','Domestic Violence','FGM','Online Safety','Other']} /></Field>
      <Field label="Source"><Select value={source} onChange={setSource} options={['Direct Disclosure','Staff Observation','Third Party','Unexplained Injury','Behaviour Change']} /></Field>
      <Field label="Description"><Textarea value={description} onChange={setDescription} /></Field>
      <ToggleRow label="Immediate Risk" value={immediateRisk} onChange={setImmediateRisk} />
      <ToggleRow label="DSL Notified" value={dslNotified} onChange={setDslNotified} />
      {dslNotified && <Field label="DSL Name"><Input value={dslName} onChange={setDslName} /></Field>}
      <Field label="Action Taken"><Textarea value={actionTaken} onChange={setActionTaken} /></Field>
      <ToggleRow label="Referral Made" value={referral} onChange={setReferral} />
      {referral && <Field label="Agency Name"><Input value={agencyName} onChange={setAgencyName} /></Field>}
      <SubmitBtn label="Submit Concern — URGENT" danger />
      <Footer text="This concern will be logged immediately and DSL alerted." />
    </form></Overlay>
  )
}

// 19
export function EHCPReviewModal({ onClose, onToast }: ModalProps) {
  const [studentName, setStudentName] = useState('')
  const [currentReviewDate, setCurrentReviewDate] = useState('')
  const [newReviewDate, setNewReviewDate] = useState('')
  const [reviewType, setReviewType] = useState('Annual')
  const [attendees, setAttendees] = useState('')
  const [reportDueDate, setReportDueDate] = useState('')
  const [notes, setNotes] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('EHCP review scheduled'); onClose() }}>
      <Header title="EHCP Review" onClose={onClose} />
      <Field label="Student Name"><Input value={studentName} onChange={setStudentName} /></Field>
      <Field label="Current Review Date"><Input value={currentReviewDate} onChange={setCurrentReviewDate} type="date" /></Field>
      <Field label="New Review Date"><Input value={newReviewDate} onChange={setNewReviewDate} type="date" /></Field>
      <Field label="Review Type"><Select value={reviewType} onChange={setReviewType} options={['Annual','Emergency','Transfer','Post-16']} /></Field>
      <Field label="Attendees"><Textarea value={attendees} onChange={setAttendees} /></Field>
      <Field label="Pre-review Report Due Date"><Input value={reportDueDate} onChange={setReportDueDate} type="date" /></Field>
      <Field label="Notes"><Textarea value={notes} onChange={setNotes} /></Field>
      <SubmitBtn label="Schedule Review" />
      <Footer text="All attendees will receive an invite. Reports must be submitted 2 weeks before the review." />
    </form></Overlay>
  )
}

// 20
export function RaiseInvoiceModal({ onClose, onToast }: ModalProps) {
  const [invoiceTo, setInvoiceTo] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [vat, setVat] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [costCentre, setCostCentre] = useState('General')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Invoice raised'); onClose() }}>
      <Header title="Raise Invoice" onClose={onClose} />
      <Field label="Invoice To"><Input value={invoiceTo} onChange={setInvoiceTo} /></Field>
      <Field label="Description"><Textarea value={description} onChange={setDescription} /></Field>
      <Field label="Amount (£)"><Input value={amount} onChange={setAmount} type="number" /></Field>
      <ToggleRow label="VAT" value={vat} onChange={setVat} />
      <Field label="Due Date"><Input value={dueDate} onChange={setDueDate} type="date" /></Field>
      <Field label="Cost Centre"><Select value={costCentre} onChange={setCostCentre} options={['General','Curriculum','Sports','Arts','Trips','Catering','Maintenance','IT','Other']} /></Field>
      <Field label="Reference"><Input value={reference} onChange={setReference} /></Field>
      <Field label="Notes"><Textarea value={notes} onChange={setNotes} /></Field>
      <SubmitBtn label="Raise Invoice" />
      <Footer text="Invoice will be generated as a PDF and sent automatically." />
    </form></Overlay>
  )
}

// 21
export function SubmitExpenseModal({ onClose, onToast }: ModalProps) {
  const [staffMember, setStaffMember] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Travel')
  const [receiptAttached, setReceiptAttached] = useState(false)
  const [approvedBy, setApprovedBy] = useState('')
  const [notes, setNotes] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Expense claim submitted'); onClose() }}>
      <Header title="Submit Expense" onClose={onClose} />
      <Field label="Staff Member"><Input value={staffMember} onChange={setStaffMember} /></Field>
      <Field label="Date"><Input value={date} onChange={setDate} type="date" /></Field>
      <Field label="Description"><Input value={description} onChange={setDescription} /></Field>
      <Field label="Amount (£)"><Input value={amount} onChange={setAmount} type="number" /></Field>
      <Field label="Category"><Select value={category} onChange={setCategory} options={['Travel','Supplies','Training','Equipment','Catering','Other']} /></Field>
      <ToggleRow label="Receipt Attached" value={receiptAttached} onChange={setReceiptAttached} />
      <Field label="Approved By"><Input value={approvedBy} onChange={setApprovedBy} /></Field>
      <Field label="Notes"><Textarea value={notes} onChange={setNotes} /></Field>
      <SubmitBtn label="Submit Claim" />
      <Footer text="Claims are processed within 5 working days." />
    </form></Overlay>
  )
}

// 22
export function BudgetReviewModal({ onClose, onToast }: ModalProps) {
  const [budgetArea, setBudgetArea] = useState('Whole School')
  const [reviewDate, setReviewDate] = useState('')
  const [currentSpend, setCurrentSpend] = useState('')
  const [remainingBudget, setRemainingBudget] = useState('')
  const [ragStatus, setRagStatus] = useState('On Track')
  const [notes, setNotes] = useState('')
  const [actionRequired, setActionRequired] = useState(false)
  const [actionDetail, setActionDetail] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Budget review saved'); onClose() }}>
      <Header title="Budget Review" onClose={onClose} />
      <Field label="Budget Area"><Select value={budgetArea} onChange={setBudgetArea} options={['Whole School','Department','Pupil Premium','SEND','Sports Premium','Other']} /></Field>
      <Field label="Review Date"><Input value={reviewDate} onChange={setReviewDate} type="date" /></Field>
      <Field label="Current Spend (£)"><Input value={currentSpend} onChange={setCurrentSpend} type="number" /></Field>
      <Field label="Remaining Budget (£)"><Input value={remainingBudget} onChange={setRemainingBudget} type="number" /></Field>
      <Field label="RAG Status"><Select value={ragStatus} onChange={setRagStatus} options={['On Track','Under Review','Overspending']} /></Field>
      <Field label="Notes"><Textarea value={notes} onChange={setNotes} /></Field>
      <ToggleRow label="Action Required" value={actionRequired} onChange={setActionRequired} />
      {actionRequired && <Field label="Action Detail"><Textarea value={actionDetail} onChange={setActionDetail} /></Field>}
      <SubmitBtn label="Save Review" />
    </form></Overlay>
  )
}

// 23
export function MaintenanceRequestModal({ onClose, onToast }: ModalProps) {
  const [location, setLocation] = useState('')
  const [issueType, setIssueType] = useState('Electrical')
  const [priority, setPriority] = useState('Routine')
  const [description, setDescription] = useState('')
  const [reportedBy, setReportedBy] = useState('')
  const [date, setDate] = useState(today())
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Maintenance request submitted'); onClose() }}>
      <Header title="Maintenance Request" onClose={onClose} />
      <Field label="Location"><Input value={location} onChange={setLocation} /></Field>
      <Field label="Issue Type"><Select value={issueType} onChange={setIssueType} options={['Electrical','Plumbing','Heating','Structural','IT','Furniture','Cleaning','Security','Grounds','Other']} /></Field>
      <Field label="Priority"><Select value={priority} onChange={setPriority} options={['Urgent','High','Routine']} /></Field>
      <Field label="Description"><Textarea value={description} onChange={setDescription} /></Field>
      <Field label="Reported By"><Input value={reportedBy} onChange={setReportedBy} /></Field>
      <Field label="Date"><Input value={date} onChange={setDate} type="date" /></Field>
      <SubmitBtn label="Submit Request" />
      <Footer text="Urgent requests will be escalated to the site manager immediately." />
    </form></Overlay>
  )
}

// 24
export function RoomBookingModal({ onClose, onToast }: ModalProps) {
  const [room, setRoom] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [bookedBy, setBookedBy] = useState('')
  const [purpose, setPurpose] = useState('Meeting')
  const [numPeople, setNumPeople] = useState('')
  const [equipment, setEquipment] = useState('')
  const [notes, setNotes] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Room booked'); onClose() }}>
      <Header title="Room Booking" onClose={onClose} />
      <Field label="Room"><Input value={room} onChange={setRoom} /></Field>
      <Field label="Date"><Input value={date} onChange={setDate} type="date" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Start Time"><Input value={startTime} onChange={setStartTime} type="time" /></Field>
        <Field label="End Time"><Input value={endTime} onChange={setEndTime} type="time" /></Field>
      </div>
      <Field label="Booked By"><Input value={bookedBy} onChange={setBookedBy} /></Field>
      <Field label="Purpose"><Select value={purpose} onChange={setPurpose} options={['Meeting','Cover','Exam','Event','Training','External Hire','Other']} /></Field>
      <Field label="Number of People"><Input value={numPeople} onChange={setNumPeople} type="number" /></Field>
      <Field label="Equipment Needed"><Input value={equipment} onChange={setEquipment} /></Field>
      <Field label="Notes"><Textarea value={notes} onChange={setNotes} /></Field>
      <SubmitBtn label="Confirm Booking" />
      <Footer text="Booking will appear on the facilities calendar immediately." />
    </form></Overlay>
  )
}

// 25
export function NewEnquiryModal({ onClose, onToast }: ModalProps) {
  const [parentName, setParentName] = useState('')
  const [studentName, setStudentName] = useState('')
  const [dob, setDob] = useState('')
  const [currentSchool, setCurrentSchool] = useState('')
  const [desiredYear, setDesiredYear] = useState(YEARS[0])
  const [desiredStartDate, setDesiredStartDate] = useState('')
  const [source, setSource] = useState('Website')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [tourRequested, setTourRequested] = useState(false)
  const [preferredDate, setPreferredDate] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Enquiry saved'); onClose() }}>
      <Header title="New Enquiry" onClose={onClose} />
      <Field label="Parent Name"><Input value={parentName} onChange={setParentName} /></Field>
      <Field label="Student Name"><Input value={studentName} onChange={setStudentName} /></Field>
      <Field label="Date of Birth"><Input value={dob} onChange={setDob} type="date" /></Field>
      <Field label="Current School"><Input value={currentSchool} onChange={setCurrentSchool} /></Field>
      <Field label="Desired Year"><Select value={desiredYear} onChange={setDesiredYear} options={YEARS} /></Field>
      <Field label="Desired Start Date"><Input value={desiredStartDate} onChange={setDesiredStartDate} type="date" /></Field>
      <Field label="Source"><Select value={source} onChange={setSource} options={['Website','Open Day','Word of Mouth','Social Media','Local Press','Feeder School','Other']} /></Field>
      <Field label="Email"><Input value={email} onChange={setEmail} type="email" /></Field>
      <Field label="Phone"><Input value={phone} onChange={setPhone} type="tel" /></Field>
      <Field label="Notes"><Textarea value={notes} onChange={setNotes} /></Field>
      <ToggleRow label="Tour Requested" value={tourRequested} onChange={setTourRequested} />
      {tourRequested && <Field label="Preferred Date"><Input value={preferredDate} onChange={setPreferredDate} type="date" /></Field>}
      <SubmitBtn label="Save Enquiry" />
      <Footer text="Parent will receive an acknowledgement email within 24 hours." />
    </form></Overlay>
  )
}

// 26
export function OpenDayModal({ onClose, onToast }: ModalProps) {
  const [eventName, setEventName] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [maxAttendees, setMaxAttendees] = useState('')
  const [description, setDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('All')
  const [registrationRequired, setRegistrationRequired] = useState(false)
  const [deadline, setDeadline] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Event created'); onClose() }}>
      <Header title="Open Day / Event" onClose={onClose} />
      <Field label="Event Name"><Input value={eventName} onChange={setEventName} /></Field>
      <Field label="Date"><Input value={date} onChange={setDate} type="date" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Start Time"><Input value={startTime} onChange={setStartTime} type="time" /></Field>
        <Field label="End Time"><Input value={endTime} onChange={setEndTime} type="time" /></Field>
      </div>
      <Field label="Location"><Input value={location} onChange={setLocation} /></Field>
      <Field label="Max Attendees"><Input value={maxAttendees} onChange={setMaxAttendees} type="number" /></Field>
      <Field label="Description"><Textarea value={description} onChange={setDescription} /></Field>
      <Field label="Target Audience"><Select value={targetAudience} onChange={setTargetAudience} options={['Year 6','Sixth Form','Nursery','All','Staff','Governors']} /></Field>
      <ToggleRow label="Registration Required" value={registrationRequired} onChange={setRegistrationRequired} />
      {registrationRequired && <Field label="Registration Deadline"><Input value={deadline} onChange={setDeadline} type="date" /></Field>}
      <SubmitBtn label="Create Event" />
      <Footer text="Event will be added to the school calendar." />
    </form></Overlay>
  )
}

// 27
export function SocialMediaPostModal({ onClose, onToast }: ModalProps) {
  const [platform, setPlatform] = useState('Twitter')
  const [content, setContent] = useState('')
  const [includeImage, setIncludeImage] = useState(false)
  const [imageDescription, setImageDescription] = useState('')
  const [scheduleDatetime, setScheduleDatetime] = useState('')
  const [approvedBy, setApprovedBy] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Post scheduled'); onClose() }}>
      <Header title="Social Media Post" onClose={onClose} />
      <Field label="Platform"><Select value={platform} onChange={setPlatform} options={['Twitter','Facebook','Instagram','LinkedIn','School Website','All']} /></Field>
      <Field label="Post Content">
        <Textarea value={content} onChange={v => { if (v.length <= 280) setContent(v) }} placeholder="Write your post..." />
        <div style={{ fontSize: 12, color: content.length > 260 ? '#EF4444' : '#6B7280', textAlign: 'right', marginTop: 4 }}>{content.length}/280</div>
      </Field>
      <ToggleRow label="Include Image" value={includeImage} onChange={setIncludeImage} />
      {includeImage && <Field label="Image Description"><Input value={imageDescription} onChange={setImageDescription} /></Field>}
      <Field label="Schedule"><Input value={scheduleDatetime} onChange={setScheduleDatetime} type="datetime-local" /></Field>
      <Field label="Approved By"><Input value={approvedBy} onChange={setApprovedBy} /></Field>
      <SubmitBtn label="Schedule Post" />
      <Footer text="Post will be reviewed before publishing if approval is required." />
    </form></Overlay>
  )
}

// 28
export function DSLReviewModal({ onClose, onToast }: ModalProps) {
  const [studentName, setStudentName] = useState('')
  const [originalConcernDate, setOriginalConcernDate] = useState('')
  const [reviewDate, setReviewDate] = useState(today())
  const [currentStatus, setCurrentStatus] = useState('Open')
  const [update, setUpdate] = useState('')
  const [nextReviewDate, setNextReviewDate] = useState('')
  const [externalAgency, setExternalAgency] = useState(false)
  const [agencyNameContact, setAgencyNameContact] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('DSL review saved'); onClose() }}>
      <Header title="DSL Review" onClose={onClose} />
      <Field label="Student Name"><Input value={studentName} onChange={setStudentName} /></Field>
      <Field label="Original Concern Date"><Input value={originalConcernDate} onChange={setOriginalConcernDate} type="date" /></Field>
      <Field label="Review Date"><Input value={reviewDate} onChange={setReviewDate} type="date" /></Field>
      <Field label="Current Status"><Select value={currentStatus} onChange={setCurrentStatus} options={['Open','Monitoring','Referred to LADO','Social Care','Police','Closed']} /></Field>
      <Field label="Update"><Textarea value={update} onChange={setUpdate} /></Field>
      <Field label="Next Review Date"><Input value={nextReviewDate} onChange={setNextReviewDate} type="date" /></Field>
      <ToggleRow label="External Agency Involved" value={externalAgency} onChange={setExternalAgency} />
      {externalAgency && <Field label="Agency Name / Contact"><Input value={agencyNameContact} onChange={setAgencyNameContact} /></Field>}
      <SubmitBtn label="Save Review" />
      <Footer text="All updates are time-stamped and cannot be edited after saving." />
    </form></Overlay>
  )
}

// 29
export function StaffAlertModal({ onClose, onToast }: ModalProps) {
  const [alertType, setAlertType] = useState('General')
  const [urgency, setUrgency] = useState('Informational')
  const [message, setMessage] = useState('')
  const [sendTo, setSendTo] = useState('All Staff')
  const [namedRecipients, setNamedRecipients] = useState('')
  const isUrgent = urgency === 'Immediate' || urgency === 'Urgent'
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Alert sent'); onClose() }}>
      <Header title="Staff Alert" onClose={onClose} />
      <Field label="Alert Type"><Select value={alertType} onChange={setAlertType} options={['Safeguarding Update','Missing Student','Medical Emergency','Security','Fire','General']} /></Field>
      <Field label="Urgency"><Select value={urgency} onChange={setUrgency} options={['Immediate','Urgent','Informational']} /></Field>
      <Field label="Message">
        <Textarea value={message} onChange={v => { if (v.length <= 200) setMessage(v) }} />
        <div style={{ fontSize: 12, color: message.length > 180 ? '#EF4444' : '#6B7280', textAlign: 'right', marginTop: 4 }}>{message.length}/200</div>
      </Field>
      <Field label="Send To"><Select value={sendTo} onChange={setSendTo} options={['All Staff','Teaching','Leadership','Support','Named']} /></Field>
      {sendTo === 'Named' && <Field label="Named Recipients"><Input value={namedRecipients} onChange={setNamedRecipients} /></Field>}
      <SubmitBtn label="Send Alert Now" danger={isUrgent} />
      <Footer text="Alert will be sent via email and in-app notification immediately." />
    </form></Overlay>
  )
}

// 30
export function RegisterSessionModal({ onClose, onToast }: ModalProps) {
  const [sessionType, setSessionType] = useState('Breakfast')
  const [date, setDate] = useState(today())
  const [sessionTime, setSessionTime] = useState('07:30 - 08:30')
  const [staffOnDuty, setStaffOnDuty] = useState('')
  const [registeredCount, setRegisteredCount] = useState('')
  const [presentCount, setPresentCount] = useState('')
  const [incidents, setIncidents] = useState(false)
  const [incidentDetails, setIncidentDetails] = useState('')
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Session register submitted'); onClose() }}>
      <Header title="Register Session" onClose={onClose} />
      <Field label="Session Type"><Select value={sessionType} onChange={setSessionType} options={['Breakfast','After School','Holiday','Lunchtime']} /></Field>
      <Field label="Date"><Input value={date} onChange={setDate} type="date" /></Field>
      <Field label="Session Time"><Select value={sessionTime} onChange={setSessionTime} options={['07:30 - 08:30','08:00 - 09:00','12:00 - 13:00','15:00 - 16:00','15:00 - 17:00','15:00 - 18:00']} /></Field>
      <Field label="Staff on Duty"><Input value={staffOnDuty} onChange={setStaffOnDuty} /></Field>
      <Field label="Registered Count"><Input value={registeredCount} onChange={setRegisteredCount} type="number" /></Field>
      <Field label="Present Count"><Input value={presentCount} onChange={setPresentCount} type="number" /></Field>
      <ToggleRow label="Incidents" value={incidents} onChange={setIncidents} />
      {incidents && <Field label="Incident Details"><Textarea value={incidentDetails} onChange={setIncidentDetails} /></Field>}
      <SubmitBtn label="Submit Register" />
    </form></Overlay>
  )
}

// 31
export function PaymentLogModal({ onClose, onToast }: ModalProps) {
  const [parentName, setParentName] = useState('')
  const [studentName, setStudentName] = useState('')
  const [sessionType, setSessionType] = useState('Breakfast')
  const [sessionsPaidFor, setSessionsPaidFor] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [date, setDate] = useState(today())
  const [receiptIssued, setReceiptIssued] = useState(false)
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); onToast('Payment logged'); onClose() }}>
      <Header title="Payment Log" onClose={onClose} />
      <Field label="Parent Name"><Input value={parentName} onChange={setParentName} /></Field>
      <Field label="Student Name"><Input value={studentName} onChange={setStudentName} /></Field>
      <Field label="Session Type"><Select value={sessionType} onChange={setSessionType} options={['Breakfast','After School','Holiday']} /></Field>
      <Field label="Sessions Paid For"><Input value={sessionsPaidFor} onChange={setSessionsPaidFor} type="number" /></Field>
      <Field label="Amount (£)"><Input value={amount} onChange={setAmount} type="number" /></Field>
      <Field label="Payment Method"><Select value={paymentMethod} onChange={setPaymentMethod} options={['Cash','Card','ParentPay','Bank Transfer','Tax-Free Childcare']} /></Field>
      <Field label="Date"><Input value={date} onChange={setDate} type="date" /></Field>
      <ToggleRow label="Receipt Issued" value={receiptIssued} onChange={setReceiptIssued} />
      <SubmitBtn label="Log Payment" />
      <Footer text="Payment will be added to the pre & after school finance report." />
    </form></Overlay>
  )
}

// 32
export function AddChildToClubModal({ onClose, onToast }: ModalProps) {
  const [childName, setChildName] = useState('')
  const [yearGroup, setYearGroup] = useState(YEARS[0])
  const [sessionType, setSessionType] = useState('Breakfast')
  const [days, setDays] = useState({ Mon: false, Tue: false, Wed: false, Thu: false, Fri: false })
  const [startDate, setStartDate] = useState('')
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
  const [medicalNeeds, setMedicalNeeds] = useState(false)
  const [medicalDetails, setMedicalDetails] = useState('')
  const [consent, setConsent] = useState(false)
  return (
    <Overlay><form onSubmit={e => { e.preventDefault(); if (!consent) return; onToast('Child added to register'); onClose() }}>
      <Header title="Add Child to Club" onClose={onClose} />
      <Field label="Child Name"><Input value={childName} onChange={setChildName} /></Field>
      <Field label="Year Group"><Select value={yearGroup} onChange={setYearGroup} options={YEARS} /></Field>
      <Field label="Session Type"><Select value={sessionType} onChange={setSessionType} options={['Breakfast','After School','Both']} /></Field>
      <div style={{ marginBottom: 12 }}>
        <Label>Days Required</Label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['Mon','Tue','Wed','Thu','Fri'] as const).map(d => (
            <button key={d} type="button" onClick={() => setDays(p => ({ ...p, [d]: !p[d] }))}
              style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                background: days[d] ? '#0D9488' : '#374151', color: '#F9FAFB' }}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <Field label="Start Date"><Input value={startDate} onChange={setStartDate} type="date" /></Field>
      <Field label="Emergency Contact Name"><Input value={emergencyContactName} onChange={setEmergencyContactName} /></Field>
      <Field label="Emergency Contact Phone"><Input value={emergencyContactPhone} onChange={setEmergencyContactPhone} type="tel" /></Field>
      <ToggleRow label="Medical Needs" value={medicalNeeds} onChange={setMedicalNeeds} />
      {medicalNeeds && <Field label="Medical Details"><Textarea value={medicalDetails} onChange={setMedicalDetails} /></Field>}
      <ToggleRow label="Consent (Required)" value={consent} onChange={setConsent} />
      <SubmitBtn label="Add to Register" />
      <Footer text="Parent will receive a confirmation email with session details." />
    </form></Overlay>
  )
}
