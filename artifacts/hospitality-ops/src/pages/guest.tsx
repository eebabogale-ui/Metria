import { useEffect, useState } from 'react';
import { useCreateGuestRequest, useGetGuestRequest, useGetGuestTable, getGetGuestRequestQueryKey, getGetGuestTableQueryKey } from '@workspace/api-client-react';
import { ArrowLeft, CheckCircle2, Clock3, Loader2, MessageSquare, RotateCcw, Send, Sparkles } from 'lucide-react';
import { useLocation, useParams } from 'wouter';

import { Button, EmptyState, ErrorState, ServiceGlyph, Skeleton, StatusBadge } from '@/components/ops-ui';

type GuestStep = 'choose' | 'confirm' | 'tracking';

export function GuestPage() {
  const params = useParams<{ businessSlug: string; tableCode: string }>();
  const [, setLocation] = useLocation();
  const businessSlug = params.businessSlug ?? '';
  const tableCode = params.tableCode ?? '';
  const initialToken = new URLSearchParams(window.location.search).get('request') ?? '';
  const [step, setStep] = useState<GuestStep>(initialToken ? 'tracking' : 'choose');
  const [selectedService, setSelectedService] = useState<import('@workspace/api-client-react').Service | null>(null);
  const [note, setNote] = useState('');
  const [token, setToken] = useState(initialToken);
  const tableQuery = useGetGuestTable(businessSlug, tableCode, { query: { queryKey: getGetGuestTableQueryKey(businessSlug, tableCode) } });
  const createRequest = useCreateGuestRequest();
  const requestQuery = useGetGuestRequest(token, { query: { enabled: Boolean(token), queryKey: getGetGuestRequestQueryKey(token), refetchInterval: token ? 10_000 : false } });

  useEffect(() => {
    if (createRequest.data?.trackingToken) {
      const trackingToken = createRequest.data.trackingToken;
      setToken(trackingToken);
      setStep('tracking');
      setLocation(`/guest/${businessSlug}/${tableCode}?request=${encodeURIComponent(trackingToken)}`, { replace: true });
    }
  }, [businessSlug, createRequest.data, setLocation, tableCode]);

  const submitRequest = () => {
    if (!selectedService) return;
    createRequest.mutate({ businessSlug, tableCode, data: { serviceId: selectedService.id, note: note.trim() || undefined } });
  };
  const reset = () => {
    setStep('choose');
    setSelectedService(null);
    setNote('');
    setToken('');
    createRequest.reset();
    setLocation(`/guest/${businessSlug}/${tableCode}`, { replace: true });
  };
  const table = tableQuery.data;
  const tracked = requestQuery.data ?? createRequest.data;

  if (tableQuery.isLoading) return <GuestFrame><GuestSkeleton /></GuestFrame>;
  if (tableQuery.isError || !table) return <GuestFrame><ErrorState onRetry={() => void tableQuery.refetch()} /></GuestFrame>;

  return <GuestFrame><div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span>{table.businessName}</span><span className="text-border">/</span><span>{table.branchName}</span></div><div className="mt-10"><div className="flex items-end justify-between"><div><p className="font-mono-app text-[10px] uppercase tracking-[0.15em] text-primary">You’re at</p><h1 className="mt-2 font-display text-5xl leading-none tracking-[-0.04em]">{table.tableName}</h1></div><span className="rounded-full bg-muted px-3 py-1.5 font-mono-app text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{table.tableCode}</span></div></div>
    {step === 'choose' ? <><div className="mt-10"><p className="text-sm font-semibold">What can we help with?</p><div className="mt-4 grid gap-3">{table.services.filter((service) => service.active).map((service) => <button type="button" key={service.id} onClick={() => { setSelectedService(service); setStep('confirm'); }} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md" data-testid={`button-service-${service.id}`}><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary transition group-hover:bg-primary group-hover:text-primary-foreground"><ServiceGlyph icon={service.icon} size={22} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{service.name}</span><span className="mt-1 block text-xs text-muted-foreground">{service.department}</span></span><span className="text-muted-foreground transition group-hover:translate-x-1">→</span></button>)}</div></div>{!table.services.filter((service) => service.active).length ? <div className="mt-6"><EmptyState icon={Sparkles} title="A moment, please" body="The service menu is being refreshed by the team." /></div> : null}</> : null}
    {step === 'confirm' && selectedService ? <div className="mt-10"><button type="button" onClick={() => setStep('choose')} className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground" data-testid="button-back-to-services"><ArrowLeft size={14} /> Back to services</button><div className="mt-5 rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:p-6"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><ServiceGlyph icon={selectedService.icon} size={22} /></span><div><p className="font-mono-app text-[10px] uppercase tracking-[0.13em] text-primary">Your request</p><h2 className="mt-1 font-display text-3xl">{selectedService.name}</h2></div></div><label className="mt-8 block"><span className="flex items-center gap-2 text-xs font-bold"><MessageSquare size={14} className="text-primary" /> Add a note <span className="font-normal text-muted-foreground">(optional)</span></span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} rows={4} placeholder="Anything that would help us find you or get it right?" className="mt-3 w-full resize-none rounded-2xl border border-input bg-card p-3 text-sm leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" data-testid="textarea-guest-note" /><span className="mt-1 block text-right font-mono-app text-[10px] text-muted-foreground">{note.length}/240</span></label><Button onClick={submitRequest} disabled={createRequest.isPending} size="lg" className="mt-5 w-full" data-testid="button-send-request">{createRequest.isPending ? <><Loader2 size={17} className="animate-spin" /> Sending to the team…</> : <><Send size={17} /> Send request</>}</Button>{createRequest.isError ? <p className="mt-3 text-center text-xs font-semibold text-destructive">We couldn’t send that just now. Please try again.</p> : null}</div></div> : null}
    {step === 'tracking' ? <div className="mt-10"><div className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-8"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary"><CheckCircle2 size={30} /></div><p className="mt-6 font-mono-app text-[10px] uppercase tracking-[0.16em] text-primary">Request received</p><h2 className="mt-2 font-display text-4xl">We’re on it.</h2><p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-muted-foreground">The team has your request. Keep this page open for the latest update.</p>{tracked ? <div className="mt-8 rounded-2xl bg-muted/60 p-4 text-left"><div className="flex items-center justify-between"><span className="text-sm font-bold">{tracked.serviceName}</span><StatusBadge status={tracked.status} /></div><div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Clock3 size={14} className="text-primary" /> {statusMessage(tracked.status)}</div></div> : requestQuery.isError ? <div className="mt-8 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-left"><p className="text-sm font-bold">We lost the live update</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Your request is still saved. Try refreshing its status.</p><Button tone="quiet" size="sm" className="mt-3" onClick={() => void requestQuery.refetch()}><RotateCcw size={14} /> Refresh status</Button></div> : <div className="mt-8 flex justify-center"><Skeleton className="h-20 w-full" /></div>}<p className="mt-6 font-mono-app text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Tracking reference / {token.slice(0, 8)}</p></div><Button tone="quiet" onClick={reset} className="mx-auto mt-5 flex" data-testid="button-new-request"><RotateCcw size={15} /> Make another request</Button></div> : null}
  </GuestFrame>;
}

function statusMessage(status: import('@workspace/api-client-react').ServiceRequestStatus) {
  if (status === 'REQUESTED') return 'Your request is in the team queue.';
  if (status === 'ACCEPTED') return 'A team member has picked this up.';
  if (status === 'IN_PROGRESS') return 'Your request is being taken care of now.';
  if (status === 'COMPLETED') return 'All set. We hope you enjoy your stay.';
  if (status === 'DECLINED') return 'The team couldn’t complete this request.';
  return 'This request has been cancelled.';
}

function GuestFrame({ children }: { children: React.ReactNode }) {
  return <div className="noise min-h-[100dvh] bg-background px-5 py-5 sm:px-6"><div className="mx-auto max-w-[480px]">{children}<footer className="flex items-center justify-center gap-2 pb-6 pt-12 text-[10px] uppercase tracking-[0.15em] text-muted-foreground"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-foreground text-[11px] font-semibold text-background">H</span> Powered by harbor</footer></div></div>;
}

function GuestSkeleton() {
  return <><Skeleton className="h-4 w-40" /><Skeleton className="mt-12 h-16 w-56" /><Skeleton className="mt-10 h-5 w-48" /><div className="mt-4 space-y-3"><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /></div></>;
}
