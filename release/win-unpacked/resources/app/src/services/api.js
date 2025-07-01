import axios from 'axios';

// Определяем базовый URL API в зависимости от окружения
const getApiBaseUrl = () => {
  // Если мы на HTTPS странице, используем HTTPS API через Nginx proxy
  if (window.location.protocol === 'https:') {
    return 'https://bunker-boats.ru/api';
  }
  // Для HTTP страниц используем прямое подключение
  return 'http://89.169.170.164:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 API Base URL:', API_BASE_URL);

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ответов
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Если токен недействителен, перенаправляем на логин
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

// Транзакции топлива
export const fuelService = {
  getTransactions: () => api.get('/fuel'),
  getTransaction: (id) => api.get(`/fuel/${id}`),
  createTransaction: (data) => api.post('/fuel', data),
  updateTransaction: (id, data) => api.put(`/fuel/${id}`, data),
  deleteTransaction: (id) => api.delete(`/fuel/transaction/${id}`),
  getAllTransactions: () => api.get('/fuel/all'),
};

// Смены
export const shiftService = {
  getShifts: (params) => api.get('/shifts', { params }).then(res => res.data),
  getShift: (id) => api.get(`/shifts/${id}`).then(res => res.data),
  createShift: (data) => api.post('/shifts', data).then(res => res.data),
  updateShift: (id, data) => api.put(`/shifts/${id}`, data).then(res => res.data),
  deleteShift: (id) => api.delete(`/shifts/${id}`).then(res => res.data)
};

// Пользователи
export const userService = {
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  login: (username, password) => api.post('/users/login', { username, password }),
  getCurrentUser: () => api.get('/users/me')
};

// Заказы
export const orderService = {
  getOrders: () => api.get('/orders'),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post('/orders', data),
  updateOrder: (id, data) => api.put(`/orders/${id}`, data),
  deleteOrder: (id) => api.delete(`/orders/${id}`)
};

// Расходы
export const expenseService = {
  getExpenses: () => api.get('/expenses'),
  getExpense: (id) => api.get(`/expenses/${id}`),
  createExpense: (data) => api.post('/expenses', data),
  updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/expenses/${id}`)
};

export default api; 