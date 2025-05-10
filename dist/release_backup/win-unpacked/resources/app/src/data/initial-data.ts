export const initialUsers = [
  {
    id: '1',
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
    password: 'admin123'
  }
];

export const initialTransactions = [
  {
    key: '1',
    type: 'purchase',
    volume: 1000,
    price: 50,
    totalCost: 50000,
    date: '2024-04-08',
    timestamp: 1712534400000,
    fuelType: 'diesel',
    supplier: 'ООО Топливо',
    paymentMethod: 'transfer'
  },
  {
    key: '2',
    type: 'sale',
    volume: 500,
    price: 60,
    totalCost: 30000,
    date: '2024-04-08',
    timestamp: 1712534400000,
    fuelType: 'diesel',
    customer: 'ИП Иванов',
    vessel: 'ТС-002',
    paymentMethod: 'cash'
  }
]; 