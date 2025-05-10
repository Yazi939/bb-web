import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Table, Typography, Space } from 'antd';
import { useFuelMetrics } from '../../hooks/useFuelMetrics';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { fuelService } from '../../services/api';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const Dashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | undefined>(undefined);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const response: any = await fuelService.getTransactions();
      let data: any[] = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (Array.isArray(response?.data)) {
        data = response.data;
      } else if (Array.isArray(response?.data?.transactions)) {
        data = response.data.transactions;
      }
      setAllTransactions(data);
    })();
  }, []);

  const metrics = useFuelMetrics(allTransactions, dateRange);

  const columns: ColumnsType<any> = [
    {
      title: 'Тип топлива',
      dataIndex: 'fuelType',
      key: 'fuelType',
    },
    {
      title: 'Продано',
      dataIndex: 'sold',
      key: 'sold',
      render: (value: number) => typeof value === 'number' && !isNaN(value) ? value.toFixed(2) : '-',
    },
    {
      title: 'Закуплено',
      dataIndex: 'purchased',
      key: 'purchased',
      render: (value: number) => typeof value === 'number' && !isNaN(value) ? value.toFixed(2) : '-',
    },
    {
      title: 'Перемещено',
      dataIndex: 'transferred',
      key: 'transferred',
      render: (value: number) => typeof value === 'number' && !isNaN(value) ? value.toFixed(2) : '-',
    },
    {
      title: 'Корректировки',
      dataIndex: 'adjusted',
      key: 'adjusted',
      render: (value: number) => typeof value === 'number' && !isNaN(value) ? value.toFixed(2) : '-',
    },
    {
      title: 'Текущий остаток',
      dataIndex: 'currentBalance',
      key: 'currentBalance',
      render: (value: number) => typeof value === 'number' && !isNaN(value) ? value.toFixed(2) : '-',
    },
  ];

  const tableData = Object.entries(metrics.fuelTypeStats).map(([fuelType, stats]) => ({
    key: fuelType,
    fuelType,
    ...stats
  }));

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Дашборд</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates || undefined)}
          style={{ marginBottom: 16 }}
        />

        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Общий остаток"
                value={metrics.totalBalance}
                suffix="л"
                precision={2}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Остаток на базе"
                value={metrics.baseBalance}
                suffix="л"
                precision={2}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Остаток на бункеровщике"
                value={metrics.bunkerBalance}
                suffix="л"
                precision={2}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Маржа"
                value={metrics.profitMargin}
                suffix="%"
                precision={2}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Продано"
                value={metrics.totalSold}
                suffix="л"
                precision={2}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Закуплено"
                value={metrics.totalPurchased}
                suffix="л"
                precision={2}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Перемещено"
                value={metrics.totalTransferred}
                suffix="л"
                precision={2}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Корректировки"
                value={metrics.totalAdjusted}
                suffix="л"
                precision={2}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Доход от продаж"
                value={metrics.totalSaleIncome}
                suffix="₽"
                precision={2}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Затраты на закупку"
                value={metrics.totalPurchaseCost}
                suffix="₽"
                precision={2}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Прибыль"
                value={metrics.totalProfit}
                suffix="₽"
                precision={2}
                valueStyle={{ color: metrics.totalProfit >= 0 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="Статистика по типам топлива">
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
          />
        </Card>
      </Space>
    </div>
  );
};

export default Dashboard; 