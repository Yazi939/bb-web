import React, { useState, useEffect } from 'react';
import { Calendar, Card, Modal, Table, Tag, Typography, Space, Row, Col, Statistic, Select, DatePicker, Button, Divider, Form, InputNumber, message, Input, notification } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DeleteOutlined, PlusOutlined, EditOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { FuelTransaction, OperationType } from '../../types/electron';
import { getCurrentUser } from '../../utils/users';
import './ExpensesCalendar.css';
import { ALL_OPERATION_TYPES, FUEL_TYPES, PAYMENT_METHODS, FuelType, PaymentMethod } from '../../constants/fuelTypes';
import dayjs from 'dayjs';
import { fuelService } from '../../services/api';
import SocketService from '../../services/socketService';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

interface OperationTypeOption {
  value: OperationType;
  label: string;
  color: string;
}

// Добавить новые типы операций
const ALL_OPERATION_TYPES_EXTENDED = [
  ...ALL_OPERATION_TYPES,
  { value: 'expense', label: 'Общие расходы', color: 'red' },
  { value: 'repair', label: 'Ремонт', color: 'orange' },
  { value: 'salary', label: 'Зарплата', color: 'purple' }
];

const OPERATION_TYPE_OPTIONS: { value: OperationType; label: string; color: string }[] = ALL_OPERATION_TYPES_EXTENDED.map((type) => ({
  value: type.value as OperationType,
  label: type.label,
  color: type.color
}));

const ExpensesCalendar: React.FC = () => {
  const [transactions, setTransactions] = useState<FuelTransaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<FuelTransaction[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedOperationTypes, setSelectedOperationTypes] = useState<OperationType[]>([]);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<FuelType[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        setIsAdmin(user?.role === 'admin');
      } catch (e) {
        setCurrentUser(null);
        setIsAdmin(false);
      }
    })();
  }, []);

  useEffect(() => {
    loadTransactions();

    // Подключаемся к WebSocket
    const socketService = SocketService.getInstance();
    
    // Обработка обновлений данных
    socketService.onDataUpdated((data) => {
      if (data.type === 'transactions') {
        switch (data.action) {
          case 'created':
            setTransactions(prev => [...prev, data.data]);
            break;
          case 'updated':
            setTransactions(prev => prev.map(t => t.id === data.data.id ? data.data : t));
            break;
          case 'deleted':
            setTransactions(prev => prev.filter(t => t.id !== data.id));
            break;
        }
      }
    });

    // Обработка событий транзакций
    socketService.onTransactionCreated((transaction) => {
      setTransactions(prev => [...prev, transaction]);
    });

    socketService.onTransactionUpdated((transaction) => {
      setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
    });

    socketService.onTransactionDeleted((transactionId) => {
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
    });

    return () => {
      socketService.removeDataUpdatedListener();
      socketService.removeTransactionListeners();
    };
  }, []);

  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    
    const matchesDate = !dateRange || (
      transactionDate >= dateRange[0].startOf('day').toDate() &&
      transactionDate <= dateRange[1].endOf('day').toDate()
    );
    
    const matchesOperation = selectedOperationTypes.length === 0 || 
      selectedOperationTypes.includes(t.type);
    
    const matchesFuel = selectedFuelTypes.length === 0 || 
      selectedFuelTypes.includes(t.fuelType as FuelType);
    
    return matchesDate && matchesOperation && matchesFuel;
  });

  useEffect(() => {
    console.log('Component mounted, loading transactions...');
    loadTransactions();
  }, []);

  useEffect(() => {
    console.log('Transactions updated:', transactions);
  }, [transactions]);

  useEffect(() => {
    console.log('Filtered transactions updated:', filteredTransactions);
  }, [filteredTransactions]);

  const loadTransactions = async () => {
    try {
      const response = await fuelService.getTransactions();
      const data = Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : response.data?.transactions || []);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      notification.error({
        message: 'Ошибка загрузки',
        description: 'Не удалось загрузить данные транзакций'
      });
    }
  };

  const calculateStatistics = () => {
    const purchaseVolume = filteredTransactions
      .filter(t => t.type === 'purchase' && typeof t.volume === 'number' && !isNaN(t.volume))
      .reduce((sum, t) => sum + t.volume, 0);

    const purchaseCost = filteredTransactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + (t.totalCost || 0), 0);

    const saleVolume = filteredTransactions
      .filter(t => t.type === 'sale' && typeof t.volume === 'number' && !isNaN(t.volume))
      .reduce((sum, t) => sum + t.volume, 0);

    const saleCost = filteredTransactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + (t.totalCost || 0), 0);

    const totalVolume = filteredTransactions
      .filter(t => typeof t.volume === 'number' && !isNaN(t.volume))
      .reduce((sum, t) => sum + t.volume, 0);

    // Включаем в totalCost все операции с totalCost или price (например, expense, salary, repair)
    const totalCost = filteredTransactions
      .reduce((sum, t) => sum + (t.totalCost != null ? t.totalCost : (t.price != null ? t.price : 0)), 0);

    // Новый расчёт прибыли и замороженных средств
    const avgPurchasePrice = purchaseVolume > 0 ? purchaseCost / purchaseVolume : 0;
    const soldCost = saleVolume * avgPurchasePrice;
    const profit = saleCost - soldCost;
    const frozenVolume = purchaseVolume - saleVolume;
    const frozenCost = frozenVolume * avgPurchasePrice;

    return {
      totalVolume,
      totalCost,
      purchaseVolume,
      purchaseCost,
      saleVolume,
      saleCost,
      profit,
      frozenCost
    };
  };

  const getChartData = () => {
    const dailyData = filteredTransactions.reduce((acc, t) => {
      const date = t.date;
      if (!acc[date]) {
        acc[date] = { date, volume: 0, cost: 0 };
      }
      acc[date].volume += t.volume;
      acc[date].cost += t.totalCost;
      return acc;
    }, {} as Record<string, { date: string; volume: number; cost: number }>);

    return Object.values(dailyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const getPieData = () => {
    return ALL_OPERATION_TYPES_EXTENDED.map(type => ({
      name: type.label,
      value: filteredTransactions
        .filter(t => t.type === type.value)
        .reduce((sum, t) => sum + t.volume, 0),
      color: type.color
    })).filter(item => item.value > 0);
  };

  const statistics = calculateStatistics();
  const chartData = getChartData();
  const pieData = getPieData();

  const onPanelChange = (value: Dayjs, mode: string) => {
    console.log(value.format('YYYY-MM-DD'), mode);
  };

  const onSelect = (date: Dayjs) => {
    try {
      const localDate = date.startOf('day');
      const dateStr = localDate.format('YYYY-MM-DD');
      const dayTransactions = transactions.filter(t => t.createdAt && dayjs(t.createdAt).format('YYYY-MM-DD') === dateStr);
      setSelectedDate(localDate);
      setSelectedTransactions(dayTransactions);
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error in onSelect:', error);
      message.error('Произошла ошибка при открытии модального окна');
    }
  };

  const dateCellRender = (date: Dayjs) => {
    try {
      const localDate = date.startOf('day');
      const dateStr = localDate.format('YYYY-MM-DD');
      const dayTransactions = transactions.filter(t => t.createdAt && dayjs(t.createdAt).format('YYYY-MM-DD') === dateStr);
      if (dayTransactions.length === 0) return null;

      const totalVolume = dayTransactions
        .filter(t => t && typeof t.volume === 'number' && !isNaN(t.volume))
        .reduce((sum, t) => {
          const volume = Number(t.volume);
          return sum + (isNaN(volume) ? 0 : volume);
        }, 0);

      const totalCost = dayTransactions
        .filter(t => t && (typeof t.totalCost === 'number' || typeof t.price === 'number'))
        .reduce((sum, t) => {
          const cost = Number(t.totalCost || t.price || 0);
          return sum + (isNaN(cost) ? 0 : cost);
        }, 0);

      return (
        <div className="calendar-cell" onClick={() => onSelect(localDate)}>
          <div className="transactions-count">{dayTransactions.length} операций</div>
          <div className="transactions-volume">{totalVolume.toFixed(2)} л</div>
          <div className="transactions-cost">{totalCost.toFixed(2)} ₽</div>
          <div className="transactions-types">
            {Array.from(new Set(dayTransactions.map(t => t.type))).map((type, index) => {
              const operation = ALL_OPERATION_TYPES_EXTENDED.find(ot => ot.value === type);
              return operation ? (
                <Tag key={index} color={operation.color} style={{ marginRight: 4 }}>
                  {operation.label}
                </Tag>
              ) : null;
            })}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error in dateCellRender:', error);
      return null;
    }
  };

  const handleAddOperation = async (values: any) => {
    try {
      const { type, fuelType, volume, price, notes } = values;
      let newOperation: any = {
        type,
        date: selectedDate?.format('YYYY-MM-DD') || new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        supplier: 'Добавлено вручную',
        paymentMethod: 'transfer',
        notes
      };
      if (["expense", "repair", "salary"].includes(type)) {
        newOperation.price = price;
        newOperation.totalCost = price;
      } else {
        newOperation.fuelType = fuelType;
        newOperation.volume = volume;
        newOperation.price = price;
        newOperation.totalCost = volume * price;
      }
      await fuelService.createTransaction(newOperation);
      await loadTransactions();
      message.success('Операция добавлена успешно');
      setIsAddModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error adding operation:', error);
      message.error('Ошибка при добавлении операции');
    }
  };

  const handleDeleteOperation = async (operationId: string) => {
    try {
      await fuelService.deleteTransaction(operationId);
      await loadTransactions();
      setSelectedTransactions(selectedTransactions.filter(t => t.id !== operationId));
      message.success('Операция удалена успешно');
    } catch (error) {
      console.error('Error deleting operation:', error);
      message.error('Ошибка при удалении операции');
    }
  };

  const columns: ColumnsType<FuelTransaction> = [
    {
      title: 'Тип операции',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          purchase: { color: 'green', text: 'Закупка' },
          sale: { color: 'blue', text: 'Продажа' },
          base_to_bunker: { color: 'orange', text: 'На бункер' },
          bunker_to_base: { color: 'purple', text: 'С бункера' },
          expense: { color: 'red', text: 'Общие расходы' }
        };
        const { color, text } = typeMap[type] || { color: 'default', text: type };
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Тип топлива',
      dataIndex: 'fuelType',
      key: 'fuelType',
      render: (_: string, record) =>
        ['expense', 'repair', 'salary'].includes(record.type)
          ? '-' 
          : (FUEL_TYPES.find(f => f.value === record.fuelType)?.label || record.fuelType)
    },
    {
      title: 'Объем (л)',
      dataIndex: 'volume',
      key: 'volume',
      render: (volume: number | string | undefined | null) => {
        if (volume === undefined || volume === null) return '-';
        const numValue = typeof volume === 'string' ? parseFloat(volume) : volume;
        return numValue.toFixed(2);
      }
    },
    {
      title: 'Цена (₽/л)',
      dataIndex: 'price',
      key: 'price',
      render: (price: number | string | undefined | null) => {
        if (price === undefined || price === null) return '-';
        const numValue = typeof price === 'string' ? parseFloat(price) : price;
        return numValue.toFixed(2);
      }
    },
    {
      title: 'Сумма (₽)',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (totalCost: number | string | undefined | null) => {
        if (totalCost === undefined || totalCost === null) return '-';
        const numValue = typeof totalCost === 'string' ? parseFloat(totalCost) : totalCost;
        return numValue.toFixed(2);
      }
    },
    {
      title: 'Примечания',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes?: string) => notes || '-'
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteOperation(record.id)}
        />
      )
    }
  ];

  return (
    <Card title="Календарь расходов топлива" className="expenses-calendar">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col span={24}>
            <Space>
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0].startOf('day'), dates[1].endOf('day')]);
                  } else {
                    setDateRange(null);
                  }
                }}
                style={{ width: 300 }}
              />
              <Select<FuelTransaction['type'][]>
                mode="multiple"
                placeholder="Типы операций"
                style={{ width: 200 }}
                value={selectedOperationTypes}
                onChange={setSelectedOperationTypes}
                options={OPERATION_TYPE_OPTIONS}
              />
              <Select
                mode="multiple"
                placeholder="Типы топлива"
                style={{ width: 200 }}
                value={selectedFuelTypes}
                onChange={setSelectedFuelTypes}
                options={FUEL_TYPES.map(f => ({ value: f.value, label: f.label }))}
              />
            </Space>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Общий объем"
                value={statistics.totalVolume}
                suffix="л"
                precision={2}
              />
              <div style={{ height: 20 }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Общая стоимость"
                value={statistics.totalCost}
                suffix="₽"
                precision={2}
              />
              <div style={{ height: 20 }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Прибыль"
                value={statistics.profit}
                suffix="₽"
                precision={2}
                valueStyle={{ color: statistics.profit >= 0 ? '#3f8600' : '#cf1322' }}
              />
              <div style={{ color: '#1890ff', fontSize: 13, marginTop: 4 }}>
                Заморожено: {statistics.frozenCost.toFixed(2)} ₽
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Количество операций"
                value={filteredTransactions.length}
              />
              <div style={{ height: 20 }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Card title="Расход топлива по дням">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="volume" name="Объем (л)" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="cost" name="Стоимость (₽)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Распределение по типам операций">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        <Calendar 
          onPanelChange={onPanelChange}
          onSelect={onSelect}
          dateCellRender={dateCellRender}
        />
      </Space>

      <Modal
        title={selectedDate ? `Операции за ${selectedDate.format('DD.MM.YYYY')}` : 'Операции'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setIsAddModalVisible(true);
              form.setFieldsValue({ date: selectedDate });
            }}
          >
            Добавить операцию
          </Button>,
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Закрыть
          </Button>
        ]}
        width={800}
      >
        {selectedTransactions.length > 0 ? (
          <>
            <Table
              columns={columns}
              dataSource={selectedTransactions}
              rowKey="id"
              pagination={false}
              size="small"
            />
            <div style={{ marginTop: 16 }}>
              <Space>
                <Text strong>Итого за день:</Text>
                <Text>Объем: {selectedTransactions.filter(t => typeof t.volume === 'number' && !isNaN(t.volume)).reduce((sum, t) => sum + t.volume, 0).toFixed(2)} л</Text>
                <Text>Стоимость: {selectedTransactions.reduce((sum, t) => sum + (t.totalCost != null ? t.totalCost : (t.price != null ? t.price : 0)), 0).toFixed(2)} ₽</Text>
              </Space>
            </div>
          </>
        ) : (
          <Text>Нет операций за выбранную дату</Text>
        )}
      </Modal>

      <Modal
        title="Добавить операцию"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddOperation}
        >
          <Form.Item
            name="type"
            label="Тип операции"
            rules={[{ required: true, message: 'Выберите тип операции' }]}
          >
            <Select onChange={() => form.resetFields(["fuelType", "volume", "price", "notes"]) }>
              {ALL_OPERATION_TYPES_EXTENDED.map(type => (
                <Select.Option key={type.value} value={type.value}>
                  {type.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item shouldUpdate={(prev, curr) => prev.type !== curr.type} noStyle>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              if (["expense", "salary", "repair"].includes(type)) {
                return (
                  <>
                    <Form.Item
                      name="price"
                      label="Сумма (₽)"
                      rules={[{ required: true, message: 'Введите сумму' }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      name="notes"
                      label="Описание"
                      rules={[{ required: true, message: 'Введите описание' }]}
                    >
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </>
                );
              }
              // Для топлива — старые поля
              return (
                <>
                  <Form.Item
                    name="fuelType"
                    label="Тип топлива"
                    rules={[{ required: true, message: 'Выберите тип топлива' }]}
                  >
                    <Select>
                      {FUEL_TYPES.map(type => (
                        <Select.Option key={type.value} value={type.value}>
                          {type.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="volume"
                    label="Объем (л)"
                    rules={[{ required: true, message: 'Введите объем' }]}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item
                    name="price"
                    label="Цена (₽/л)"
                    rules={[{ required: true, message: 'Введите цену' }]}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item
                    name="notes"
                    label="Описание"
                  >
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </>
              );
            }}
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Добавить
              </Button>
              <Button onClick={() => setIsAddModalVisible(false)}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ExpensesCalendar; 