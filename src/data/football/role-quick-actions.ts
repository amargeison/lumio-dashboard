import type { LucideIcon } from 'lucide-react'
import {
  Sparkles, ClipboardList, Crown, DollarSign, Mail, ShieldAlert,
  Target, Users as UsersIcon, MapPin, Activity, Heart, Eye, Newspaper, Video,
  Inbox, Search as SearchIcon, FileText, ArrowUpDown, Phone, Briefcase,
  Calendar, HelpCircle, Settings, Plane, Truck, Building,
  TrendingUp, GraduationCap, AlertTriangle,
} from 'lucide-react'

/**
 * Role-aware Quick Actions for Football Pro.
 * Each entry navigates via `targetDept` (a SIDEBAR_ITEMS id) or fires
 * `modalId` for a non-route action that the host page can wire to a
 * modal/handler. Actions are intentionally tuned per role and capped at 6.
 */
export type QuickAction = {
  id: string
  label: string
  icon: LucideIcon
  targetDept?: string
  modalId?: string
  badge?: number | string
}

export const FOOTBALL_GENERIC_ACTIONS: QuickAction[] = [
  { id: 'briefing',  label: "Today's Briefing", icon: Sparkles,    targetDept: 'overview' },
  { id: 'calendar',  label: 'View Calendar',    icon: Calendar,    modalId: 'calendar' },
  { id: 'inbox',     label: 'Inbox',            icon: Inbox,       modalId: 'inbox' },
  { id: 'search',    label: 'Search',           icon: SearchIcon,  modalId: 'global-search' },
  { id: 'help',      label: 'Help & Support',   icon: HelpCircle,  modalId: 'help' },
  { id: 'settings',  label: 'Settings',         icon: Settings,    targetDept: 'settings' },
]

export const FOOTBALL_ROLE_QUICK_ACTIONS: Record<string, QuickAction[]> = {
  ceo: [
    { id: 'briefing',           label: "Today's Briefing",     icon: Sparkles,     targetDept: 'overview' },
    { id: 'approve-decision',   label: 'Approve Decision',     icon: ClipboardList, modalId: 'pending-decisions' },
    { id: 'open-board',         label: 'Open Board Suite',     icon: Crown,        targetDept: 'board' },
    { id: 'quick-pnl',          label: 'Quick P&L',            icon: DollarSign,   targetDept: 'finance' },
    { id: 'send-memo',          label: 'Send Internal Memo',   icon: Mail,         modalId: 'compose-memo' },
    { id: 'crisis-alerts',      label: 'View Crisis Alerts',   icon: ShieldAlert,  targetDept: 'board' },
  ],

  chairman: [
    { id: 'briefing',           label: "Today's Briefing",     icon: Sparkles,     targetDept: 'overview' },
    { id: 'open-board',         label: 'Open Board Suite',     icon: Crown,        targetDept: 'board' },
    { id: 'strategic-kpis',     label: 'View Strategic KPIs',  icon: TrendingUp,   targetDept: 'board' },
    { id: 'shareholder-view',   label: 'Owner / Shareholder',  icon: UsersIcon,    targetDept: 'board' },
    { id: 'risk-register',      label: 'Risk Register',        icon: ShieldAlert,  targetDept: 'board' },
    { id: 'schedule-board',     label: 'Schedule Board Item',  icon: Calendar,     modalId: 'schedule-board-item' },
  ],

  manager: [
    { id: 'training-plan',      label: "Today's Training Plan", icon: ClipboardList, targetDept: 'training' },
    { id: 'log-injury',         label: 'Log Injury',           icon: Heart,        modalId: 'log-injury' },
    { id: 'team-selection',     label: 'Open Team Selection',  icon: UsersIcon,    targetDept: 'squad-planner' },
    { id: 'gps-readiness',      label: 'Review GPS Readiness', icon: Activity,     targetDept: 'performance' },
    { id: 'matchday-squad',     label: 'Set Match Day Squad',  icon: Target,       targetDept: 'squad-planner' },
    { id: 'press-prep',         label: 'Press Conference Prep', icon: Newspaper,   targetDept: 'media' },
  ],

  director_football: [
    { id: 'window-status',      label: 'Window Status',        icon: ArrowUpDown,  targetDept: 'transfers' },
    { id: 'agent-inbox',        label: 'Agent Inbox',          icon: Inbox,        targetDept: 'transfers' },
    { id: 'loan-recall',        label: 'Loan Recall Window',   icon: Phone,        targetDept: 'transfers' },
    { id: 'contract-expiries',  label: 'Contract Expiries 60d', icon: FileText,    targetDept: 'transfers' },
    { id: 'add-watchlist',      label: 'Add Watchlist Player', icon: Eye,          modalId: 'add-watchlist-player' },
    { id: 'bid-tracker',        label: 'Bid Tracker',          icon: Briefcase,    targetDept: 'transfers' },
  ],

  head_performance: [
    { id: 'gps-plan',           label: "Today's GPS Plan",     icon: Activity,     targetDept: 'performance' },
    { id: 'acwr-alert',         label: 'ACWR Alert Review',    icon: AlertTriangle, targetDept: 'performance' },
    { id: 'wellness-rate',      label: 'Wellness Return Rate', icon: Heart,        targetDept: 'medical' },
    { id: 'rehab-progressions', label: 'Rehab Progressions',   icon: Heart,        targetDept: 'medical' },
    { id: 'workload-position',  label: 'Workload by Position', icon: UsersIcon,    targetDept: 'performance' },
    { id: 'yesterday-session',  label: "Yesterday's Session",  icon: Activity,     targetDept: 'performance' },
  ],

  analyst: [
    { id: 'match-prep',         label: "Today's Match Prep",   icon: Video,        targetDept: 'lumio-vision' },
    { id: 'opposition-report',  label: 'Opposition Report',    icon: Eye,          targetDept: 'scouting' },
    { id: 'performance-stats',  label: 'Performance Stats',    icon: TrendingUp,   targetDept: 'analytics' },
    { id: 'set-piece-library',  label: 'Set Piece Library',    icon: Target,       targetDept: 'set-pieces' },
    { id: 'export-match-data',  label: 'Export Match Data',    icon: FileText,     modalId: 'export-match-data' },
    { id: 'tag-clip',           label: 'Tag New Clip',         icon: Video,        targetDept: 'lumio-vision' },
  ],

  head_medical: [
    { id: 'treatment-list',     label: "Today's Treatment List", icon: ClipboardList, targetDept: 'medical' },
    { id: 'log-injury',         label: 'Log Injury',           icon: Heart,        modalId: 'log-injury' },
    { id: 'rtp-reviews',        label: 'Return-to-Play Reviews', icon: Activity,    targetDept: 'medical' },
    { id: 'open-medical',       label: 'Open Medical Hub',     icon: Heart,        targetDept: 'medical' },
    { id: 'concussion',         label: 'Concussion Protocol',  icon: AlertTriangle, targetDept: 'medical' },
    { id: 'wellness-alerts',    label: 'Wellness Alerts',      icon: Heart,        targetDept: 'medical' },
  ],

  commercial: [
    { id: 'sponsorship-pipeline', label: 'Sponsorship Pipeline', icon: Briefcase,  targetDept: 'commercial' },
    { id: 'active-deals',       label: 'Active Deal Status',   icon: TrendingUp,   targetDept: 'commercial' },
    { id: 'hospitality-week',   label: 'Hospitality This Week', icon: UsersIcon,   targetDept: 'commercial' },
    { id: 'matchday-revenue',   label: 'Matchday Revenue',     icon: DollarSign,   targetDept: 'commercial' },
    { id: 'renewal-alerts',     label: 'Renewal Alerts 90d',   icon: AlertTriangle, targetDept: 'commercial' },
    { id: 'open-commercial',    label: 'Open Commercial',      icon: Briefcase,    targetDept: 'commercial' },
  ],

  head_operations: [
    { id: 'matchday-brief',     label: 'Matchday Brief',       icon: ClipboardList, targetDept: 'club-operations' },
    { id: 'stewards-rota',      label: 'Stewards Rota Status', icon: UsersIcon,    targetDept: 'club-operations' },
    { id: 'stadium-facilities', label: 'Stadium & Facilities', icon: MapPin,       targetDept: 'facilities' },
    { id: 'travel-logistics',   label: 'Travel & Logistics',   icon: Truck,        targetDept: 'club-operations' },
    { id: 'compliance',         label: 'Compliance & Insurance', icon: ShieldAlert, targetDept: 'club-operations' },
    { id: 'tours-camps',        label: 'Tours & Camps',        icon: Plane,        targetDept: 'tours-camps' },
  ],

  head_community: [
    { id: 'foundation',         label: 'Foundation Activity',  icon: Heart,        targetDept: 'community' },
    { id: 'schools',            label: 'Schools Calendar',     icon: GraduationCap, targetDept: 'community' },
    { id: 'impact',             label: 'Impact Dashboard',     icon: TrendingUp,   targetDept: 'community' },
    { id: 'events',             label: 'Upcoming Events',      icon: Calendar,     targetDept: 'community' },
    { id: 'volunteers',         label: 'Volunteer Hours',      icon: UsersIcon,    targetDept: 'community' },
    { id: 'partnerships',       label: 'Local Partnerships',   icon: Building,     targetDept: 'community' },
  ],
}
