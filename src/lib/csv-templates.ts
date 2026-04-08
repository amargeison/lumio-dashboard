// Generates blank CSV template content for the import wizard.

export function generateSquadTemplate(): string {
  return [
    'Name,Position,Squad Number,DOB,Nationality,Status',
    'John Smith,GK,1,1995-04-12,England,fit',
    'Marcus Lee,CM,8,1998-09-22,Wales,fit',
  ].join('\n') + '\n'
}

export function generateContractsTemplate(): string {
  return [
    'Name,Start Date,End Date,Weekly Wage,Release Clause,Option to Extend',
    'John Smith,2023-07-01,2026-06-30,3500,500000,Yes',
    'Marcus Lee,2024-01-15,2027-06-30,2800,,No',
  ].join('\n') + '\n'
}

export function generateFixturesTemplate(): string {
  return [
    'Opponent,Date,Time,Venue,Competition,Home Score,Away Score',
    'Wrexham,2026-04-12,15:00,Home,EFL League One,,',
    'Bradford City,2026-04-19,15:00,Away,EFL League One,,',
  ].join('\n') + '\n'
}

export function downloadCSV(filename: string, content: string): void {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
