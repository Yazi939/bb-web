const axios = require('axios');

// Указываем production API URL по умолчанию
const API_URL = process.env.REACT_APP_API_URL || 'http://89.169.170.164:5000/api';

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

// Перехватчик ответов для глобальной обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Обработка ошибок соединения
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.error('API Connection Error:', error.message);
      // Возвращаем "мягкую" ошибку вместо жесткого прерывания
      return Promise.resolve({
        data: { error: true, message: 'Нет соединения с сервером' },
        status: 503
      });
    }
    
    // Обработка ошибок авторизации
    if (error.response.status === 401 || error.response.status === 403) {
      localStorage.removeItem('token');
      // Проверяем, не Electron ли это
      const isElectron = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
      if (!isElectron) {
        window.location.href = '/login';
      }
      // В Electron просто возвращаем ошибку
    }
    
    return Promise.reject(error);
  }
);

// Транзакции топлива
const fuelService = {
  getTransactions: () => api.get('/fuel'),
  getTransaction: (id) => api.get(`/fuel/${id}`),
  createTransaction: (data) => api.post('/fuel', data),
  updateTransaction: (id, data) => api.put(`/fuel/${id}`, data),
  deleteTransaction: (id) => api.delete(`/fuel/${id}`)
};

// Смены
const shiftService = {
  getShifts: (params) => api.get('/shifts', { params }),
  getShift: (id) => api.get(`/shifts/${id}`),
  createShift: (data) => api.post('/shifts', data),
  updateShift: (id, data) => api.put(`/shifts/${id}`, data),
  deleteShift: (id) => api.delete(`/shifts/${id}`)
};

// Пользователи
const userService = {
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  login: (email, password) => api.post('/users/login', { email, password })
};

module.exports = { fuelService, shiftService, userService, default: api }; 