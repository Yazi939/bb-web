import React, { useState, useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './components/Dashboard/Dashboard';
import Calculator from './components/Calculator/Calculator';
import FuelTrading from './components/FuelTrading/FuelTrading';
import SalaryCalculator from './components/SalaryCalculator/SalaryCalculator';
import ExpenseCalendar from './components/ExpenseCalendar/ExpenseCalendar';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Применяем data-theme атрибут к body для работы CSS переменных
  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Настройки темы
  const themeConfig = {
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
    },
    components: {
      Menu: {
        // Сайдбар всегда темный
        colorItemBg: '#001529',
        colorItemText: 'rgba(255, 255, 255, 0.85)',
        colorItemTextHover: '#ffffff',
        colorItemTextSelected: '#ffffff',
        colorItemBgSelected: '#1890ff',
      },
      Layout: {
        colorBgHeader: isDarkMode ? '#001529' : '#fff',
        colorBgBody: isDarkMode ? '#121212' : '#f0f2f5',
        colorBgTrigger: '#001529',
        // Сайдбар всегда темный
        colorBgLayout: isDarkMode ? '#121212' : '#f0f2f5',
      },
      Sider: {
        colorBgLayout: '#001529',
      }
    },
  };

  return (
    <ConfigProvider
      locale={ruRU}
      theme={themeConfig}
    >
      <Router>
        <MainLayout onThemeChange={setIsDarkMode} isDarkMode={isDarkMode}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/fuel-trading" element={<FuelTrading />} />
            <Route path="/salary-calculator" element={<SalaryCalculator />} />
            <Route path="/expense-calendar" element={<ExpenseCalendar />} />
          </Routes>
        </MainLayout>
      </Router>
    </ConfigProvider>
  );
};

export default App; 