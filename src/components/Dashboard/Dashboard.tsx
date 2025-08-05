import React, { useState, useEffect } from 'react';
import { Card, Statistic, DatePicker, Table, Typography, Space } from 'antd';
import { useFuelMetrics } from '../../hooks/useFuelMetrics';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { fuelService } from '../../services/api';
import styles from './Dashboard.module.css';

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
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <Title level={2} className={styles.headerTitle}>Дашборд</Title>
        <div className={styles.datePickerContainer}>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates || undefined)}
          />
        </div>
      </div>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div className={styles.metricsGrid}>
          <Card className={styles.metricCard}>
            <Statistic
              title="Общий остаток"
              value={metrics.totalBalance}
              suffix="л"
              precision={2}
            />
          </Card>
          <Card className={styles.metricCard}>
            <Statistic
              title="Остаток на базе"
              value={metrics.baseBalance}
              suffix="л"
              precision={2}
            />
          </Card>
          <Card className={styles.metricCard}>
            <Statistic
              title="Остаток на бункеровщике"
              value={metrics.bunkerBalance}
              suffix="л"
              precision={2}
            />
          </Card>
          <Card className={styles.metricCard}>
            <Statistic
              title="Маржа"
              value={metrics.profitMargin}
              suffix="%"
              precision={2}
            />
          </Card>
        </div>

        <div className={styles.metricsGrid}>
          <Card className={styles.metricCard}>
            <Statistic
              title="Продано"
              value={metrics.totalSold}
              suffix="л"
              precision={2}
            />
          </Card>
          <Card className={styles.metricCard}>
            <Statistic
              title="Закуплено"
              value={metrics.totalPurchased}
              suffix="л"
              precision={2}
            />
          </Card>
          <Card className={styles.metricCard}>
            <Statistic
              title="Перемещено"
              value={metrics.totalTransferred}
              suffix="л"
              precision={2}
            />
          </Card>
          <Card className={styles.metricCard}>
            <Statistic
              title="Корректировки"
              value={metrics.totalAdjusted}
              suffix="л"
              precision={2}
            />
          </Card>
        </div>

        <div className={styles.secondaryMetrics}>
          <Card className={`${styles.secondaryCard} ${styles.revenue}`}>
            <Statistic
              title="Доход от продаж"
              value={metrics.totalSaleIncome}
              suffix="₽"
              precision={2}
            />
          </Card>
          <Card className={`${styles.secondaryCard} ${styles.cost}`}>
            <Statistic
              title="Затраты на закупку"
              value={metrics.totalPurchaseCost}
              suffix="₽"
              precision={2}
            />
          </Card>
          <Card className={`${styles.secondaryCard} ${styles.profit}`}>
            <Statistic
              title="Прибыль"
              value={metrics.totalProfit}
              suffix="₽"
              precision={2}
              valueStyle={{ color: metrics.totalProfit >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </div>

        <div className={styles.tableSection}>
          <div className={styles.tableSectionHeader}>
            <h3 className={styles.tableSectionTitle}>Статистика по типам топлива</h3>
          </div>
          <div className={styles.tableWrapper}>
            <Table
              className={styles.responsiveTable}
              columns={columns}
              dataSource={tableData}
              pagination={false}
            />
          </div>
          
          {/* Мобильные карточки */}
          <div className={styles.mobileCards}>
            {tableData.map((item) => (
              <div key={item.key} className={styles.dataCard}>
                <div className={styles.dataCardHeader}>
                  <h4>{item.fuelType}</h4>
                </div>
                <div className={styles.dataCardContent}>
                  <div className={styles.dataCardField}>
                    <span className={styles.dataCardLabel}>Продано:</span>
                    <span className={styles.dataCardValue}>
                      {typeof item.sold === 'number' && !isNaN(item.sold) ? item.sold.toFixed(2) : '-'} л
                    </span>
                  </div>
                  <div className={styles.dataCardField}>
                    <span className={styles.dataCardLabel}>Закуплено:</span>
                    <span className={styles.dataCardValue}>
                      {typeof item.purchased === 'number' && !isNaN(item.purchased) ? item.purchased.toFixed(2) : '-'} л
                    </span>
                  </div>
                  <div className={styles.dataCardField}>
                    <span className={styles.dataCardLabel}>Остаток:</span>
                    <span className={styles.dataCardValue}>
                      {typeof item.balance === 'number' && !isNaN(item.balance) ? item.balance.toFixed(2) : '-'} л
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Space>
    </div>
  );
};

export default Dashboard; 