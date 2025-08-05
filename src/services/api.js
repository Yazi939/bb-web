import axios from 'axios';

// Автоматическое определение API URL в зависимости от платформы
const getApiUrl = () => {
  // Если это веб-версия и загружена по HTTPS
  if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:') {
    return 'https://bunker-boats.ru/api';
  }
  // Если переменная окружения задана
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // По умолчанию для разработки
  return 'http://89.169.170.164:5000/api';
};

const API_URL = getApiUrl();
console.log('🔗 API Base URL:', API_URL);

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
    if (error.response) {
      // Ошибка от сервера
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Ошибка сети
      console.error('Network Error:', error.request);
    } else {
      // Ошибка в настройках запроса
      console.error('Request Error:', error.message);
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