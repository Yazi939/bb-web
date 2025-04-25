import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Table, Space, Typography, Row, Col, Divider, Select, DatePicker, Statistic, notification, Radio } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FileExcelOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { exportFuelDataToExcel } from '../../utils/excelExport';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface FuelTransaction {
  key: string;
  type: 'purchase' | 'sale';
  volume: number;
  price: number;
  totalCost: number;
  date: string;
  timestamp: number;
  fuelType: string;
  supplier?: string;
  customer?: string;
  notes?: string;
}

const FUEL_TYPES = [
  { value: 'diesel', label: 'Дизельное топливо' },
  { value: 'gasoline_92', label: 'Бензин АИ-92' },
  { value: 'gasoline_95', label: 'Бензин АИ-95' },
  { value: 'gasoline_98', label: 'Бензин АИ-98' },
  { value: 'gas', label: 'Газ' }
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
  
  // Загрузка данных из localStorage при первой загрузке
  useEffect(() => {
    const savedTransactions = localStorage.getItem('fuelTransactions');
    const savedLastKey = localStorage.getItem('fuelLastKey');
    
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
    
    if (savedLastKey) {
      setLastKey(parseInt(savedLastKey));
    }
  }, []);
  
  // Сохранение данных в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('fuelTransactions', JSON.stringify(transactions));
    localStorage.setItem('fuelLastKey', lastKey.toString());
  }, [transactions, lastKey]);
  
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
  
  // Расчетные данные по фильтрованным транзакциям
  const totalPurchased = filteredTransactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.volume, 0);
    
  const totalSold = filteredTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.volume, 0);
    
  const totalPurchaseCost = filteredTransactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.totalCost, 0);
    
  const totalSaleIncome = filteredTransactions
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

  const handleAddTransaction = (values: any) => {
    const { type, volume, price, fuelType, supplier, customer, notes } = values;
    const volNumber = parseFloat(volume);
    const priceNumber = parseFloat(price);
    const now = new Date();
    
    const newTransaction: FuelTransaction = {
      key: `transaction-${lastKey + 1}`,
      type,
      volume: volNumber,
      price: priceNumber,
      totalCost: volNumber * priceNumber,
      date: now.toLocaleString(),
      timestamp: now.getTime(),
      fuelType,
      supplier: supplier || undefined,
      customer: customer || undefined,
      notes: notes || undefined
    };
    
    setTransactions([...transactions, newTransaction]);
    setLastKey(lastKey + 1);
    form.resetFields();
    
    notification.success({
      message: type === 'purchase' ? 'Покупка добавлена' : 'Продажа добавлена',
      description: `${volNumber.toFixed(2)} л топлива по цене ${priceNumber.toFixed(2)} ₽/л`
    });
  };

  const handleDeleteTransaction = (key: string) => {
    setTransactions(transactions.filter(t => t.key !== key));
    notification.info({
      message: 'Транзакция удалена',
      description: 'Запись удалена из истории операций'
    });
  };

  const exportToExcel = () => {
    const result = exportFuelDataToExcel(
      filteredTransactions,
      fuelTypeData,
      totalPurchased,
      totalSold,
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

  const columns: ColumnsType<FuelTransaction> = [
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type) => type === 'purchase' ? 'Покупка' : 'Продажа',
      filters: [
        { text: 'Покупка', value: 'purchase' },
        { text: 'Продажа', value: 'sale' }
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
      render: (price) => price.toFixed(2),
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Стоимость (₽)',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (totalCost) => totalCost.toFixed(2),
      sorter: (a, b) => a.totalCost - b.totalCost,
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => a.timestamp - b.timestamp,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record: FuelTransaction) => (
        <Button 
          icon={<DeleteOutlined 
            onPointerEnterCapture={() => {}} 
            onPointerLeaveCapture={() => {}} 
          />} 
          danger
          onClick={() => handleDeleteTransaction(record.key)}
        />
      ),
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
                name="price"
                label="Цена (₽/л)"
                rules={[{ required: true, message: 'Введите цену' }]}
              >
                <Input type="number" min="0" step="0.01" placeholder="Введите цену" />
              </Form.Item>

              {advancedMode && (
                <>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
                  >
                    {({ getFieldValue }) => 
                      getFieldValue('type') === 'purchase' ? (
                        <Form.Item name="supplier" label="Поставщик">
                          <Input placeholder="Введите название поставщика" />
                        </Form.Item>
                      ) : (
                        <Form.Item name="customer" label="Клиент">
                          <Input placeholder="Введите название клиента" />
                        </Form.Item>
                      )
                    }
                  </Form.Item>
                  
                  <Form.Item name="notes" label="Примечания">
                    <Input.TextArea placeholder="Дополнительная информация" />
                  </Form.Item>
                </>
              )}
              
              <Form.Item>
                <Button type="link" onClick={() => setAdvancedMode(!advancedMode)}>
                  {advancedMode ? 'Скрыть дополнительные поля' : 'Показать дополнительные поля'}
                </Button>
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
    </div>
  );
};

export default FuelTrading; 