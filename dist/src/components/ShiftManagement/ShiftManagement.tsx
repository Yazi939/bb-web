import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Button, DatePicker, Select, Table, Space, 
  Typography, Row, Col, message, Statistic, Tag, Radio, Modal, InputNumber
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SaveOutlined, DeleteOutlined, CalculatorOutlined } from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { getCurrentUser, checkPermission, rolePermissions } from '../../utils/users';
import type { Shift } from '../../types/shift';
import styles from './ShiftManagement.module.css';
import { shiftService } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const IconProps: Partial<AntdIconProps> = {
  onPointerOverCapture: () => {},
  onPointerOutCapture: () => {}
};

const BASE_SALARY = {
  day: 5500,
  night: 6500,
};

const ShiftManagement: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Константы для расчета бонуса
  const BONUS_PERCENT = 10; // 10% от стоимости сэкономленного топлива

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        pageSize,
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD')
      };
      const response = await shiftService.getShifts(params);
      setShifts(Array.isArray(response) ? response : response.shifts);
      setTotal(Array.isArray(response) ? response.length : response.total);
      console.log('shifts after fetch:', Array.isArray(response) ? response : response.shifts);
    } catch (error) {
      message.error('Ошибка при загрузке смен');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [dateRange, page, pageSize]);

  useEffect(() => {
    console.log('shifts in render:', shifts);
  }, [shifts]);

  const handleDelete = async (id: string) => {
    try {
      await shiftService.deleteShift(id);
      message.success('Смена успешно удалена');
      fetchShifts();
    } catch (error) {
      message.error('Ошибка при удалении смены');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const baseSalary = BASE_SALARY[values.shiftType as 'day' | 'night'];
      const submitValues = { ...values, baseSalary };
      if (editingShift) {
        await shiftService.updateShift(editingShift.id, submitValues);
        message.success('Смена успешно обновлена');
      } else {
        await shiftService.createShift(submitValues);
        message.success('Смена успешно создана');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchShifts();
    } catch (error) {
      message.error('Ошибка при сохранении смены');
    }
  };

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    form.setFieldsValue({
      ...shift,
      date: dayjs(shift.date)
    });
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setEditingShift(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    } else {
      setDateRange(null);
    }
    setPage(1);
  };

  // Обработчик изменения значений в форме
  const handleValuesChange = (changedValues: any, allValues: any) => {
    if (changedValues.fuelSaved || changedValues.fuelPrice) {
      const fuelSaved = allValues.fuelSaved || 0;
      const fuelPrice = allValues.fuelPrice || 0;
      const bonus = (fuelSaved * fuelPrice * BONUS_PERCENT) / 100;
      form.setFieldsValue({ bonus: Math.round(bonus) });
    }
  };

  const columns: ColumnsType<Shift> = [
    {
      title: 'Сотрудник',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'Тип смены',
      dataIndex: 'shiftType',
      key: 'shiftType',
      render: (type: 'day' | 'night') => (
        <Tag color={type === 'day' ? 'blue' : 'purple'}>
          {type === 'day' ? 'Дневная' : 'Ночная'}
        </Tag>
      ),
    },
    {
      title: 'Сэкономлено топлива',
      dataIndex: 'fuelSaved',
      key: 'fuelSaved',
      render: (value: number) => `${value} л`,
    },
    {
      title: 'Бонус',
      dataIndex: 'bonus',
      key: 'bonus',
      render: (value: number) => `${value} ₽`,
    },
    {
      title: 'Базовая зарплата',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      render: (value: number) => `${value} ₽`,
    },
    {
      title: 'Общая зарплата',
      dataIndex: 'totalSalary',
      key: 'totalSalary',
      render: (value: number) => `${value} ₽`,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<SaveOutlined {...IconProps} />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined {...IconProps} />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  const salaryStats = React.useMemo(() => {
    const total = shifts.reduce((sum, s) => sum + (s.baseSalary || 0) + (s.bonus || 0), 0);
    const count = shifts.length;
    const avg = count ? total / count : 0;
    return { total, count, avg };
  }, [shifts]);

  const salaryByDate = React.useMemo(() => {
    const map = new Map<string, number>();
    shifts.forEach(s => {
      const date = dayjs(s.date).format('YYYY-MM-DD');
      const sum = (s.baseSalary || 0) + (s.bonus || 0);
      map.set(date, (map.get(date) || 0) + sum);
    });
    return Array.from(map.entries()).map(([date, value]) => ({ date, value }));
  }, [shifts]);

  return (
    <div className={styles.shiftManagement}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col>
          <Card>
            <Statistic title="Всего к выплате" value={salaryStats.total} suffix="₽" precision={2} />
          </Card>
        </Col>
        <Col>
          <Card>
            <Statistic title="Количество смен" value={salaryStats.count} />
          </Card>
        </Col>
        <Col>
          <Card>
            <Statistic title="Средняя зарплата за смену" value={salaryStats.avg} suffix="₽" precision={2} />
          </Card>
        </Col>
        <Col span={24} style={{ marginTop: 16 }}>
          <Card title="Выплаты по датам" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={salaryByDate}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={4}>Управление сменами</Title>
          </Col>
          <Col>
            <Button type="primary" onClick={handleAdd}>
              Добавить смену
            </Button>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              allowClear
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={shifts}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
          rowKey="id"
        />
      </Card>

      <Modal
        title={editingShift ? 'Редактировать смену' : 'Добавить смену'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleValuesChange}
          initialValues={{
            shiftType: 'day',
            fuelSaved: 0,
            fuelPrice: 0,
            bonus: 0,
          }}
        >
          <Form.Item
            name="employeeName"
            label="Сотрудник"
            rules={[{ required: true, message: 'Введите имя сотрудника' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="date"
            label="Дата"
            rules={[{ required: true, message: 'Выберите дату' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="shiftType"
            label="Тип смены"
            rules={[{ required: true, message: 'Выберите тип смены' }]}
          >
            <Radio.Group>
              <Radio value="day">Дневная <span style={{color:'#888',fontSize:12}}>(5500 ₽)</span></Radio>
              <Radio value="night">Ночная <span style={{color:'#888',fontSize:12}}>(6500 ₽)</span></Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="fuelSaved"
            label="Сэкономлено топлива (л)"
            rules={[{ required: true, message: 'Введите количество топлива' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="fuelPrice"
            label="Цена топлива (₽/л)"
            rules={[{ required: true, message: 'Введите цену топлива' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="bonus"
            label="Бонус (₽)"
            rules={[{ required: true, message: 'Введите бонус' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} disabled />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Примечания"
          >
            <Input.TextArea />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingShift ? 'Сохранить' : 'Добавить'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ShiftManagement; 