import React, { useState, useEffect } from 'react';
import {
  getBusinessBySlug,
  getZones,
  getServicePoints,
  createServicePoint,
  bulkCreateServicePoints,
} from '@/lib/services/silentserve';
import type { ServicePointDoc, ZoneDoc, BusinessDoc, ServicePointType } from '@/lib/types';
import { QRCard, PrintableQRTemplate } from '@/components/qr-card';
import { QrCode, Plus, Layers, Printer, Search, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function ServicePointsAndQRSection() {
  const businessSlug = 'grand-hotel';
  const [business, setBusiness] = useState<BusinessDoc | null>(null);
  const [zones, setZones] = useState<ZoneDoc[]>([]);
  const [servicePoints, setServicePoints] = useState<ServicePointDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('ALL');

  // Modals
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showPrintAll, setShowPrintAll] = useState(false);

  // Single Form State
  const [singleZoneId, setSingleZoneId] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singleType, setSingleType] = useState<ServicePointType>('table');
  const [singleLabel, setSingleLabel] = useState('');

  // Bulk Form State
  const [bulkZoneId, setBulkZoneId] = useState('');
  const [bulkPrefix, setBulkPrefix] = useState('Table');
  const [bulkStart, setBulkStart] = useState(1);
  const [bulkEnd, setBulkEnd] = useState(10);
  const [bulkType, setBulkType] = useState<ServicePointType>('table');

  const loadData = async () => {
    setLoading(true);
    const b = await getBusinessBySlug(businessSlug);
    if (b) {
      setBusiness(b);
      const z = await getZones(b.id);
      const sp = await getServicePoints(b.id);
      setZones(z);
      setServicePoints(sp);
      if (z.length > 0) {
        setSingleZoneId(z[0].id);
        setBulkZoneId(z[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !singleName.trim() || !singleZoneId) return;

    const z = zones.find((item) => item.id === singleZoneId);
    await createServicePoint(business.id, {
      zoneId: singleZoneId,
      zoneName: z?.name || 'Main',
      name: singleName.trim(),
      type: singleType,
      label: singleLabel.trim() || undefined,
      active: true,
    });

    toast.success(`Created ${singleName}`);
    setSingleName('');
    setSingleLabel('');
    setShowSingleModal(false);
    loadData();
  };

  const handleCreateBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !bulkZoneId || bulkStart > bulkEnd) return;

    const z = zones.find((item) => item.id === bulkZoneId);
    await bulkCreateServicePoints(
      business.id,
      bulkZoneId,
      z?.name || 'Main',
      bulkPrefix,
      bulkStart,
      bulkEnd,
      bulkType
    );

    toast.success(`Created ${bulkEnd - bulkStart + 1} service points`);
    setShowBulkModal(false);
    loadData();
  };

  const filteredPoints = servicePoints.filter((sp) => {
    const matchesSearch = sp.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = selectedZoneFilter === 'ALL' || sp.zoneId === selectedZoneFilter;
    return matchesSearch && matchesZone;
  });

  return (
    <div className="space-y-8">
      {/* Header & Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-500" /> Service Points & QR Codes
          </h2>
          <p className="text-xs text-slate-500">
            Generate, customize, and print high-resolution QR codes for tables, rooms, and cabanas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSingleModal(true)}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Service Point
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-sm"
          >
            <Layers className="w-4 h-4" /> Bulk Create
          </button>
          <button
            onClick={() => setShowPrintAll(!showPrintAll)}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            <Printer className="w-4 h-4" /> {showPrintAll ? 'Grid View' : 'Printable Sheets'}
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      {!showPrintAll && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setSelectedZoneFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedZoneFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Zones
            </button>
            {zones.map((z) => (
              <button
                key={z.id}
                onClick={() => setSelectedZoneFilter(z.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedZoneFilter === z.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {z.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid or Printable Layout */}
      {!showPrintAll ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPoints.map((sp) => {
            const qrUrl = `${window.location.origin}/g/${business?.slug || 'grand-hotel'}/${sp.zoneName?.toLowerCase() || 'restaurant'}/${sp.qrToken}`;
            return (
              <QRCard
                key={sp.id}
                businessName={business?.name || 'Grand Hotel'}
                zoneName={sp.zoneName || 'Restaurant'}
                servicePointName={sp.name}
                qrUrl={qrUrl}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <p className="text-xs font-semibold text-slate-600">Print preview layout optimized for standard A4 paper sheets.</p>
            <button
              onClick={() => window.print()}
              type="button"
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print Sheet Now
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
            {filteredPoints.map((sp) => {
              const qrUrl = `${window.location.origin}/g/${business?.slug || 'grand-hotel'}/${sp.zoneName?.toLowerCase() || 'restaurant'}/${sp.qrToken}`;
              return (
                <PrintableQRTemplate
                  key={sp.id}
                  businessName={business?.name || 'Grand Hotel'}
                  zoneName={sp.zoneName || 'Restaurant'}
                  servicePointName={sp.name}
                  qrUrl={qrUrl}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Add Single Service Point Modal */}
      {showSingleModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Single Service Point</h3>
            <form onSubmit={handleCreateSingle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Zone</label>
                <select
                  value={singleZoneId}
                  onChange={(e) => setSingleZoneId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-amber-500"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Name / Identifier</label>
                <input
                  type="text"
                  required
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  placeholder="e.g. Table 15, Room 302, Cabana B"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                <select
                  value={singleType}
                  onChange={(e) => setSingleType(e.target.value as ServicePointType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-amber-500"
                >
                  <option value="table">Table</option>
                  <option value="room">Room</option>
                  <option value="seat">Seat / Chair</option>
                  <option value="cabana">Cabana</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                >
                  Create & Generate QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Creation Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Bulk Create Service Points</h3>
            <form onSubmit={handleCreateBulk} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Zone</label>
                <select
                  value={bulkZoneId}
                  onChange={(e) => setBulkZoneId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-amber-500"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prefix</label>
                  <input
                    type="text"
                    required
                    value={bulkPrefix}
                    onChange={(e) => setBulkPrefix(e.target.value)}
                    placeholder="e.g. Table or Room"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={bulkType}
                    onChange={(e) => setBulkType(e.target.value as ServicePointType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-amber-500"
                  >
                    <option value="table">Table</option>
                    <option value="room">Room</option>
                    <option value="seat">Seat</option>
                    <option value="cabana">Cabana</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Number</label>
                  <input
                    type="number"
                    min={1}
                    value={bulkStart}
                    onChange={(e) => setBulkStart(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Number</label>
                  <input
                    type="number"
                    min={1}
                    value={bulkEnd}
                    onChange={(e) => setBulkEnd(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Generate {bulkEnd - bulkStart + 1} QRs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
