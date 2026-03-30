'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package, AlertCircle, Truck, Receipt, Plus, RefreshCw, Phone, ClipboardList, FileText, PackagePlus, BookOpen, HelpCircle, Sparkles, Shield } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import DeptAISummary from '@/components/DeptAISummary'
import { ChartSection, parseNum } from '@/components/chart-ui'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import NewProjectModal from '@/components/modals/NewProjectModal'
import { useToast } from '@/components/modals/useToast'

const stats = [
  { label: 'Open Purchase Orders',    value: '14',     trend: '+3',   trendDir: 'up'   as const, trendGood: false, icon: Package,     sub: 'vs last week'   },
  { label: 'Low Stock Items',         value: '6',      trend: '+2',   trendDir: 'up'   as const, trendGood: false, icon: AlertCircle, sub: 'need restocking' },
  { label: 'Pending Deliveries',      value: '9',      trend: '+1',   trendDir: 'up'   as const, trendGood: false, icon: Truck,       sub: 'expected this week'},
  { label: 'Supplier Invoices Due',   value: '£28,400',trend: '+£4k', trendDir: 'up'   as const, trendGood: false, icon: Receipt,     sub: 'within 30 days'  },
]

const orders = [
  { po: 'PO-2026-088', supplier: 'Acme Office Supplies',   items: 'Desk chairs × 12',         value: '£3,840',  ordered: '10 Mar 2026', expected: '21 Mar 2026', status: 'In Transit'  },
  { po: 'PO-2026-087', supplier: 'TechPro Direct',          items: 'MacBook Pro M4 × 4',       value: '£12,800', ordered: '8 Mar 2026',  expected: '18 Mar 2026', status: 'Delivered'   },
  { po: 'PO-2026-086', supplier: 'PrintWave Ltd',           items: 'A3 printer paper × 50 ream',value: '£420',   ordered: '7 Mar 2026',  expected: '14 Mar 2026', status: 'Delivered'   },
  { po: 'PO-2026-085', supplier: 'CloudLicence Group',      items: 'Notion Enterprise seats',   value: '£2,400', ordered: '5 Mar 2026',  expected: '5 Mar 2026',  status: 'Delivered'   },
  { po: 'PO-2026-084', supplier: 'Ergonomics Now',          items: 'Standing desk converters × 8',value:'£1,960',ordered: '1 Mar 2026', expected: '24 Mar 2026', status: 'Pending'     },
  { po: 'PO-2026-083', supplier: 'TechPro Direct',          items: 'USB-C hubs × 20',          value: '£680',   ordered: '28 Feb 2026', expected: '10 Mar 2026', status: 'Delivered'   },
  { po: 'PO-2026-082', supplier: 'Facilities Direct',       items: 'Cleaning supplies — monthly',value:'£340',   ordered: '28 Feb 2026', expected: '3 Mar 2026',  status: 'Delivered'   },
  { po: 'PO-2026-081', supplier: 'Acme Office Supplies',    items: 'Notepads, pens, stationery', value: '£185', ordered: '25 Feb 2026', expected: '4 Mar 2026',  status: 'Delivered'   },
  { po: 'PO-2026-080', supplier: 'DataSafe Shredding',      items: 'Confidential waste disposal',value:'£220',   ordered: '20 Feb 2026', expected: '20 Feb 2026', status: 'Delivered'   },
  { po: 'PO-2026-079', supplier: 'CloudLicence Group',      items: 'GitHub Teams renewal',      value: '£840',   ordered: '15 Feb 2026', expected: '15 Feb 2026', status: 'Overdue'     },
  { po: 'PO-2026-078', supplier: 'SwiftCourier UK',         items: 'Courier — hardware returns', value: '£145', ordered: '12 Feb 2026', expected: '14 Feb 2026', status: 'Delivered'   },
  { po: 'PO-2026-077', supplier: 'TechPro Direct',          items: 'Monitor calibrators × 2',   value: '£380',   ordered: '10 Feb 2026', expected: '17 Feb 2026', status: 'Delivered'   },
]

const lowStock = [
  { item: 'Toner cartridges — HP LaserJet',  stock: '2 left',  threshold: '5',  supplier: 'PrintWave Ltd'       },
  { item: 'Laptop bags — 15"',               stock: '1 left',  threshold: '4',  supplier: 'Acme Office Supplies'},
  { item: 'HDMI cables — 2m',                stock: '3 left',  threshold: '8',  supplier: 'TechPro Direct'      },
  { item: 'Whiteboard markers (sets)',        stock: '2 left',  threshold: '6',  supplier: 'Acme Office Supplies'},
  { item: 'Hand sanitiser — 500ml',          stock: '4 left',  threshold: '10', supplier: 'Facilities Direct'   },
  { item: 'Meeting room notepads',           stock: '3 left',  threshold: '12', supplier: 'Acme Office Supplies'},
]

const upcoming = [
  { supplier: 'Acme Office Supplies',   items: 'Desk chairs × 12',            date: '21 Mar 2026', badge: 'In Transit' },
  { supplier: 'Ergonomics Now',          items: 'Standing desk converters × 8', date: '24 Mar 2026', badge: 'Pending'    },
  { supplier: 'CloudLicence Group',      items: 'Notion Enterprise renewal',    date: '25 Mar 2026', badge: 'Pending'    },
]

export default function OperationsPage() {
  const [showProject, setShowProject] = useState(false)
  const { showToast, Toast } = useToast()

  const actions = [
    { label: 'New Order',         icon: Plus,          onClick: () => setShowProject(true) },
    { label: 'Restock Alert',     icon: RefreshCw,     onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Supplier Contact',  icon: Phone,         onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Delivery Log',      icon: ClipboardList, onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Stock Report',      icon: FileText,      onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Book Stock',        icon: PackagePlus,   onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Admin Portal',     icon: Shield,        onClick: () => window.location.href = '/admin' },
  ]

  const hasData = useHasDashboardData('operations')
  if (hasData === null) return null
  if (!hasData) return <DashboardEmptyState pageKey="operations"
    title="No operations data yet"
    description="Upload your process documentation, FAQ library and operational data to activate the Operations module."
    uploads={[
      { key: 'processes', label: 'Upload Process Docs (CSV)' },
      { key: 'faq', label: 'Upload FAQ Library (CSV)' },
    ]}
  />

  return (
    <PageShell title="Operations" subtitle="Workflows, supply chain and process management">
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>
      <DeptAISummary dept="operations" portal="business" />

      <QuickActions items={actions} />

      {/* AI Workflow Launchers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            href: '/operations/wiki',
            icon: BookOpen,
            accent: '#6C3FC5',
            accentBg: 'rgba(108,63,197,0.08)',
            badge: 'OP-WIKI-01',
            title: 'Wiki Builder',
            desc: 'Pull from Notion, Confluence, SharePoint, Google Drive and files — generate a structured internal wiki in minutes.',
            cta: 'Launch workflow',
          },
          {
            href: '/operations/faq',
            icon: HelpCircle,
            accent: '#0D9488',
            accentBg: 'rgba(13,148,136,0.08)',
            badge: 'OP-FAQ-01',
            title: 'FAQ Builder',
            desc: 'Analyse Zendesk tickets, Intercom threads, and your KB — auto-generate a categorised FAQ for customers or staff.',
            cta: 'Launch workflow',
          },
        ].map(({ href, icon: Icon, accent, accentBg, badge, title, desc, cta }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-xl border border-[#1F2937] bg-[#111318] p-5 hover:border-[#374151] transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: accentBg }}>
                <Icon className="w-4 h-4" style={{ color: accent }} />
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" style={{ color: accent }} />
                <span className="text-xs font-mono" style={{ color: accent }}>{badge}</span>
              </div>
            </div>
            <div>
              <div className="font-semibold text-[#F9FAFB] group-hover:text-white transition-colors">{title}</div>
              <div className="text-xs text-[#6B7280] mt-1 leading-relaxed">{desc}</div>
            </div>
            <div className="text-xs font-medium mt-auto" style={{ color: accent }}>{cta} →</div>
          </Link>
        ))}
      </div>

      <TwoCol
        main={
          <SectionCard title="Purchase Orders" action="View all">
            <Table
              cols={['PO #', 'Supplier', 'Items', 'Value', 'Ordered', 'Expected', 'Status']}
              rows={orders.map((o) => [
                <span key={o.po} className="font-mono text-xs" style={{ color: '#9CA3AF' }}>{o.po}</span>,
                o.supplier, o.items, o.value, o.ordered, o.expected,
                <Badge key={o.po + 's'} status={o.status} />,
              ])}
            />
          </SectionCard>
        }
        side={
          <>
            <SectionCard title="Low Stock Alerts">
              {lowStock.map((s) => (
                <PanelItem
                  key={s.item}
                  title={s.item}
                  sub={`Stock: ${s.stock} (min: ${s.threshold})`}
                  extra={s.supplier}
                  badge="Critical"
                />
              ))}
            </SectionCard>
            <SectionCard title="Upcoming Deliveries">
              {upcoming.map((d) => (
                <PanelItem
                  key={d.supplier + d.date}
                  title={d.supplier}
                  sub={d.items}
                  extra={`Expected: ${d.date}`}
                  badge={d.badge}
                />
              ))}
            </SectionCard>
          </>
        }
      />
      {showProject && <NewProjectModal onClose={() => setShowProject(false)} onSubmit={() => { setShowProject(false); showToast('Project created') }} />}
      <Toast />
    </PageShell>
  )
}
