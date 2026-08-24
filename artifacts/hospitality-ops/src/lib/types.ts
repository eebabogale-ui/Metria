export type BusinessType = 'Cafe' | 'Restaurant' | 'Hotel' | 'Resort' | 'Bar' | 'Other';

export interface BusinessConfig {
  businessName: string;
  logo?: string;
  timezone: string;
  currency: string;
  defaultCooldownSeconds: number;
  cancelWindowSeconds: number;
  completedDisplaySeconds: number;
  staffPinEnabled: boolean;
  dashboardPin?: string;
  soundEnabled: boolean;
  businessType: BusinessType;
  guestWelcomeMessage?: string;
}

export interface BusinessDoc {
  id: string;
  name: string;
  slug: string;
  businessType: BusinessType;
  createdAt: string;
  ownerId: string;
  plan: 'Starter' | 'Pro' | 'Hotel' | 'Enterprise';
}

export interface ZoneDoc {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  active: boolean;
  icon?: string;
  createdAt: string;
}

export type ServicePointType = 'table' | 'room' | 'seat' | 'cabana' | 'custom';

export interface ServicePointDoc {
  id: string;
  businessId: string;
  zoneId: string;
  zoneName?: string;
  name: string;
  type: ServicePointType;
  label?: string;
  active: boolean;
  qrToken: string;
  createdAt: string;
}

export interface StaffDoc {
  id: string;
  businessId: string;
  name: string;
  active: boolean;
  zoneIds: string[];
  pin?: string;
  createdAt: string;
}

export type RequestStatus = 'WAITING' | 'CLAIMED' | 'COMPLETED' | 'CANCELLED';

export interface ServiceRequestDoc {
  id: string;
  businessId: string;
  zoneId: string;
  zoneName: string;
  servicePointId: string;
  servicePointName: string;
  status: RequestStatus;
  createdAt: string;
  claimedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  claimedByStaffId?: string;
  claimedByStaffName?: string;
  guestSessionId: string;
  note?: string;
}
