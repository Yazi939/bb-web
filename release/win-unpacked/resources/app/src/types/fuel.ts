export interface FuelTransaction {
  id: string;
  key: string;
  type: 'purchase' | 'sale' | 'bunker_sale' | 'drain' | 'base_to_bunker' | 'bunker_to_base';
  volume: number;
  price: number;
  totalCost: number;
  date: string;
  timestamp: number;
  fuelType: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'deferred';
  userId?: string;
  userRole?: string;
  notes?: string;
  edited?: boolean;
  editTimestamp?: number;
} 