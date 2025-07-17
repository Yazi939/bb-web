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
import { getCurrentUser, logoutUser, UserRole, User } from './utils/users';
import Dashboard from './components/Dashboard/Dashboard';
import FuelTrading from './components/FuelTrading/FuelTrading';
import UserManagement from './components/UserManagement/UserManagement';
import ShiftManagement from './components/ShiftManagement/ShiftManagement';
import Orders from './components/Orders/Orders';
import Login from './components/Login/Login';
import Preloader from './components/Preloader/Preloader';
import ExpensesCalendar from './components/ExpensesCalendar/ExpensesCalendar';
import ExpenseManagement from './components/ExpenseManagement/ExpenseManagementWeb';

import UpdateNotification from './components/UpdateNotification';
import './App.css';

const { Header, Content, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

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

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [showOverlay, setShowOverlay] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('fuel');
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);

  // Базовая отладка загрузки
  console.log('🚀 App component loaded!');
  console.log('📱 Window width:', window.innerWidth);
  console.log('📱 isMobile detected:', isMobile);
  console.log('📱 User agent:', navigator.userAgent);

  // Инициализация состояния при загрузке
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 767;
      setIsMobile(mobile);
      console.log('📱 Resize detected:', { width: window.innerWidth, isMobile: mobile });
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
    const initApp = async () => {
      try {
        const user = await getCurrentUser();
        console.log('getCurrentUser:', user);
        if (user) {
          setCurrentUser(user);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
        notification.error({
          message: 'Ошибка инициализации',
          description: 'Не удалось загрузить данные пользователей. Пожалуйста, перезагрузите приложение.'
        });
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    console.log('currentUser (render):', currentUser);
  }, [currentUser]);

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    setCurrentView(e.key);
    closeMenu();
  };

  const handleUserMenuClick: MenuProps['onClick'] = async (e) => {
    if (e.key === 'logout') {
      await logoutUser();
      setIsLoggedIn(false);
      setCurrentUser(null);
      setCurrentView('fuel');
    }
  };

  const toggleMenu = () => {
    console.log('🔧 Toggle menu called:', { isMobile, mobileMenuOpen });
    
    if (isMobile) {
      const newMobileMenuOpen = !mobileMenuOpen;
      setMobileMenuOpen(newMobileMenuOpen);
      setShowOverlay(newMobileMenuOpen);
      console.log('🔧 Mobile menu toggle:', { 
        wasClosed: !mobileMenuOpen, 
        willBeOpen: newMobileMenuOpen,
        isMobile: isMobile 
      });
    } else {
      setCollapsed(!collapsed);
      setShowOverlay(false);
    }
  };

  const closeMenu = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
      setShowOverlay(false);
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
      {isMobile && showOverlay && (
        <div className="mobile-menu-overlay visible" onClick={toggleMenu} />
      )}
      <Sider
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth="0"
        className={`main-sidebar ${collapsed ? 'ant-layout-sider-collapsed' : ''}`}
        trigger={null}
        style={{ height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0 }}
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
      <UpdateNotification />
    </Layout>
  );
};

export default App; 