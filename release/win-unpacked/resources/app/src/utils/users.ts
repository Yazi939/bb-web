import { mockUsers } from './mockData';
import { userService } from '../services/api';

// Типы пользователей
export type UserRole = 'admin' | 'moderator' | 'worker';

// Интерфейс пользователя
export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  password?: string;
}

// Права доступа по ролям
export const rolePermissions = {
  admin: {
    canEdit: true,
    canDelete: true,
    canFreeze: true,
    canAddUsers: true,
    canViewReports: true,
    canExport: true,
    canManageOrders: true,
    canManageShifts: true,
  },
  moderator: {
    canEdit: true,
    canDelete: false,
    canFreeze: true,
    canAddUsers: false,
    canViewReports: true, 
    canExport: true,
    canManageOrders: true,
    canManageShifts: true,
  },
  worker: {
    canEdit: false,
    canDelete: false,
    canFreeze: false,
    canAddUsers: false,
    canViewReports: false,
    canExport: false,
    canManageOrders: false,
    canManageShifts: false,
  }
};

// Авторизация пользователя
export const loginUser = async (username: string, password: string): Promise<User | null> => {
  try {
    // Всегда используем только серверную авторизацию
    const response = await userService.login(username, password);
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      
      const user = response.data.user || {
        id: response.data.id,
        username: response.data.username,
        role: response.data.role,
        name: response.data.name
      };
      
      // Сохраняем данные пользователя в localStorage
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      return user;
    }
    return null;
  } catch (error) {
    console.error('Error logging in:', error);
    return null;
  }
};

// Получение текущего пользователя
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = localStorage.getItem('token');
    const currentUser = localStorage.getItem('currentUser');
    
    if (token && currentUser) {
      return JSON.parse(currentUser);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Выход пользователя
export const logoutUser = async (): Promise<void> => {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
};

// Проверка прав доступа
export const checkPermission = async (permission: keyof typeof rolePermissions.admin): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  return rolePermissions[user.role][permission] || false;
}; 