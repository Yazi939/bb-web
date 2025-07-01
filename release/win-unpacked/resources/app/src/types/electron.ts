export interface FuelTransaction {
  id: string;
  key: string;
  type: 'purchase' | 'sale' | 'base_to_bunker' | 'bunker_to_base' | 'bunker_sale' | 'drain' | 'expense' | 'repair' | 'salary';
  volume?: number;
  price?: number;
  totalCost?: number;
  date?: string;
  timestamp?: number;
  fuelType?: string;
  supplier?: string;
  customer?: string;
  vessel?: string;
  source?: string;
  destination?: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'deferred';
  userId?: string;
  userRole?: string;
  notes?: string;
  frozen?: boolean;
  frozenDate?: number;
  edited?: boolean;
  editTimestamp?: number;
  createdAt?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerContact: string;
  vesselName: string;
  fuelType: string;
  volume: number;
  price: number;
  totalCost: number;
  status: string;
  createdAt: string;
  timestamp: number;
  deliveryDate?: string;
  deliveryTimestamp?: number;
  notes?: string;
}

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

export interface ElectronAPI {
  appReady: () => Promise<boolean>;
  vehicles: {
    getAll: () => Promise<any[]>;
    add: (vehicle: any) => Promise<any>;
    update: (vehicle: any) => Promise<any>;
    delete: (id: string) => Promise<void>;
  };
  transactions: {
    getAll: () => Promise<FuelTransaction[]>;
    add: (transaction: FuelTransaction) => Promise<FuelTransaction[]>;
    update: (transactions: FuelTransaction[]) => Promise<FuelTransaction[]>;
    delete: (key: string) => Promise<FuelTransaction[]>;
    getByDateRange: (startDate: string, endDate: string) => Promise<FuelTransaction[]>;
    getByFuelType: (fuelType: string) => Promise<FuelTransaction[]>;
  };
  orders: {
    getAll: () => Promise<Order[]>;
    add: (order: Order) => Promise<Order[]>;
    update: (order: Order) => Promise<Order[]>;
    delete: (id: string) => Promise<Order[]>;
  };
  settings: {
    get: () => Promise<any>;
    update: (settings: any) => Promise<any>;
  };
  fuel: {
    calculate: (data: any) => Promise<any>;
  };
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;
  onUpdateNotAvailable?: (callback: (info?: UpdateInfo) => void) => void;
  onDownloadProgress: (callback: (progress: { percent: number }) => void) => void;
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void;
  onUpdateError: (callback: (error: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
} 