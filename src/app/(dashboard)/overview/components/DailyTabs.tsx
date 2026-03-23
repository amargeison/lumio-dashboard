'use client'

type Tab = 'home' | 'quick-wins' | 'tasks' | 'insights' | 'not-to-miss' | 'team'

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home',        label: 'Today',       icon: '🏠' },
  { id: 'quick-wins',  label: 'Quick Wins',  icon: '⚡' },
  { id: 'tasks',       label: 'Daily Tasks', icon: '✅' },
  { id: 'insights',    label: 'Insights',    icon: '📊' },
  { id: 'not-to-miss', label: "Don't Miss",  icon: '🔴' },
  { id: 'team',        label: 'Team',        icon: '👥' },
]

export default function DailyTabs({ activeTab, onTabChange }: Props) {
  return (
    <div className="border-b overflow-x-auto scrollbar-none" style={{ backgroundColor: '#0D0E14', borderColor: '#1F2937' }}>
      <div className="flex items-center gap-0 min-w-max px-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
            style={{
              borderBottomColor: activeTab === tab.id ? '#7C3AED' : 'transparent',
              color: activeTab === tab.id ? '#A78BFA' : '#6B7280',
              backgroundColor: activeTab === tab.id ? 'rgba(124,58,237,0.05)' : 'transparent',
            }}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
