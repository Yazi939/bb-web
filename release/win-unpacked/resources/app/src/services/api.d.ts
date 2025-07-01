import { AxiosInstance } from 'axios';
import { Shift } from '../types/electron';

interface ApiService {
  get: (url: string, config?: any) => Promise<any>;
  post: (url: string, data?: any, config?: any) => Promise<any>;
  put: (url: string, data?: any, config?: any) => Promise<any>;
  delete: (url: string, config?: any) => Promise<any>;
}

interface FuelService {
  getTransactions: () => Promise<FuelTransaction[]>;
  getTransaction: (id: string | number) => Promise<FuelTransaction>;
  createTransaction: (data: Omit<FuelTransaction, 'id' | 'createdAt'>) => Promise<FuelTransaction>;
  updateTransaction: (id: string | number, data: Partial<FuelTransaction>) => Promise<FuelTransaction>;
  deleteTransaction: (id: string | number) => Promise<void>;
  getAllTransactions: () => Promise<FuelTransaction[]>;
}

interface ShiftService {
  getShifts: (params?: { page?: number; pageSize?: number }) => Promise<{ shifts: Shift[]; total: number }>;
  getShift: (id: string | number) => Promise<Shift>;
  createShift: (data: Omit<Shift, 'id' | 'createdAt'>) => Promise<Shift>;
  updateShift: (id: string | number, data: Partial<Shift>) => Promise<Shift>;
  deleteShift: (id: string | number) => Promise<void>;
}

interface UserService {
  getUsers: () => Promise<any>;
  getUser: (id: string | number) => Promise<any>;
  createUser: (data: any) => Promise<any>;
  updateUser: (id: string | number, data: any) => Promise<any>;
  deleteUser: (id: string | number) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
}

interface VehicleService {
  getVehicles: () => Promise<any>;
  getVehicle: (id: string | number) => Promise<any>;
  createVehicle: (data: any) => Promise<any>;
  updateVehicle: (id: string | number, data: any) => Promise<any>;
  deleteVehicle: (id: string | number) => Promise<any>;
}

export const fuelService: FuelService;
export const shiftService: ShiftService;
export const userService: UserService;
export const vehicleService: VehicleService;

declare const api: AxiosInstance;
export default api; 