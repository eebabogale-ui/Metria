import React, { useEffect, useState } from 'react';
import {
  getBusinessBySlug,
  getBusinessConfig,
  getStaffList,
  subscribeToRequests,
  claimRequestAtomically,
  completeRequest,
} from '@/lib/services/silentserve';
import type {
  BusinessDoc,
  BusinessConfig,
  StaffDoc,
  ServiceRequestDoc,
  RequestStatus,
} from '@/lib/types';
import { StatusBadge, AudioNotifier } from '@/components/silentserve-ui';
import {
  Bell,
  CheckCircle2,
  Clock,
  UserCheck,
  Volume2,
  VolumeX,
  Filter,
  Lock,
  LogOut,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export function StaffDashboardPage() {
  const businessSlug = 'grand-hotel';
  const [business, setBusiness] = useState<BusinessDoc | null>(null);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [staffList, setStaffList] = useState<StaffDoc[]>([]);
  const [currentStaff, setCurrentStaff] = useState<StaffDoc | null>(() => {
    try {
      const stored = localStorage.getItem('silentserve_staff_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [pinInput, setPinInput] = useState('');
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [requests, setRequests] = useState<ServiceRequestDoc[]>([]);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'WAITING' | 'MY_REQUESTS' | 'COMPLETED'>('ALL');
  const [soundMuted, setSoundMuted] = useState(false);
  const [triggerSound, setTriggerSound] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Load Business, Config, and Staff
  useEffect(() => {
    async function init() {
      const b = await getBusinessBySlug(businessSlug);
      if (b) {
        setBusiness(b);
        const cfg = await getBusinessConfig(b.id);
        setConfig(cfg);
        const s = await getStaffList(b.id);
        setStaffList(s.filter((st) => st.active));
      }
    }
    init();
  }, []);

  // Realtime Requests Subscription
  useEffect(() => {
    if (!business) return;

    let prevCount = -1;
    const unsub = subscribeToRequests(business.id, (newRequests) => {
      setRequests(newRequests);

      const waitingCount = newRequests.filter((r) => r.status === 'WAITING').length;
      if (prevCount !== -1 && waitingCount > prevCount && !soundMuted) {
        setTriggerSound(true);
        setTimeout(() => setTriggerSound(false), 300);
      }
      prevCount = waitingCount;
    });

    return () => unsub();
  }, [business, soundMuted]);

  const selectStaff = (staff: StaffDoc) => {
    if (config?.staffPinEnabled) {
      if (pinInput !== (staff.pin || config.dashboardPin || '1234')) {
        toast.error('Invalid Staff PIN');
        return;
      }
    }
    setCurrentStaff(staff);
    setPinUnlocked(true);
    localStorage.setItem('silentserve_staff_session', JSON.stringify(staff));
    toast.success(`Logged in as ${staff.name}`);
  };

  const switchStaff = () => {
    setCurrentStaff(null);
    setPinUnlocked(false);
    setPinInput('');
    localStorage.removeItem('silentserve_staff_session');
  };

  const handleClaim = async (req: ServiceRequestDoc) => {
    if (!business || !currentStaff || actionInProgress) return;
    setActionInProgress(req.id);

    try {
      const res = await claimRequestAtomically(business.id, req.id, currentStaff);
      if (res.success) {
        toast.success(`Claimed ${req.servicePointName}`);
      } else {
        toast.error(`Already claimed by ${res.claimedBy || 'another staff member'}`);
      }
    } catch (e) {
      toast.error('Failed to claim request');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleComplete = async (req: ServiceRequestDoc) => {
    if (!business || !currentStaff || actionInProgress) return;
    setActionInProgress(req.id);

    try {
      await completeRequest(business.id, req.id, currentStaff.id);
      toast.success(`Completed ${req.servicePointName}`);
    } catch (e) {
      toast.error('Failed to mark complete');
    } finally {
      setActionInProgress(null);
    }
  };

  // Staff Selection Screen
  if (!currentStaff) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-6">
            <UserCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Staff Shift Selection</h1>
          <p className="text-xs text-slate-400 mt-2">Select your name to enter the live service queue.</p>

          <div className="mt-8 space-y-3">
            {staffList.map((s) => (
              <div key={s.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left">
                <p className="text-sm font-bold text-white mb-2">{s.name}</p>
                {config?.staffPinEnabled && (
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Enter PIN"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-center mb-3 outline-none focus:border-amber-500"
                  />
                )}
                <button
                  type="button"
                  onClick={() => selectStaff(s)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition uppercase tracking-wider"
                >
                  Start Shift as {s.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter Requests
  const filteredRequests = requests.filter((r) => {
    if (selectedZoneFilter !== 'ALL' && r.zoneId !== selectedZoneFilter && r.zoneName !== selectedZoneFilter) {
      return false;
    }
    if (selectedStatusFilter === 'WAITING') return r.status === 'WAITING';
    if (selectedStatusFilter === 'MY_REQUESTS') return r.claimedByStaffId === currentStaff.id && r.status === 'CLAIMED';
    if (selectedStatusFilter === 'COMPLETED') return r.status === 'COMPLETED';
    return r.status !== 'CANCELLED';
  });

  const waitingCount = requests.filter((r) => r.status === 'WAITING').length;
  const claimedCount = requests.filter((r) => r.status === 'CLAIMED').length;
  const doneTodayCount = requests.filter((r) => r.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      <AudioNotifier playSound={triggerSound} />

      {/* Staff Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center font-display text-lg">S</span>
          <div>
            <h1 className="text-sm font-black tracking-tight uppercase text-white">{business?.name || 'SilentServe'}</h1>
            <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Staff: <span className="text-amber-400 font-bold">{currentStaff.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundMuted(!soundMuted)}
            type="button"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={soundMuted ? 'Unmute alerts' : 'Mute alerts'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={switchStaff}
            type="button"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Switch Staff
          </button>
        </div>
      </header>

      {/* Dashboard KPI Row */}
      <div className="p-6 grid grid-cols-3 gap-4 border-b border-slate-800 bg-slate-950">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">WAITING</span>
          <span className={`text-3xl font-black font-mono mt-1 ${waitingCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            {waitingCount}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">CLAIMED</span>
          <span className="text-3xl font-black font-mono mt-1 text-amber-400">{claimedCount}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">DONE TODAY</span>
          <span className="text-3xl font-black font-mono mt-1 text-emerald-400">{doneTodayCount}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          {(['ALL', 'WAITING', 'MY_REQUESTS', 'COMPLETED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedStatusFilter === st
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st === 'MY_REQUESTS' ? 'My Requests' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Live Queue */}
      <main className="p-6 flex-1 max-w-5xl w-full mx-auto">
        {filteredRequests.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center my-12">
            <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white">No active service requests</h3>
            <p className="text-xs text-slate-500 mt-1">You're all caught up! New requests will appear here in real time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map((req) => {
              const waitSec = Math.floor((Date.now() - new Date(req.createdAt).getTime()) / 1000);
              const isUrgent = waitSec > 120 && req.status === 'WAITING';

              return (
                <div
                  key={req.id}
                  className={`bg-slate-900 rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                    req.status === 'WAITING'
                      ? isUrgent
                        ? 'border-red-500 bg-red-950/20 shadow-red-500/10'
                        : 'border-slate-800 hover:border-slate-700'
                      : req.status === 'CLAIMED'
                      ? 'border-amber-500/40 bg-amber-950/10'
                      : 'border-slate-800 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">{req.zoneName}</span>
                      <StatusBadge status={req.status} />
                    </div>
                    <h3 className="text-2xl font-black uppercase text-white tracking-tight">{req.servicePointName}</h3>
                    {req.note && (
                      <p className="mt-2 text-xs italic text-amber-200/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                        "{req.note}"
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {Math.floor(waitSec / 60)}m {waitSec % 60}s ago
                    </div>

                    {req.status === 'WAITING' ? (
                      <button
                        type="button"
                        onClick={() => handleClaim(req)}
                        disabled={actionInProgress === req.id}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl uppercase tracking-wider transition active:scale-95 flex items-center gap-1.5"
                      >
                        {actionInProgress === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'CLAIM'}
                      </button>
                    ) : req.status === 'CLAIMED' ? (
                      <button
                        type="button"
                        onClick={() => handleComplete(req)}
                        disabled={actionInProgress === req.id}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl uppercase tracking-wider transition active:scale-95 flex items-center gap-1.5"
                      >
                        {actionInProgress === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'DONE'}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 font-semibold">Done by {req.claimedByStaffName || 'Staff'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
