import React, { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Notice from '../components/Notice.jsx';
import { paymentsApi } from '../api/index.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { Icon } from '../components/Icons.jsx';

const emptyForm = {
  order_id: '',
  payment_method: '',
  transaction_id: '',
  amount: '',
  currency: 'USD',
  status: 'PENDING'
};

const PaymentsPage = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const { t } = useI18n();

  const statusOptions = useMemo(() => ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await paymentsApi.list(1, 100, search, statusFilter);
      setItems(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || t('errors.payments_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, statusFilter]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice('');
    setError('');

    const payload = {
      order_id: Number(form.order_id),
      payment_method: form.payment_method.trim() || null,
      transaction_id: form.transaction_id.trim() || null,
      amount: Number(form.amount || 0),
      currency: form.currency.trim() || 'USD',
      status: form.status.trim() || null
    };

    try {
      if (editingId) {
        await paymentsApi.update(editingId, payload);
        setNotice(t('payments.updated'));
      } else {
        await paymentsApi.create(payload);
        setNotice(t('payments.created'));
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message || t('errors.payments_save'));
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({
      order_id: String(row.order_id || ''),
      payment_method: row.payment_method || '',
      transaction_id: row.transaction_id || '',
      amount: row.amount ?? '',
      currency: row.currency || 'USD',
      status: row.status || 'PENDING'
    });
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(`${t('payments.delete_confirm')} #${row.id}?`);
    if (!confirmed) return;

    setNotice('');
    setError('');
    try {
      await paymentsApi.remove(row.id);
      setNotice(t('payments.deleted'));
      load();
    } catch (err) {
      setError(err.message || t('errors.payments_delete'));
    }
  };

  return (
    <>
      <SectionHeader
        title={t('payments.title')}
        subtitle={t('payments.subtitle')}
        icon={<Icon name="payments" className="icon" />}
        meta={pagination ? `${t('common.total')}: ${pagination.total}` : ''}
      />
      <Notice type="success" message={notice} />
      <Notice type="error" message={error} />

      <div className="form-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('payments.order_id')}</label>
            <input type="number" min="1" name="order_id" value={form.order_id} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('payments.payment_method')}</label>
            <input name="payment_method" value={form.payment_method} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>{t('payments.transaction_id')}</label>
            <input name="transaction_id" value={form.transaction_id} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>{t('payments.amount')}</label>
            <input type="number" min="0" step="0.01" name="amount" value={form.amount} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('payments.currency')}</label>
            <input name="currency" value={form.currency} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>{t('table.status')}</label>
            <select name="status" value={form.status} onChange={handleChange}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={loading}>
              {editingId ? t('common.update') : t('common.create')}
            </button>
            <button className="ghost-button" type="button" onClick={resetForm}>
              {t('common.clear')}
            </button>
          </div>
        </form>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder={t('payments.search_placeholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="inline-group">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">{t('payments.status_all')}</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <span className="muted">
            {loading ? t('common.loading') : `${items.length} ${t('common.results')}`}
          </span>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'id', label: t('table.id') },
          { key: 'order_id', label: t('payments.order_id') },
          {
            key: 'customer',
            label: t('table.customer'),
            render: (row) => row.user_email || '-'
          },
          { key: 'payment_method', label: t('payments.payment_method') },
          { key: 'transaction_id', label: t('payments.transaction_id') },
          { key: 'amount', label: t('payments.amount') },
          { key: 'currency', label: t('payments.currency') },
          { key: 'status', label: t('table.status') },
          {
            key: 'actions',
            label: t('table.actions'),
            align: 'right',
            render: (row) => (
              <div className="row-actions">
                <button className="ghost-button" type="button" onClick={() => handleEdit(row)}>
                  {t('common.edit')}
                </button>
                <button className="ghost-button danger" type="button" onClick={() => handleDelete(row)}>
                  {t('common.delete')}
                </button>
              </div>
            )
          }
        ]}
        rows={items}
        emptyMessage={t('payments.empty')}
      />
    </>
  );
};

export default PaymentsPage;
