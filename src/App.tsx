import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space } from 'antd';
import type { MenuProps } from 'antd';
import { 
  DashboardOutlined, PartitionOutlined, TeamOutlined, 
  ShoppingCartOutlined, ScheduleOutlined,
  LogoutOutlined, UserOutlined, SettingOutlined,
  MenuUnfoldOutlined, MenuFoldOutlined, DownOutlined
} from '@ant-design/icons';
import { initializeUsers, getCurrentUser, logoutUser } from './utils/users';
import Dashboard from './components/Dashboard/Dashboard';
import FuelTrading from './components/FuelTrading/FuelTrading';
import UserManagement from './components/UserManagement/UserManagement';
import ShiftManagement from './components/ShiftManagement/ShiftManagement';
import Orders from './components/Orders/Orders';
import Login from './components/Login/Login';
import Preloader from './components/Preloader/Preloader';
import './App.css';

const { Header, Content, Sider } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeUsers();
      const user = getCurrentUser();
      if (user) {
        setIsLoggedIn(true);
        setCurrentUser(user);
      }
      setTimeout(() => {
        setLoading(false);
      }, 800);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (isLoggedIn) {
      setCurrentUser(getCurrentUser());
    } else {
      setCurrentUser(null);
    }
  }, [isLoggedIn]);
  
  const handleLogin = () => {
    setIsLoggedIn(true);
  };
  
  const handleLogout = () => {
    logoutUser();
    setIsLoggedIn(false);
  };
  
  const handleMenuClick = (e: { key: string }) => {
    setCurrentView(e.key);
  };
  
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'fuelTrading':
        return <FuelTrading />;
      case 'userManagement':
        return <UserManagement />;
      case 'shiftManagement':
        return <ShiftManagement />;
      case 'orders':
        return <Orders />;
      default:
        return <Dashboard />;
    }
  };
  
  if (loading) {
    return <Preloader />;
  }
  
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Профиль'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Настройки'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      onClick: handleLogout
    }
  ];

  const sideMenuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Панель управления'
    },
    {
      key: 'fuelTrading',
      icon: <PartitionOutlined />,
      label: 'Учет топлива'
    },
    {
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: 'Заказы'
    },
    {
      key: 'shiftManagement',
      icon: <ScheduleOutlined />,
      label: 'Расчёт зп'
    },
    currentUser?.role === 'admin' ? {
      key: 'userManagement',
      icon: <TeamOutlined />,
      label: 'Пользователи'
    } : null
  ].filter(Boolean);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth="0"
        className="main-sidebar"
        trigger={null}
        style={{ height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0 }}
      >
        <div className="logo" style={{ color: 'white' }}>
          {!collapsed && <span>FUEL Manager</span>}
        </div>
        <Menu 
          theme="dark" 
          mode="inline" 
          defaultSelectedKeys={['dashboard']}
          selectedKeys={[currentView]}
          onClick={handleMenuClick}
          items={sideMenuItems}
        />
        <div className="sidebar-footer" style={{ 
          width: collapsed ? 80 : 200,
          padding: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white'
        }}>
          <Dropdown menu={{ items: userMenuItems }} placement="topRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined style={{ color: 'white' }} />} />
              {!collapsed && (
                <>
                  <span style={{ color: 'white' }}>{currentUser?.name || 'Пользователь'}</span>
                  <DownOutlined style={{ color: 'white' }} />
                </>
              )}
            </Space>
          </Dropdown>
        </div>
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 0 : 200, transition: 'margin-left 0.2s' }}>
        <Header style={{ 
          padding: '0 16px', 
          background: '#fff', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Button
            type="text"
            icon={collapsed ? 
              <MenuUnfoldOutlined style={{ color: 'rgba(0, 0, 0, 0.15)' }} /> : 
              <MenuFoldOutlined style={{ color: 'rgba(0, 0, 0, 0.15)' }} />
            }
            onClick={() => setCollapsed(!collapsed)}
            style={{ 
              fontSize: '16px', 
              width: 32, 
              height: 32,
              margin: '16px 0',
              opacity: 0.5,
              transition: 'opacity 0.3s'
            }}
            className="collapse-trigger"
          />
          <div style={{ flex: 1 }} />
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App; 