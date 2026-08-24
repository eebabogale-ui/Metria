import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import {
  getBusinessBySlug,
  getBusinessConfig,
  getServicePointByInfo,
  createGuestRequest,
  cancelGuestRequest,
  subscribeToRequests,
} from '@/lib/services/silentserve';
import type {
  BusinessDoc,
  BusinessConfig,
  ServicePointDoc,
  ServiceRequestDoc,
} from '@/lib/types';
import { StatusBadge } from '@/components/silentserve-ui';
import { Bell, CheckCircle2, Clock, XCircle, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';

export function GuestPage() {
  const params = useParams<{
    businessSlug?: string;
    locationId?: string;
    servicePointId?: string;
    tableCode?: string;
  }>();

  const businessSlug = params.businessSlug || 'grand-hotel';
  const locationOrZone = params.locationId || 'restaurant';
  const servicePointCode = params.servicePointId || params.tableCode || 'table-5';

  const [business, setBusiness] = useState<BusinessDoc | null>(null);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [servicePoint, setServicePoint] = useState<ServicePointDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState<ServiceRequestDoc | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [cancelTimeRemaining, setCancelTimeRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('silentserve_guest_session');
    if (!id) {
      id = `sess_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem('silentserve_guest_session', id);
    }
    return id;
  });

  // Load business info and service point details
  useEffect(() => {
    let isMounted = true;
    async function loadInfo() {
      setLoading(true);
      const b = await getBusinessBySlug(businessSlug);
      if (b) {
        if (isMounted) setBusiness(b);
        const cfg = await getBusinessConfig(b.id);
        if (isMounted) setConfig(cfg);

        const res = await getServicePointByInfo(businessSlug, locationOrZone, servicePointCode);
        if (res && isMounted) {
          setServicePoint(res.servicePoint);
        } else if (isMounted) {
          // Fallback service point representation if direct match is missing
          setServicePoint({
            id: servicePointCode,
            businessId: b.id,
            zoneId: 'zone-restaurant',
            zoneName: locationOrZone.charAt(0).toUpperCase() + locationOrZone.slice(1),
            name: servicePointCode.toUpperCase().replace('-', ' '),
            type: 'table',
            active: true,
            qrToken: servicePointCode,
            createdAt: new Date().toISOString(),
          });
        }
      }
      if (isMounted) setLoading(false);
    }
    loadInfo();
    return () => {
      isMounted = false;
    };
  }, [businessSlug, locationOrZone, servicePointCode]);

  // Subscribe to realtime requests for this service point
  useEffect(() => {
    if (!business || !servicePoint) return;

    const unsub = subscribeToRequests(business.id, (requests) => {
      // Find active request for this service point
      const matching = requests.find(
        (r) =>
          r.servicePointId === servicePoint.id ||
          r.servicePointName.toLowerCase() === servicePoint.name.toLowerCase()
      );

      if (matching) {
        // If request is completed, display completion according to config.completedDisplaySeconds
        if (matching.status === 'COMPLETED') {
          setActiveRequest(matching);
          const displayMs = (config?.completedDisplaySeconds || 5) * 1000;
          const completedTime = matching.completedAt ? new Date(matching.completedAt).getTime() : Date.now();
          if (Date.now() - completedTime > displayMs) {
            setActiveRequest(null);
          }
        } else if (matching.status !== 'CANCELLED') {
          setActiveRequest(matching);
        } else if (activeRequest?.id === matching.id) {
          setActiveRequest(null);
        }
      } else {
        setActiveRequest(null);
      }
    });

    return () => unsub();
  }, [business, servicePoint, config]);

  // Handle cancellation countdown timer
  useEffect(() => {
    if (!activeRequest || activeRequest.status !== 'WAITING') {
      setCancelTimeRemaining(0);
      return;
    }
    const cancelWindowSec = config?.cancelWindowSeconds ?? 10;
    const createdTime = new Date(activeRequest.createdAt).getTime();
    const expiresAt = createdTime + cancelWindowSec * 1000;

    const interval = setInterval(() => {
      const remainingSec = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setCancelTimeRemaining(remainingSec);
      if (remainingSec <= 0) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [activeRequest, config]);

  // Handle cooldown timer after creating a request
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const handleCallService = async () => {
    if (!business || !servicePoint || submitting || cooldownRemaining > 0) return;
    setSubmitting(true);

    try {
      const req = await createGuestRequest({
        businessId: business.id,
        zoneId: servicePoint.zoneId,
        zoneName: servicePoint.zoneName || 'Main Area',
        servicePointId: servicePoint.id,
        servicePointName: servicePoint.name,
        guestSessionId: sessionId,
        note: note.trim() || undefined,
      });

      setActiveRequest(req);
      setCooldownRemaining(config?.defaultCooldownSeconds ?? 60);
      setNote('');
      setShowNoteInput(false);
    } catch (e) {
      console.error('Error creating service request', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!business || !activeRequest) return;
    await cancelGuestRequest(business.id, activeRequest.id);
    setActiveRequest(null);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
        <p className="text-sm font-semibold tracking-wider text-slate-400">CONNECTING TO SILENTSERVE...</p>
      </div>
    );
  }

  if (!business || !servicePoint) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Service Point Not Found</h2>
        <p className="text-sm text-slate-400 mt-2">Please scan a valid SilentServe QR code to make a service request.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-between p-6 max-w-md mx-auto relative overflow-hidden select-none">
      {/* Header Info */}
      <header className="pt-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          {business.name}
        </div>
        <p className="text-xs font-mono uppercase tracking-widest text-slate-500">{servicePoint.zoneName || 'LOCATION'}</p>
        <h1 className="text-4xl font-black tracking-tight text-white mt-1 uppercase">{servicePoint.name}</h1>
      </header>

      {/* Main Request Interactive Area */}
      <main className="my-auto py-8 text-center">
        {!activeRequest || activeRequest.status === 'CANCELLED' ? (
          <div className="flex flex-col items-center">
            <p className="text-base font-medium text-slate-300 max-w-xs mb-8 leading-relaxed">
              {config?.guestWelcomeMessage || 'Need assistance? Tap the button below to notify a staff member instantly.'}
            </p>

            {/* CALL BUTTON */}
            <button
              type="button"
              onClick={handleCallService}
              disabled={submitting || cooldownRemaining > 0}
              className={`w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all transform active:scale-95 shadow-2xl relative ${
                cooldownRemaining > 0
                  ? 'bg-slate-800 border-4 border-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-b from-amber-400 to-amber-600 border-4 border-amber-300 text-slate-950 shadow-amber-500/20 hover:scale-105'
              }`}
            >
              {submitting ? (
                <Loader2 className="w-16 h-16 animate-spin text-slate-950" />
              ) : cooldownRemaining > 0 ? (
                <>
                  <Clock className="w-12 h-12 mb-2" />
                  <span className="text-2xl font-extrabold font-mono">{cooldownRemaining}s</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-1 text-slate-400">Cooldown</span>
                </>
              ) : (
                <>
                  <Bell className="w-16 h-16 mb-2 animate-bounce" />
                  <span className="text-xl font-black tracking-tight uppercase">CALL A TEAM MEMBER</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest mt-1 text-slate-900/70">One Tap Request</span>
                </>
              )}
            </button>

            {/* Optional Note Toggle */}
            {cooldownRemaining <= 0 && (
              <div className="mt-6 w-full max-w-xs">
                {!showNoteInput ? (
                  <button
                    type="button"
                    onClick={() => setShowNoteInput(true)}
                    className="text-xs font-semibold text-slate-400 hover:text-amber-400 transition"
                  >
                    + Add an optional note
                  </button>
                ) : (
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-left">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Note for staff
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={120}
                      rows={2}
                      placeholder="e.g. Need extra water or cutlery"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 resize-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeRequest.status === 'WAITING' ? (
          /* WAITING SCREEN */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-6 animate-pulse">
              <Clock className="w-10 h-10" />
            </div>
            <StatusBadge status="WAITING" />
            <h2 className="text-2xl font-black tracking-tight text-white mt-4">Waiting for assistance</h2>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              Your service request has been sent to the team. Someone will be with you shortly.
            </p>

            {/* CANCEL BUTTON */}
            {cancelTimeRemaining > 0 && (
              <div className="mt-6 w-full pt-6 border-t border-slate-800 flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleCancelRequest}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4 text-red-400" />
                  Cancel Request ({cancelTimeRemaining}s)
                </button>
              </div>
            )}
          </div>
        ) : activeRequest.status === 'CLAIMED' ? (
          /* CLAIMED SCREEN */
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 animate-spin" />
            </div>
            <StatusBadge status="CLAIMED" />
            <h2 className="text-2xl font-black tracking-tight text-white mt-4">
              {activeRequest.claimedByStaffName || 'A team member'} is coming
            </h2>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              Your request has been claimed by <span className="font-bold text-amber-400">{activeRequest.claimedByStaffName || 'staff'}</span> and is currently on the way!
            </p>
          </div>
        ) : (
          /* COMPLETED SCREEN */
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <StatusBadge status="COMPLETED" />
            <h2 className="text-2xl font-black tracking-tight text-white mt-4">All set!</h2>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              {activeRequest.claimedByStaffName || 'Staff'} has completed your request. We hope you enjoy your experience!
            </p>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="pb-4 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-600">
          Powered by <span className="text-slate-400 font-bold">SilentServe</span>
        </p>
      </footer>
    </div>
  );
}
