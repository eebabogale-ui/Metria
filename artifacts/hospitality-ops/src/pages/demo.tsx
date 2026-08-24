import React from 'react';
import { useLocation } from 'wouter';
import { resetDemoData } from '@/lib/services/silentserve';
import { Sparkles, ArrowRight, RotateCcw, ExternalLink, QrCode, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

export function DemoPage() {
  const [, setLocation] = useLocation();

  const handleReset = () => {
    resetDemoData();
    toast.success('Demo environment reset to initial state');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans flex flex-col justify-between">
      <div className="max-w-4xl mx-auto w-full">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => setLocation('/')}
            className="text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-1.5"
          >
            ← Back to Landing Page
          </button>
          <button
            onClick={handleReset}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Demo State
          </button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Interactive Multi-Tenant Demo
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight uppercase">Experience SilentServe Live</h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto mt-3 leading-relaxed">
            Test the complete end-to-end flow: scan a simulated guest QR code, submit a silent request, and claim it in real-time on the staff tablet dashboard.
          </p>
        </div>

        {/* Interactive Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Step 1: Guest View */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black mb-4">
                1
              </div>
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">Guest Interface</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Simulates scanning Table 5 QR code at Grand Hotel. No account or app required.
              </p>
            </div>
            <a
              href="/g/grand-hotel/restaurant/sp-table-5"
              target="_blank"
              rel="noreferrer"
              className="mt-6 w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition text-center flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              Open Guest View <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Step 2: Staff Dashboard */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black mb-4">
                2
              </div>
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">Staff Dashboard</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Realtime tablet queue with audio notifications and atomic claim updates.
              </p>
            </div>
            <a
              href="/staff"
              target="_blank"
              rel="noreferrer"
              className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition text-center flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              Open Staff Tablet <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Step 3: Admin Portal */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black mb-4">
                3
              </div>
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">Manager Admin</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Manage staff, zones, service points, printable QR codes, and performance metrics.
              </p>
            </div>
            <a
              href="/admin"
              target="_blank"
              rel="noreferrer"
              className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition text-center flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              Open Admin Portal <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      <footer className="text-center text-[10px] font-mono text-slate-600 uppercase tracking-widest pt-8">
        SilentServe SaaS • Realtime Hospitality Service Protocol
      </footer>
    </div>
  );
}
