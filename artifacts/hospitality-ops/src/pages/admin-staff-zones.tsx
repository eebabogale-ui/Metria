import React, { useState, useEffect } from 'react';
import {
  getBusinessBySlug,
  getStaffList,
  getZones,
  createStaffMember,
  createZone,
} from '@/lib/services/silentserve';
import type { StaffDoc, ZoneDoc, BusinessDoc } from '@/lib/types';
import { Users, MapPin, Plus, Check, Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';

export function StaffAndZonesSection() {
  const businessSlug = 'grand-hotel';
  const [business, setBusiness] = useState<BusinessDoc | null>(null);
  const [staffList, setStaffList] = useState<StaffDoc[]>([]);
  const [zones, setZones] = useState<ZoneDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Staff form state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('1234');
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);

  // Zone form state
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDescription, setNewZoneDescription] = useState('');

  const loadData = async () => {
    setLoading(true);
    const b = await getBusinessBySlug(businessSlug);
    if (b) {
      setBusiness(b);
      const s = await getStaffList(b.id);
      const z = await getZones(b.id);
      setStaffList(s);
      setZones(z);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !newStaffName.trim()) return;

    await createStaffMember(business.id, newStaffName.trim(), selectedZoneIds, newStaffPin.trim() || '1234');
    toast.success(`Added staff member ${newStaffName}`);
    setNewStaffName('');
    setSelectedZoneIds([]);
    setShowAddStaffModal(false);
    loadData();
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !newZoneName.trim()) return;

    await createZone(business.id, newZoneName.trim(), newZoneDescription.trim() || undefined);
    toast.success(`Created zone ${newZoneName}`);
    setNewZoneName('');
    setNewZoneDescription('');
    setShowAddZoneModal(false);
    loadData();
  };

  const toggleZoneSelection = (zoneId: string) => {
    setSelectedZoneIds((prev) =>
      prev.includes(zoneId) ? prev.filter((id) => id !== zoneId) : [...prev, zoneId]
    );
  };

  return (
    <div className="space-y-10">
      {/* Staff Management */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" /> Staff Members
            </h2>
            <p className="text-xs text-slate-500">Manage floor staff, zone assignments, and dashboard access PINs.</p>
          </div>
          <button
            onClick={() => setShowAddStaffModal(true)}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Staff Member
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((s) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">{s.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    s.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {s.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Zones: {s.zoneIds.length ? `${s.zoneIds.length} assigned` : 'All zones'}
                </p>
                {s.pin && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    PIN: ••••
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone Management */}
      <div className="pt-8 border-t border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" /> Service Zones
            </h2>
            <p className="text-xs text-slate-500">Organize your property into operational areas like Pool, Restaurant, or Rooms.</p>
          </div>
          <button
            onClick={() => setShowAddZoneModal(true)}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Zone
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {zones.map((z) => (
            <div key={z.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">{z.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
              {z.description && <p className="text-xs text-slate-500 mt-2">{z.description}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Staff Member</h3>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Maria Gonzalez"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dashboard PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Assign to Zones</label>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {zones.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => toggleZoneSelection(z.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition ${
                        selectedZoneIds.includes(z.id)
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span>{z.name}</span>
                      {selectedZoneIds.includes(z.id) && <Check className="w-4 h-4 text-amber-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Zone Modal */}
      {showAddZoneModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Zone</h3>
            <form onSubmit={handleCreateZone} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="e.g. Rooftop Pool & Bar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newZoneDescription}
                  onChange={(e) => setNewZoneDescription(e.target.value)}
                  placeholder="e.g. Outdoor terrace and pool cabanas"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddZoneModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                >
                  Create Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
