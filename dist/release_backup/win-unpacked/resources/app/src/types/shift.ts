import { Dayjs } from 'dayjs';

export interface Shift {
  id: string;
  employeeName: string;
  date: string;
  timestamp: number;
  shiftType: 'day' | 'night';
  fuelSaved: number;
  fuelPrice: number;
  bonus: number;
  baseSalary: number;
  totalSalary: number;
  notes?: string;
  createdAt: string;
} 