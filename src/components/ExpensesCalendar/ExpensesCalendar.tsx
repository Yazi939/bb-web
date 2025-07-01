import React, { useState, useEffect } from 'react';
import { Calendar, Card, Modal, Table, Tag, Typography, Space, Row, Col, Statistic, Select, DatePicker, Button, Divider, Form, InputNumber, message, Input, notification } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DeleteOutlined, PlusOutlined, EditOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { FuelTransaction } from '../../types/electron';
import { getCurrentUser } from '../../utils/users';
import './ExpensesCalendar.css';
import { ALL_OPERATION_TYPES, FUEL_TYPES, PAYMENT_METHODS, FuelType, PaymentMethod } from '../../constants/fuelTypes';
import dayjs from 'dayjs';
import { fuelService } from '../../services/api';
import SocketService from '../../services/socketService';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

// Разрешённые типы операций для учёта топлива (как в FuelTrading)
const allowedTypes = ['purchase', 'sale', 'bunker_sale', 'base_to_bunker', 'bunker_to_base'];

const ExpensesCalendar: React.FC = () => {
  const [allTransactions, setAllTransactions] = useState<FuelTransaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<FuelTransaction[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedOperationTypes, setSelectedOperationTypes] = useState<string[]>([]);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<FuelType[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FuelTransaction | null>(null);
  const [editForm] = Form.useForm();

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
            setAllTransactions(prev => [...prev, data.data]);
            break;
          case 'updated':
            setAllTransactions(prev => prev.map(t => t.id === data.data.id ? data.data : t));
            break;
          case 'deleted':
            setAllTransactions(prev => prev.filter(t => t.id !== data.id));
            break;
        }
      }
    });

    return () => {
      socketService.removeDataUpdatedListener();
      socketService.removeTransactionListeners();
    };
  }, []);

  // Фильтрация транзакций (как в FuelTrading)
  const filteredTransactions = allTransactions.filter(t => {
    const isNotFrozen = !t.frozen;
    const isAllowedType = allowedTypes.includes(t.type);
    
    if (!(isNotFrozen && isAllowedType)) {
      return false;
    }
    
    const transactionDate = dayjs(t.timestamp || t.createdAt || t.date);
    
    const matchesDate = !dateRange || (
      transactionDate.isSameOrAfter(dateRange[0].startOf('day')) &&
      transactionDate.isSameOrBefore(dateRange[1].endOf('day'))
    );
    
    const matchesOperation = selectedOperationTypes.length === 0 || 
      selectedOperationTypes.includes(t.type);
    
    const matchesFuel = selectedFuelTypes.length === 0 || 
      selectedFuelTypes.includes(t.fuelType as FuelType);
    
    return matchesDate && matchesOperation && matchesFuel;
  });

  const loadTransactions = async () => {
    try {
      const response: any = await fuelService.getTransactions();
      const data = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : response?.data?.transactions || []);
      
      // Обрабатываем даты так же как в FuelTrading
      const processedData = data.map((t: any) => {
        const createdDate = t.createdAt ? dayjs(t.createdAt) : dayjs();
        const transactionDate = t.date ? dayjs(t.date) : createdDate;
        
        return {
          ...t,
          date: transactionDate.format('YYYY-MM-DD'),
          timestamp: t.timestamp || transactionDate.valueOf(),
          volume: Number(t.volume) || 0,
          totalCost: Number(t.totalCost) || 0
        };
      });
      
      setAllTransactions(processedData);
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
      .reduce((sum, t) => sum + (t.volume || 0), 0);

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
    return ALL_OPERATION_TYPES.map(type => ({
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
      const startOfDay = localDate.startOf('day');
      const endOfDay = localDate.endOf('day');
      
      // Фильтруем транзакции только за выбранный день из разрешенных типов
      const dayTransactions = allTransactions.filter(t => {
        if (!allowedTypes.includes(t.type) || t.frozen) return false;
        // Осторожно парсим время - проверяем есть ли уже временная зона
        let timeStr = t.createdAt || t.date;
        if (timeStr && !timeStr.includes('+') && !timeStr.endsWith('Z')) {
          timeStr = timeStr + '+03:00'; // Добавляем московскую зону только если её нет
        }
        const transactionDate = dayjs(timeStr);
        return transactionDate.isSameOrAfter(startOfDay) && transactionDate.isSameOrBefore(endOfDay);
      });
      
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
      const startOfDay = localDate.startOf('day');
      const endOfDay = localDate.endOf('day');
      
      // Фильтруем транзакции только за этот день из разрешенных типов
      const dayTransactions = allTransactions.filter(t => {
        if (!allowedTypes.includes(t.type) || t.frozen) return false;
        // Осторожно парсим время - проверяем есть ли уже временная зона
        let timeStr = t.createdAt || t.date;
        if (timeStr && !timeStr.includes('+') && !timeStr.endsWith('Z')) {
          timeStr = timeStr + '+03:00'; // Добавляем московскую зону только если её нет
        }
        const transactionDate = dayjs(timeStr);
        return transactionDate.isSameOrAfter(startOfDay) && transactionDate.isSameOrBefore(endOfDay);
      });
      
      if (dayTransactions.length === 0) return null;

      const totalVolume = dayTransactions
        .filter(t => t && typeof t.volume === 'number' && !isNaN(t.volume))
        .reduce((sum, t) => {
          const volume = Number(t.volume || 0);
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
              const operation = ALL_OPERATION_TYPES.find(ot => ot.value === type);
              return operation ? (
                <Tag key={index} color={operation.color} style={{ marginRight: 4 }}>
                  {operation.label}
                </Tag>
              ) : (
                <Tag key={index} style={{ marginRight: 4 }}>
                  {type}
                </Tag>
              );
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
      
      // КРИТИЧНО: устанавливаем правильный timestamp для выбранной даты
      const now = new Date();
      const operationDate = selectedDate || dayjs();
      
      // Создаем дату с выбранной датой но текущим временем
      let targetDate: Date;
      if (selectedDate) {
        // Если выбрана конкретная дата, используем её с текущим временем
        targetDate = new Date(
          operationDate.year(),
          operationDate.month(), // dayjs месяцы с 0
          operationDate.date(),
          now.getHours(),
          now.getMinutes(),
          now.getSeconds()
        );
      } else {
        // Если дата не выбрана, используем текущее время
        targetDate = now;
      }
      
      const correctTimestamp = targetDate.getTime(); // Правильный timestamp
      
      let newOperation: any = {
        type,
        date: operationDate.format('YYYY-MM-DD'),
        timestamp: correctTimestamp,
        createdAt: new Date().toISOString(),
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

  // Функция редактирования транзакции (как в FuelTrading)
  const handleEditTransaction = (transaction: FuelTransaction) => {
    setEditingTransaction(transaction);
    editForm.setFieldsValue({
      type: transaction.type,
      fuelType: transaction.fuelType,
      volume: transaction.volume,
      price: transaction.price,
      supplier: transaction.supplier,
      customer: transaction.customer,
      vessel: transaction.vessel,
      paymentMethod: transaction.paymentMethod,
      notes: transaction.notes
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      if (!editingTransaction) return;

      const updatedTransaction = {
        id: editingTransaction.id,
        type: values.type,
        volume: Number(values.volume),
        price: Number(values.price),
        totalCost: Number(values.volume) * Number(values.price),
        fuelType: values.fuelType,
        supplier: values.supplier,
        customer: values.customer,
        vessel: values.vessel,
        paymentMethod: values.paymentMethod,
        notes: values.notes,
        date: editingTransaction.date,
        timestamp: editingTransaction.timestamp,
        userId: editingTransaction.userId,
        createdAt: editingTransaction.createdAt
      };

      await fuelService.updateTransaction(editingTransaction.id, updatedTransaction);
      await loadTransactions();
      
      // Обновляем выбранные транзакции
      const updatedSelected = selectedTransactions.map(t => 
        t.id === editingTransaction.id ? { ...t, ...updatedTransaction } : t
      );
      setSelectedTransactions(updatedSelected);
      
      setEditModalVisible(false);
      setEditingTransaction(null);
      notification.success({
        message: 'Транзакция обновлена',
        description: 'Транзакция успешно обновлена'
      });
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      notification.error({
        message: 'Ошибка обновления',
        description: 'Не удалось обновить транзакцию'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditingTransaction(null);
    editForm.resetFields();
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
          bunker_sale: { color: 'blue', text: 'Продажа с причала' },
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
      render: (_: string, record) => (FUEL_TYPES.find(f => f.value === record.fuelType)?.label || record.fuelType || '-')
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
      title: 'Поставщик',
      dataIndex: 'supplier',
      key: 'supplier',
      render: (supplier?: string) => supplier || '-'
    },
    {
      title: 'Покупатель',
      dataIndex: 'customer',
      key: 'customer',
      render: (customer?: string) => customer || '-'
    },
    {
      title: 'Судно',
      dataIndex: 'vessel',
      key: 'vessel',
      render: (vessel?: string) => vessel || '-'
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
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditTransaction(record)}
            title="Редактировать"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteOperation(record.id)}
            title="Удалить"
          />
        </Space>
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
                options={ALL_OPERATION_TYPES.map(type => ({ value: type.value, label: type.label }))}
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
        width={1200}
        style={{ top: 20 }}
      >
        {selectedTransactions.length > 0 ? (
          <>
            <Table
              columns={columns}
              dataSource={selectedTransactions}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 900 }}
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
              {ALL_OPERATION_TYPES.map(type => (
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

      <Modal
        title="Редактировать операцию"
        open={editModalVisible}
        onCancel={handleCancelEdit}
        onOk={handleSaveEdit}
        footer={[
          <Button key="cancel" onClick={handleCancelEdit}>
            Отмена
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveEdit}>
            Сохранить
          </Button>
        ]}
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <Form.Item
            name="type"
            label="Тип операции"
            rules={[{ required: true, message: 'Выберите тип операции' }]}
          >
            <Select>
              {ALL_OPERATION_TYPES.map(type => (
                <Select.Option key={type.value} value={type.value}>
                  {type.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

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
            name="supplier"
            label="Поставщик"
            rules={[{ required: true, message: 'Введите поставщика' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="customer"
            label="Покупатель"
            rules={[{ required: true, message: 'Введите покупателя' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="vessel"
            label="Судно"
            rules={[{ required: true, message: 'Введите судно' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="paymentMethod"
            label="Метод оплаты"
            rules={[{ required: true, message: 'Выберите метод оплаты' }]}
          >
            <Select>
              {PAYMENT_METHODS.map(method => (
                <Select.Option key={method} value={method}>
                  {method}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Примечания"
            rules={[{ required: true, message: 'Введите примечания' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ExpensesCalendar; 