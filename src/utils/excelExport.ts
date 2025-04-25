import * as XLSX from 'xlsx';

// Типы топлива
const FUEL_TYPES = [
  { value: 'diesel', label: 'Дизельное топливо' },
  { value: 'gasoline_92', label: 'Бензин АИ-92' },
  { value: 'gasoline_95', label: 'Бензин АИ-95' },
  { value: 'gasoline_98', label: 'Бензин АИ-98' },
  { value: 'gas', label: 'Газ' }
];

// Интерфейс для транзакций
interface FuelTransaction {
  key: string;
  type: 'purchase' | 'sale';
  volume: number;
  price: number;
  totalCost: number;
  date: string;
  timestamp: number;
  fuelType: string;
  supplier?: string;
  customer?: string;
  notes?: string;
}

// Интерфейс для данных по типам топлива
interface FuelTypeData {
  fuelType: string;
  fuelName: string;
  purchased: number;
  sold: number;
  balance: number;
  purchaseCost: number;
  saleIncome: number;
  profit: number;
}

// Интерфейс для результата экспорта
interface ExportResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

/**
 * Экспортирует данные учета топлива в Excel файл с рабочими формулами
 */
export const exportFuelDataToExcel = (
  transactions: FuelTransaction[],
  fuelTypeData: FuelTypeData[],
  totalPurchased: number,
  totalSold: number,
  totalPurchaseCost: number,
  totalSaleIncome: number,
  averagePurchasePrice: number,
  averageSalePrice: number,
  coefficient: number,
  profitMargin: number
): ExportResult => {
  try {
    // Создаем рабочую книгу Excel
    const workbook = XLSX.utils.book_new();
    
    // Преобразуем данные транзакций для первого листа
    const transactionData = transactions.map((item, index) => ({
      '№': index + 1,
      'Тип операции': item.type === 'purchase' ? 'Покупка' : 'Продажа',
      'Тип топлива': FUEL_TYPES.find(t => t.value === item.fuelType)?.label || item.fuelType,
      'Объем (л)': item.volume,
      'Цена (₽/л)': item.price,
      'Стоимость (₽)': item.totalCost,
      'Дата': item.date,
      'Поставщик/Клиент': item.type === 'purchase' ? item.supplier : item.customer,
      'Примечания': item.notes || ''
    }));
    
    // Создаем первый лист с транзакциями
    const transactionsSheet = XLSX.utils.json_to_sheet(transactionData);
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Транзакции');
    
    // Данные для сводного листа
    const summaryData = [
      ['Отчет по движению топлива', '', '', ''],
      ['Дата формирования:', new Date().toLocaleString(), '', ''],
      ['', '', '', ''],
      ['Сводная информация', '', '', ''],
      ['Показатель', 'Значение', '', ''],
      ['Куплено топлива (л)', totalPurchased, '', ''],
      ['Продано топлива (л)', totalSold, '', ''],
      ['Остаток (л)', totalPurchased - totalSold, '', ''],
      ['Затраты на покупку (₽)', totalPurchaseCost, '', ''],
      ['Доход от продажи (₽)', totalSaleIncome, '', ''],
      ['Прибыль (₽)', totalSaleIncome - totalPurchaseCost, '', ''],
      ['Средняя цена покупки (₽/л)', averagePurchasePrice, '', ''],
      ['Средняя цена продажи (₽/л)', averageSalePrice, '', ''],
      ['Коэффициент', coefficient, '', ''],
      ['Маржа (%)', profitMargin.toString(), '', ''],
      ['', '', '', ''],
      ['Информация по типам топлива', '', '', '']
    ];
    
    // Добавляем данные по каждому типу топлива
    fuelTypeData.forEach(data => {
      summaryData.push([data.fuelName, '', '', '']);
      summaryData.push(['Куплено (л)', data.purchased, '', '']);
      summaryData.push(['Продано (л)', data.sold, '', '']);
      summaryData.push(['Остаток (л)', data.balance, '', '']);
      summaryData.push(['Прибыль (₽)', data.profit, '', '']);
      summaryData.push(['', '', '', '']);
    });
    
    // Создаем лист сводной информации
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Сводная информация');
    
    // Создаем третий лист с формулами и аналитикой
    const analyticData = [
      ['Аналитика и расчеты', '', '', '', ''],
      ['', '', '', '', ''],
      ['Динамика по месяцам', '', '', '', ''],
      ['Месяц', 'Куплено (л)', 'Продано (л)', 'Прибыль (₽)', 'Маржа (%)']
    ];
    
    // Группируем транзакции по месяцам
    const monthlyData = new Map();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.timestamp);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthName,
          purchased: 0,
          purchaseCost: 0,
          sold: 0,
          saleIncome: 0
        });
      }
      
      const monthData = monthlyData.get(monthKey);
      
      if (transaction.type === 'purchase') {
        monthData.purchased += transaction.volume;
        monthData.purchaseCost += transaction.totalCost;
      } else {
        monthData.sold += transaction.volume;
        monthData.saleIncome += transaction.totalCost;
      }
    });
    
    // Преобразуем данные по месяцам в строки для Excel
    Array.from(monthlyData.entries())
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .forEach(([_, data]) => {
        const profit = data.saleIncome - data.purchaseCost;
        const margin = data.purchaseCost > 0 ? ((profit / data.purchaseCost) * 100).toFixed(2) : 0;
        
        analyticData.push([
          data.month,
          data.purchased,
          data.sold,
          profit,
          margin
        ]);
      });
    
    // Добавляем формулы для расчетов
    analyticData.push(['', '', '', '', '']);
    const rowCountBeforeTotal = analyticData.length;
    analyticData.push(['Итого:', '=SUM(B4:B' + rowCountBeforeTotal + ')', '=SUM(C4:C' + rowCountBeforeTotal + ')', '=SUM(D4:D' + rowCountBeforeTotal + ')', '']);
    
    // Формулы для эффективности продаж
    analyticData.push(['', '', '', '', '']);
    analyticData.push(['Эффективность продаж', '', '', '', '']);
    analyticData.push(['Показатель', 'Значение', 'Формула', '', '']);
    analyticData.push(['Средняя маржа (%)', '=AVERAGE(E4:E' + rowCountBeforeTotal + ')', '=AVERAGE(E4:E' + rowCountBeforeTotal + ')', '', '']);
    analyticData.push(['Коэффициент оборота', '=IF(B' + (rowCountBeforeTotal+1) + '>0, C' + (rowCountBeforeTotal+1) + '/B' + (rowCountBeforeTotal+1) + ', 0)', 'Продано/Куплено', '', '']);
    analyticData.push(['Рентабельность (%)', '=IF(B' + (rowCountBeforeTotal+1) + '>0, D' + (rowCountBeforeTotal+1) + '/B' + (rowCountBeforeTotal+1) + '*100, 0)', 'Прибыль/Куплено*100', '', '']);
    
    // Добавляем диаграммы (только данные для них)
    analyticData.push(['', '', '', '', '']);
    analyticData.push(['Данные для диаграмм', '', '', '', '']);
    analyticData.push(['', '', '', '', '']);

    // Данные для круговой диаграммы остатков по типам топлива
    analyticData.push(['Остатки по типам топлива', '', '', '', '']);
    analyticData.push(['Тип топлива', 'Остаток (л)', '', '', '']);
    fuelTypeData.forEach(data => {
      if (data.balance > 0) {
        analyticData.push([data.fuelName, data.balance, '', '', '']);
      }
    });
    
    // Создаем лист аналитики
    const analyticSheet = XLSX.utils.aoa_to_sheet(analyticData);
    XLSX.utils.book_append_sheet(workbook, analyticSheet, 'Аналитика');
    
    // Устанавливаем ширину столбцов
    const setCellWidths = (sheet: XLSX.WorkSheet) => {
      const columnWidths = [
        { wch: 25 },  // A
        { wch: 15 },  // B
        { wch: 15 },  // C
        { wch: 15 },  // D
        { wch: 15 },  // E
      ];
      sheet['!cols'] = columnWidths;
    };
    
    setCellWidths(transactionsSheet);
    setCellWidths(summarySheet);
    setCellWidths(analyticSheet);
    
    // Сохраняем файл
    XLSX.writeFile(workbook, 'fuel_report.xlsx');
    
    return {
      success: true,
      fileName: 'fuel_report.xlsx'
    };
  } catch (error) {
    console.error('Ошибка при экспорте в Excel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}; 