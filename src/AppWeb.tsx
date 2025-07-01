import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space, notification } from 'antd';
import type { MenuProps } from 'antd';
import { 
  DashboardOutlined, PartitionOutlined, TeamOutlined, 
  ShoppingCartOutlined, ScheduleOutlined, CalendarOutlined,
  LogoutOutlined, UserOutlined, SettingOutlined,
  MenuUnfoldOutlined, MenuFoldOutlined, DownOutlined,
  DollarOutlined
} from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import Dashboard from './components/Dashboard/Dashboard';
import FuelTrading from './components/FuelTrading/FuelTrading';
import UserManagement from './components/UserManagement/UserManagement';
import ShiftManagement from './components/ShiftManagement/ShiftManagement';
import Orders from './components/Orders/Orders';
import Login from './components/Login/Login';
import Preloader from './components/Preloader/Preloader';
import ExpensesCalendar from './components/ExpensesCalendar/ExpensesCalendar';
import ExpenseManagement from './components/ExpenseManagement/ExpenseManagementWeb';
import './App.css';

// Компонент-заглушка для UpdateNotification в веб-версии
const WebUpdateNotification: React.FC = () => null;

const { Header, Content, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

interface User {
  id: number;
  username: string;
  role: string;
  name?: string;
}

const iconProps: AntdIconProps = {
  className: "white-icon"
};

const adminMenuItems: MenuItem[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined className="white-icon" />,
    label: 'Дашборд',
  },
  {
    key: 'fuel',
    icon: <PartitionOutlined className="white-icon" />,
    label: 'Топливо',
  },
  {
    key: 'orders',
    icon: <ShoppingCartOutlined className="white-icon" />,
    label: 'Заказы',
  },
  {
    key: 'expenses',
    icon: <CalendarOutlined className="white-icon" />,
    label: 'Календарь расходов',
  },
  {
    key: 'expense-management',
    icon: <DollarOutlined className="white-icon" />,
    label: 'Управление расходами',
  },
  {
    key: 'users',
    icon: <TeamOutlined className="white-icon" />,
    label: 'Пользователи',
  },
  {
    key: 'shifts',
    icon: <ScheduleOutlined className="white-icon" />,
    label: 'Смены',
  },
];

const userMenuItems: MenuItem[] = [
  {
    key: 'fuel',
    icon: <PartitionOutlined className="white-icon" />,
    label: 'Топливо',
  },
  {
    key: 'orders',
    icon: <ShoppingCartOutlined className="white-icon" />,
    label: 'Заказы',
  },
];

const AppWeb: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<string>('fuel');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 767;
      setIsMobile(mobile);
      if (!mobile) {
        setCollapsed(false);
        setShowOverlay(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (loading) {
      setShowLoader(true);
    } else {
      // showLoader теперь скрывается только после onFinish
    }
  }, [loading]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Простая проверка - если токен есть, считаем что пользователь авторизован
          // В реальном приложении здесь бы была проверка токена на сервере
          const userData = { id: 1, username: 'webuser', role: 'user', name: 'Web User' };
          console.log('Web auth verified:', userData);
          setCurrentUser(userData);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    console.log('currentUser (render):', currentUser);
  }, [currentUser]);

  const toggleMenu = () => {
    if (isMobile) {
      setCollapsed(!collapsed);
      setShowOverlay(!collapsed);
    } else {
      setCollapsed(!collapsed);
      setShowOverlay(false);
    }
  };

  const closeMenu = () => {
    if (isMobile) {
      setCollapsed(true);
      setShowOverlay(false);
    }
  };

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    setCurrentView(e.key);
    closeMenu();
  };

  const handleUserMenuClick: MenuProps['onClick'] = async (e) => {
    if (e.key === 'logout') {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setCurrentUser(null);
      setCurrentView('fuel');
      notification.success({
        message: 'Выход выполнен',
        description: 'Вы успешно вышли из системы'
      });
    }
  };

  const renderContent = () => {
    if (showLoader) {
      return <Preloader loading={loading} onFinish={() => setShowLoader(false)} />;
    }

    if (!isLoggedIn) {
      return <Login onLoginSuccess={async (user: User) => {
        console.log('LOGIN RESPONSE:', user);
        setIsLoggedIn(true);
        setCurrentUser(user);
        setCurrentView('fuel');
      }} />;
    }

    switch (currentView) {
      case 'dashboard':
        return currentUser?.role === 'admin' ? <Dashboard /> : null;
      case 'fuel':
        return <FuelTrading />;
      case 'expenses':
        return currentUser?.role === 'admin' ? <ExpensesCalendar /> : null;
      case 'expense-management':
        return currentUser?.role === 'admin' ? <ExpenseManagement /> : null;
      case 'users':
        return currentUser?.role === 'admin' ? <UserManagement /> : null;
      case 'shifts':
        return currentUser?.role === 'admin' ? <ShiftManagement /> : null;
      case 'orders':
        return <Orders />;
      default:
        return <FuelTrading />;
    }
  };

  const dropdownMenuItems: MenuProps['items'] = [
    {
      key: 'settings',
      icon: <SettingOutlined className="white-icon" />,
      label: 'Настройки',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined className="white-icon" />,
      label: 'Выход',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {showOverlay && (
        <div 
          className="mobile-menu-overlay visible" 
          onClick={closeMenu}
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: isMobile ? 'block' : 'none'
          }}
        />
      )}
      <Sider
        collapsed={isMobile ? collapsed : collapsed}
        breakpoint="lg"
        collapsedWidth="0"
        className={`main-sidebar ${collapsed ? 'ant-layout-sider-collapsed' : ''}`}
        trigger={null}
        style={{ 
          height: '100vh', 
          position: 'fixed', 
          left: 0, 
          top: 0, 
          bottom: 0,
          zIndex: isMobile ? 1000 : 100,
          transform: isMobile ? (collapsed ? 'translateX(-100%)' : 'translateX(0)') : 'none',
          transition: 'transform 0.3s ease'
        }}
      >
        <div className="logo">
          {!collapsed && <span>Bunker Boats</span>}
        </div>
        <Menu 
          theme="dark" 
          mode="inline" 
          defaultSelectedKeys={['fuel']}
          selectedKeys={[currentView]}
          onClick={handleMenuClick}
          items={currentUser?.role === 'admin' ? adminMenuItems : userMenuItems}
        />
        <div className="sidebar-footer" style={{ width: collapsed ? 80 : 200 }}>
          <Dropdown menu={{ items: dropdownMenuItems, onClick: handleUserMenuClick }} placement="topRight">
            <Space>
              <Avatar icon={<UserOutlined className="white-icon" />} />
              {!collapsed && (
                <>
                  <span style={{ color: 'white' }}>{currentUser?.name || currentUser?.username || 'Пользователь'}</span>
                  <DownOutlined className="white-icon" />
                </>
              )}
            </Space>
          </Dropdown>
        </div>
      </Sider>
      
      <Layout style={{ marginLeft: collapsed ? 0 : isMobile ? 0 : 200 }}>
        <Header className="site-layout-background" style={{ padding: 0, background: '#001529' }}>
          <Button
            type="text"
            icon={collapsed ? 
              <MenuUnfoldOutlined className="white-icon" /> : 
              <MenuFoldOutlined className="white-icon" />
            }
            onClick={toggleMenu}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
          {renderContent()}
        </Content>
              </Layout>
        <WebUpdateNotification />
      </Layout>
    );
  };

export default AppWeb; 