'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useToast } from './ToastProvider';
import { fetcher } from '@/lib/fetcher';

function Brand() {
  return (
    <div className="brand-mark">
      <span>iocl</span>
    </div>
  );
}

function NotificationBell() {
  const notify = useToast();
  const { data } = useSWR('/api/approvals?status=pending', fetcher, { refreshInterval: 30000 });
  const count = data?.approvals?.length ?? 0;

  return (
    <button
      className="notification"
      onClick={() => notify(count > 0 ? `${count} approval${count === 1 ? '' : 's'} need your attention.` : 'No approvals pending right now.')}
    >
      ♢{count > 0 && <i />}
    </button>
  );
}

export default function DashboardShell({ session, nav, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <main className="portal">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileOpen(open => !open)}>☰</button>
        <Link className="portal-brand" href="/dashboard">
          <Brand />
          <div>
            <strong>KANNUSAMY AGENCY</strong>
            <small>INDIANOIL OPERATIONS PORTAL</small>
          </div>
        </Link>
        <div className="top-actions">
          <NotificationBell />
          <Link className="profile" href={session.role === 'SUPER_ADMIN' ? '/access' : '/dashboard'}>
            <span className="avatar">{session.initials}</span>
            <span className="profile-copy">
              <strong>{session.label}</strong>
              <small>{session.subtitle}</small>
            </span>
            <b>⌄</b>
          </Link>
        </div>
      </header>
      <div className="app-layout">
        <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
          <div className="sidebar-label">WORKSPACE</div>
          <nav>
            {nav.map(item => (
              <Link
                key={item.key}
                href={item.path}
                className={`nav-item ${pathname === item.path ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sync">
              <span className="dot" />
              <div>
                <strong>Systems live</strong>
                <small>Signed in as {session.username}</small>
              </div>
            </div>
            <button className="logout" onClick={logout}>
              ↪ <span>Sign out</span>
            </button>
          </div>
        </aside>
        <section className="content">{children}</section>
      </div>
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}
    </main>
  );
}
