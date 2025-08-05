import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Form, Input, Select, Modal, Space, Typography, message, Tag } from 'antd';
import { UserAddOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { User, UserRole, getCurrentUser, rolePermissions } from '../../utils/users';
import styles from './UserManagement.module.css';
import type { UserRole as UserRoleType } from '../../utils/users';
import { userService } from '../../services/api';

const { Option } = Select;
const { Title } = Typography;

const IconProps = {
  onPointerEnterCapture: () => {},
  onPointerLeaveCapture: () => {}
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: UserRoleType } | null>(null);
  
  useEffect(() => {
    loadUsers();
    getCurrentUser().then(setCurrentUser);
  }, []);
  
  const loadUsers = async () => {
    try {
      const response = await userService.getUsers();
      const usersData = Array.isArray(response.data) ? response.data : response.data.users || [];
      
      console.log('🔍 Диагностика пользователей:', {
        response,
        usersData,
        userIds: usersData.map((u: User) => ({ name: u.name, id: u.id, hasId: !!u.id }))
      });
      
      setUsers(usersData);
    } catch (error) {
      message.error('Ошибка при загрузке пользователей');
      console.error(error);
    }
  };
  
  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };
  
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      username: user.username,
      role: user.role,
      password: user.password,
    });
    setModalVisible(true);
  };
  
  const handleDeleteUser = async (userId: string) => {
    // Prevent deleting your own account
    if (userId === currentUser?.id) {
      message.error('Вы не можете удалить свой аккаунт');
      return;
    }
    
    Modal.confirm({
      title: 'Удаление пользователя',
      content: 'Вы уверены, что хотите удалить данного пользователя?',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      async onOk() {
        try {
          await userService.deleteUser(userId);
          await loadUsers();
          message.success('Пользователь удален');
        } catch (error) {
          message.error('Ошибка при удалении пользователя');
          console.error(error);
        }
      },
    });
  };
  
  const handleSubmit = async (values: any) => {
    const { name, username, password, role } = values;
    
    try {
      if (editingUser) {
        // Update existing user
        const updatedUser = {
          ...editingUser,
          name,
          username,
          password: password || editingUser.password,
          role
        };
        await userService.updateUser(updatedUser.id, updatedUser);
        message.success('Пользователь обновлен');
      } else {
        // Create new user
        await userService.createUser({
          name,
          username,
          password,
          role
        });
        message.success('Пользователь добавлен');
      }
      
      await loadUsers();
      setModalVisible(false);
    } catch (error) {
      message.error('Ошибка при сохранении пользователя');
      console.error(error);
    }
  };
  
  const columns = [
    {
      title: 'Имя',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <div>
          {name}
          <br />
          <small style={{ color: '#999', fontSize: '11px' }}>
            ID: {record.id || 'НЕТ ID'}
          </small>
        </div>
      ),
    },
    {
      title: 'Логин',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRoleType) => {
        let color = '';
        let label = '';
        let description = '';
        
        switch (role) {
          case 'admin':
            color = 'red';
            label = 'Администратор';
            description = 'Полный доступ';
            break;
          case 'moderator':
            color = 'blue';
            label = 'Модератор';
            description = 'Управление без удаления';
            break;
          case 'pier':
            color = 'cyan';
            label = 'Причал';
            description = 'Продажи и приобретения';
            break;
          case 'bunker':
            color = 'orange';
            label = 'Бункеровщик';
            description = 'Продажи и операции с бункером';
            break;
          case 'worker':
            color = 'green';
            label = 'Работник';
            description = 'Просмотр продаж';
            break;
        }
        
        return (
          <div>
            <Tag color={color}>{label}</Tag>
            <br />
            <small style={{ color: '#666', fontSize: '11px' }}>{description}</small>
          </div>
        );
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => handleEditUser(record)}
          />
          {!record.id ? (
            <span style={{ fontSize: '11px', color: '#ff4d4f' }}>
              Нет ID - нельзя удалить
            </span>
          ) : record.id === currentUser?.id ? (
            <span style={{ fontSize: '11px', color: '#999' }}>
              Ваш аккаунт
            </span>
          ) : (
            <Button 
              icon={<DeleteOutlined />} 
              size="small" 
              danger 
              onClick={() => {
                console.log('🔍 Диагностика удаления:', {
                  recordId: record.id,
                  recordUsername: record.username,
                  currentUserId: currentUser?.id,
                  currentUserName: currentUser?.name,
                  hasId: !!record.id,
                  isSameUser: record.id === currentUser?.id
                });
                handleDeleteUser(record.id);
              }}
            />
          )}
        </Space>
      ),
    },
  ];
  
  return (
    <div className={styles.userManagement}>
      <Card 
        title="Области видимости ролей" 
        style={{ marginBottom: 24 }}
        size="small"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '12px', border: '1px solid #ff4d4f', borderRadius: '6px', backgroundColor: '#fff2f0' }}>
            <Tag color="red" style={{ marginBottom: '8px' }}>Администратор</Tag>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <strong>Видит:</strong> ВСЕ операции<br />
              <strong>Может:</strong> Создавать, редактировать, удалять операции, управлять пользователями
            </div>
          </div>
          
          <div style={{ padding: '12px', border: '1px solid #1890ff', borderRadius: '6px', backgroundColor: '#f6ffff' }}>
            <Tag color="blue" style={{ marginBottom: '8px' }}>Модератор</Tag>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <strong>Видит:</strong> ВСЕ операции<br />
              <strong>Может:</strong> Редактировать операции, просматривать отчеты
            </div>
          </div>
          
          <div style={{ padding: '12px', border: '1px solid #13c2c2', borderRadius: '6px', backgroundColor: '#f6ffff' }}>
            <Tag color="cyan" style={{ marginBottom: '8px' }}>Причал</Tag>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <strong>Видит:</strong> Продажи с причала (bunker_sale) и приобретения (purchase)<br />
              <strong>Может:</strong> Создавать, редактировать свои операции и просматривать статистику
            </div>
          </div>
          
          <div style={{ padding: '12px', border: '1px solid #fa8c16', borderRadius: '6px', backgroundColor: '#fff7e6' }}>
            <Tag color="orange" style={{ marginBottom: '8px' }}>Бункеровщик</Tag>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <strong>Видит:</strong> Продажи с катера (sale) и операции с бункером (base_to_bunker, bunker_to_base)<br />
              <strong>Может:</strong> Создавать, редактировать свои операции и просматривать статистику
            </div>
          </div>
          
          <div style={{ padding: '12px', border: '1px solid #52c41a', borderRadius: '6px', backgroundColor: '#f6ffed' }}>
            <Tag color="green" style={{ marginBottom: '8px' }}>Работник</Tag>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <strong>Видит:</strong> Обе продажи (sale + bunker_sale)<br />
              <strong>Может:</strong> Только просматривать операции
            </div>
          </div>
        </div>
      </Card>
      
      <Card
        title="Управление пользователями"
        extra={
          <Button 
            type="primary" 
            icon={<UserAddOutlined />} 
            onClick={handleAddUser}
          >
            Добавить пользователя
          </Button>
        }
      >
        <Table 
          dataSource={users} 
          columns={columns} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
        />
      </Card>
      
      <Modal
        title={editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Имя"
            rules={[{ required: true, message: 'Введите имя пользователя' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="username"
            label="Логин"
            rules={[{ required: true, message: 'Введите логин' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: !editingUser, message: 'Введите пароль' }]}
          >
            <Input.Password placeholder={editingUser ? '(Не изменять)' : 'Введите пароль'} />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="Роль"
            rules={[{ required: true, message: 'Выберите роль' }]}
          >
            <Select placeholder="Выберите роль пользователя">
              <Option value="admin">
                <div>
                  <strong>Администратор</strong>
                  <br />
                  <small style={{ color: '#666' }}>Полный доступ ко всем операциям и функциям</small>
                </div>
              </Option>
              <Option value="moderator">
                <div>
                  <strong>Модератор</strong>
                  <br />
                  <small style={{ color: '#666' }}>Может редактировать, но не удалять операции</small>
                </div>
              </Option>
              <Option value="pier">
                <div>
                  <strong>Причал</strong>
                  <br />
                  <small style={{ color: '#666' }}>Видит продажи с причала и приобретения (bunker_sale + purchase)</small>
                </div>
              </Option>
              <Option value="bunker">
                <div>
                  <strong>Бункеровщик</strong>
                  <br />
                  <small style={{ color: '#666' }}>Видит продажи с катера и операции с бункером (sale + base_to_bunker + bunker_to_base)</small>
                </div>
              </Option>
              <Option value="worker">
                <div>
                  <strong>Работник</strong>
                  <br />
                  <small style={{ color: '#666' }}>Видит обе продажи, но без административных функций</small>
                </div>
              </Option>
            </Select>
          </Form.Item>
          
          <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}>
            {({ getFieldValue }) => {
              const selectedRole = getFieldValue('role');
              if (!selectedRole) return null;
              
              let roleInfo = null;
              switch (selectedRole) {
                case 'admin':
                  roleInfo = {
                    title: 'Администратор',
                    color: '#ff4d4f',
                    bgColor: '#fff2f0',
                    permissions: 'ВСЕ операции',
                    actions: 'Полный доступ ко всем функциям системы'
                  };
                  break;
                case 'moderator':
                  roleInfo = {
                    title: 'Модератор',
                    color: '#1890ff',
                    bgColor: '#f6ffff',
                    permissions: 'ВСЕ операции',
                    actions: 'Может редактировать операции, просматривать отчеты'
                  };
                  break;
                case 'pier':
                  roleInfo = {
                    title: 'Причал',
                    color: '#13c2c2',
                    bgColor: '#f6ffff',
                    permissions: 'Продажи с причала и приобретения (bunker_sale + purchase)',
                    actions: 'Создание, редактирование своих операций и просмотр статистики'
                  };
                  break;
                case 'bunker':
                  roleInfo = {
                    title: 'Бункеровщик',
                    color: '#fa8c16',
                    bgColor: '#fff7e6',
                    permissions: 'Продажи с катера и операции с бункером (sale + base_to_bunker + bunker_to_base)',
                    actions: 'Создание, редактирование своих операций и просмотр статистики'
                  };
                  break;
                case 'worker':
                  roleInfo = {
                    title: 'Работник',
                    color: '#52c41a',
                    bgColor: '#f6ffed',
                    permissions: 'Обе продажи (sale + bunker_sale)',
                    actions: 'Только просмотр операций'
                  };
                  break;
                default:
                  return null;
              }
              
              return (
                <div style={{ 
                  padding: '12px', 
                  border: `1px solid ${roleInfo.color}`, 
                  borderRadius: '6px', 
                  backgroundColor: roleInfo.bgColor,
                  marginBottom: '16px'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <Tag color={selectedRole === 'admin' ? 'red' : selectedRole === 'moderator' ? 'blue' : selectedRole === 'pier' ? 'cyan' : selectedRole === 'bunker' ? 'orange' : 'green'}>
                      {roleInfo.title}
                    </Tag>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <strong>Область видимости:</strong> {roleInfo.permissions}<br />
                    <strong>Возможности:</strong> {roleInfo.actions}
                  </div>
                </div>
              );
            }}
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Сохранить' : 'Добавить'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement; 