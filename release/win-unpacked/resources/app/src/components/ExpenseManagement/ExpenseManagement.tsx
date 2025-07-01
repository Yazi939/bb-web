import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Table,
  Modal,
  message,
  Space,
  Tag,
  Popconfirm,
  Row,
  Col,
  Typography,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import styles from './ExpenseManagement.module.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Expense {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  supplier?: string;
  invoice?: string;
  notes?: string;
  userId: string;
  createdBy?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const ExpenseManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Константы для селектов
  const expenseTypes = [
    { value: 'expense', label: 'Расход', color: 'red' },
    { value: 'salary', label: 'Зарплата', color: 'blue' },
    { value: 'repair', label: 'Ремонт', color: 'orange' }
  ];

  const expenseCategories = [
    { value: 'office', label: 'Офисные расходы' },
    { value: 'transport', label: 'Транспорт' },
    { value: 'utilities', label: 'Коммунальные услуги' },
    { value: 'equipment', label: 'Оборудование' },
    { value: 'maintenance', label: 'Обслуживание' },
    { value: 'marketing', label: 'Маркетинг' },
    { value: 'legal', label: 'Юридические услуги' },
    { value: 'other', label: 'Прочее' }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Наличные' },
    { value: 'card', label: 'Карта' },
    { value: 'transfer', label: 'Перевод' }
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const API_URL = process.env.REACT_APP_API_URL || 'http://89.169.170.164:5000/api';

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      
      // Проверяем структуру ответа
      let expensesData = [];
      if (Array.isArray(response.data)) {
        expensesData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        expensesData = response.data.data;
      } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        expensesData = response.data.data;
      }
      
      console.log('Setting expenses:', expensesData);
      setExpenses(expensesData);
    } catch (error) {
      message.error('Ошибка загрузки расходов');
      console.error('Error fetching expenses:', error);
      setExpenses([]); // Устанавливаем пустой массив в случае ошибки
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const expenseData = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        timestamp: Date.now(),
        status: 'active',
        userId: 'admin1', // Временно захардкодим, потом получим из контекста пользователя
        createdBy: 'admin'
      };

      const token = localStorage.getItem('token');
      
      if (editingExpense) {
        await axios.put(`${API_URL}/expenses/${editingExpense.id}`, expenseData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success('Расход успешно обновлен');
      } else {
        await axios.post(`${API_URL}/expenses`, expenseData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success('Расход успешно добавлен');
      }

      form.resetFields();
      setIsModalVisible(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      message.error('Ошибка при сохранении расхода');
      console.error('Error saving expense:', error);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    form.setFieldsValue({
      ...expense,
      date: dayjs(expense.date)
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Расход успешно удален');
      fetchExpenses();
    } catch (error) {
      message.error('Ошибка при удалении расхода');
      console.error('Error deleting expense:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingExpense(null);
  };

  const getTypeColor = (type: string) => {
    const typeObj = expenseTypes.find(t => t.value === type);
    return typeObj?.color || 'default';
  };

  const getCategoryLabel = (category: string) => {
    const categoryObj = expenseCategories.find(c => c.value === category);
    return categoryObj?.label || category;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodObj = paymentMethods.find(m => m.value === method);
    return methodObj?.label || method;
  };

  const columns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
      sorter: (a: Expense, b: Expense) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>
          {expenseTypes.find(t => t.value === type)?.label || type}
        </Tag>
      ),
      filters: expenseTypes.map(type => ({ text: type.label, value: type.value })),
      onFilter: (value: any, record: Expense) => record.type === value,
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => getCategoryLabel(category),
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#f5222d' }}>
          {amount.toLocaleString('ru-RU')} ₽
        </Text>
      ),
      sorter: (a: Expense, b: Expense) => a.amount - b.amount,
    },
    {
      title: 'Способ оплаты',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => getPaymentMethodLabel(method),
    },
    {
      title: 'Поставщик',
      dataIndex: 'supplier',
      key: 'supplier',
      ellipsis: true,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Активный' : 'Отменен'}
        </Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
             render: (_: any, record: Expense) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Удалить расход?"
            description="Вы уверены, что хотите удалить этот расход?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalAmount = (expenses || [])
    .filter(expense => expense && expense.status === 'active')
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);

      return (
      <div className={styles.expenseManagement}>
        <Title level={2}>
          <DollarOutlined /> Управление расходами
        </Title>

      <Row gutter={[16, 16]} className={styles.statisticsRow}>
        <Col span={12}>
          <Card>
            <div className={styles.statisticsCard}>
              <CalendarOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }} />
              <div>
                <Text type="secondary">Общая сумма расходов</Text>
              </div>
              <div>
                <Text strong style={{ fontSize: 24, color: '#f5222d' }}>
                  {totalAmount.toLocaleString('ru-RU')} ₽
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <div className={styles.statisticsCard}>
              <CalendarOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
              <div>
                <Text type="secondary">Количество записей</Text>
              </div>
              <div>
                <Text strong style={{ fontSize: 24, color: '#52c41a' }}>
                  {(expenses || []).length}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title="Список расходов"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Добавить расход
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={expenses || []}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} из ${total} записей`,
          }}
        />
      </Card>

      <Modal
        title={editingExpense ? 'Редактировать расход' : 'Добавить новый расход'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width="90%"
        style={{ maxWidth: '800px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            paymentMethod: 'cash',
            type: 'expense',
            category: 'office'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Тип расхода"
                rules={[{ required: true, message: 'Выберите тип расхода' }]}
              >
                <Select placeholder="Выберите тип">
                  {expenseTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Категория"
                rules={[{ required: true, message: 'Выберите категорию' }]}
              >
                <Select placeholder="Выберите категорию">
                  {expenseCategories.map(category => (
                    <Option key={category.value} value={category.value}>
                      {category.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Описание"
            rules={[{ required: true, message: 'Введите описание расхода' }]}
          >
            <TextArea rows={3} placeholder="Введите описание расхода" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Сумма"
                rules={[{ required: true, message: 'Введите сумму' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0"
                  min={0}
                  precision={2}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  addonAfter="₽"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Дата"
                rules={[{ required: true, message: 'Выберите дату' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD.MM.YYYY"
                  placeholder="Выберите дату"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="Способ оплаты"
                rules={[{ required: true, message: 'Выберите способ оплаты' }]}
              >
                <Select placeholder="Выберите способ оплаты">
                  {paymentMethods.map(method => (
                    <Option key={method.value} value={method.value}>
                      {method.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="supplier" label="Поставщик">
                <Input placeholder="Название поставщика" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="invoice" label="Номер счета">
                <Input placeholder="Номер счета/документа" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Заметки">
            <TextArea rows={2} placeholder="Дополнительные заметки" />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>
                Отмена
              </Button>
              <Button type="primary" htmlType="submit">
                {editingExpense ? 'Обновить' : 'Создать'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExpenseManagement; 