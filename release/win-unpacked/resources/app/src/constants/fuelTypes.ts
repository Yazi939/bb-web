import type { FuelTransaction } from '../types/electron';

export const FUEL_TYPES = [
  { value: 'diesel', label: 'Дизельное топливо' },
  { value: 'gasoline_95', label: 'Бензин АИ-95' }
] as const;

export const ALL_OPERATION_TYPES = [
  { value: 'purchase' as const, label: 'Закупка', color: 'green' },
  { value: 'sale' as const, label: 'Продажа', color: 'blue' },
  { value: 'base_to_bunker' as const, label: 'На бункер', color: 'orange' },
  { value: 'bunker_to_base' as const, label: 'С бункера', color: 'purple' },
  { value: 'bunker_sale' as const, label: 'Продажа с базы', color: 'cyan' }
] as const;

export const PAYMENT_METHODS = [
  { value: 'cash' as const, label: 'Наличные' },
  { value: 'card' as const, label: 'Карта' },
  { value: 'transfer' as const, label: 'Перевод' },
  { value: 'deferred' as const, label: 'Отсрочка' }
] as const;

export type FuelType = typeof FUEL_TYPES[number]['value'];
export type OperationType = FuelTransaction['type'];
export type PaymentMethod = typeof PAYMENT_METHODS[number]['value']; 