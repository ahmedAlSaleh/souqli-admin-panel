import React, { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Notice from '../components/Notice.jsx';
import { logsApi } from '../api/index.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { Icon } from '../components/Icons.jsx';

const RecordsPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    entity_type: '',
    user_id: '',
    date_from: '',
    date_to: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useI18n();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await logsApi.list(1, 100, {
        ...filters,
        user_id: filters.user_id ? Number(filters.user_id) : ''
      });
      setLogs(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || t('errors.logs_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.search, filters.action, filters.entity_type, filters.user_id, filters.date_from, filters.date_to]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <SectionHeader
        title={t('records.title')}
        subtitle={t('records.subtitle')}
        icon={<Icon name="records" className="icon" />}
        meta={pagination ? `${t('common.total')}: ${pagination.total}` : ''}
      />
      <Notice type="error" message={error} />

      <div className="form-card">
        <div className="form-grid">
          <div className="form-group">
            <label>{t('filters.search_label')}</label>
            <input
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder={t('records.search_placeholder')}
            />
          </div>
          <div className="form-group">
            <label>{t('table.action')}</label>
            <input name="action" value={filters.action} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>{t('table.entity')}</label>
            <input name="entity_type" value={filters.entity_type} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>{t('table.user')}</label>
            <input type="number" min="1" name="user_id" value={filters.user_id} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>{t('records.date_from')}</label>
            <input type="date" name="date_from" value={filters.date_from} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>{t('records.date_to')}</label>
            <input type="date" name="date_to" value={filters.date_to} onChange={handleChange} />
          </div>
          <div className="form-actions">
            <button
              className="ghost-button"
              type="button"
              onClick={() =>
                setFilters({
                  search: '',
                  action: '',
                  entity_type: '',
                  user_id: '',
                  date_from: '',
                  date_to: ''
                })
              }
            >
              {t('common.clear')}
            </button>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <span className="muted">
          {loading ? t('common.loading') : `${logs.length} ${t('common.results')}`}
        </span>
      </div>

      <DataTable
        columns={[
          { key: 'id', label: t('table.id') },
          { key: 'user_email', label: t('table.user') },
          { key: 'action', label: t('table.action') },
          { key: 'entity_type', label: t('table.entity') },
          { key: 'entity_id', label: t('table.id') },
          { key: 'created_at', label: t('table.timestamp'), align: 'right' }
        ]}
        rows={logs}
        emptyMessage={t('records.empty')}
      />
    </>
  );
};

export default RecordsPage;
