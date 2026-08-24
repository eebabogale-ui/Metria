import React from 'react';
import type { RequestStatus } from '@/lib/types';
import { Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export function StatusBadge({ status }: { status: RequestStatus | string }) {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;
  let Icon = Clock;

  if (status === 'WAITING') {
    colorClasses = 'bg-red-50 text-red-700 border-red-200 animate-pulse';
    label = 'WAITING';
    Icon = Clock;
  } else if (status === 'CLAIMED') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'CLAIMED';
    Icon = AlertCircle;
  } else if (status === 'COMPLETED') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    label = 'COMPLETED';
    Icon = CheckCircle;
  } else if (status === 'CANCELLED') {
    colorClasses = 'bg-zinc-100 text-zinc-500 border-zinc-200';
    label = 'CANCELLED';
    Icon = XCircle;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClasses}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, trend }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: string;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && <Icon className="w-5 h-5 text-slate-400" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-slate-900 font-mono">{value}</span>
        {trend && <span className="text-xs font-semibold text-emerald-600">{trend}</span>}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function AudioNotifier({ playSound }: { playSound: boolean }) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (playSound) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 pitch
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } catch (e) {
        console.log('Audio playback blocked or not supported');
      }
    }
  }, [playSound]);

  return null;
}
