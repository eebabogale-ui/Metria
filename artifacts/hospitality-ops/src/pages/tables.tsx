import { useState } from 'react';
import { getListTablesQueryKey, useCreateTable, useListTables } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, Plus, QrCode, ScanLine, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button, EmptyState, ErrorState, LoadingRow, Skeleton } from '@/components/ops-ui';

export function TablesPage() {
  const queryClient = useQueryClient();
  const { data: tables, isLoading, isError, refetch } = useListTables({ query: { queryKey: getListTablesQueryKey() } });
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const createTable = useCreateTable();
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !area.trim()) return;
    createTable.mutate(
      { data: { name: name.trim(), area: area.trim() } },
      {
        onSuccess: () => {
          setName('');
          setArea('');
          setShowCreate(false);
          queryClient.invalidateQueries({ queryKey: getListTablesQueryKey() });
          toast.success('Table created', { description: 'The guest link is ready to share.' });
        },
        onError: () => toast.error('Could not create table'),
      },
    );
  };
  const copyPath = async (path: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      toast.success('Guest link copied');
    } catch {
      toast.error('Could not copy the guest link');
    }
  };

  return <div className="mx-auto max-w-[1240px]"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono-app text-[10px] uppercase tracking-[0.18em] text-primary">Setup & distribution</p><h1 className="mt-3 font-display text-5xl leading-none tracking-[-0.04em] sm:text-6xl">Tables & QR</h1><p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Give every table a clear front door to service. Add a table, then place its QR route where guests can see it.</p></div><Button onClick={() => setShowCreate(true)} data-testid="button-add-table"><Plus size={17} /> Add table</Button></div>
    {showCreate ? <div className="mt-8 rounded-2xl border border-primary/25 bg-primary/5 p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="font-mono-app text-[10px] uppercase tracking-[0.15em] text-primary">New QR route</p><h2 className="mt-2 font-display text-2xl">Add a table</h2></div><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close add table form" data-testid="button-close-add-table"><X size={18} /></button></div><form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="block"><span className="mb-2 block text-xs font-bold">Table name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Table 12" className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-primary" data-testid="input-table-name" /></label><label className="block"><span className="mb-2 block text-xs font-bold">Area</span><input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Terrace" className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-primary" data-testid="input-table-area" /></label><Button type="submit" disabled={createTable.isPending || !name.trim() || !area.trim()} data-testid="button-create-table">{createTable.isPending ? 'Creating…' : 'Create table'}</Button></form>{createTable.isError ? <p className="mt-3 text-xs font-semibold text-destructive">Couldn’t create that table. Check the details and try again.</p> : null}</div> : null}
    <div className="mt-10">{isLoading ? <><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1,2,3].map((item) => <Skeleton className="h-56 rounded-2xl" key={item} />)}</div><div className="mt-4"><LoadingRow label="Loading tables" /></div></> : isError ? <ErrorState onRetry={() => void refetch()} /> : tables?.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{tables.map((table) => <TableCard key={table.id} table={table} onCopy={copyPath} />)}</div> : <EmptyState icon={QrCode} title="Your first table starts here" body="Create a table to generate its guest request route and QR destination." action={<Button onClick={() => setShowCreate(true)} size="sm"><Plus size={15} /> Add first table</Button>} />}</div>
  </div>;
}

function TableCard({ table, onCopy }: { table: import('@workspace/api-client-react').Table; onCopy: (path: string) => void }) {
  return <article className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className="flex items-start justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background"><ScanLine size={22} strokeWidth={1.5} /></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${table.active ? 'bg-emerald-100 text-emerald-900' : 'bg-muted text-muted-foreground'}`}>{table.active ? 'Active' : 'Paused'}</span></div><h2 className="mt-6 font-display text-2xl">{table.name}</h2><p className="mt-1 text-xs text-muted-foreground">{table.area} <span className="mx-1 text-border">/</span> <span className="font-mono-app">{table.code}</span></p><div className="mt-6 flex items-center justify-between border-t border-border pt-4"><span className="text-xs text-muted-foreground">{table.requestCount} requests routed</span><div className="flex gap-1"><button type="button" onClick={() => onCopy(table.guestPath)} title="Copy guest link" className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-primary" data-testid={`button-copy-table-${table.id}`}><Copy size={15} /></button><a href={table.guestPath} target="_blank" rel="noreferrer" title="Open guest page" className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-primary" data-testid={`link-open-table-${table.id}`}><ExternalLink size={15} /></a></div></div></article>;
}
