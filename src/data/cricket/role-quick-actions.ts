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

  // Pitch-side tactical actions removed — Hudl/Sportscode territory.
  // Head-coach quick actions now focus on workload, welfare and squad ops.
  head_coach: [
    { id: 'squad-selection',  label: 'Squad Selection',      icon: UsersIcon,    targetDept: 'squad' },
    { id: 'workload-alerts',  label: 'Bowling Workload',     icon: Activity,     targetDept: 'bowling-workload' },
    { id: 'gps-readiness',    label: 'GPS Readiness',        icon: Activity,     targetDept: 'gps' },
    { id: 'medical-review',   label: 'Medical Review',       icon: Heart,        targetDept: 'medical' },
    { id: 'pathway',          label: 'Player Pathway',       icon: TrendingUp,   targetDept: 'pathway' },
    { id: 'mental-performance', label: 'Mental Performance', icon: Sparkles,     targetDept: 'mental-performance' },
  ],

  // Captain role retained for compatibility but pitch-side tactical actions
  // (match brief, field settings, bowling plan, batting order, D/L) removed.
  // Captain quick actions now centre on squad readiness and director comms.
  captain: [
    { id: 'squad-status',     label: 'Squad Status',         icon: UsersIcon,    targetDept: 'squad' },
    { id: 'medical-review',   label: 'Medical Review',       icon: Heart,        targetDept: 'medical' },
    { id: 'team-comms',       label: 'Team Comms',           icon: MessageSquare, targetDept: 'team-comms' },
    { id: 'gps-readiness',    label: 'GPS Readiness',        icon: Activity,     targetDept: 'gps' },
    { id: 'workload-alerts',  label: 'Bowling Workload',     icon: AlertTriangle, targetDept: 'bowling-workload' },
    { id: 'talk-director',    label: 'Talk to Director',     icon: MessageSquare, modalId: 'message-director' },
  ],

  // Analyst quick actions previously fed match-coding workflows. Match-coding
  // is Hudl/Sportscode territory — analyst now focuses on operational data
  // (insights, GPS, workload, contracts) that supports the club business.
  analyst: [
    { id: 'dept-insights',    label: 'Department Insights',  icon: TrendingUp,   targetDept: 'insights' },
    { id: 'gps-readiness',    label: 'GPS Readiness',        icon: Activity,     targetDept: 'gps' },
    { id: 'gps-heatmaps',     label: 'GPS Heatmaps',         icon: Crosshair,    targetDept: 'gps-heatmaps' },
    { id: 'workload-alerts',  label: 'Bowling Workload',     icon: AlertTriangle, targetDept: 'bowling-workload' },
    { id: 'contracts',        label: 'Contract Hub',         icon: FileText,     targetDept: 'contract-hub' },
    { id: 'export-data',      label: 'Export Data',          icon: FileText,     modalId: 'export-match-data' },
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
