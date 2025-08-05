import { User, UserRole } from './users';
import { FuelTransaction, Shift } from '../types/electron';
import dayjs from 'dayjs';

// Мок-данные для пользователей
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin',
    role: 'admin' as UserRole,
    username: 'admin',
    password: 'admin123'
  },
  {
    id: '2',
    name: 'Worker',
    role: 'worker' as UserRole,
    username: 'worker',
    password: 'worker123'
  },
  {
    id: '3',
    name: 'Причал',
    role: 'pier' as UserRole,
    username: 'pier',
    password: 'pier123'
  },
  {
    id: '4',
    name: 'Бункеровщик',
    role: 'bunker' as UserRole,
    username: 'bunker',
    password: 'bunker123'
  }
];

// Мок-данные для транзакций
export const mockTransactions: FuelTransaction[] = [
  {
    key: 'transaction-1',
    type: 'sale' as const,
    fuelType: 'АИ-92',
    volume: 100,
    price: 45.5,
    totalCost: 4550,
    date: dayjs().format('YYYY-MM-DD'),
    timestamp: Date.now() - 86400000, // вчера
    frozen: false,
    notes: 'Продажа АИ-92',
    customer: 'ООО "Транспорт"',
    vessel: 'Судно-1',
    paymentMethod: 'cash'
  },
  {
    key: 'transaction-2',
    type: 'purchase' as const,
    fuelType: 'АИ-95',
    volume: 200,
    price: 48.0,
    totalCost: 9600,
    date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    timestamp: Date.now() - 172800000, // позавчера
    frozen: false,
    notes: 'Закупка АИ-95',
    supplier: 'ООО "Топливная компания"',
    paymentMethod: 'transfer'
  }
];

// Мок-данные для заказов
export const mockOrders = [
  {
    id: '1',
    customerName: 'ООО "Транспорт"',
    customerContact: '+7 999 123-45-67',
    vesselName: 'Судно-1',
    fuelType: 'АИ-92',
    volume: 500,
    price: 45.0,
    totalCost: 22500,
    status: 'pending',
    createdAt: dayjs().format('YYYY-MM-DD'),
    timestamp: Date.now(),
    notes: 'Заказ на АИ-92'
  },
  {
    id: '2',
    customerName: 'ИП Петров',
    customerContact: '+7 999 765-43-21',
    vesselName: 'Судно-2',
    fuelType: 'АИ-95',
    volume: 300,
    price: 47.5,
    totalCost: 14250,
    status: 'completed',
    createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    timestamp: Date.now() - 86400000,
    notes: 'Заказ на АИ-95'
  }
];

// Мок-данные для смен
export const mockShifts: Shift[] = [
  {
    id: 'shift-1',
    employeeName: 'Иванов Иван',
    date: dayjs().format('YYYY-MM-DD'),
    timestamp: Date.now(),
    shiftType: 'day',
    fuelSaved: 50,
    bonus: 325,
    baseSalary: 5500,
    totalSalary: 5825,
    notes: 'Дневная смена'
  },
  {
    id: 'shift-2',
    employeeName: 'Петров Петр',
    date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    timestamp: Date.now() - 86400000,
    shiftType: 'night',
    fuelSaved: 75,
    bonus: 487.5,
    baseSalary: 6500,
    totalSalary: 6987.5,
    notes: 'Ночная смена'
  }
]; 