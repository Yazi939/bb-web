export interface ElectronAPI {
  transactions: {
    getAll: () => Promise<FuelTransaction[]>;
    add: (transaction: FuelTransaction) => Promise<FuelTransaction[]>;
    update: (transactions: FuelTransaction[]) => Promise<FuelTransaction[]>;
    delete: (id: string) => Promise<FuelTransaction[]>;
  };
  vehicles: {
    getAll: () => Promise<any[]>;
    add: (vehicle: any) => Promise<any[]>;
    update: (vehicle: any) => Promise<any[]>;
    delete: (id: string) => Promise<any[]>;
  };
  calculateFuel: (data: any) => Promise<any>;
  getAppVersion: () => string;
  isElectron: boolean;
  appReady: () => boolean;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export interface FuelTransaction {
  key: string;
  type: 'purchase' | 'sale' | 'drain';
  volume: number;
  price: number;
  totalCost: number;
  date: string;
  timestamp: number;
  fuelType: string;
  supplier?: string;
  customer?: string;
  vessel?: string;
  frozen?: boolean;
  frozenDate?: number;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'deferred';
  userId?: string;
  userRole?: string;
  notes?: string;
  edited?: boolean;
  editTimestamp?: number;
} 