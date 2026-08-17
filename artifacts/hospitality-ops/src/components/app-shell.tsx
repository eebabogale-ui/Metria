import { useMemo, useState } from 'react';
import { useClerk } from '@clerk/react';
import { useGetCurrentUser, useHealthCheck, getGetCurrentUserQueryKey, getHealthCheckQueryKey } from '@workspace/api-client-react';
import { BarChart3, Boxes, ClipboardList, LogOut, Menu, QrCode, Radio, Settings2, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';

import { Avatar, Skeleton } from '@/components/ops-ui';

const navItems = [
  { href: '/dashboard', label: 'Command center', icon: Radio },
  { href: '/requests', label: 'Request log', icon: ClipboardList },
  { href: '/tables', label: 'Tables & QR', icon: QrCode },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useClerk();
  const { data: user, isLoading: userLoading } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey() } });
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 60_000 } });
  const activeLabel = useMemo(() => navItems.find((item) => location.startsWith(item.href))?.label ?? 'Overview', [location]);

  return (
    <div className="min-h-[100dvh] bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[262px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-3">
          <Link href="/dashboard" className="flex items-center gap-3" data-testid="link-shell-logo">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground font-display text-xl font-semibold">H</span>
            <span><span className="block text-[15px] font-extrabold tracking-tight">harbor</span><span className="block font-mono-app text-[9px] uppercase tracking-[0.2em] text-sidebar-foreground/55">operations</span></span>
          </Link>
          <button type="button" className="rounded-lg p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu" data-testid="button-close-menu"><X size={18} /></button>
        </div>
        <div className="mt-9 px-3 font-mono-app text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/45">Workspace</div>
        <nav className="mt-3 space-y-1">
          {navItems.map((item) => {
            const active = location.startsWith(item.href);
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid={`link-nav-${item.href.slice(1)}`}><Icon size={17} strokeWidth={active ? 2.4 : 1.8} /><span>{item.label}</span>{active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary-foreground" /> : null}</Link>;
          })}
        </nav>
        <div className="mt-auto">
          <div className="mb-4 rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-3">
            <div className="flex items-center gap-2 text-sidebar-foreground/65"><BarChart3 size={14} /><span className="font-mono-app text-[10px] uppercase tracking-[0.12em]">System status</span><span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" /></div>
            <p className="mt-2 text-xs text-sidebar-foreground/55">{health.isError ? 'Connection needs attention' : 'All services operational'}</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            {userLoading ? <Skeleton className="h-9 w-9 rounded-full bg-sidebar-accent" /> : <Avatar name={user?.name} />}
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user?.name ?? 'Operator'}</p><p className="truncate text-[11px] text-sidebar-foreground/50">{user?.role ?? 'Team member'}</p></div>
            <button type="button" title="Sign out" onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' })} className="rounded-lg p-2 text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground" data-testid="button-sign-out"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
      {mobileOpen ? <button type="button" className="fixed inset-0 z-30 bg-foreground/25 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-close-navigation-overlay" /> : null}
      <main className="min-h-[100dvh] lg:pl-[262px]">
        <header className="sticky top-0 z-20 flex h-[74px] items-center border-b border-border/70 bg-background/90 px-5 backdrop-blur-md sm:px-8">
          <button type="button" className="mr-3 rounded-xl p-2 hover:bg-muted lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu" data-testid="button-open-menu"><Menu size={20} /></button>
          <div><p className="font-mono-app text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Harbor / {activeLabel}</p><p className="mt-1 text-sm font-semibold text-foreground">{user?.business?.branchName ?? 'Operations workspace'}</p></div>
          <div className="ml-auto flex items-center gap-3"><Link href="/tables" className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground sm:flex" data-testid="link-header-tables"><Settings2 size={14} /> Manage setup</Link><span className="hidden h-7 w-px bg-border sm:block" /><span className="font-mono-app text-[10px] text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
        </header>
        <div className="px-5 py-7 sm:px-8 sm:py-9">{children}</div>
      </main>
    </div>
  );
}