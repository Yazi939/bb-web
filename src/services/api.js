import axios from 'axios';

// Указываем production API URL по умолчанию
const API_URL = process.env.REACT_APP_API_URL || 'https://bunker-boats.ru';

// Создаем инстанс axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Увеличиваем таймаут для запросов
  timeout: 10000,
  // Добавляем withCredentials для CORS
  withCredentials: true
});

// Перехватчик для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Перехватчик для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Обработка ошибок авторизации
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Проверяем, не Electron ли это
      const isElectron = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
      if (!isElectron) {
        window.location.href = '/login';
      }
    }
    
    // Обработка ошибок соединения
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.error('API Connection Error:', error.message);
      return Promise.resolve({
        data: { error: true, message: 'Нет соединения с сервером' },
        status: 503
      });
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

export default api; 