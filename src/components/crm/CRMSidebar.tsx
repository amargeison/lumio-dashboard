'use client';

import { usePathname, useRouter } from 'next/navigation';
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
  Building2,
  Search,
  UserSearch,
} from 'lucide-react';

interface CRMSidebarProps {
  intelligenceBadgeCount?: number;
}

const BASE_NAV = [
  { label: 'Dashboard', path: '/crm/dashboard', icon: LayoutDashboard },
  { label: 'Pipeline', path: '/crm/pipeline', icon: GitBranch },
  { label: 'Contacts', path: '/crm/contacts', icon: Users },
  { label: 'Companies', path: '/crm/companies', icon: Building2 },
  { label: 'Intelligence', path: '/crm/intelligence', icon: Sparkles, hasBadge: true },
  { label: 'Company Finder', path: '/crm/companies#finder', icon: Search },
  { label: 'Contact Finder', path: '/crm/contacts#finder', icon: UserSearch },
  { label: 'Reports', path: '/crm/reports', icon: BarChart2 },
];

const BASE_TOOLS = [
  { label: 'Email', path: '/crm/email', icon: Mail },
  { label: 'Calendar', path: '/crm/calendar', icon: Calendar },
  { label: 'Settings', path: '/crm/settings', icon: Settings },
];

function getCrmSlug(): string {
  if (typeof window === 'undefined') return ''
  // 1. URL — if /slug/crm/..., first part is slug
  const parts = window.location.pathname.split('/').filter(Boolean)
  if (parts.length >= 2 && parts[1] === 'crm') return parts[0]
  // 2. Cookie from middleware
  const cookie = document.cookie.split('; ').find(r => r.startsWith('lumio_tenant_slug='))?.split('=')[1]
  if (cookie) return cookie
  // 3. localStorage
  return localStorage.getItem('lumio_workspace_slug') || ''
}

export default function CRMSidebar({ intelligenceBadgeCount = 0 }: CRMSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [initials, setInitials] = useState('LU');
  const [toast, setToast] = useState<string | null>(null);
  const [crmSlug, setCrmSlug] = useState('');

  useEffect(() => {
    setCrmSlug(getCrmSlug());
    const stored = localStorage.getItem('lumio_company_initials');
    if (stored) setInitials(stored);
  }, []);

  const prefix = crmSlug ? `/${crmSlug}` : '';
  const navItems = BASE_NAV.map(item => ({ ...item, href: `${prefix}${item.path}` }));
  const toolItems = BASE_TOOLS.map(item => ({ ...item, href: `${prefix}${item.path}` }));

  function handleToolAction(_action: string) {
    // All tool items are now links — this is kept for backwards compat
  }

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
          const active = pathname === item.href || pathname?.startsWith(item.href + '/') || pathname === item.path || pathname?.startsWith(item.path + '/');
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

        {/* Tool items */}
        {toolItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname?.startsWith(item.href + '/') || pathname === item.path || pathname?.startsWith(item.path + '/');
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg"
              style={{
                backgroundColor: active ? '#1E2035' : 'transparent',
                color: active ? '#F1F3FA' : '#6B7299',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                transition: 'background-color 0.15s, color 0.15s',
                borderLeft: active ? '3px solid transparent' : '3px solid transparent',
                borderImage: active ? 'linear-gradient(180deg, #8B5CF6, #22D3EE) 1' : 'none',
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100, backgroundColor: '#8B5CF6', color: '#F1F3FA', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
          {toast}
        </div>
      )}

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
