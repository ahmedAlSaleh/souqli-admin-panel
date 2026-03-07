import React, { useEffect, useState } from 'react';
import StatCard from '../components/StatCard.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Notice from '../components/Notice.jsx';
import { categoryApi, productApi, logsApi, ordersApi } from '../api/index.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { Icon } from '../components/Icons.jsx';

const statusPill = (value, t) => {
  const normalized = String(value).toLowerCase();
  let className = 'pill';
  if (['active', 'completed', 'paid', 'live'].includes(normalized)) className += ' pill-success';
  if (['pending', 'processing'].includes(normalized)) className += ' pill-warning';
  if (['inactive', 'canceled', 'rejected', 'out of stock'].includes(normalized))
    className += ' pill-danger';
  const labelMap = {
    active: t('status.active'),
    inactive: t('status.inactive'),
    pending: t('status.pending'),
    processing: t('status.processing'),
    completed: t('status.completed'),
    canceled: t('status.canceled'),
    rejected: t('status.rejected'),
    'out of stock': t('status.out_of_stock')
  };
  return <span className={className}>{labelMap[normalized] || value}</span>;
};

const DashboardPage = () => {
  const [stats, setStats] = useState([]);
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const { t } = useI18n();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [catData, prodData, logsData] = await Promise.all([
          categoryApi.list(1, 1),
          productApi.list(1, 1),
          logsApi.list(1, 5)
        ]);
        setStats([
          {
            label: t('dashboard.stats_categories'),
            value: String(catData.pagination.total),
            change: t('dashboard.stats_categories_meta')
          },
          {
            label: t('dashboard.stats_products'),
            value: String(prodData.pagination.total),
            change: t('dashboard.stats_products_meta')
          },
          {
            label: t('dashboard.stats_logs'),
            value: String(logsData.pagination.total),
            change: t('dashboard.stats_logs_meta')
          }
        ]);
        setLogs(logsData.items || []);
      } catch (err) {
        setError(err.message || t('errors.dashboard_load'));
      }
    };

    const loadOrders = async () => {
      try {
        const data = await ordersApi.listMy(1, 5);
        setOrders(data.items || []);
      } catch (err) {
        // Orders are optional for admin users. Ignore if empty or missing.
      }
    };

    loadStats();
    loadOrders();
  }, [t]);

  return (
    <>
      <Notice type="error" message={error} />
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={stat.label} {...stat} index={index} />
        ))}
      </div>

      <div className="two-col">
        <div className="card highlight">
          <h3>{t('dashboard.sales_title')}</h3>
          <p className="muted">{t('dashboard.sales_desc')}</p>
          <div className="progress-list">
            <div>
              <div className="progress-label">{t('dashboard.progress_electronics')}</div>
              <div className="progress">
                <span style={{ width: '72%' }} />
              </div>
            </div>
            <div>
              <div className="progress-label">{t('dashboard.progress_fashion')}</div>
              <div className="progress">
                <span style={{ width: '48%' }} />
              </div>
            </div>
            <div>
              <div className="progress-label">{t('dashboard.progress_home')}</div>
              <div className="progress">
                <span style={{ width: '34%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card highlight">
          <h3>{t('dashboard.focus_title')}</h3>
          <ul className="checklist">
            {t('dashboard.focus_items').map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button className="primary-button" type="button">
            {t('dashboard.open_tasks')}
          </button>
        </div>
      </div>

      <SectionHeader
        title={t('dashboard.latest_orders')}
        subtitle={t('dashboard.latest_orders_subtitle')}
        icon={<Icon name="orders" className="icon" />}
      />
      <DataTable
        columns={[
          { key: 'id', label: t('table.order_id') },
          {
            key: 'status_name',
            label: t('table.status'),
            render: (row) => statusPill(row.status_name, t)
          },
          { key: 'total_amount', label: t('table.total') },
          { key: 'created_at', label: t('table.date'), align: 'right' }
        ]}
        rows={orders}
        emptyMessage={t('orders.empty')}
      />

      <SectionHeader
        title={t('dashboard.activity_title')}
        subtitle={t('dashboard.activity_subtitle')}
        icon={<Icon name="records" className="icon" />}
      />
      <DataTable
        columns={[
          { key: 'user_email', label: t('table.user') },
          { key: 'action', label: t('table.action') },
          { key: 'entity_type', label: t('table.entity') },
          { key: 'created_at', label: t('table.timestamp'), align: 'right' }
        ]}
        rows={logs}
        emptyMessage={t('records.empty')}
      />
    </>
  );
};

export default DashboardPage;
