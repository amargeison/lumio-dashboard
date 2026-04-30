import {
  Sparkles, ClipboardList, FileText, Mail, Briefcase,
  Target, Users as UsersIcon, Calendar, Activity, Heart, Eye, Video,
  Inbox, Search as SearchIcon, HelpCircle, Settings, Cloud, Wrench,
  ShoppingCart, MapPin, AlertTriangle, MessageSquare, Crosshair,
  TrendingUp, Mic, ShieldAlert, Ticket,
} from 'lucide-react'

import type { QuickAction } from '@/data/football/role-quick-actions'
export type { QuickAction }

export const CRICKET_GENERIC_ACTIONS: QuickAction[] = [
  { id: 'briefing',  label: "Today's Briefing", icon: Sparkles,    targetDept: 'briefing' },
  { id: 'calendar',  label: 'View Calendar',    icon: Calendar,    modalId: 'calendar' },
  { id: 'inbox',     label: 'Inbox',            icon: Inbox,       modalId: 'inbox' },
  { id: 'search',    label: 'Search',           icon: SearchIcon,  modalId: 'global-search' },
  { id: 'help',      label: 'Help & Support',   icon: HelpCircle,  modalId: 'help' },
  { id: 'settings',  label: 'Settings',         icon: Settings,    targetDept: 'settings' },
]

export const CRICKET_ROLE_QUICK_ACTIONS: Record<string, QuickAction[]> = {
  director: [
    { id: 'briefing',         label: "Today's Briefing",     icon: Sparkles,     targetDept: 'briefing' },
    { id: 'squad-status',     label: 'County Squad Status',  icon: UsersIcon,    targetDept: 'squad' },
    { id: 'contract-tracker', label: 'Contract Tracker',     icon: FileText,     targetDept: 'contract-hub' },
    { id: 'approve-decision', label: 'Approve Decision',     icon: ClipboardList, modalId: 'pending-decisions' },
    { id: 'commercial',       label: 'Commercial Pipeline',  icon: Briefcase,    targetDept: 'commercial' },
    { id: 'open-board',       label: 'Open Board View',      icon: TrendingUp,   targetDept: 'board' },
  ],

  head_coach: [
    { id: 'practice-plan',    label: "Today's Practice Plan", icon: ClipboardList, targetDept: 'practice-log' },
    { id: 'toss-strategy',    label: 'Toss Strategy',        icon: Cloud,        targetDept: 'match-centre' },
    { id: 'innings-brief',    label: 'Innings Brief',        icon: Sparkles,     targetDept: 'ai-innings-brief' },
    { id: 'squad-selection',  label: 'Squad Selection',      icon: UsersIcon,    targetDept: 'squad' },
    { id: 'net-builder',      label: 'Net Session Builder',  icon: Calendar,     targetDept: 'net-planner' },
    { id: 'opposition',       label: 'Opposition Review',    icon: Eye,          targetDept: 'opposition' },
  ],

  captain: [
    { id: 'match-brief',      label: "Today's Match Brief",  icon: Target,       targetDept: 'match-centre' },
    { id: 'field-settings',   label: 'Field Setting Library', icon: Crosshair,   targetDept: 'match-centre' },
    { id: 'dl-calculator',    label: 'D/L Calculator',       icon: Cloud,        targetDept: 'dls' },
    { id: 'bowling-plan',     label: 'Bowling Plan Tonight', icon: Crosshair,    targetDept: 'match-centre' },
    { id: 'batting-order',    label: 'Batting Order Tool',   icon: ClipboardList, targetDept: 'match-centre' },
    { id: 'talk-director',    label: 'Talk to Director',     icon: MessageSquare, modalId: 'message-director' },
  ],

  analyst: [
    { id: 'match-notes',      label: 'Match Notes Tonight',  icon: FileText,     targetDept: 'match-centre' },
    { id: 'batting-l5',       label: 'Batting Analytics L5', icon: TrendingUp,   targetDept: 'batting-analytics' },
    { id: 'bowling',          label: 'Bowling Analytics',    icon: Crosshair,    targetDept: 'bowling-analytics' },
    { id: 'ball-tracking',    label: 'Ball Tracking Review', icon: Video,        targetDept: 'video-analysis' },
    { id: 'video-today',      label: 'Video Review Today',   icon: Video,        targetDept: 'video-analysis' },
    { id: 'opposition',       label: 'Opposition Analytics', icon: Eye,          targetDept: 'opposition' },
  ],

  groundsman: [
    { id: 'pitch-report',     label: "Today's Pitch Report", icon: ClipboardList, modalId: 'pitch-report' },
    { id: 'weather-matchday', label: 'Weather Match Day',    icon: Cloud,        modalId: 'weather-hourly' },
    { id: 'equipment-status', label: 'Equipment Status',     icon: Wrench,       targetDept: 'operations' },
    { id: 'order-equipment',  label: 'Order New Equipment',  icon: ShoppingCart, modalId: 'requisition' },
    { id: 'maintenance-log',  label: 'Maintenance Log',      icon: Wrench,       targetDept: 'operations' },
    { id: 'outfield-status',  label: 'Outfield Status',      icon: MapPin,       modalId: 'outfield-rating' },
  ],

  medical: [
    { id: 'treatment-list',   label: "Today's Treatment List", icon: ClipboardList, targetDept: 'medical' },
    { id: 'log-injury',       label: 'Log Injury',           icon: Heart,        modalId: 'log-injury' },
    { id: 'workload-alerts',  label: 'Workload Alerts',      icon: AlertTriangle, targetDept: 'bowling-workload' },
    { id: 'rtp-reviews',      label: 'Return-to-Play Reviews', icon: Activity,    targetDept: 'medical' },
    { id: 'stock-check',      label: 'Medical Stock Check',  icon: Briefcase,    targetDept: 'medical' },
    { id: 'concussion',       label: 'Concussion Protocol',  icon: ShieldAlert,  targetDept: 'medical' },
  ],

  operations: [
    { id: 'matchday-brief',   label: 'Matchday Briefing',    icon: ClipboardList, targetDept: 'operations' },
    { id: 'officials',        label: 'Scorer/Umpire Confirms', icon: ShieldAlert, targetDept: 'operations' },
    { id: 'hospitality',      label: 'Hospitality Headcount', icon: Ticket,      targetDept: 'operations' },
    { id: 'broadcast',        label: 'Broadcast Crew',       icon: Mic,          targetDept: 'operations' },
    { id: 'members-inbox',    label: 'Members Liaison Inbox', icon: Mail,        targetDept: 'operations' },
    { id: 'stewards-rota',    label: 'Stewards Rota Status', icon: UsersIcon,    targetDept: 'operations' },
  ],
}
