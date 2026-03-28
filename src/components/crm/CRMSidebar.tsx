'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Workflow,
  LayoutDashboard,
  GitBranch,
  Users,
  Sparkles,
  BarChart2,
  Mail,
  Calendar,
  Settings,
} from 'lucide-react';

interface CRMSidebarProps {
  intelligenceBadgeCount?: number;
}

const navItems = [
  { label: 'Dashboard', href: '/crm/dashboard', icon: LayoutDashboard },
  { label: 'Pipeline', href: '/crm/pipeline', icon: GitBranch },
  { label: 'Contacts', href: '/crm/contacts', icon: Users },
  { label: 'Intelligence', href: '/crm/intelligence', icon: Sparkles, hasBadge: true },
  { label: 'Reports', href: '/crm/reports', icon: BarChart2 },
];

const disabledItems = [
  { label: 'Email', icon: Mail, tooltip: 'Coming soon' },
  { label: 'Calendar', icon: Calendar, tooltip: 'Coming soon' },
  { label: 'Settings', icon: Settings, tooltip: 'Coming soon' },
];

export default function CRMSidebar({ intelligenceBadgeCount = 0 }: CRMSidebarProps) {
  const pathname = usePathname();
  const [initials, setInitials] = useState('LU');

  useEffect(() => {
    const stored = localStorage.getItem('lumio_company_initials');
    if (stored) setInitials(stored);
  }, []);

  return (
    <aside
      style={{
        width: 240,
        minHeight: '100vh',
        backgroundColor: '#0D0E1A',
        borderRight: '1px solid #1E2035',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-5">
        <Workflow size={20} style={{ color: '#8B5CF6' }} />
        <span
          style={{
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: '0.05em',
            background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          LUMIO CRM
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 px-3 flex-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg relative"
              style={{
                backgroundColor: active ? '#1E2035' : 'transparent',
                color: active ? '#F1F3FA' : '#6B7299',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                transition: 'background-color 0.15s, color 0.15s',
                borderLeft: active ? '3px solid transparent' : '3px solid transparent',
                borderImage: active
                  ? 'linear-gradient(180deg, #8B5CF6, #22D3EE) 1'
                  : 'none',
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.hasBadge && intelligenceBadgeCount > 0 && (
                <span
                  className="flex items-center justify-center"
                  style={{
                    marginLeft: 'auto',
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                    background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)',
                    paddingLeft: 6,
                    paddingRight: 6,
                  }}
                >
                  {intelligenceBadgeCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* Divider */}
        <div
          style={{
            height: 1,
            backgroundColor: '#1E2035',
            margin: '8px 12px',
          }}
        />

        {/* Disabled items */}
        {disabledItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 px-3 py-2 rounded-lg"
              title={item.tooltip}
              style={{
                color: '#3D4263',
                fontSize: 14,
                cursor: 'not-allowed',
                borderLeft: '3px solid transparent',
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 10,
                  color: '#3D4263',
                  fontStyle: 'italic',
                }}
              >
                Soon
              </span>
            </div>
          );
        })}
      </nav>

      {/* User avatar */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid #1E2035' }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.05em',
          }}
        >
          {initials}
        </div>
      </div>
    </aside>
  );
}
