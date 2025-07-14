import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { fuelService } from '../services/api';
import { FUEL_TYPES } from '../constants/fuelTypes';

// Подключаем плагины
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface UniversalFuelTransaction {
  id: string;
  type: string;
  fuelType?: string;
  volume?: number;
  price?: number;
  totalCost?: number;
  timestamp?: number;
  frozen?: boolean;
  [key: string]: any;
}

interface FuelMetrics {
  // Основные метрики
  totalSold: number;
  totalPurchased: number;
  totalTransferred: number;
  totalAdjusted: number;
  
  // Финансовые показатели
  totalSaleIncome: number;
  totalPurchaseCost: number;
  totalProfit: number;
  profitMargin: number;
  
  // Остатки
  baseBalance: number;
  bunkerBalance: number;
  totalBalance: number;
  
  // Статистика по типам топлива
  fuelTypeStats: Record<string, {
    sold: number;
    purchased: number;
    transferred: number;
    adjusted: number;
    baseBalance: number;
    bunkerBalance: number;
    currentBalance: number;
  }>;
  
  // Средние цены
  averageSalePrice: number;
  averagePurchasePrice: number;
}

export const useFuelMetrics = (
  allTransactions: UniversalFuelTransaction[],
  dateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null]
) => {
  const [metrics, setMetrics] = useState<FuelMetrics>({
    totalSold: 0,
    totalPurchased: 0,
    totalTransferred: 0,
    totalAdjusted: 0,
    totalSaleIncome: 0,
    totalPurchaseCost: 0,
    totalProfit: 0,
    profitMargin: 0,
    baseBalance: 0,
    bunkerBalance: 0,
    totalBalance: 0,
    fuelTypeStats: {},
    averageSalePrice: 0,
    averagePurchasePrice: 0
  });

  useEffect(() => {
    const now = dayjs();
    const startOfToday = now.startOf('day');
    const endOfToday = now.endOf('day');

    // Остатки — по всей истории
    let allBaseBalance = 0;
    let allBunkerBalance = 0;
    const allFuelTypeStats: Record<string, any> = {};
    allTransactions.forEach((t: any) => {
      if (!allFuelTypeStats[t.fuelType]) {
        allFuelTypeStats[t.fuelType] = {
          sold: 0,
          purchased: 0,
          transferred: 0,
          adjusted: 0,
          baseBalance: 0,
          bunkerBalance: 0,
          currentBalance: 0
        };
      }
    });
    allTransactions.forEach((t: any) => {
      if (t.frozen) return;
      const volume = Number(t.volume) || 0;
      const stats = allFuelTypeStats[t.fuelType];
      switch (t.type) {
        case 'sale':
          stats.sold += volume;
          stats.bunkerBalance -= volume;
          allBunkerBalance -= volume;
          break;
        case 'bunker_sale':
          stats.sold += volume;
          stats.baseBalance -= volume;
          allBaseBalance -= volume;
          break;
        case 'purchase':
          stats.purchased += volume;
          stats.baseBalance += volume;
          allBaseBalance += volume;
          break;
        case 'base_to_bunker':
          stats.transferred += volume;
          stats.baseBalance -= volume;
          stats.bunkerBalance += volume;
          allBaseBalance -= volume;
          allBunkerBalance += volume;
          break;
        case 'bunker_to_base':
          stats.transferred += volume;
          stats.bunkerBalance -= volume;
          stats.baseBalance += volume;
          allBunkerBalance -= volume;
          allBaseBalance += volume;
          break;
      }
      stats.currentBalance = stats.baseBalance + stats.bunkerBalance;
    });
    const allTotalBalance = allBaseBalance + allBunkerBalance;

    // Дневная статистика — только по выбранному дню/периоду
    let filteredTransactions = allTransactions.filter((t: UniversalFuelTransaction) => {
      const isNotFrozen = !t.frozen;
      const transactionDate = dayjs(t.timestamp);
      if (dateRange && dateRange[0] && dateRange[1]) {
        const rangeStart = dateRange[0].startOf('day');
        const rangeEnd = dateRange[1].endOf('day');
        return isNotFrozen && 
               transactionDate.isSameOrAfter(rangeStart) && 
               transactionDate.isSameOrBefore(rangeEnd);
      }
      return isNotFrozen && 
             transactionDate.isSameOrAfter(startOfToday) && 
             transactionDate.isSameOrBefore(endOfToday);
    });
    const allFuelTypes = FUEL_TYPES.map(f => f.value);
    const dayStatsByType: Record<string, any> = {};
    let totalSaleIncome = 0;
    let totalPurchaseCost = 0;
    let totalSold = 0;
    let totalPurchased = 0;
    let totalTransferred = 0;
    filteredTransactions.forEach((t: any) => {
      if (!dayStatsByType[t.fuelType]) {
        dayStatsByType[t.fuelType] = {
          sold: 0,
          purchased: 0,
          transferred: 0,
          adjusted: 0,
          saleIncome: 0,
          purchaseCost: 0
        };
      }
      const volume = Number(t.volume) || 0;
      const totalCost = Number(t.totalCost) || 0;
      switch (t.type) {
        case 'sale':
        case 'bunker_sale': // Добавляем обработку продаж с причала
          dayStatsByType[t.fuelType].sold += volume;
          dayStatsByType[t.fuelType].saleIncome += totalCost;
          totalSaleIncome += totalCost;
          totalSold += volume;
          break;
        case 'purchase':
          dayStatsByType[t.fuelType].purchased += volume;
          dayStatsByType[t.fuelType].purchaseCost += totalCost;
          totalPurchaseCost += totalCost;
          totalPurchased += volume;
          break;
        case 'base_to_bunker':
        case 'bunker_to_base':
          dayStatsByType[t.fuelType].transferred += volume;
          totalTransferred += volume;
          break;
      }
    });
    // Формируем fuelTypeStats для setMetrics
    const fuelTypeStats: Record<string, any> = {};
    allFuelTypes.forEach(fuelType => {
      fuelTypeStats[fuelType] = {
        sold: dayStatsByType[fuelType]?.sold || 0,
        purchased: dayStatsByType[fuelType]?.purchased || 0,
        transferred: dayStatsByType[fuelType]?.transferred || 0,
        adjusted: dayStatsByType[fuelType]?.adjusted || 0,
        baseBalance: allFuelTypeStats[fuelType]?.baseBalance || 0,
        bunkerBalance: allFuelTypeStats[fuelType]?.bunkerBalance || 0,
        currentBalance: allFuelTypeStats[fuelType]?.currentBalance || 0
      };
    });
    const totalProfit = totalSaleIncome - totalPurchaseCost;
    const profitMargin = totalSaleIncome > 0 ? (totalProfit / totalSaleIncome) * 100 : 0;
    const averageSalePrice = totalSold > 0 ? totalSaleIncome / totalSold : 0;
    const averagePurchasePrice = totalPurchased > 0 ? totalPurchaseCost / totalPurchased : 0;
    setMetrics({
      totalSold,
      totalPurchased,
      totalTransferred,
      totalAdjusted: 0, // Пока не используется
      totalSaleIncome,
      totalPurchaseCost,
      totalProfit,
      profitMargin,
      baseBalance: allBaseBalance,
      bunkerBalance: allBunkerBalance,
      totalBalance: allTotalBalance,
      fuelTypeStats,
      averageSalePrice,
      averagePurchasePrice
    });
  }, [allTransactions, dateRange]);

  return metrics;
}; 