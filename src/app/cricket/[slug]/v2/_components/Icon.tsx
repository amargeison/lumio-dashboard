'use client'

import {
  Home, Sparkles, Circle, Flag, Eye, Play, FileText, Zap, Users, Plus,
  Heart, Waves, Flame, ArrowUpRight, Briefcase, Calendar, Trophy, Mic,
  MapPin, Search, ChevronDown, ChevronRight, Bell, Check, Cloud,
  Shield, Settings, BarChart3, Ticket, Megaphone, PoundSterling,
  Globe, Sun, Plane, Wrench, Newspaper, Crosshair, LayoutGrid,
  type LucideProps,
} from 'lucide-react'

// Icon name → Lucide component map. Mirrors proto/shared/icons.jsx so the
// rest of the v2 components can keep their `<Icon name="…" size={…} />`
// API and we don't have to thread Lucide imports through every module.
const MAP: Record<string, React.ComponentType<LucideProps>> = {
  home:            Home,
  sparkles:        Sparkles,
  dot:             Circle,
  flag:            Flag,
  eye:             Eye,
  play:            Play,
  note:            FileText,
  lightning:       Zap,
  people:          Users,
  medical:         Heart,
  wave:            Waves,
  flame:           Flame,
  'arrow-up-right': ArrowUpRight,
  briefcase:       Briefcase,
  calendar:        Calendar,
  trophy:          Trophy,
  mic:             Mic,
  pin:             MapPin,
  search:          Search,
  'chevron-down':  ChevronDown,
  'chevron-right': ChevronRight,
  plus:            Plus,
  bell:            Bell,
  check:           Check,
  cloud:           Cloud,
  shield:          Shield,
  settings:        Settings,
  bars:            BarChart3,
  ticket:          Ticket,
  megaphone:       Megaphone,
  pound:           PoundSterling,
  globe:           Globe,
  sun:             Sun,
  plane:           Plane,
  wrench:          Wrench,
  newspaper:       Newspaper,
  crosshair:       Crosshair,
  grid:            LayoutGrid,
}

export type IconProps = {
  name:    string
  size?:   number
  stroke?: number
  style?:  React.CSSProperties
  className?: string
}

export function Icon({ name, size = 16, stroke = 1.6, style, className }: IconProps) {
  const Cmp = MAP[name] ?? Circle
  return <Cmp size={size} strokeWidth={stroke} style={style} className={className} />
}
