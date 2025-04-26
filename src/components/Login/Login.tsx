import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { loginUser, initializeUsers } from '../../utils/users';
import styles from './Login.module.css';

const { Title } = Typography;

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Initialize default users
    initializeUsers();
  }, []);
  
  const handleSubmit = (values: { username: string; password: string }) => {
    setLoading(true);
    setError('');
    
    // Simulate network delay
    setTimeout(() => {
      const user = loginUser(values.username, values.password);
      
      if (user) {
        message.success(`Добро пожаловать, ${user.name}!`);
        onLoginSuccess();
      } else {
        setError('Неверное имя пользователя или пароль');
      }
      
      setLoading(false);
    }, 800);
  };
  
  return (
    <div className={styles.loginContainer}>
      <Card className={styles.loginCard}>
        <Title level={2} className={styles.loginTitle}>
          Система управления топливом
        </Title>
        
        {error && (
          <Alert
            message="Ошибка входа"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Введите имя пользователя' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Имя пользователя" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Пароль"
              size="large"
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              block
            >
              Войти
            </Button>
          </Form.Item>
          
          <div className={styles.loginHelp}>
            <p>Для входа используйте:</p>
            <p><strong>Администратор:</strong> admin / admin123</p>
            <p><strong>Модератор:</strong> moderator / mod123</p>
            <p><strong>Работник:</strong> worker / worker123</p>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login; 