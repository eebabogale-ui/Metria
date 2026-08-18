import { useMemo, useState } from 'react';
import { getGetDashboardQueryKey, getListRequestsQueryKey, useListRequests, useUpdateRequestStatus } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button, EmptyState, ErrorState, LoadingRow, PriorityMark, RequestActionIcon, ServiceGlyph, Skeleton, StatusBadge } from '@/components/ops-ui';

const filters = ['ALL', 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'DECLINED', 'CANCELLED'] as const;

export function RequestsPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('ALL');
  const [search, setSearch] = useState('');
  const [pendingId, setPendingId] = useState<number | null>(null);
  const params = filter === 'ALL' ? { limit: 100 } : { status: filter, limit: 100 };
  const { data, isLoading, isError, refetch } = useListRequests(params, { query: { queryKey: getListRequestsQueryKey(params) } });
  const queryClient = useQueryClient();
  const updateStatus = useUpdateRequestStatus();
  const requests = useMemo(() => (data ?? []).filter((request) => `${request.tableName} ${request.serviceName} ${request.note ?? ''}`.toLowerCase().includes(search.toLowerCase())), [data, search]);
  const change = (id: number, status: 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DECLINED') => {
    setPendingId(id);
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey(params) });
          queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey({ limit: 100 }) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          toast.success(`Request marked ${status.toLowerCase().replace('_', ' ')}`);
        },
        onError: () => toast.error('Request could not be updated', { description: 'Refresh the queue and try again.' }),
        onSettled: () => setPendingId(null),
      },
    );
  };

  return <div className="mx-auto max-w-[1240px]"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono-app text-[10px] uppercase tracking-[0.18em] text-primary">The paper trail</p><h1 className="mt-3 font-display text-5xl leading-none tracking-[-0.04em] sm:text-6xl">Request log</h1><p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Every request, from first signal to final handoff. Search by table, service, or guest note.</p></div><div className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground sm:flex"><Filter size={14} /> {requests.length} shown</div></div>
    <div className="mt-9 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests…" className="h-10 w-full rounded-xl bg-muted/65 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" data-testid="input-search-requests" /></div><div className="flex gap-1 overflow-x-auto pb-1 lg:pb-0">{filters.map((item) => <button type="button" key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition ${filter === item ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} data-testid={`button-filter-${item.toLowerCase()}`}>{item.replace('_', ' ')}</button>)}</div></div>
    <div className="mt-5">{isLoading ? <div className="space-y-3">{[1,2,3,4].map((item) => <Skeleton key={item} className="h-24 rounded-2xl" />)}<LoadingRow label="Loading request history" /></div> : isError ? <ErrorState onRetry={() => void refetch()} /> : requests.length ? <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="hidden grid-cols-[1.1fr_.8fr_.75fr_.75fr_auto] gap-4 border-b border-border bg-muted/45 px-5 py-3 font-mono-app text-[10px] uppercase tracking-[0.13em] text-muted-foreground md:grid"><span>Request</span><span>Table</span><span>Received</span><span>State</span><span /></div>{requests.map((request) => <RequestRecord key={request.id} request={request} busy={pendingId === request.id} onChange={change} />)}</div> : <EmptyState icon={ClipboardList} title="No requests in this view" body={search ? 'Try a different search phrase.' : 'Completed and active requests will collect here as your team works.'} />}</div>
  </div>;
}

function RequestRecord({ request, busy, onChange }: { request: import('@workspace/api-client-react').ServiceRequest; busy: boolean; onChange: (id: number, status: 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DECLINED') => void }) {
  const action = request.status === 'REQUESTED' ? { label: 'Accept', status: 'ACCEPTED' as const, type: 'accept' as const } : request.status === 'ACCEPTED' ? { label: 'Start', status: 'IN_PROGRESS' as const, type: 'start' as const } : request.status === 'IN_PROGRESS' ? { label: 'Complete', status: 'COMPLETED' as const, type: 'complete' as const } : null;
  return <div className="grid gap-4 border-b border-border px-5 py-5 last:border-0 md:grid-cols-[1.1fr_.8fr_.75fr_.75fr_auto] md:items-center md:gap-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"><ServiceGlyph icon={request.serviceIcon} /></div><div className="min-w-0"><p className="truncate text-sm font-bold">{request.serviceName}</p><div className="mt-1 flex items-center gap-2"><PriorityMark priority={request.priority} /><span className="truncate text-xs text-muted-foreground">{request.note ?? 'No guest note'}</span></div></div></div><div><span className="text-xs font-semibold">{request.tableName}</span><span className="ml-2 text-xs text-muted-foreground">{request.tableArea}</span></div><span className="text-xs text-muted-foreground">{new Date(request.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span><StatusBadge status={request.status} /><div className="flex justify-end gap-2">{request.status === 'REQUESTED' ? <Button tone="quiet" size="sm" disabled={busy} onClick={() => onChange(request.id, 'DECLINED')} data-testid={`button-log-decline-${request.id}`}><RequestActionIcon action="decline" />Decline</Button> : null}{action ? <Button size="sm" disabled={busy} onClick={() => onChange(request.id, action.status)} data-testid={`button-log-${action.label.toLowerCase()}-${request.id}`}><RequestActionIcon action={action.type} />{action.label}</Button> : null}</div></div>;
}
