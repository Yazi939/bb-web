import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Table, Space, Typography, Row, Col, Divider, Select, DatePicker, Statistic, notification, Radio, Modal, Tag, ConfigProvider } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, FilterOutlined, UserOutlined, CarOutlined, InfoCircleOutlined, PlusOutlined, SettingOutlined, PartitionOutlined } from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import dayjs, { Dayjs } from 'dayjs';
import './FuelTrading.module.css';
import { useFuelMetrics } from '../../hooks/useFuelMetrics';
import SocketService from '../../services/socketService';
import { mockTransactions } from '../../utils/mockData';
import { fuelService } from '../../services/api';
import crypto from 'crypto';
import type { FuelTransaction } from '../../types/electron';
import * as XLSX from 'xlsx';
import ruRU from 'antd/es/locale/ru_RU';
import { DatePicker as AntdDatePicker } from 'antd';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

// Подключаем плагины
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Иконки без событий pointer capture
const IconProps: Partial<AntdIconProps> = {
  style: { color: 'white' },
  onPointerEnter: undefined,
  onPointerLeave: undefined
};

const FUEL_TYPES = [
  { value: 'diesel', label: 'Дизельное топливо' },
  { value: 'gasoline_95', label: 'Бензин АИ-95' }
];

const BUNKER_VESSELS = [
  { value: 'fedorov', label: 'Фёдоров' }
];

// Добавим имя файла для экспорта Excel
const EXCEL_FILE_NAME = 'fuel_report.xlsx';

interface FuelTypeData {
  fuelType: string;
  fuelName: string;
  purchased: number;
  sold: number;
  baseBalance: number;
  bunkerBalance: number;
  purchaseCost: number;
  saleIncome: number;
  profit: number;
  balance: number;
  drained: number;
}

// Типы операций для учёта топлива
type FuelTransactionType = FuelTransaction['type'];

// Разрешённые типы операций для учёта топлива
const allowedTypes: FuelTransactionType[] = ['purchase', 'sale', 'bunker_sale', 'base_to_bunker', 'bunker_to_base'];

const FuelTrading: React.FC = () => {
  const [allTransactions, setAllTransactions] = useState<FuelTransaction[]>([]);
  const [transactions, setTransactions] = useState<FuelTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | undefined>(undefined);
  const [filters, setFilters] = useState<any>({});
  const [editingTransaction, setEditingTransaction] = useState<FuelTransaction | null>(null);
  const [deleteTransaction, setDeleteTransaction] = useState<FuelTransaction | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [filterFuelType, setFilterFuelType] = useState<string | null>(null);
  const [filterTransactionType, setFilterTransactionType] = useState<FuelTransactionType | null>(null);
  const [form] = Form.useForm();
  const [lastKey, setLastKey] = useState(0);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string }>({ id: '', role: '' });
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<FuelTransaction | null>(null);
  const metrics = useFuelMetrics(allTransactions, dateRange);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showTotal: (total: number) => `Всего ${total} записей`,
    pageSizeOptions: ['10', '20', '50', '100'],
    showQuickJumper: true
  });
  const [archivedTransactions, setArchivedTransactions] = useState<FuelTransaction[]>([]);
  const [selectedArchiveDate, setSelectedArchiveDate] = useState<Dayjs | null>(null);
  const [archiveDayTransactions, setArchiveDayTransactions] = useState<FuelTransaction[]>([]);

  const fetchTransactions = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response: any = await fuelService.getTransactions();
      const responseData = Array.isArray(response) ? response : (response?.data || []);
      const fetchedTransactions = responseData.map((t: any) => {
        // Исправляем работу с датами - используем UTC для стабильности
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
      
      setAllTransactions(fetchedTransactions);
      
      // НЕ устанавливаем transactions здесь - это делается через фильтрацию
    } catch (error) {
      console.error('Error fetching transactions:', error);
      notification.error({
        message: 'Ошибка',
        description: 'Не удалось загрузить историю операций'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    loadUserInfo();

    // Подключаемся к Socket.IO
    const socket = SocketService.getInstance();
    socket.connect();

    // Подписываемся на общее событие обновления данных
    socket.onDataUpdated((data) => {
      console.log('Получено обновление данных:', data);
      if (data.type === 'transactions') {
        if (data.action === 'created') {
          setTransactions(prev => {
            // Проверяем, нет ли уже такой транзакции
            if (prev.some(t => t.id === data.data.id)) {
              console.log('Транзакция уже существует, пропускаем:', data.data.id);
              return prev;
            }
            return [...prev, data.data];
          });
        } else if (data.action === 'updated') {
          setTransactions(prev => prev.map(t => t.id === data.data.id ? data.data : t));
        } else if (data.action === 'deleted') {
          setTransactions(prev => prev.filter(t => t.id !== data.id));
        }
      }
    });

    // Отписываемся от событий при размонтировании компонента
    return () => {
      socket.removeDataUpdatedListener();
      socket.disconnect();
    };
  }, []);

  // Фильтрация транзакций для отображения (все операции + фильтры)
  const filteredTransactions = allTransactions.filter(t => {
    const isNotFrozen = !t.frozen;
    const isAllowedType = allowedTypes.includes(t.type);
    
    // Базовые фильтры: не заморожено и разрешенный тип операции
    if (!(isNotFrozen && isAllowedType)) {
      return false;
    }
    
    // Фильтр по диапазону дат (если выбран)
    if (dateRange && dateRange[0] && dateRange[1]) {
      const transactionDate = dayjs(t.timestamp);
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      if (!transactionDate.isSameOrAfter(startDate) || !transactionDate.isSameOrBefore(endDate)) {
        return false;
      }
    }
    
    // Фильтр по типу топлива
    if (filterFuelType && t.fuelType !== filterFuelType) {
      return false;
    }
    // Фильтр по типу операции
    if (filterTransactionType && t.type !== filterTransactionType) {
      return false;
    }
    return true;
  });

  // Фильтрация архивных транзакций
  useEffect(() => {
    if (selectedArchiveDate) {
      const startOfDay = selectedArchiveDate.startOf('day');
      const endOfDay = selectedArchiveDate.endOf('day');
      
      const filtered = allTransactions.filter(t => {
          const transactionDate = dayjs(t.timestamp);
        return !t.frozen && 
               transactionDate.isSameOrAfter(startOfDay) && 
               transactionDate.isSameOrBefore(endOfDay);
      });
      
      setArchiveDayTransactions(filtered);
    }
  }, [selectedArchiveDate, allTransactions]);

  const handleTableChange = (paginationConfig: any) => {
    setPagination({
      ...pagination,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize
    });
  };
  
  useEffect(() => {
    // При изменении фильтров или пагинации обновляем отображаемые транзакции
    const { current, pageSize } = pagination;
    const start = (current - 1) * pageSize;
    const end = start + pageSize;
    const paginatedTransactions = filteredTransactions.slice(start, end);
    
    setTransactions(paginatedTransactions);
    
    // Обновляем общее количество для пагинации
    setPagination(prev => ({
      ...prev,
      total: filteredTransactions.length
    }));
  }, [filteredTransactions, pagination.current, pagination.pageSize]);
  
  const loadUserInfo = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{"id": "", "role": ""}');
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };
  
  const saveTransactions = async () => {
    try {
      const updatedTransactions = transactions.map(t => ({
        ...t,
        volume: t.volume !== undefined ? Number(t.volume) : 0,
        price: t.price !== undefined ? Number(t.price) : 0,
        totalCost: t.totalCost !== undefined ? Number(t.totalCost) : 0,
      }));
      await Promise.all(updatedTransactions.map(t => 
        fuelService.updateTransaction(t.key, t)
      ));
    } catch (error) {
      console.error('Failed to save transactions:', error);
      notification.error({
        message: 'Ошибка сохранения',
        description: 'Не удалось сохранить изменения'
      });
    }
  };
  
  // Расчетные данные по активным транзакциям (используем filteredTransactions вместо transactions)
  const totalPurchased = filteredTransactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + (t.volume || 0), 0);
    
  const totalSold = filteredTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + (t.volume || 0), 0);
    
  const totalPurchaseCost = filteredTransactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + (t.totalCost || 0), 0);
    
  const totalSaleIncome = filteredTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + (t.totalCost || 0), 0);
    
  const totalBaseToBunker = filteredTransactions
    .filter(t => t.type === 'base_to_bunker')
    .reduce((sum, t) => sum + (t.volume || 0), 0);

  const totalBunkerToBase = filteredTransactions
    .filter(t => t.type === 'bunker_to_base')
    .reduce((sum, t) => sum + (t.volume || 0), 0);
    
  const avgPurchasePrice = totalPurchased > 0 ? totalPurchaseCost / totalPurchased : 0;
  const soldCost = totalSold * avgPurchasePrice;
  const profit = totalSaleIncome - soldCost;
  // Замороженные средства (стоимость нераспроданного топлива)
  const frozenVolume = totalPurchased - totalSold;
  const frozenCost = frozenVolume > 0 ? frozenVolume * avgPurchasePrice : 0;
    
  const averageSalePrice = totalSold > 0 
    ? totalSaleIncome / totalSold 
    : 0;
    
  const coefficient = avgPurchasePrice > 0 
    ? averageSalePrice / avgPurchasePrice 
    : 0;
  
  const profitMargin = coefficient > 0 
    ? (coefficient - 1) * 100
    : 0;
    
  // Итоговые остатки по всем операциям (не зависят от дня)
  const totalFuelTypeStats = metrics.fuelTypeStats;

  // Статистика за день (продажи, покупки, прибыль и т.д.)
  // ... как раньше, на основе filteredTransactions ...
    
  // Данные по типам топлива
  const fuelTypeData = FUEL_TYPES.map(fuelType => {
    const dayStats = filteredTransactions.filter(t => t.fuelType === fuelType.value);
    const purchased = dayStats.filter(t => t.type === 'purchase').reduce((sum, t) => sum + (t.volume || 0), 0);
    const sold = dayStats.filter(t => t.type === 'sale').reduce((sum, t) => sum + (t.volume || 0), 0);
    const baseToBunker = dayStats.filter(t => t.type === 'base_to_bunker').reduce((sum, t) => sum + (t.volume || 0), 0);
    const bunkerToBase = dayStats.filter(t => t.type === 'bunker_to_base').reduce((sum, t) => sum + (t.volume || 0), 0);
    const purchaseCost = dayStats.filter(t => t.type === 'purchase').reduce((sum, t) => sum + (t.totalCost || 0), 0);
    const saleIncome = dayStats.filter(t => t.type === 'sale').reduce((sum, t) => sum + (t.totalCost || 0), 0);
    const profit = sold * (purchased > 0 ? purchaseCost / purchased : 0) > 0 ? saleIncome - sold * (purchaseCost / purchased) : 0;
    // Остатки — итоговые
    const baseBalance = totalFuelTypeStats[fuelType.value]?.baseBalance || 0;
    const bunkerBalance = totalFuelTypeStats[fuelType.value]?.bunkerBalance || 0;
    return {
      fuelType: fuelType.value,
      fuelName: fuelType.label,
      purchased,
      sold,
      baseBalance,
      bunkerBalance,
      purchaseCost,
      saleIncome,
      profit
    } as FuelTypeData;
  }).filter(data => data.purchased > 0 || data.sold > 0 || data.baseBalance > 0 || data.bunkerBalance > 0);

  const handleAddTransaction = async (values: any) => {
    try {
      const vesselValue = (values.type === 'base_to_bunker' || values.type === 'bunker_to_base') ? values.bunkerVessel : values.vessel;
      const now = dayjs();
      const currentDate = now.format('YYYY-MM-DD');
      const currentTimestamp = now.valueOf();
      
      // Отладочная информация при создании
      console.log('🆕 Creating timestamp:', {
        now_dayjs: now.format(),
        now_valueOf: currentTimestamp,
        now_js_date: new Date(),
        now_js_timestamp: Date.now(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        comparison: {
          'dayjs.valueOf()': currentTimestamp,
          'Date.now()': Date.now(),
          'new Date().getTime()': new Date().getTime()
        }
      });
      
      const newTransaction: FuelTransaction = {
        id: '', // Временное значение, будет заменено сервером
        key: '', // Временное значение, будет заменено сервером
        type: values.type,
        fuelType: values.fuelType,
        volume: Number(values.volume),
        price: values.price ? Number(values.price) : 0,
        totalCost: (values.price && values.volume) ? Number(values.volume) * Number(values.price) : 0,
        date: currentDate,
        timestamp: currentTimestamp,
        frozen: false,
        notes: values.notes,
        customer: values.customer,
        vessel: vesselValue,
        supplier: values.supplier,
        paymentMethod: values.paymentMethod,
        userId: currentUser.id,
        createdAt: now.toISOString()
      };

      const response = await fuelService.createTransaction(newTransaction);
      console.log('Create response:', response);
      
      if (response.data && response.data.id) {
        newTransaction.id = response.data.id;
        newTransaction.key = response.data.id;
        // Добавляем транзакцию в состояние сразу
        setTransactions(prev => [...prev, newTransaction]);
      }
      
      await fetchTransactions();

      form.resetFields();
      setEditModalVisible(false);
      notification.success({
        message: 'Транзакция добавлена',
        description: 'Новая транзакция успешно добавлена'
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
      await fuelService.deleteTransaction(key);
      await fetchTransactions();
      notification.success({
        message: 'Транзакция удалена',
        description: 'Транзакция успешно удалена'
      });
    } catch (error: any) {
      if (error?.response?.status === 403) {
        notification.error({
          message: 'Ошибка доступа',
          description: 'У вас нет прав для удаления этой транзакции'
        });
      } else {
        notification.error({
          message: 'Ошибка удаления',
          description: 'Не удалось удалить транзакцию'
        });
      }
    }
  };

  const clearFilters = () => {
    setDateRange(undefined);
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
      bunkerVessel: transaction.vessel,
      notes: transaction.notes
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      if (!editingTransaction) return;

      // Проверяем права доступа
      const isAdmin = currentUser.role === 'admin';
      const isOwner = editingTransaction.userId === currentUser.id;
      
      if (!isAdmin && !isOwner) {
        notification.error({
          message: 'Ошибка доступа',
          description: 'У вас нет прав для редактирования этой транзакции'
        });
        setEditModalVisible(false);
        setEditingTransaction(null);
        return;
      }

      const vesselValue = (values.type === 'base_to_bunker' || values.type === 'bunker_to_base') ? values.bunkerVessel : values.vessel;
      const updatedTransaction = {
        id: editingTransaction.id,
        type: values.type as FuelTransactionType,
        volume: Number(values.volume),
        price: Number(values.price),
        totalCost: Number(values.volume) * Number(values.price),
        fuelType: values.fuelType,
        supplier: values.supplier,
        customer: values.customer,
        vessel: vesselValue,
        paymentMethod: values.paymentMethod,
        notes: values.notes,
        date: values.date || editingTransaction.date,
        timestamp: values.timestamp || editingTransaction.timestamp,
        userId: editingTransaction.userId,
        userRole: editingTransaction.userRole,
        createdAt: editingTransaction.createdAt
      };

      console.log('Sending update request with data:', updatedTransaction);
      const response = await fuelService.updateTransaction(editingTransaction.id, updatedTransaction);
      console.log('Update response:', response);

      // Даже если есть ошибка, но данные обновились, считаем операцию успешной
      await fetchTransactions();
      setEditModalVisible(false);
      setEditingTransaction(null);
      notification.success({
        message: 'Транзакция обновлена',
        description: 'Транзакция успешно обновлена'
      });
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      // Проверяем, обновились ли данные, несмотря на ошибку
      await fetchTransactions();
      const updatedTransaction = await fuelService.getTransaction(editingTransaction?.id || '');
      
      if (updatedTransaction) {
        setEditModalVisible(false);
        setEditingTransaction(null);
        notification.success({
          message: 'Транзакция обновлена',
          description: 'Транзакция успешно обновлена'
        });
      } else {
        notification.error({
          message: 'Ошибка обновления',
          description: error.response?.data?.error || error.message || 'Не удалось обновить транзакцию'
        });
      }
    }
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

  const showDeleteConfirm = (transaction: FuelTransaction) => {
    setTransactionToDelete(transaction);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    
    console.log('Attempting to delete transaction:', transactionToDelete);
    console.log('Transaction ID:', transactionToDelete.id);
    console.log('Transaction Key:', transactionToDelete.key);
    
    // Проверяем права доступа
    const isAdmin = currentUser.role === 'admin';
    const isOwner = transactionToDelete.userId === currentUser.id;
    
    console.log('User permissions:', { isAdmin, isOwner, userId: currentUser.id, transactionUserId: transactionToDelete.userId });
    
    if (!isAdmin && !isOwner) {
      notification.error({
        message: 'Ошибка доступа',
        description: 'У вас нет прав для удаления этой транзакции'
      });
      setDeleteModalVisible(false);
      setTransactionToDelete(null);
      return;
    }

    try {
      console.log('Sending delete request for transaction ID:', transactionToDelete.id);
      const response = await fuelService.deleteTransaction(transactionToDelete.id);
      console.log('Delete response:', response);
      await fetchTransactions();
      setDeleteModalVisible(false);
      setTransactionToDelete(null);
      notification.success({
        message: 'Транзакция удалена',
        description: 'Транзакция успешно удалена'
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      console.error('Error response:', error.response);
      if (error?.response?.status === 403) {
        notification.error({
          message: 'Ошибка доступа',
          description: 'У вас нет прав для удаления этой транзакции'
        });
      } else {
        notification.error({
          message: 'Ошибка удаления',
          description: 'Не удалось удалить транзакцию'
        });
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setTransactionToDelete(null);
  };

  const columns: ColumnsType<FuelTransaction> = [
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        switch(type) {
          case 'purchase': return <Tag color="green">Покупка</Tag>;
          case 'sale': return <Tag color="volcano">Продажа</Tag>;
          case 'base_to_bunker': return <Tag color="blue">База → Бункер</Tag>;
          case 'bunker_to_base': return <Tag color="purple">Бункер → База</Tag>;
          default: return <Tag>{type}</Tag>;
        }
      },
      filters: [
        { text: 'Покупка', value: 'purchase' },
        { text: 'Продажа', value: 'sale' },
        ...(currentUser.role === 'admin' ? [
          { text: 'База → Бункер', value: 'base_to_bunker' },
          { text: 'Бункер → База', value: 'bunker_to_base' }
        ] : [])
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Топливо',
      dataIndex: 'fuelType',
      key: 'fuelType',
      render: (fuelType) => <b>{FUEL_TYPES.find(t => t.value === fuelType)?.label || fuelType}</b>,
      filters: FUEL_TYPES.map(type => ({ text: type.label, value: type.value })),
      onFilter: (value, record) => record.fuelType === value,
    },
    {
      title: 'Объем (л)',
      dataIndex: 'volume',
      key: 'volume',
      render: (volume: number | undefined | null) => {
        if (volume === undefined || volume === null) return '-';
        return <b>{typeof volume === 'number' && !isNaN(volume) ? volume.toFixed(2) : '-'}</b>;
      },
      sorter: (a, b) => (a.volume || 0) - (b.volume || 0),
    },
    {
      title: 'Цена (₽/л)',
      dataIndex: 'price',
      key: 'price',
      render: (price: number | undefined | null, record) => {
        if (price === undefined || price === null) return '-';
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return <span>{typeof numPrice === 'number' && !isNaN(numPrice) ? Number(numPrice).toFixed(2) : '-'}</span>;
      },
      sorter: (a, b) => (a.price || 0) - (b.price || 0),
    },
    {
      title: 'Стоимость (₽)',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (totalCost: number | undefined | null, record) => {
        if (totalCost === undefined || totalCost === null) return '-';
        const numCost = typeof totalCost === 'string' ? parseFloat(totalCost) : totalCost;
        return <b style={{ color: '#1890ff' }}>{typeof numCost === 'number' && !isNaN(numCost) ? Number(numCost).toFixed(2) : '-'}</b>;
      },
      sorter: (a, b) => (a.totalCost || 0) - (b.totalCost || 0),
    },
    {
      title: 'Судно/Клиент/Поставщик',
      key: 'counterparty',
      render: (_: any, record: FuelTransaction) => {
        if (record.type === 'purchase') {
          return record.supplier ? <span><UserOutlined /> {record.supplier}</span> : '-';
        }
        if (record.type === 'sale') {
          return (
            <span>
              {record.customer ? <><UserOutlined /> {record.customer}</> : null}
              {record.vessel ? <><CarOutlined style={{ marginLeft: 4 }} /> {record.vessel}</> : null}
              {(!record.customer && !record.vessel) ? '-' : null}
            </span>
          );
        }
        if (record.type === 'base_to_bunker' || record.type === 'bunker_to_base') {
          return record.vessel
            ? <span><CarOutlined /> {record.vessel}</span>
            : '-';
        }
        return '-';
      },
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
      title: 'Дата и время',
      dataIndex: 'timestamp',
      key: 'timestamp',
      sorter: (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
      defaultSortOrder: 'descend',
      render: (timestamp, record) => {
        if (!timestamp) return '-';
        
        // Отладочная информация
        console.log('🕒 Timestamp debug:', {
          original: timestamp,
          typeof: typeof timestamp,
          new_Date: new Date(timestamp),
          dayjs_parse: dayjs(timestamp).format(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          now_for_comparison: new Date().toLocaleString()
        });
        
        // Правильная обработка timestamp с учетом local timezone
        const jsDate = new Date(timestamp);
        const date = dayjs(jsDate);
        
        return (
          <div style={{ color: '#888', fontSize: 13 }}>
            <div>{date.format('DD.MM.YYYY')}</div>
            <div style={{ color: '#aaa', fontSize: 11 }}>
              {date.format('HH:mm:ss')}
              <span style={{ color: '#ccc', fontSize: 10, marginLeft: 4 }}>
                (JS: {jsDate.toLocaleTimeString()})
              </span>
            </div>
          </div>
        );
      }
    },
    {
      title: 'Примечания',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes?: string) => notes ? <span title={notes}><InfoCircleOutlined style={{ color: '#1890ff', marginRight: 4 }} />{notes.length > 20 ? notes.slice(0, 20) + '…' : notes}</span> : '-'
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record: FuelTransaction) => {
        const isAdmin = currentUser.role === 'admin';
        const isOwner = record.userId === currentUser.id;
        const canEdit = isAdmin || isOwner;
        const canDelete = isAdmin || isOwner;
        
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
            {canDelete && (
              <Button 
                size="small"
                icon={<DeleteOutlined />} 
                danger
                onClick={() => showDeleteConfirm(record)}
              />
            )}
          </Space>
        );
      },
    },
  ];

  const advancedColumns = [
    ...columns.slice(0, -1),
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

  // ВРЕМЕННО: выводим данные для отладки объёма
  console.log('filteredTransactions:', filteredTransactions.map(t => ({ key: t.key, volume: t.volume, type: typeof t.volume })));

  const tableData = Object.entries(metrics.fuelTypeStats).map(([fuelType, stats]) => ({
    key: fuelType,
    fuelType,
    ...stats
  }));

  // Функция экспорта в Excel
  const exportToExcel = () => {
    // Преобразуем данные для экспорта (например, fuelTransactions)
    const data = transactions.map((item, idx) => ({
      '№': idx + 1,
      'Тип операции': item.type,
      'Тип топлива': item.fuelType,
      'Объем (л)': item.volume,
      'Цена (₽/л)': item.price,
      'Стоимость (₽)': item.totalCost,
      'Дата': item.date,
      'Судно': item.vessel || '',
      'Поставщик': item.supplier || '',
      'Покупатель': item.customer || '',
      'Примечания': item.notes || ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Топливо');
    XLSX.writeFile(workbook, 'fuel_report.xlsx');
  };

  // Вспомогательная функция для расчёта статистики по произвольному набору операций
  function calcStatsForTransactions(transactions: FuelTransaction[]) {
    const totalPurchased = transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.volume, 0);
    const totalSold = transactions.filter(t => t.type === 'sale' || t.type === 'bunker_sale').reduce((sum, t) => sum + t.volume, 0);
    const totalPurchaseCost = transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.totalCost, 0);
          const totalSaleIncome = transactions.filter(t => t.type === 'sale' || t.type === 'bunker_sale').reduce((sum, t) => sum + t.totalCost, 0);
    const avgPurchasePrice = totalPurchased > 0 ? totalPurchaseCost / totalPurchased : 0;
    const soldCost = totalSold * avgPurchasePrice;
    const profit = totalSaleIncome - soldCost;
    return { totalPurchased, totalSold, profit };
  }

  // Отладочный вывод для проверки расчёта остатков по дизелю
  console.log('Остаток дизеля на бункере:', metrics.fuelTypeStats['diesel']?.bunkerBalance);
  console.log('Все операции дизеля:', allTransactions.filter(t => t.fuelType === 'diesel'));

  return (
    <ConfigProvider locale={ruRU}>
      <div className="fuelTrading">
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
                    <Option value="sale">Продажа с катера</Option>
                    <Option value="bunker_sale">Продажа с причала</Option>
                    {currentUser.role === 'admin' && (
                      <>
                        <Option value="base_to_bunker">Перемещение с базы на бункеровщик</Option>
                        <Option value="bunker_to_base">Перемещение с бункеровщика на базу</Option>
                      </>
                    )}
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
                    return (type === 'purchase' || type === 'sale' || type === 'bunker_sale') ? (
                      <Form.Item
                        name="price"
                        label="Цена (₽/л)"
                        rules={[{ required: true, message: 'Введите цену' }]}
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
                      <Form.Item name="supplier" label="Поставщик" rules={[{ required: true, message: 'Укажите поставщика' }]}> 
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
                    return (type === 'sale' || type === 'bunker_sale') ? (
                      <>
                        <Form.Item name="customer" label="Покупатель" rules={[{ required: true, message: 'Укажите покупателя' }]}> 
                          <Input placeholder="Укажите покупателя" />
                        </Form.Item>
                        {type === 'sale' && (
                          <Form.Item name="vessel" label="Название катера" rules={[{ required: true, message: 'Укажите название катера' }]}> 
                            <Input placeholder="Укажите название катера" />
                          </Form.Item>
                        )}
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
                
                {/* Добавляем поле выбора бункеровщика */}
                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
                >
                  {({ getFieldValue }) => {
                    const type = getFieldValue('type');
                    if (type === 'base_to_bunker' || type === 'bunker_to_base') {
                      return (
                        <Form.Item
                          name="bunkerVessel"
                          label="Бункеровщик"
                          rules={[{ required: true }]}
                        >
                          <Select placeholder="Выберите бункеровщик">
                            {BUNKER_VESSELS.map(vessel => (
                              <Option key={vessel.value} value={vessel.value}>{vessel.label}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      );
                    }
                    return null;
                  }}
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
                <Col span={24}>
                  <Statistic 
                    title="Прибыль" 
                    value={profit} 
                    precision={2}
                    prefix="₽" 
                    valueStyle={{ color: profit > 0 ? '#3f8600' : '#cf1322' }}
                  />
                  <div style={{ color: '#1890ff', fontSize: 13, marginTop: 4 }}>
                    Заморожено: {typeof frozenCost === 'number' && !isNaN(frozenCost) ? frozenCost.toFixed(2) : '-'} ₽
                  </div>
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
                    value={typeof profitMargin === 'number' && !isNaN(profitMargin) ? profitMargin.toFixed(2) : '-'}
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
                    <div key={data.fuelType} style={{ marginBottom: 24 }}>
                      <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '12px' }}>{data.fuelName}</Text>
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Statistic 
                            title="Остаток на базе"
                            value={data.baseBalance}
                            precision={2}
                            suffix="л"
                            valueStyle={{ color: data.baseBalance > 0 ? '#3f8600' : '#cf1322' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic 
                            title="Остаток на бункеровщике"
                            value={data.bunkerBalance}
                            precision={2}
                            suffix="л"
                            valueStyle={{ color: data.bunkerBalance > 0 ? '#3f8600' : '#cf1322' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic 
                            title="Прибыль"
                            value={data.profit}
                            precision={2}
                            prefix="₽"
                            valueStyle={{ color: data.profit > 0 ? '#3f8600' : '#cf1322' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic 
                            title="Объем продаж"
                            value={data.sold}
                            precision={2}
                            suffix="л"
                          />
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
                    onClick={exportToExcel}
                    type="primary"
                  >
                    Экспорт в Excel
                  </Button>
                  <Button 
                    icon={<FilterOutlined />} 
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
                      onChange={(dates) => setDateRange(dates ? [dates[0], dates[1]] : undefined)}
                      placeholder={['Начальная дата', 'Конечная дата']}
                    />
                    <Space style={{ marginTop: 8 }} wrap>
                      <Button 
                        size="small" 
                        onClick={() => {
                          const today = dayjs();
                          setDateRange([today, today]);
                        }}
                      >
                        Сегодня
                      </Button>
                      <Button 
                        size="small" 
                        onClick={() => {
                          const today = dayjs();
                          const weekAgo = today.subtract(7, 'day');
                          setDateRange([weekAgo, today]);
                        }}
                      >
                        Неделя
                      </Button>
                      <Button 
                        size="small" 
                        onClick={() => {
                          const today = dayjs();
                          const monthAgo = today.subtract(1, 'month');
                          setDateRange([monthAgo, today]);
                        }}
                      >
                        Месяц
                      </Button>
                      <Button 
                        size="small" 
                        onClick={() => setDateRange(undefined)}
                      >
                        Все время
                      </Button>
                    </Space>
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
                      onChange={(value) => setFilterTransactionType(value as FuelTransactionType | null)}
                    >
                      <Option value="purchase">Покупка</Option>
                      <Option value="sale">Продажа с катера</Option>
                      <Option value="bunker_sale">Продажа с причала</Option>
                      {currentUser.role === 'admin' && (
                        <>
                          <Option value="base_to_bunker">Перемещение с базы на бункеровщик</Option>
                          <Option value="bunker_to_base">Перемещение с бункеровщика на базу</Option>
                        </>
                      )}
                    </Select>
                  </Col>
                </Row>
              </Space>
              
              <Table 
                columns={advancedMode ? advancedColumns : columns} 
                dataSource={transactions} 
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showTotal: (total: number) => `Всего ${total} записей`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  showQuickJumper: true
                }}
                scroll={{ x: 'max-content' }}
                rowClassName={() => 'fuel-table-row'}
                onChange={handleTableChange}
                loading={loading}
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
                <Option value="sale">Продажа с катера</Option>
                <Option value="bunker_sale">Продажа с причала</Option>
                <Option value="base_to_bunker">Перемещение с базы на бункеровщик</Option>
                <Option value="bunker_to_base">Перемещение с бункеровщика на базу</Option>
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
                return (type === 'purchase' || type === 'sale' || type === 'bunker_sale') ? (
                  <Form.Item
                    name="price"
                    label="Цена (₽/л)"
                    rules={[{ required: true, message: 'Введите цену' }]}
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
                  <Form.Item name="supplier" label="Поставщик" rules={[{ required: true, message: 'Укажите поставщика' }]}> 
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
                return (type === 'sale' || type === 'bunker_sale') ? (
                  <>
                    <Form.Item name="customer" label="Покупатель" rules={[{ required: true, message: 'Укажите покупателя' }]}> 
                      <Input placeholder="Укажите покупателя" />
                    </Form.Item>
                    {type === 'sale' && (
                      <Form.Item name="vessel" label="Название катера" rules={[{ required: true, message: 'Укажите название катера' }]}> 
                        <Input placeholder="Укажите название катера" />
                      </Form.Item>
                    )}
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
              <Input.TextArea rows={2} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Подтвердите удаление операции"
          open={deleteModalVisible}
          onOk={handleConfirmDelete}
          onCancel={handleCancelDelete}
          okText="Удалить"
          cancelText="Отмена"
          okButtonProps={{ danger: true }}
        >
          {transactionToDelete && (
            <div>
              <p>Вы действительно хотите удалить эту операцию?</p>
              <ul>
                <li><b>Тип:</b> {(() => {
                  switch(transactionToDelete.type) {
                    case 'purchase': return 'Покупка';
                    case 'sale': return 'Продажа с катера';
                    case 'bunker_sale': return 'Продажа с причала';
                    case 'base_to_bunker': return 'Перемещение с базы на бункеровщик';
                    case 'bunker_to_base': return 'Перемещение с бункеровщика на базу';
                    default: return transactionToDelete.type;
                  }
                })()}</li>
                <li><b>Топливо:</b> {FUEL_TYPES.find(t => t.value === transactionToDelete.fuelType)?.label || transactionToDelete.fuelType}</li>
                <li><b>Объем:</b> {transactionToDelete.volume} л</li>
                <li><b>Дата:</b> {typeof transactionToDelete.date === 'string' ? transactionToDelete.date : ''}</li>
              </ul>
            </div>
          )}
        </Modal>

        <Card title="Архив операций за день" style={{ marginTop: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <AntdDatePicker
              value={selectedArchiveDate}
              onChange={setSelectedArchiveDate}
              placeholder="Выберите дату"
              style={{ width: 200 }}
              allowClear
            />
            {selectedArchiveDate && (
              <Table
                columns={advancedMode ? advancedColumns : columns}
                dataSource={archiveDayTransactions}
                pagination={false}
                rowClassName={() => 'fuel-table-row'}
                scroll={{ x: 'max-content' }}
                style={{ marginTop: 16 }}
              />
            )}
            {selectedArchiveDate && archiveDayTransactions.length > 0 && (
              <Card title={`Статистика за ${selectedArchiveDate.format('DD.MM.YYYY')}`} size="small" style={{ marginTop: 16 }}>
                {(() => {
                  const dayStats = calcStatsForTransactions(archiveDayTransactions);
                  // Сводная таблица по видам топлива
                  const fuelTypes = Array.from(new Set(archiveDayTransactions.map(t => t.fuelType)));
                  const fuelRows = fuelTypes.map(fuelType => {
                    const fuelTrans = archiveDayTransactions.filter(t => t.fuelType === fuelType);
                    const purchased = fuelTrans.filter(t => t.type === 'purchase').reduce((sum, t) => sum + (t.volume || 0), 0);
                    const sold = fuelTrans.filter(t => t.type === 'sale').reduce((sum, t) => sum + (t.volume || 0), 0);
                    const purchaseCost = fuelTrans.filter(t => t.type === 'purchase').reduce((sum, t) => sum + (t.totalCost || 0), 0);
                    const saleIncome = fuelTrans.filter(t => t.type === 'sale').reduce((sum, t) => sum + (t.totalCost || 0), 0);
                    const profit = sold * (purchased > 0 ? purchaseCost / purchased : 0) > 0 ? saleIncome - sold * (purchaseCost / purchased) : 0;
                    return { fuelType, purchased, sold, profit };
                  });
                  return (
                    <div>
                      <Row gutter={[16, 16]}>
                        <Col span={12}><Statistic title="Куплено" value={dayStats.totalPurchased} precision={2} suffix="л" /></Col>
                        <Col span={12}><Statistic title="Продано" value={dayStats.totalSold} precision={2} suffix="л" /></Col>
                        <Col span={24}><Statistic title="Прибыль" value={dayStats.profit} precision={2} prefix="₽" valueStyle={{ color: dayStats.profit > 0 ? '#3f8600' : '#cf1322' }} /></Col>
                      </Row>
                      <div style={{ marginTop: 16 }}>
                        <Table
                          size="small"
                          pagination={false}
                          columns={[
                            { title: 'Топливо', dataIndex: 'fuelType', key: 'fuelType', render: v => FUEL_TYPES.find(f => f.value === v)?.label || v },
                            { title: 'Куплено (л)', dataIndex: 'purchased', key: 'purchased', render: v => v.toFixed(2) },
                            { title: 'Продано (л)', dataIndex: 'sold', key: 'sold', render: v => v.toFixed(2) },
                            { title: 'Прибыль (₽)', dataIndex: 'profit', key: 'profit', render: v => <span style={{ color: v > 0 ? '#3f8600' : '#cf1322' }}>{v.toFixed(2)}</span> }
                          ]}
                          dataSource={fuelRows}
                          rowKey={row => String(row.fuelType || '')}
                        />
                      </div>
                    </div>
                  );
                })()}
              </Card>
            )}
          </Space>
        </Card>

        <style>{`
          .fuel-table-row {
            height: 48px !important;
            font-size: 15px;
          }
          .ant-table-cell {
            white-space: nowrap;
          }
          .ant-table-cell .ant-tag {
            margin-right: 0;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
};

export default FuelTrading; 