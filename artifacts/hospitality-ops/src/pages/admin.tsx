import React, { useState } from 'react';
import { StaffAndZonesSection } from '@/pages/admin-staff-zones';
import { ServicePointsAndQRSection } from '@/pages/admin-qr';
import { AnalyticsAndSettingsSection } from '@/pages/admin-analytics-settings';
import {
  Users,
  QrCode,
  BarChart3,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useLocation } from 'wouter';

export function AdminPage() {
  const [currentTab, setCurrentTab] = useState<'overview' | 'staff' | 'qr'>('overview');
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none">
      {/* Header */}
      <header className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center font-display text-xl">S</span>
          <div>
            <h1 className="text-base font-black tracking-tight uppercase">SilentServe Admin</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" /> Grand Hotel & Resorts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.open('/staff', '_blank')}
            type="button"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            Launch Staff View <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLocation('/demo')}
            type="button"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Interactive Demo Mode
          </button>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto p-8 gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-64 space-y-2">
          <button
            onClick={() => setCurrentTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition ${
              currentTab === 'overview'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-500" />
            Overview & Settings
          </button>

          <button
            onClick={() => setCurrentTab('staff')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition ${
              currentTab === 'staff'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-amber-500" />
            Staff & Zones
          </button>

          <button
            onClick={() => setCurrentTab('qr')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition ${
              currentTab === 'qr'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-4 h-4 text-amber-500" />
            Service Points & QR
          </button>
        </aside>

        {/* Tab Content */}
        <main className="flex-1 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          {currentTab === 'overview' && <AnalyticsAndSettingsSection />}
          {currentTab === 'staff' && <StaffAndZonesSection />}
          {currentTab === 'qr' && <ServicePointsAndQRSection />}
        </main>
      </div>
    </div>
  );
}
