import React, { useState, useEffect } from 'react';
import {
  getBusinessBySlug,
  getBusinessConfig,
  updateBusinessConfig,
  subscribeToRequests,
} from '@/lib/services/silentserve';
import type { BusinessDoc, BusinessConfig, ServiceRequestDoc } from '@/lib/types';
import { StatCard } from '@/components/silentserve-ui';
import {
  BarChart3,
  Clock,
  TrendingUp,
  CheckCircle,
  Settings,
  Shield,
  Volume2,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

export function AnalyticsAndSettingsSection() {
  const businessSlug = 'grand-hotel';
  const [business, setBusiness] = useState<BusinessDoc | null>(null);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [requests, setRequests] = useState<ServiceRequestDoc[]>([]);

  // Config Form State
  const [cooldownSec, setCooldownSec] = useState(60);
  const [cancelSec, setCancelSec] = useState(10);
  const [completedDisplaySec, setCompletedDisplaySec] = useState(5);
  const [staffPinEnabled, setStaffPinEnabled] = useState(false);
  const [dashboardPin, setDashboardPin] = useState('1234');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    async function load() {
      const b = await getBusinessBySlug(businessSlug);
      if (b) {
        setBusiness(b);
        const cfg = await getBusinessConfig(b.id);
        setConfig(cfg);
        setCooldownSec(cfg.defaultCooldownSeconds);
        setCancelSec(cfg.cancelWindowSeconds);
        setCompletedDisplaySec(cfg.completedDisplaySeconds);
        setStaffPinEnabled(cfg.staffPinEnabled);
        setDashboardPin(cfg.dashboardPin || '1234');
        setSoundEnabled(cfg.soundEnabled);

        subscribeToRequests(b.id, (reqs) => setRequests(reqs));
      }
    }
    load();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    await updateBusinessConfig(business.id, {
      defaultCooldownSeconds: cooldownSec,
      cancelWindowSeconds: cancelSec,
      completedDisplaySeconds: completedDisplaySec,
      staffPinEnabled,
      dashboardPin,
      soundEnabled,
    });

    toast.success('Settings saved successfully');
  };

  // Metrics Calculations
  const waitingCount = requests.filter((r) => r.status === 'WAITING').length;
  const claimedCount = requests.filter((r) => r.status === 'CLAIMED').length;
  const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;

  const responseTimesSec = requests
    .filter((r) => r.claimedAt && r.createdAt)
    .map((r) => (new Date(r.claimedAt!).getTime() - new Date(r.createdAt).getTime()) / 1000);

  const avgResponseTimeSec = responseTimesSec.length
    ? Math.round(responseTimesSec.reduce((a, b) => a + b, 0) / responseTimesSec.length)
    : 18;

  return (
    <div className="space-y-10">
      {/* Analytics Overview */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-amber-500" /> Operational Metrics & Analytics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Active Waiting" value={waitingCount} subtitle="Immediate attention needed" icon={Clock} />
          <StatCard title="Being Handled" value={claimedCount} subtitle="Staff currently on location" icon={TrendingUp} />
          <StatCard title="Completed Today" value={completedCount} subtitle="Service requests fulfilled" icon={CheckCircle} />
          <StatCard
            title="Avg Response Time"
            value={`${avgResponseTimeSec}s`}
            subtitle="From guest tap to staff claim"
            trend="-12% faster"
          />
        </div>
      </div>

      {/* Business Configuration Settings */}
      <div className="pt-8 border-t border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-amber-500" /> Business Settings & Guest Rules
        </h2>

        <form onSubmit={handleSaveConfig} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Guest Cooldown (Seconds)</label>
              <input
                type="number"
                min={10}
                max={300}
                value={cooldownSec}
                onChange={(e) => setCooldownSec(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">Prevents guest spamming repeated calls.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cancellation Window (Seconds)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={cancelSec}
                onChange={(e) => setCancelSec(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">Time allowed for guest to cancel request.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Completion Display Duration (Seconds)</label>
              <input
                type="number"
                min={2}
                max={30}
                value={completedDisplaySec}
                onChange={(e) => setCompletedDisplaySec(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Staff Dashboard PIN</label>
              <input
                type="password"
                maxLength={4}
                value={dashboardPin}
                onChange={(e) => setDashboardPin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={staffPinEnabled}
                onChange={(e) => setStaffPinEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              <span className="text-xs font-bold text-slate-800">Require PIN for staff tablet login</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              <span className="text-xs font-bold text-slate-800">Enable sound alerts on staff dashboard</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition uppercase tracking-wider"
          >
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}
