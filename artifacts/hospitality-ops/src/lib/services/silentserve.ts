import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  BusinessConfig,
  BusinessDoc,
  ZoneDoc,
  ServicePointDoc,
  StaffDoc,
  ServiceRequestDoc,
  RequestStatus,
} from '@/lib/types';

// Default Business Config
export const DEFAULT_CONFIG: BusinessConfig = {
  businessName: 'Grand Hotel',
  timezone: 'UTC',
  currency: 'USD',
  defaultCooldownSeconds: 60,
  cancelWindowSeconds: 10,
  completedDisplaySeconds: 5,
  staffPinEnabled: false,
  dashboardPin: '1234',
  soundEnabled: true,
  businessType: 'Hotel',
  guestWelcomeMessage: 'Need something? Tap below and a team member will be right with you.',
};

// Local storage backup/mock state key for fallback offline/demo mode when Firebase is not connected to a live server
const DEMO_STORAGE_KEY = 'silentserve_demo_store';

interface DemoStoreData {
  businesses: Record<string, BusinessDoc>;
  configs: Record<string, BusinessConfig>;
  zones: Record<string, ZoneDoc[]>;
  servicePoints: Record<string, ServicePointDoc[]>;
  staff: Record<string, StaffDoc[]>;
  requests: Record<string, ServiceRequestDoc[]>;
}

function getLocalStore(): DemoStoreData {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading local demo store', e);
  }
  const initial = createInitialDemoStore();
  saveLocalStore(initial);
  return initial;
}

function saveLocalStore(store: DemoStoreData) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed saving local demo store', e);
  }
}

export function createInitialDemoStore(): DemoStoreData {
  const businessId = 'grand-hotel';
  const business: BusinessDoc = {
    id: businessId,
    name: 'Grand Hotel',
    slug: 'grand-hotel',
    businessType: 'Hotel',
    createdAt: new Date().toISOString(),
    ownerId: 'demo-owner',
    plan: 'Hotel',
  };

  const zones: ZoneDoc[] = [
    { id: 'zone-restaurant', businessId, name: 'Restaurant', active: true, createdAt: new Date().toISOString() },
    { id: 'zone-pool', businessId, name: 'Pool', active: true, createdAt: new Date().toISOString() },
    { id: 'zone-roomservice', businessId, name: 'Room Service', active: true, createdAt: new Date().toISOString() },
  ];

  const servicePoints: ServicePointDoc[] = [
    { id: 'sp-table-1', businessId, zoneId: 'zone-restaurant', zoneName: 'Restaurant', name: 'Table 1', type: 'table', label: 'Main Floor', active: true, qrToken: 'tok-table-1', createdAt: new Date().toISOString() },
    { id: 'sp-table-2', businessId, zoneId: 'zone-restaurant', zoneName: 'Restaurant', name: 'Table 2', type: 'table', label: 'Main Floor', active: true, qrToken: 'tok-table-2', createdAt: new Date().toISOString() },
    { id: 'sp-table-5', businessId, zoneId: 'zone-restaurant', zoneName: 'Restaurant', name: 'Table 5', type: 'table', label: 'Terrace', active: true, qrToken: 'tok-table-5', createdAt: new Date().toISOString() },
    { id: 'sp-room-101', businessId, zoneId: 'zone-roomservice', zoneName: 'Room Service', name: 'Room 101', type: 'room', label: 'Deluxe Suite', active: true, qrToken: 'tok-room-101', createdAt: new Date().toISOString() },
    { id: 'sp-room-102', businessId, zoneId: 'zone-roomservice', zoneName: 'Room Service', name: 'Room 102', type: 'room', label: 'Deluxe Suite', active: true, qrToken: 'tok-room-102', createdAt: new Date().toISOString() },
    { id: 'sp-pool-1', businessId, zoneId: 'zone-pool', zoneName: 'Pool', name: 'Pool Chair 1', type: 'seat', label: 'Sundeck', active: true, qrToken: 'tok-pool-1', createdAt: new Date().toISOString() },
  ];

  const staff: StaffDoc[] = [
    { id: 'staff-maria', businessId, name: 'Maria', active: true, zoneIds: ['zone-restaurant', 'zone-pool'], pin: '1234', createdAt: new Date().toISOString() },
    { id: 'staff-juan', businessId, name: 'Juan', active: true, zoneIds: ['zone-pool', 'zone-roomservice'], pin: '1234', createdAt: new Date().toISOString() },
    { id: 'staff-carlos', businessId, name: 'Carlos', active: true, zoneIds: ['zone-roomservice'], pin: '1234', createdAt: new Date().toISOString() },
    { id: 'staff-david', businessId, name: 'David', active: true, zoneIds: ['zone-restaurant'], pin: '1234', createdAt: new Date().toISOString() },
  ];

  const requests: ServiceRequestDoc[] = [
    {
      id: 'req-demo-1',
      businessId,
      zoneId: 'zone-restaurant',
      zoneName: 'Restaurant',
      servicePointId: 'sp-table-5',
      servicePointName: 'Table 5',
      status: 'WAITING',
      createdAt: new Date(Date.now() - 24000).toISOString(),
      guestSessionId: 'sess-demo-1',
    },
    {
      id: 'req-demo-2',
      businessId,
      zoneId: 'zone-pool',
      zoneName: 'Pool',
      servicePointId: 'sp-pool-1',
      servicePointName: 'Pool Chair 1',
      status: 'CLAIMED',
      createdAt: new Date(Date.now() - 120000).toISOString(),
      claimedAt: new Date(Date.now() - 18000).toISOString(),
      claimedByStaffId: 'staff-maria',
      claimedByStaffName: 'Maria',
      guestSessionId: 'sess-demo-2',
    },
  ];

  return {
    businesses: { [businessId]: business },
    configs: { [businessId]: { ...DEFAULT_CONFIG, businessName: 'Grand Hotel' } },
    zones: { [businessId]: zones },
    servicePoints: { [businessId]: servicePoints },
    staff: { [businessId]: staff },
    requests: { [businessId]: requests },
  };
}

export function resetDemoData() {
  const initial = createInitialDemoStore();
  saveLocalStore(initial);
  return initial;
}

// Data Service APIs
export async function getBusinessBySlug(slug: string): Promise<BusinessDoc | null> {
  try {
    const q = query(collection(db, 'businesses'), where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0];
      return { id: docData.id, ...docData.data() } as BusinessDoc;
    }
  } catch (e) {
    console.warn('Firestore fallback to local store for business slug', slug);
  }
  const store = getLocalStore();
  const found = Object.values(store.businesses).find((b) => b.slug === slug || b.id === slug);
  return found || null;
}

export async function getBusinessConfig(businessId: string): Promise<BusinessConfig> {
  try {
    const ref = doc(db, 'businesses', businessId, 'settings', 'config');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as BusinessConfig;
    }
  } catch (e) {
    console.warn('Firestore fallback for business config');
  }
  const store = getLocalStore();
  return store.configs[businessId] || DEFAULT_CONFIG;
}

export async function updateBusinessConfig(businessId: string, config: Partial<BusinessConfig>): Promise<void> {
  try {
    const ref = doc(db, 'businesses', businessId, 'settings', 'config');
    await setDoc(ref, config, { merge: true });
  } catch (e) {
    console.warn('Firestore config update fallback');
  }
  const store = getLocalStore();
  store.configs[businessId] = { ...(store.configs[businessId] || DEFAULT_CONFIG), ...config };
  saveLocalStore(store);
}

// Service Point Lookup
export async function getServicePointByInfo(
  businessSlug: string,
  zoneOrLocation: string,
  servicePointIdOrCode: string
): Promise<{ business: BusinessDoc; servicePoint: ServicePointDoc; zone?: ZoneDoc } | null> {
  const business = await getBusinessBySlug(businessSlug);
  if (!business) return null;

  try {
    const spQuery = query(
      collection(db, 'businesses', business.id, 'servicePoints'),
      where('qrToken', '==', servicePointIdOrCode),
      limit(1)
    );
    const snap = await getDocs(spQuery);
    if (!snap.empty) {
      const sp = { id: snap.docs[0].id, ...snap.docs[0].data() } as ServicePointDoc;
      return { business, servicePoint: sp };
    }
  } catch (e) {
    console.warn('Firestore service point query fallback');
  }

  const store = getLocalStore();
  const sps = store.servicePoints[business.id] || [];
  const found = sps.find(
    (s) =>
      s.id === servicePointIdOrCode ||
      s.qrToken === servicePointIdOrCode ||
      s.name.toLowerCase().replace(/\s+/g, '-') === servicePointIdOrCode.toLowerCase()
  );

  if (found) {
    return { business, servicePoint: found };
  }
  return null;
}

// Guest Request Operations
export async function createGuestRequest(params: {
  businessId: string;
  zoneId: string;
  zoneName: string;
  servicePointId: string;
  servicePointName: string;
  guestSessionId: string;
  note?: string;
}): Promise<ServiceRequestDoc> {
  const now = new Date().toISOString();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newRequest: ServiceRequestDoc = {
    id: requestId,
    businessId: params.businessId,
    zoneId: params.zoneId,
    zoneName: params.zoneName,
    servicePointId: params.servicePointId,
    servicePointName: params.servicePointName,
    status: 'WAITING',
    createdAt: now,
    guestSessionId: params.guestSessionId,
    note: params.note,
  };

  try {
    const reqRef = doc(db, 'businesses', params.businessId, 'requests', requestId);
    await setDoc(reqRef, { ...newRequest, serverTimestamp: serverTimestamp() });
  } catch (e) {
    console.warn('Firestore request creation fallback to local store');
  }

  const store = getLocalStore();
  if (!store.requests[params.businessId]) store.requests[params.businessId] = [];
  store.requests[params.businessId].unshift(newRequest);
  saveLocalStore(store);

  // Trigger local listeners
  notifyListeners(params.businessId);

  return newRequest;
}

export async function cancelGuestRequest(businessId: string, requestId: string): Promise<boolean> {
  const now = new Date().toISOString();
  try {
    const reqRef = doc(db, 'businesses', businessId, 'requests', requestId);
    await updateDoc(reqRef, { status: 'CANCELLED', cancelledAt: now });
  } catch (e) {
    console.warn('Firestore cancel request fallback');
  }

  const store = getLocalStore();
  const reqs = store.requests[businessId] || [];
  const req = reqs.find((r) => r.id === requestId);
  if (req && req.status === 'WAITING') {
    req.status = 'CANCELLED';
    req.cancelledAt = now;
    saveLocalStore(store);
    notifyListeners(businessId);
    return true;
  }
  return false;
}

// Atomic Staff Claiming with Transaction Guarantee
export async function claimRequestAtomically(
  businessId: string,
  requestId: string,
  staff: StaffDoc
): Promise<{ success: boolean; claimedBy?: string }> {
  const now = new Date().toISOString();
  try {
    const reqRef = doc(db, 'businesses', businessId, 'requests', requestId);
    const result = await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(reqRef);
      if (!sfDoc.exists()) {
        throw new Error('Request does not exist!');
      }
      const data = sfDoc.data() as ServiceRequestDoc;
      if (data.status !== 'WAITING') {
        return { success: false, claimedBy: data.claimedByStaffName };
      }
      transaction.update(reqRef, {
        status: 'CLAIMED',
        claimedByStaffId: staff.id,
        claimedByStaffName: staff.name,
        claimedAt: now,
      });
      return { success: true, claimedBy: staff.name };
    });
    return result;
  } catch (e) {
    console.warn('Firestore claim transaction fallback');
  }

  const store = getLocalStore();
  const reqs = store.requests[businessId] || [];
  const req = reqs.find((r) => r.id === requestId);

  if (!req) return { success: false };
  if (req.status !== 'WAITING') {
    return { success: false, claimedBy: req.claimedByStaffName };
  }

  req.status = 'CLAIMED';
  req.claimedAt = now;
  req.claimedByStaffId = staff.id;
  req.claimedByStaffName = staff.name;
  saveLocalStore(store);
  notifyListeners(businessId);

  return { success: true, claimedBy: staff.name };
}

// Complete Request Action
export async function completeRequest(
  businessId: string,
  requestId: string,
  staffId: string
): Promise<boolean> {
  const now = new Date().toISOString();
  try {
    const reqRef = doc(db, 'businesses', businessId, 'requests', requestId);
    await updateDoc(reqRef, {
      status: 'COMPLETED',
      completedAt: now,
    });
  } catch (e) {
    console.warn('Firestore complete request fallback');
  }

  const store = getLocalStore();
  const reqs = store.requests[businessId] || [];
  const req = reqs.find((r) => r.id === requestId);
  if (req) {
    req.status = 'COMPLETED';
    req.completedAt = now;
    saveLocalStore(store);
    notifyListeners(businessId);
    return true;
  }
  return false;
}

// Realtime Subscriptions with local store broadcast fallback
type Listener = (requests: ServiceRequestDoc[]) => void;
const listenersByBusiness: Record<string, Set<Listener>> = {};

function notifyListeners(businessId: string) {
  const store = getLocalStore();
  const reqs = store.requests[businessId] || [];
  const listeners = listenersByBusiness[businessId];
  if (listeners) {
    listeners.forEach((callback) => callback([...reqs]));
  }
}

export function subscribeToRequests(
  businessId: string,
  callback: (requests: ServiceRequestDoc[]) => void
): () => void {
  let unsubFirestore: (() => void) | null = null;

  try {
    const q = query(
      collection(db, 'businesses', businessId, 'requests'),
      orderBy('createdAt', 'desc')
    );
    unsubFirestore = onSnapshot(q, (snapshot) => {
      const items: ServiceRequestDoc[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ServiceRequestDoc[];
      callback(items);
    });
  } catch (e) {
    console.warn('Firestore realtime subscription fallback');
  }

  if (!listenersByBusiness[businessId]) {
    listenersByBusiness[businessId] = new Set();
  }
  listenersByBusiness[businessId].add(callback);

  // Trigger initial callback with local store
  const store = getLocalStore();
  callback(store.requests[businessId] || []);

  return () => {
    if (unsubFirestore) unsubFirestore();
    if (listenersByBusiness[businessId]) {
      listenersByBusiness[businessId].delete(callback);
    }
  };
}

// Helper methods for CRUD operations
export async function getZones(businessId: string): Promise<ZoneDoc[]> {
  try {
    const snap = await getDocs(collection(db, 'businesses', businessId, 'zones'));
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ZoneDoc[];
    }
  } catch (e) {}
  return getLocalStore().zones[businessId] || [];
}

export async function createZone(businessId: string, name: string, description?: string): Promise<ZoneDoc> {
  const zone: ZoneDoc = {
    id: `zone_${Date.now()}`,
    businessId,
    name,
    description,
    active: true,
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'businesses', businessId, 'zones', zone.id), zone);
  } catch (e) {}
  const store = getLocalStore();
  if (!store.zones[businessId]) store.zones[businessId] = [];
  store.zones[businessId].push(zone);
  saveLocalStore(store);
  return zone;
}

export async function getServicePoints(businessId: string): Promise<ServicePointDoc[]> {
  try {
    const snap = await getDocs(collection(db, 'businesses', businessId, 'servicePoints'));
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ServicePointDoc[];
    }
  } catch (e) {}
  return getLocalStore().servicePoints[businessId] || [];
}

export async function createServicePoint(
  businessId: string,
  data: Omit<ServicePointDoc, 'id' | 'businessId' | 'qrToken' | 'createdAt'>
): Promise<ServicePointDoc> {
  const sp: ServicePointDoc = {
    ...data,
    id: `sp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    businessId,
    qrToken: `tok_${Math.random().toString(36).substring(2, 10)}`,
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'businesses', businessId, 'servicePoints', sp.id), sp);
  } catch (e) {}
  const store = getLocalStore();
  if (!store.servicePoints[businessId]) store.servicePoints[businessId] = [];
  store.servicePoints[businessId].push(sp);
  saveLocalStore(store);
  return sp;
}

export async function bulkCreateServicePoints(
  businessId: string,
  zoneId: string,
  zoneName: string,
  prefix: string,
  start: number,
  end: number,
  type: import('@/lib/types').ServicePointType
): Promise<ServicePointDoc[]> {
  const created: ServicePointDoc[] = [];
  for (let i = start; i <= end; i++) {
    const name = `${prefix} ${i}`;
    const sp = await createServicePoint(businessId, {
      zoneId,
      zoneName,
      name,
      type,
      active: true,
    });
    created.push(sp);
  }
  return created;
}

export async function getStaffList(businessId: string): Promise<StaffDoc[]> {
  try {
    const snap = await getDocs(collection(db, 'businesses', businessId, 'staff'));
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as StaffDoc[];
    }
  } catch (e) {}
  return getLocalStore().staff[businessId] || [];
}

export async function createStaffMember(businessId: string, name: string, zoneIds: string[], pin?: string): Promise<StaffDoc> {
  const staff: StaffDoc = {
    id: `staff_${Date.now()}`,
    businessId,
    name,
    active: true,
    zoneIds,
    pin: pin || '1234',
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'businesses', businessId, 'staff', staff.id), staff);
  } catch (e) {}
  const store = getLocalStore();
  if (!store.staff[businessId]) store.staff[businessId] = [];
  store.staff[businessId].push(staff);
  saveLocalStore(store);
  return staff;
}
