import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  CircleHelp,
  Coffee,
  ConciergeBell,
  Forklift,
  GlassWater,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Package,
  Sparkles,
  Utensils,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';

import type { ServiceRequestPriority, ServiceRequestStatus, StaffSummaryStatus } from '@workspace/api-client-react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'secondary' | 'quiet' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ className = '', tone = 'primary', size = 'md', ...props }: ButtonProps) {
  const tones = {
    primary: 'bg-primary text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:shadow-md',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
    quiet: 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
    danger: 'bg-destructive text-destructive-foreground hover:-translate-y-0.5',
  };
  const sizes = { sm: 'h-9 px-3 text-xs', md: 'h-11 px-4 text-sm', lg: 'h-13 px-6 text-base' };
  return (
    <button
      type={props.type ?? 'button'}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50 ${tones[tone]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

export function ServiceGlyph({ icon, size = 20, className = '' }: { icon?: string; size?: number; className?: string }) {
  const normalized = (icon ?? '').toLowerCase();
  const Icon: LucideIcon =
    normalized.includes('bell') ? Bell :
    normalized.includes('food') || normalized.includes('dining') ? Utensils :
    normalized.includes('drink') || normalized.includes('water') ? GlassWater :
    normalized.includes('coffee') ? Coffee :
    normalized.includes('clean') || normalized.includes('house') ? Sparkles :
    normalized.includes('repair') || normalized.includes('maint') ? Wrench :
    normalized.includes('key') ? KeyRound :
    normalized.includes('package') || normalized.includes('luggage') ? Package :
    normalized.includes('concierge') ? ConciergeBell :
    normalized.includes('fork') ? Forklift :
    CircleHelp;
  return <Icon size={size} strokeWidth={1.8} className={className} />;
}

export function StatusBadge({ status }: { status: ServiceRequestStatus | StaffSummaryStatus }) {
  const label = status.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
  const style =
    status === 'REQUESTED' ? 'bg-amber-100 text-amber-900 border-amber-200' :
    status === 'ACCEPTED' ? 'bg-sky-100 text-sky-900 border-sky-200' :
    status === 'IN_PROGRESS' || status === 'BUSY' ? 'bg-violet-100 text-violet-900 border-violet-200' :
    status === 'COMPLETED' || status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-900 border-emerald-200' :
    status === 'OFFLINE' ? 'bg-muted text-muted-foreground border-border' :
    'bg-rose-100 text-rose-900 border-rose-200';
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${style}`}>{label}</span>;
}

export function PriorityMark({ priority }: { priority: ServiceRequestPriority }) {
  const style = priority === 'URGENT' ? 'text-rose-600 bg-rose-100' : priority === 'HIGH' ? 'text-amber-700 bg-amber-100' : 'text-muted-foreground bg-muted';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${style}`}>
      {priority === 'URGENT' ? <AlertTriangle size={11} /> : priority === 'HIGH' ? <Bell size={11} /> : null}
      {priority}
    </span>
  );
}

export function Avatar({ name, size = 'md' }: { name?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const initials = (name ?? 'Operator').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const sizes = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' };
  return <div className={`flex shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground ${sizes[size]}`}>{initials}</div>;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} aria-hidden="true" />;
}

export function EmptyState({ icon: Icon = CheckCircle2, title, body, action }: { icon?: LucideIcon; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary"><Icon size={21} /></div>
      <h3 className="font-display text-xl text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ onRetry, compact = false }: { onRetry: () => void; compact?: boolean }) {
  return (
    <div className={`flex ${compact ? 'min-h-32' : 'min-h-56'} flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/70 px-6 py-8 text-center`}>
      <AlertTriangle size={20} className="text-rose-600" />
      <h3 className="mt-3 font-semibold text-rose-950">Something went off the rails</h3>
      <p className="mt-1 text-sm text-rose-800/75">We couldn’t load this view. Try again in a moment.</p>
      <Button onClick={onRetry} tone="secondary" size="sm" className="mt-4 bg-rose-100 text-rose-900">Retry</Button>
    </div>
  );
}

export function LoadingRow({ label = 'Loading live data' }: { label?: string }) {
  return <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 size={14} className="animate-spin" /><span>{label}</span></div>;
}

export function RequestActionIcon({ action }: { action: 'accept' | 'start' | 'complete' | 'decline' }) {
  if (action === 'accept') return <Check size={15} />;
  if (action === 'start') return <MoreHorizontal size={15} />;
  if (action === 'complete') return <CheckCircle2 size={15} />;
  return <X size={15} />;
}