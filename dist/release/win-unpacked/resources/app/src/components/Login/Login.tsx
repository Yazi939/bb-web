import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { loginUser } from '../../utils/users';
import './Login.css';

const { Title } = Typography;

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const iconProps = {
  onPointerEnterCapture: () => {},
  onPointerLeaveCapture: () => {}
};

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const user = await loginUser(values.username, values.password);
      if (user) {
        onLoginSuccess(user);
      } else {
        form.setFields([
          {
            name: 'password',
            errors: ['Неверный логин или пароль'],
          },
        ]);
      }
    } catch (error) {
      console.error('Login error:', error);
      form.setFields([
        {
          name: 'password',
          errors: ['Произошла ошибка при входе'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
          Вход в систему
        </Title>
        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Введите логин' }]}
          >
            <Input
              prefix={<UserOutlined {...iconProps} />}
              placeholder="Логин"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password
              prefix={<LockOutlined {...iconProps} />}
              placeholder="Пароль"
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Войти
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login; 