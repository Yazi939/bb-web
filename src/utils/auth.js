import { authService } from '../services/api';

// Сохранение данных пользователя и токена в localStorage
export const setCurrentUser = (userData) => {
  localStorage.setItem('user', JSON.stringify(userData.user));
  localStorage.setItem('token', userData.token);
};

// Получение текущего пользователя из localStorage
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  if (user) {
    return JSON.parse(user);
  }
  return null;
};

// Выход пользователя (удаление данных из localStorage)
export const logoutUser = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

// Проверка прав доступа
export const checkPermission = (permission) => {
  const user = getCurrentUser();
  if (!user) return false;

  // Простая проверка прав на основе роли
  switch (permission) {
    case 'canManageUsers':
      return user.role === 'admin';
    case 'canManageShifts':
      return user.role === 'admin' || user.role === 'moderator';
    case 'canViewReports':
      return user.role === 'admin' || user.role === 'moderator';
    case 'canManageFuel':
      return user.role === 'admin' || user.role === 'moderator';
    default:
      return false;
  }
};

// Вход в систему
export const login = async (email, password) => {
  try {
    const response = await authService.login(email, password);
    setCurrentUser(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Регистрация
export const register = async (userData) => {
  try {
    const response = await authService.register(userData);
    setCurrentUser(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Получение данных текущего пользователя с сервера
export const fetchCurrentUser = async () => {
  try {
    const response = await authService.getMe();
    return response.data;
  } catch (error) {
    logoutUser();
    throw error;
  }
}; 