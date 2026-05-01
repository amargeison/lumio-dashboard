import type { LucideIcon } from 'lucide-react'
import {
  Sparkles, ClipboardList, Crown, DollarSign, Mail, ShieldAlert,
  Target, Users as UsersIcon, MapPin, Activity, Heart, Eye, Newspaper,
  Inbox, Search as SearchIcon, FileText, ArrowUpDown, Briefcase,
  Calendar, HelpCircle, Settings, Plane, Truck, Building,
  TrendingUp, GraduationCap, AlertTriangle, Stethoscope, Baby, Flower2,
  Brain, Globe2,
} from 'lucide-react'

/**
 * Role-aware Quick Actions for Women's FC.
 * Each entry navigates via `targetDept` (a SIDEBAR_ITEMS id) or fires
 * `modalId` for a non-route action that the host page can wire to a
 * modal/handler. Actions are intentionally tuned per role and capped at 6.
 *
 * Sidebar id reference (from src/app/womens/[slug]/page.tsx SIDEBAR_ITEMS):
 *   dashboard · briefing · insights · fsr · salary · revenue · game-standards ·
 *   welfare · acl · cycle · maternity · mental · player-welfare · club-operations ·
 *   tours-camps · squad · dualreg · tactics · match · transfers · analytics ·
 *   scouting · academy · halftime · sponsorship · standalone · board ·
 *   financial · media · social · fanhub · team · gps-load · gps-heatmaps ·
 *   medical · settings
 */

export type QuickAction = {
  id: string
  label: string
  icon: LucideIcon
  targetDept?: string
  modalId?: string
  badge?: number | string
}

export const WOMENS_GENERIC_ACTIONS: QuickAction[] = [
  { id: 'briefing', label: "Today's Briefing", icon: Sparkles,    targetDept: 'briefing' },
  { id: 'calendar', label: 'View Calendar',    icon: Calendar,    modalId: 'calendar' },
  { id: 'inbox',    label: 'Inbox',            icon: Inbox,       modalId: 'inbox' },
  { id: 'search',   label: 'Search',           icon: SearchIcon,  modalId: 'global-search' },
  { id: 'help',     label: 'Help & Support',   icon: HelpCircle,  modalId: 'help' },
  { id: 'settings', label: 'Settings',         icon: Settings,    targetDept: 'settings' },
]

export const WOMENS_ROLE_QUICK_ACTIONS: Record<string, QuickAction[]> = {
  ceo: [
    { id: 'briefing',         label: "Today's Briefing",     icon: Sparkles,    targetDept: 'briefing' },
    { id: 'fsr-position',     label: 'FSR Position',          icon: TrendingUp,  targetDept: 'fsr' },
    { id: 'open-board',       label: 'Open Board Suite',      icon: Crown,       targetDept: 'board' },
    { id: 'karen-carney',     label: 'Karen Carney Compliance', icon: ShieldAlert, targetDept: 'game-standards' },
    { id: 'approve-decision', label: 'Approve Decision',      icon: ClipboardList, modalId: 'pending-decisions' },
    { id: 'crisis-alerts',    label: 'View Crisis Alerts',    icon: AlertTriangle, targetDept: 'board' },
  ],

  dof: [
    { id: 'squad-availability', label: 'Squad Availability',    icon: UsersIcon,   targetDept: 'squad' },
    { id: 'recruitment',         label: 'Recruitment Pipeline', icon: Eye,         targetDept: 'transfers' },
    { id: 'contracts',           label: 'Contract Tracker',     icon: FileText,    targetDept: 'transfers' },
    { id: 'dual-reg',            label: 'Dual Registration',    icon: ArrowUpDown, targetDept: 'dualreg' },
    { id: 'add-watchlist',       label: 'Add Watchlist Player', icon: Eye,         modalId: 'add-watchlist-player' },
    { id: 'loans',               label: 'Loan Watchlist',       icon: Briefcase,   targetDept: 'transfers' },
  ],

  coach: [
    { id: 'training-plan',  label: "Today's Training Plan", icon: ClipboardList, targetDept: 'tactics' },
    { id: 'team-selection', label: 'Team Selection',         icon: UsersIcon,    targetDept: 'match' },
    { id: 'set-pieces',     label: 'Set Pieces Library',     icon: Target,       targetDept: 'tactics' },
    { id: 'opposition',     label: 'Opposition Analysis',    icon: Eye,          targetDept: 'scouting' },
    { id: 'match-brief',    label: 'Match Brief',            icon: FileText,     targetDept: 'match' },
    { id: 'welfare-check',  label: 'Player Welfare Check',   icon: Heart,        targetDept: 'player-welfare' },
  ],

  performance: [
    { id: 'gps-plan',           label: "Today's GPS Plan",      icon: Activity,    targetDept: 'gps-load' },
    { id: 'acl-monitor',        label: 'ACL Risk Monitor',      icon: AlertTriangle, targetDept: 'acl' },
    { id: 'workload-alerts',    label: 'Workload Alerts',       icon: AlertTriangle, targetDept: 'gps-load' },
    { id: 'wellness-rate',      label: 'Wellness Return Rate',  icon: Heart,       targetDept: 'welfare' },
    { id: 'cycle-tracker',      label: 'Cycle Tracker',         icon: Flower2,     targetDept: 'cycle' },
    { id: 'yesterday-session',  label: "Yesterday's Session",   icon: Activity,    targetDept: 'gps-load' },
  ],

  medical: [
    { id: 'treatment-list',  label: "Today's Treatment List", icon: Stethoscope,  targetDept: 'medical' },
    { id: 'log-injury',      label: 'Log Injury',             icon: Heart,        modalId: 'log-injury' },
    { id: 'acl-review',      label: 'ACL Risk Review',        icon: AlertTriangle, targetDept: 'acl' },
    { id: 'maternity',       label: 'Maternity Tracker',      icon: Baby,         targetDept: 'maternity' },
    { id: 'rtp',             label: 'Return-to-Play',         icon: Activity,     targetDept: 'medical' },
    { id: 'mental-checkin',  label: 'Mental Health Check-in', icon: Brain,        targetDept: 'mental' },
  ],

  welfare: [
    { id: 'wellbeing-checks', label: "Today's Wellbeing Check-ins", icon: Heart, targetDept: 'welfare' },
    { id: 'maternity',         label: 'Maternity Tracker',          icon: Baby,         targetDept: 'maternity' },
    { id: 'mental-alerts',     label: 'Mental Health Alerts',       icon: Brain,        targetDept: 'mental' },
    { id: 'karen-carney',      label: 'Karen Carney Compliance',    icon: ShieldAlert,  targetDept: 'game-standards' },
    { id: 'cycle-register',    label: 'Cycle Awareness Register',   icon: Flower2,      targetDept: 'cycle' },
    { id: 'concern-log',       label: 'Player Concern Log',         icon: ClipboardList, targetDept: 'welfare' },
  ],

  operations: [
    { id: 'matchday-brief',   label: 'Matchday Brief',         icon: ClipboardList, targetDept: 'club-operations' },
    { id: 'stewards',          label: 'Stewards Status',       icon: UsersIcon,     targetDept: 'club-operations' },
    { id: 'stadium-ops',       label: 'Stadium Operations',    icon: Building,      targetDept: 'club-operations' },
    { id: 'travel',            label: 'Travel & Logistics',    icon: Truck,         targetDept: 'club-operations' },
    { id: 'tours-camps',       label: 'Tours & Camps',         icon: Plane,         targetDept: 'tours-camps' },
    { id: 'compliance',        label: 'Compliance & Insurance', icon: ShieldAlert,  targetDept: 'club-operations' },
  ],

  commercial: [
    { id: 'sponsorship',     label: 'Sponsorship Pipeline', icon: Briefcase,    targetDept: 'sponsorship' },
    { id: 'activations',     label: 'Activation Calendar',  icon: Calendar,     targetDept: 'sponsorship' },
    { id: 'matchday-rev',    label: 'Matchday Revenue',     icon: DollarSign,   targetDept: 'financial' },
    { id: 'hospitality',     label: 'Hospitality Bookings', icon: UsersIcon,    targetDept: 'sponsorship' },
    { id: 'partnerships',    label: 'Brand Partnerships',   icon: Sparkles,     targetDept: 'sponsorship' },
    { id: 'renewal-alerts',  label: 'Renewal Alerts',       icon: AlertTriangle, targetDept: 'sponsorship' },
  ],

  community: [
    { id: 'foundation',     label: 'Foundation Activity', icon: Heart,        targetDept: 'fanhub' },
    { id: 'schools',        label: 'Schools Calendar',    icon: GraduationCap, targetDept: 'fanhub' },
    { id: 'karen-carney',   label: 'Karen Carney Compliance', icon: ShieldAlert, targetDept: 'game-standards' },
    { id: 'events',         label: 'Upcoming Events',     icon: Calendar,     targetDept: 'fanhub' },
    { id: 'volunteers',     label: 'Volunteer Hours',     icon: UsersIcon,    targetDept: 'fanhub' },
    { id: 'partnerships',   label: 'Local Partnerships',  icon: MapPin,       targetDept: 'fanhub' },
  ],
}
