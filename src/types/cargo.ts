// Cargo/Rack Inventory Types

export type CargoStatus = 'in_transit' | 'stored' | 'picking' | 'loading' | 'unloading' | 'shipped' | 'received';

export type CargoType = 'pallet' | 'box' | 'carton' | 'container';

export type RackZone = 'STORAGE_A' | 'STORAGE_B' | 'STORAGE_C' | 'STORAGE_D' | 'STORAGE_E' | 'STORAGE_F' | 'ZONE_A' | 'ZONE_B' | 'PROCESSING' | 'SHIPPING' | 'RECEIVING';

export interface CargoItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  type: CargoType;
  weight: number; // kg
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  quantity: number;
  status: CargoStatus;
  
  // Location tracking
  currentLocation: {
    zone: RackZone;
    rackId: string;
    shelfId: string;
    position: string; // e.g., "A-12-3" (Zone-Row-Level)
  };
  
  // Tracking info
  receivedAt?: string;
  storedAt?: string;
  pickedAt?: string;
  shippedAt?: string;
  
  // Assignment
  assignedAMR?: string;
  assignedTask?: string;
  
  // Metadata
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customerOrder?: string;
  expiryDate?: string;
  fragile: boolean;
  hazardous: boolean;
}

export interface RackLocation {
  id: string;
  zone: RackZone;
  rackName: string;
  shelfNumber: number;
  position: string;
  capacity: number; // Max items
  currentLoad: number; // Current items
  isFull: boolean;
  cargoIds: string[];
}

export interface ZoneSummary {
  zone: RackZone;
  totalRacks: number;
  totalCapacity: number;
  currentLoad: number;
  utilizationPercent: number;
  availableSlots: number;
}

// Helper functions
export const getCargoStatusLabel = (status: CargoStatus): string => {
  const labels: Record<CargoStatus, string> = {
    in_transit: 'In Transit',
    stored: 'Stored',
    picking: 'Being Picked',
    loading: 'Loading',
    unloading: 'Unloading',
    shipped: 'Shipped',
    received: 'Received'
  };
  return labels[status];
};

export const getCargoStatusColor = (status: CargoStatus): string => {
  const colors: Record<CargoStatus, string> = {
    in_transit: '#3b82f6',    // Blue
    stored: '#22c55e',        // Green
    picking: '#f59e0b',       // Amber
    loading: '#8b5cf6',       // Purple
    unloading: '#ec4899',     // Pink
    shipped: '#06b6d4',       // Cyan
    received: '#10b981'       // Emerald
  };
  return colors[status];
};

export const getCargoTypeLabel = (type: CargoType): string => {
  const labels: Record<CargoType, string> = {
    pallet: 'Pallet',
    box: 'Box',
    carton: 'Carton',
    container: 'Container'
  };
  return labels[type];
};

export const getZoneLabel = (zone: RackZone): string => {
  const labels: Record<RackZone, string> = {
    STORAGE_A: 'Storage Zone A',
    STORAGE_B: 'Storage Zone B',
    STORAGE_C: 'Storage Zone C',
    STORAGE_D: 'Storage Zone D',
    STORAGE_E: 'Storage Zone E',
    STORAGE_F: 'Storage Zone F',
    ZONE_A: 'Processing Zone A',
    ZONE_B: 'Processing Zone B',
    PROCESSING: 'Processing Center',
    SHIPPING: 'Shipping Dock',
    RECEIVING: 'Receiving Dock'
  };
  return labels[zone];
};

export const getZoneColor = (zone: RackZone): string => {
  const colors: Record<RackZone, string> = {
    STORAGE_A: '#3b82f6',
    STORAGE_B: '#3b82f6',
    STORAGE_C: '#3b82f6',
    STORAGE_D: '#3b82f6',
    STORAGE_E: '#3b82f6',
    STORAGE_F: '#3b82f6',
    ZONE_A: '#22c55e',
    ZONE_B: '#22c55e',
    PROCESSING: '#f59e0b',
    SHIPPING: '#06b6d4',
    RECEIVING: '#8b5cf6'
  };
  return colors[zone];
};

export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    low: '#94a3b8',
    medium: '#3b82f6',
    high: '#f59e0b',
    urgent: '#ef4444'
  };
  return colors[priority] || '#94a3b8';
};

export const formatLocation = (location: CargoItem['currentLocation']): string => {
  return `${getZoneLabel(location.zone)} - ${location.rackId} - Shelf ${location.shelfId} - Pos ${location.position}`;
};

export const formatDimensions = (dims: CargoItem['dimensions']): string => {
  return `${dims.length}×${dims.width}×${dims.height} cm`;
};
