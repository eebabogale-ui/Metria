import { useMemo } from 'react';
import { useGetDashboard, getGetDashboardQueryKey, useUpdateRequestStatus, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, CheckCircle2, Clock3, Inbox, UsersRound } from 'lucide-react';
import { Link } from 'wouter';

import { Button, EmptyState, ErrorState, LoadingRow, PriorityMark, RequestActionIcon, ServiceGlyph, Skeleton, StatusBadge, Avatar } from '@/components/ops-ui';

function formatAge(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey(), refetchInterval: 20_000 } });
  const updateStatus = useUpdateRequestStatus();
  const activeRequests = useMemo(() => (data?.requests ?? []).filter((request) => !['COMPLETED', 'DECLINED', 'CANCELLED'].includes(request.status)), [data?.requests]);
  const doUpdate = (id: number, status: 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DECLINED') => {
    updateStatus.mutate({ id, data: { status } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() }); } });
  };

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="animate-in flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono-app text-[10px] uppercase tracking-[0.18em] text-primary">Live operations</p><h1 className="mt-3 font-display text-5xl leading-none tracking-[-0.04em] sm:text-6xl">Good morning,<br /><span className="text-primary">let’s run the room.</span></h1><p className="mt-4 text-sm text-muted-foreground">Here’s the pulse of your floor right now.</p></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="pulse-soft h-2 w-2 rounded-full bg-emerald-500" /> Updates every 20 seconds</div></div>
      {isLoading ? <DashboardSkeleton /> : isError || !data ? <div className="mt-10"><ErrorState onRetry={() => void refetch()} /></div> : <><section className="animate-in animate-in-delay-1 mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active now" value={data.stats.active} note="Requests needing a hand" icon={Inbox} emphasis />
        <StatCard label="Requests today" value={data.stats.today} note="Across your branch" icon={Clock3} />
        <StatCard label="Completed today" value={data.stats.completed} note="Nice work, team" icon={CheckCircle2} />
        <StatCard label="Avg. response" value={formatResponse(data.stats.averageResponseSeconds)} note="From request to accepted" icon={ArrowUpRight} />
      </section>
      <section className="animate-in animate-in-delay-2 mt-8 grid gap-6 xl:grid-cols-[1.45fr_.75fr]">
        <div className="rounded-2xl border border-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border px-5 py-5 sm:px-6"><div><h2 className="font-display text-2xl">Live request queue</h2><p className="mt-1 text-xs text-muted-foreground">{activeRequests.length ? `${activeRequests.length} open ${activeRequests.length === 1 ? 'request' : 'requests'}` : 'A quiet moment on the floor'}</p></div><Link href="/requests" className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:gap-2" data-testid="link-dashboard-all-requests">View log <ArrowUpRight size={14} /></Link></div>
          {activeRequests.length ? <div className="divide-y divide-border">{activeRequests.slice(0, 7).map((request) => <RequestRow key={request.id} request={request} busy={updateStatus.isPending} onUpdate={doUpdate} />)}</div> : <div className="p-6"><EmptyState title="Nothing waiting" body="New guest requests will appear here the moment they scan and ask." /></div>}
        </div>
        <StaffPanel staff={data.staff} />
      </section></>}
    </div>
  );
}

function formatResponse(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

function StatCard({ label, value, note, icon: Icon, emphasis = false }: { label: string; value: number | string; note: string; icon: typeof Inbox; emphasis?: boolean }) {
  return <div className={`rounded-2xl border p-5 shadow-sm ${emphasis ? 'border-primary/25 bg-primary text-primary-foreground' : 'border-border bg-card'}`}><div className="flex items-start justify-between"><span className={`font-mono-app text-[10px] uppercase tracking-[0.13em] ${emphasis ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{label}</span><Icon size={17} className={emphasis ? 'text-primary-foreground/70' : 'text-primary'} /></div><p className="mt-7 font-display text-4xl">{value}</p><p className={`mt-1 text-xs ${emphasis ? 'text-primary-foreground/65' : 'text-muted-foreground'}`}>{note}</p></div>;
}

function RequestRow({ request, busy, onUpdate }: { request: import('@workspace/api-client-react').ServiceRequest; busy: boolean; onUpdate: (id: number, status: 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DECLINED') => void }) {
  const action = request.status === 'REQUESTED' ? { label: 'Accept', status: 'ACCEPTED' as const, type: 'accept' as const } : request.status === 'ACCEPTED' ? { label: 'Start', status: 'IN_PROGRESS' as const, type: 'start' as const } : { label: 'Complete', status: 'COMPLETED' as const, type: 'complete' as const };
  return <div className="group flex flex-col gap-4 px-5 py-5 transition hover:bg-muted/40 sm:flex-row sm:items-center sm:px-6"><div className="flex min-w-0 flex-1 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"><ServiceGlyph icon={request.serviceIcon} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-bold">{request.serviceName}</h3><PriorityMark priority={request.priority} /></div><p className="mt-1 text-xs text-muted-foreground">{request.tableName} <span className="mx-1 text-border">/</span> {request.tableArea} <span className="mx-1 text-border">/</span> {formatAge(request.createdAt)}</p>{request.note ? <p className="mt-1 truncate text-xs italic text-muted-foreground">“{request.note}”</p> : null}</div></div><div className="flex flex-wrap items-center gap-2 sm:shrink-0"><StatusBadge status={request.status} />{request.status === 'REQUESTED' ? <Button tone="quiet" size="sm" disabled={busy} onClick={() => onUpdate(request.id, 'DECLINED')} data-testid={`button-decline-request-${request.id}`}><RequestActionIcon action="decline" />Decline</Button> : null}<Button size="sm" disabled={busy} onClick={() => onUpdate(request.id, action.status)} data-testid={`button-${action.label.toLowerCase()}-request-${request.id}`}><RequestActionIcon action={action.type} />{action.label}</Button></div></div>;
}

function StaffPanel({ staff }: { staff: import('@workspace/api-client-react').StaffSummary[] }) {
  const available = staff.filter((member) => member.status === 'AVAILABLE').length;
  return <div className="rounded-2xl border border-border bg-card shadow-sm"><div className="border-b border-border px-5 py-5 sm:px-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-2xl">On the floor</h2><p className="mt-1 text-xs text-muted-foreground">{available} available now</p></div><UsersRound size={18} className="text-primary" /></div></div>{staff.length ? <div className="divide-y divide-border">{staff.slice(0, 6).map((member) => <div className="flex items-center gap-3 px-5 py-4 sm:px-6" key={member.id}><Avatar name={member.name} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{member.name}</p><p className="text-[11px] text-muted-foreground">{member.department}</p></div><StatusBadge status={member.status} /></div>)}</div> : <div className="p-5"><EmptyState title="No staff connected" body="Staff availability will show here as your team signs in." /></div>}</div>;
}

function DashboardSkeleton() {
  return <><div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-36 rounded-2xl" />)}</div><div className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_.75fr]"><Skeleton className="h-[490px] rounded-2xl" /><Skeleton className="h-[490px] rounded-2xl" /></div><div className="mt-5"><LoadingRow /></div></>;
}