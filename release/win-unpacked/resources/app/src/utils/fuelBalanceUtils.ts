import type { FuelTransaction } from '../types/fuel';

export interface FuelBalances {
  baseBalance: number;
  bunkerBalance: number;
}

export interface FuelStats {
  baseBalance: number;
  bunkerBalance: number;
  avgPurchasePrice: number;
  profit: number;
  frozenCost: number;
}

/**
 * Рассчитывает остатки топлива на базе и бункеровщике по всем транзакциям
 */
export function calculateFuelBalances(transactions: FuelTransaction[]): FuelBalances {
  let totalPurchased = 0;
  let totalSold = 0;
  let totalBaseToBunker = 0;
  let totalBunkerToBase = 0;
  let totalDrained = 0;

  for (const t of transactions) {
    if (t.frozen) continue; // не учитывать замороженные
    const volume = t.volume || 0;
    switch (t.type) {
      case 'purchase':
        totalPurchased += volume;
        break;
      case 'sale':
      case 'bunker_sale':
        totalSold += volume;
        break;
      case 'base_to_bunker':
        totalBaseToBunker += volume;
        break;
      case 'bunker_to_base':
        totalBunkerToBase += volume;
        break;
      case 'drain':
        totalDrained += volume;
        break;
      default:
        break;
    }
  }

  const baseBalance = totalPurchased - totalDrained - totalBaseToBunker + totalBunkerToBase;
  const bunkerBalance = totalBaseToBunker - totalBunkerToBase - totalSold - totalDrained;

  return { baseBalance, bunkerBalance };
}

/**
 * Полная статистика по топливу: прибыль, замороженные средства, средняя закупочная цена
 */
export function calculateFuelStats(transactions: FuelTransaction[]): FuelStats {
  let totalPurchased = 0;
  let totalSold = 0;
  let totalBaseToBunker = 0;
  let totalBunkerToBase = 0;
  let totalDrained = 0;
  let totalPurchaseCost = 0;
  let totalSaleIncome = 0;

  for (const t of transactions) {
    if (t.frozen) continue;
    const volume = t.volume || 0;
    const totalCost = t.totalCost || 0;
    switch (t.type) {
      case 'purchase':
        totalPurchased += volume;
        totalPurchaseCost += totalCost;
        break;
      case 'sale':
      case 'bunker_sale':
        totalSold += volume;
        totalSaleIncome += totalCost;
        break;
      case 'base_to_bunker':
        totalBaseToBunker += volume;
        break;
      case 'bunker_to_base':
        totalBunkerToBase += volume;
        break;
      case 'drain':
        totalDrained += volume;
        break;
      default:
        break;
    }
  }

  const baseBalance = totalPurchased - totalDrained - totalBaseToBunker + totalBunkerToBase;
  const bunkerBalance = totalBaseToBunker - totalBunkerToBase - totalSold - totalDrained;
  const avgPurchasePrice = totalPurchased > 0 ? totalPurchaseCost / totalPurchased : 0;
  const soldCost = totalSold * avgPurchasePrice;
  const profit = totalSaleIncome - soldCost;
  const frozenVolume = totalPurchased - totalSold;
  const frozenCost = frozenVolume > 0 ? frozenVolume * avgPurchasePrice : 0;

  return { baseBalance, bunkerBalance, avgPurchasePrice, profit, frozenCost };
} 