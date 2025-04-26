import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Table, Space, Typography, Row, Col, Divider, Select, DatePicker, Statistic, notification, Radio, Modal, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FileExcelOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { exportFuelDataToExcel } from '../../utils/excelExport';
import type { FuelTransaction } from '../../types/electron';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Иконки без событий pointer capture
const iconProps: AntdIconProps = {
  style: { color: 'white' }
};

const FUEL_TYPES = [
  { value: 'diesel', label: 'Дизельное топливо' },
  { value: 'gasoline_95', label: 'Бензин АИ-95' }
];

// Добавим имя файла для экспорта Excel
const EXCEL_FILE_NAME = 'fuel_report.xlsx';

const FuelTrading: React.FC = () => {
  const [form] = Form.useForm();
  const [transactions, setTransactions] = useState<FuelTransaction[]>([]);
  const [lastKey, setLastKey] = useState(0);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [filterFuelType, setFilterFuelType] = useState<string | null>(null);
  const [filterTransactionType, setFilterTransactionType] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FuelTransaction | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  
  // Загрузка данных из electron-store при первой загрузке
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const result = await window.electronAPI.transactions.getAll();
        setTransactions(result);
        // Set last key based on the highest existing key
        const maxKey = result.reduce((max, t) => {
          const keyNum = parseInt(t.key.replace('transaction-', ''));
          return Math.max(max, keyNum);
        }, 0);
        setLastKey(maxKey);
      } catch (error) {
        console.error('Failed to load transactions:', error);
        notification.error({
          message: 'Ошибка загрузки',
          description: 'Не удалось загрузить данные транзакций'
        });
      }
    };
    
    loadTransactions();
  }, []);
  
  // Обновление данных в electron-store при изменении
  useEffect(() => {
    const saveTransactions = async () => {
      try {
        await window.electronAPI.transactions.update(transactions);
      } catch (error) {
        console.error('Failed to save transactions:', error);
        notification.error({
          message: 'Ошибка сохранения',
          description: 'Не удалось сохранить изменения'
        });
      }
    };
    
    if (transactions.length > 0) {
      saveTransactions();
    }
  }, [transactions]);
  
  // Фильтрация транзакций
  const filteredTransactions = transactions.filter(transaction => {
    let matchesDateRange = true;
    let matchesFuelType = true;
    let matchesTransactionType = true;
    
    if (dateRange && dateRange[0] && dateRange[1]) {
      const transactionDate = new Date(transaction.timestamp).getTime();
      const startDate = dateRange[0].startOf('day').valueOf();
      const endDate = dateRange[1].endOf('day').valueOf();
      matchesDateRange = transactionDate >= startDate && transactionDate <= endDate;
    }
    
    if (filterFuelType) {
      matchesFuelType = transaction.fuelType === filterFuelType;
    }
    
    if (filterTransactionType) {
      matchesTransactionType = transaction.type === filterTransactionType;
    }
    
    return matchesDateRange && matchesFuelType && matchesTransactionType;
  });
  
  // Фильтрация транзакций с учетом замороженных для расчетов
  const activeTransactions = filteredTransactions.filter(t => !t.frozen);
  
  // Расчетные данные по активным транзакциям
  const totalPurchased = activeTransactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.volume, 0);
    
  const totalSold = activeTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.volume, 0);
  
  const totalDrained = activeTransactions
    .filter(t => t.type === 'drain')
    .reduce((sum, t) => sum + t.volume, 0);
    
  const totalPurchaseCost = activeTransactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.totalCost, 0);
    
  const totalSaleIncome = activeTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.totalCost, 0);
    
  const averagePurchasePrice = totalPurchased > 0 
    ? totalPurchaseCost / totalPurchased 
    : 0;
    
  const averageSalePrice = totalSold > 0 
    ? totalSaleIncome / totalSold 
    : 0;
    
  const coefficient = averagePurchasePrice > 0 
    ? averageSalePrice / averagePurchasePrice 
    : 0;
  
  const profitMargin = coefficient > 0 
    ? (coefficient - 1) * 100
    : 0;
    
  // Данные по типам топлива
  const fuelTypeData = FUEL_TYPES.map(fuelType => {
    const fuelTransactions = filteredTransactions.filter(t => t.fuelType === fuelType.value);
    const purchased = fuelTransactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.volume, 0);
    const sold = fuelTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.volume, 0);
    const purchaseCost = fuelTransactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.totalCost, 0);
    const saleIncome = fuelTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.totalCost, 0);
    
    return {
      fuelType: fuelType.value,
      fuelName: fuelType.label,
      purchased,
      sold,
      balance: purchased - sold,
      purchaseCost,
      saleIncome,
      profit: saleIncome - purchaseCost
    };
  }).filter(data => data.purchased > 0 || data.sold > 0); // Показываем только используемые типы топлива

  const handleAddTransaction = async (values: any) => {
    const { type, volume, price, fuelType, supplier, customer, vessel, paymentMethod, notes } = values;
    const volNumber = parseFloat(volume);
    const priceNumber = parseFloat(price);
    const now = new Date();
    
    // Get user info from context or default values
    const currentUser = { id: 'user1', role: 'worker' };
    
    const newTransaction: FuelTransaction = {
      key: `transaction-${lastKey + 1}`,
      type,
      volume: volNumber,
      price: priceNumber,
      totalCost: type === 'drain' ? 0 : volNumber * priceNumber,
      date: now.toLocaleString(),
      timestamp: now.getTime(),
      fuelType,
      supplier: type === 'purchase' ? supplier : undefined,
      customer: type === 'sale' ? customer : undefined,
      vessel: type === 'sale' ? vessel : undefined,
      paymentMethod: type === 'sale' ? paymentMethod : undefined,
      userId: currentUser.id,
      userRole: currentUser.role,
      frozen: false,
      notes: notes || undefined
    };
    
    try {
      const updatedTransactions = await window.electronAPI.transactions.add(newTransaction);
      setTransactions(updatedTransactions);
      setLastKey(lastKey + 1);
      form.resetFields();
      
      let message = '';
      if (type === 'purchase') message = 'Покупка добавлена';
      else if (type === 'sale') message = 'Продажа добавлена';
      else if (type === 'drain') message = 'Слив топлива зарегистрирован';
      
      notification.success({
        message,
        description: `${volNumber.toFixed(2)} л топлива ${type !== 'drain' ? `по цене ${priceNumber.toFixed(2)} ₽/л` : ''}`
      });
    } catch (error) {
      console.error('Failed to add transaction:', error);
      notification.error({
        message: 'Ошибка добавления',
        description: 'Не удалось добавить транзакцию'
      });
    }
  };

  const handleDeleteTransaction = async (key: string) => {
    try {
      const updatedTransactions = await window.electronAPI.transactions.delete(key);
      setTransactions(updatedTransactions);
      
      notification.success({
        message: 'Транзакция удалена',
        description: 'Запись успешно удалена из истории операций'
      });
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      notification.error({
        message: 'Ошибка удаления',
        description: 'Не удалось удалить транзакцию'
      });
    }
  };

  const exportToExcel = () => {
    const result = exportFuelDataToExcel(
      filteredTransactions,
      fuelTypeData,
      totalPurchased,
      totalSold,
      totalDrained,
      totalPurchaseCost,
      totalSaleIncome,
      averagePurchasePrice,
      averageSalePrice,
      coefficient,
      profitMargin
    );
    
    if (result.success) {
      notification.success({
        message: 'Данные экспортированы',
        description: `Отчет сохранен в файл ${result.fileName} с рабочими формулами`
      });
    } else {
      notification.error({
        message: 'Ошибка экспорта',
        description: `Не удалось экспортировать данные: ${result.error}`
      });
    }
  };

  const clearFilters = () => {
    setDateRange(null);
    setFilterFuelType(null);
    setFilterTransactionType(null);
  };

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

  const handleSaveEdit = () => {
    editForm.validateFields().then(values => {
      const { volume, price, supplier, customer, vessel, paymentMethod, notes } = values;
      const volNumber = parseFloat(volume);
      const priceNumber = parseFloat(price);
      
      if (editingTransaction) {
        const updatedTransaction: FuelTransaction = {
          ...editingTransaction,
          volume: volNumber,
          price: priceNumber,
          totalCost: editingTransaction.type === 'drain' ? 0 : volNumber * priceNumber,
          supplier: supplier || undefined,
          customer: customer || undefined,
          vessel: vessel || undefined,
          paymentMethod: paymentMethod || undefined,
          notes: notes || undefined,
          edited: true,
          editTimestamp: Date.now()
        };
        
        setTransactions(transactions.map(t => 
          t.key === editingTransaction.key ? updatedTransaction : t
        ));
        
        setEditModalVisible(false);
        setEditingTransaction(null);
        editForm.resetFields();
        
        notification.success({
          message: 'Транзакция изменена',
          description: 'Изменения сохранены успешно'
        });
      }
    });
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditingTransaction(null);
    editForm.resetFields();
  };

  const handleFreezeTransaction = (transaction: FuelTransaction) => {
    const updatedTransaction = {
      ...transaction,
      frozen: !transaction.frozen,
      frozenDate: transaction.frozen ? undefined : Date.now()
    };
    
    setTransactions(transactions.map(t => 
      t.key === transaction.key ? updatedTransaction : t
    ));
    
    notification.info({
      message: transaction.frozen ? 'Топливо разморожено' : 'Топливо заморожено',
      description: transaction.frozen 
        ? 'Топливо снова учитывается в остатках и влияет на прибыль' 
        : 'Топливо не учитывается в остатках и не влияет на прибыль'
    });
  };

  const columns: ColumnsType<FuelTransaction> = [
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        switch(type) {
          case 'purchase': return 'Покупка';
          case 'sale': return 'Продажа';
          case 'drain': return 'Слив';
          default: return type;
        }
      },
      filters: [
        { text: 'Покупка', value: 'purchase' },
        { text: 'Продажа', value: 'sale' },
        { text: 'Слив', value: 'drain' }
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Тип топлива',
      dataIndex: 'fuelType',
      key: 'fuelType',
      render: (fuelType) => FUEL_TYPES.find(t => t.value === fuelType)?.label || fuelType,
      filters: FUEL_TYPES.map(type => ({ text: type.label, value: type.value })),
      onFilter: (value, record) => record.fuelType === value,
    },
    {
      title: 'Объем (л)',
      dataIndex: 'volume',
      key: 'volume',
      render: (volume) => volume.toFixed(2),
      sorter: (a, b) => a.volume - b.volume,
    },
    {
      title: 'Цена (₽/л)',
      dataIndex: 'price',
      key: 'price',
      render: (price, record) => record.type === 'drain' ? '-' : price.toFixed(2),
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Стоимость (₽)',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (totalCost, record) => record.type === 'drain' ? '-' : totalCost.toFixed(2),
      sorter: (a, b) => a.totalCost - b.totalCost,
    },
    {
      title: 'Катер',
      dataIndex: 'vessel',
      key: 'vessel',
      render: (vessel, record) => record.type === 'sale' ? vessel || '-' : '-',
    },
    {
      title: 'Оплата',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (payment, record) => {
        if (record.type !== 'sale' || !payment) return '-';
        
        switch(payment) {
          case 'cash': return 'Наличные';
          case 'card': return 'Терминал';
          case 'transfer': return 'Перевод';
          case 'deferred': return 'Отложенный платеж';
          default: return payment;
        }
      },
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, record) => {
        if (record.frozen) {
          return <Tag color="blue">Заморожено</Tag>;
        }
        if (record.edited) {
          return <Tag color="orange">Изменено</Tag>;
        }
        return <Tag color="green">Активно</Tag>;
      }
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => b.timestamp - a.timestamp, // Newer first
      defaultSortOrder: 'descend',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record: FuelTransaction) => {
        // Check if transaction is within 24 hours and user is admin
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role": "worker"}');
        const isAdmin = currentUser.role === 'admin';
        const canEdit = isAdmin && (Date.now() - record.timestamp < 24 * 60 * 60 * 1000);
        
        return (
          <Space>
            {canEdit && (
              <Button 
                size="small"
                type="primary"
                onClick={() => handleEditTransaction(record)}
              >
                Изменить
              </Button>
            )}
            {isAdmin && (
              <Button 
                size="small"
                type={record.frozen ? "default" : "dashed"}
                onClick={() => handleFreezeTransaction(record)}
              >
                {record.frozen ? 'Разморозить' : 'Заморозить'}
              </Button>
            )}
            {isAdmin && (
              <Button 
                size="small"
                icon={<DeleteOutlined 
                  onPointerEnterCapture={() => {}} 
                  onPointerLeaveCapture={() => {}} 
                />} 
                danger
                onClick={() => handleDeleteTransaction(record.key)}
              />
            )}
          </Space>
        );
      },
    },
  ];

  const advancedColumns = [
    ...columns.slice(0, -1),
    {
      title: 'Поставщик/Клиент',
      key: 'counterparty',
      render: (_: any, record: FuelTransaction) => record.type === 'purchase' ? record.supplier : record.customer,
    },
    {
      title: 'Примечания',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
    columns[columns.length - 1] // Последний столбец (действия)
  ];

  useEffect(() => {
    // If no user exists in localStorage, create a default admin
    if (!localStorage.getItem('currentUser')) {
      localStorage.setItem('currentUser', JSON.stringify({
        id: 'admin1',
        name: 'Администратор',
        role: 'admin'
      }));
    }
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle">
        <Title level={2}>Учет топлива</Title>
        <Space>
          <Button
            icon={<FileExcelOutlined 
              onPointerEnterCapture={() => {}} 
              onPointerLeaveCapture={() => {}} 
            />}
            onClick={exportToExcel}
          >
            Экспорт данных
          </Button>
        </Space>
      </Row>
      
      <Row gutter={[24, 24]}>
        <Col span={24} lg={10}>
          <Card title="Добавить операцию" style={{ marginBottom: 20 }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleAddTransaction}
            >
              <Form.Item
                name="type"
                label="Тип операции"
                rules={[{ required: true, message: 'Выберите тип операции' }]}
              >
                <Select placeholder="Выберите тип операции">
                  <Option value="purchase">Покупка топлива</Option>
                  <Option value="sale">Продажа топлива</Option>
                  <Option value="drain">Слив топлива</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="fuelType"
                label="Тип топлива"
                rules={[{ required: true, message: 'Выберите тип топлива' }]}
              >
                <Select placeholder="Выберите тип топлива">
                  {FUEL_TYPES.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="volume"
                label="Объем топлива (л)"
                rules={[{ required: true, message: 'Введите объем' }]}
              >
                <Input type="number" min="0" step="0.01" placeholder="Введите объем" />
              </Form.Item>
              
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
              >
                {({ getFieldValue }) => {
                  const type = getFieldValue('type');
                  return type !== 'drain' ? (
                    <Form.Item
                      name="price"
                      label="Цена (₽/л)"
                      rules={[{ required: type !== 'drain', message: 'Введите цену' }]}
                    >
                      <Input type="number" min="0" step="0.01" placeholder="Введите цену" />
                    </Form.Item>
                  ) : null;
                }}
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
              >
                {({ getFieldValue }) => {
                  const type = getFieldValue('type');
                  return type === 'purchase' ? (
                    <Form.Item name="supplier" label="Поставщик">
                      <Input placeholder="Укажите поставщика" />
                    </Form.Item>
                  ) : null;
                }}
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
              >
                {({ getFieldValue }) => {
                  const type = getFieldValue('type');
                  return type === 'sale' ? (
                    <>
                      <Form.Item name="customer" label="Покупатель">
                        <Input placeholder="Укажите покупателя" />
                      </Form.Item>
                      <Form.Item name="vessel" label="Название катера" rules={[{ required: true, message: 'Укажите название катера' }]}>
                        <Input placeholder="Укажите название катера" />
                      </Form.Item>
                      <Form.Item name="paymentMethod" label="Способ оплаты" rules={[{ required: true, message: 'Укажите способ оплаты' }]}>
                        <Select placeholder="Выберите способ оплаты">
                          <Option value="cash">Наличные</Option>
                          <Option value="card">Терминал</Option>
                          <Option value="transfer">Перевод</Option>
                          <Option value="deferred">Отложенный платеж</Option>
                        </Select>
                      </Form.Item>
                    </>
                  ) : null;
                }}
              </Form.Item>

              <Form.Item name="notes" label="Примечания">
                <Input.TextArea rows={2} placeholder="Дополнительные примечания" />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Добавить
                </Button>
              </Form.Item>
            </Form>
          </Card>
          
          <Card title="Статистика">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic 
                  title="Куплено" 
                  value={totalPurchased} 
                  precision={2}
                  suffix="л" 
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Продано" 
                  value={totalSold} 
                  precision={2}
                  suffix="л" 
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Остаток" 
                  value={totalPurchased - totalSold} 
                  precision={2}
                  suffix="л" 
                  valueStyle={{ color: totalPurchased - totalSold > 0 ? '#3f8600' : '#cf1322' }}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Прибыль" 
                  value={totalSaleIncome - totalPurchaseCost} 
                  precision={2}
                  prefix="₽" 
                  valueStyle={{ color: totalSaleIncome - totalPurchaseCost > 0 ? '#3f8600' : '#cf1322' }}
                />
              </Col>
            </Row>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic 
                  title="Коэффициент" 
                  value={coefficient} 
                  precision={2}
                  valueStyle={{ color: coefficient > 1 ? '#3f8600' : '#cf1322' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Маржа"
                  value={profitMargin.toFixed(2)}
                  precision={2}
                  valueStyle={{ color: profitMargin > 0 ? '#3f8600' : '#cf1322' }}
                  suffix="%"
                />
              </Col>
            </Row>

            {fuelTypeData.length > 0 && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <Title level={5}>По типам топлива</Title>
                {fuelTypeData.map(data => (
                  <div key={data.fuelType} style={{ marginBottom: 12 }}>
                    <Text strong>{data.fuelName}</Text>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Text>Остаток: {data.balance.toFixed(2)} л</Text>
                      </Col>
                      <Col span={12}>
                        <Text>Прибыль: {data.profit.toFixed(2)} ₽</Text>
                      </Col>
                    </Row>
                  </div>
                ))}
              </>
            )}
          </Card>
        </Col>
        
        <Col span={24} lg={14}>
          <Card 
            title="История операций" 
            extra={
              <Space>
                <Button 
                  icon={<FilterOutlined 
                    onPointerEnterCapture={() => {}} 
                    onPointerLeaveCapture={() => {}} 
                  />} 
                  onClick={() => clearFilters()}
                  disabled={!dateRange && !filterFuelType && !filterTransactionType}
                >
                  Сбросить фильтры
                </Button>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text>Период:</Text>
                  <RangePicker 
                    style={{ width: '100%', marginTop: 4 }} 
                    value={dateRange}
                    onChange={setDateRange}
                  />
                </Col>
                <Col span={6}>
                  <Text>Тип топлива:</Text>
                  <Select 
                    style={{ width: '100%', marginTop: 4 }} 
                    placeholder="Все типы"
                    allowClear
                    value={filterFuelType}
                    onChange={setFilterFuelType}
                  >
                    {FUEL_TYPES.map(option => (
                      <Option key={option.value} value={option.value}>{option.label}</Option>
                    ))}
                  </Select>
                </Col>
                <Col span={6}>
                  <Text>Тип операции:</Text>
                  <Select 
                    style={{ width: '100%', marginTop: 4 }} 
                    placeholder="Все операции"
                    allowClear
                    value={filterTransactionType}
                    onChange={setFilterTransactionType}
                  >
                    <Option value="purchase">Покупка</Option>
                    <Option value="sale">Продажа</Option>
                    <Option value="drain">Слив</Option>
                  </Select>
                </Col>
              </Row>
            </Space>
            
            <Table 
              columns={advancedMode ? advancedColumns : columns} 
              dataSource={filteredTransactions} 
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="Редактировать операцию"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={handleCancelEdit}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <Form.Item
            name="type"
            label="Тип операции"
            rules={[{ required: true }]}
          >
            <Select disabled>
              <Option value="purchase">Покупка топлива</Option>
              <Option value="sale">Продажа топлива</Option>
              <Option value="drain">Слив топлива</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="fuelType"
            label="Тип топлива"
            rules={[{ required: true }]}
          >
            <Select disabled>
              {FUEL_TYPES.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="volume"
            label="Объем топлива (л)"
            rules={[{ required: true }]}
          >
            <Input type="number" min="0" step="0.01" />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              return type !== 'drain' ? (
                <Form.Item
                  name="price"
                  label="Цена (₽/л)"
                  rules={[{ required: type !== 'drain' }]}
                >
                  <Input type="number" min="0" step="0.01" />
                </Form.Item>
              ) : null;
            }}
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              return type === 'purchase' ? (
                <Form.Item name="supplier" label="Поставщик">
                  <Input />
                </Form.Item>
              ) : null;
            }}
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              return type === 'sale' ? (
                <>
                  <Form.Item name="customer" label="Покупатель">
                    <Input />
                  </Form.Item>
                  <Form.Item name="vessel" label="Название катера" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="paymentMethod" label="Способ оплаты" rules={[{ required: true }]}>
                    <Select>
                      <Option value="cash">Наличные</Option>
                      <Option value="card">Терминал</Option>
                      <Option value="transfer">Перевод</Option>
                      <Option value="deferred">Отложенный платеж</Option>
                    </Select>
                  </Form.Item>
                </>
              ) : null;
            }}
          </Form.Item>

          <Form.Item name="notes" label="Примечания">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FuelTrading; 