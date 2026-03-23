import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    team: [
      { id: '1', name: 'Sarah Mitchell',   role: 'Head of HR',        department: 'HR',       avatar: 'SM', status: 'active',  todayFocus: 'New joiner × 2',           openTasks: 3, alerts: 0, recentActivity: 'HR-01 ran 9 min ago'       },
      { id: '2', name: 'Oliver Bennett',   role: 'Head of Sales',     department: 'Sales',    avatar: 'OB', status: 'active',  todayFocus: 'Demo calls × 2',           openTasks: 5, alerts: 1, recentActivity: 'SA-02 scored 4 leads'      },
      { id: '3', name: 'Charlotte Davies', role: 'Senior AE',         department: 'Sales',    avatar: 'CD', status: 'wfh',     todayFocus: 'Oakridge demo',            openTasks: 4, alerts: 0                                            },
      { id: '4', name: 'George Harrison',  role: 'Head of Finance',   department: 'Finance',  avatar: 'GH', status: 'active',  todayFocus: 'Invoice review',           openTasks: 6, alerts: 2, recentActivity: 'AC-03 chased 3'           },
      { id: '5', name: 'Alexander Jones',  role: 'Head of IT',        department: 'IT',       avatar: 'AJ', status: 'active',  openTasks: 2, alerts: 0, recentActivity: 'IT-01 complete'                                                  },
      { id: '6', name: 'Sophia Brown',     role: 'Head of Marketing', department: 'Marketing',avatar: 'SB', status: 'holiday', openTasks: 0, alerts: 0, recentActivity: 'Back Thursday'                                                   },
    ],
  })
}
