import React, { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Notice from '../components/Notice.jsx';
import { cartsApi } from '../api/index.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { Icon } from '../components/Icons.jsx';

const CartsPage = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedCart, setSelectedCart] = useState(null);
  const [error, setError] = useState('');
  const { t } = useI18n();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await cartsApi.list(1, 100, search, statusFilter);
      setItems(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || t('errors.carts_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, statusFilter]);

  const handleOpenCart = async (id) => {
    setDetailsLoading(true);
    setError('');
    try {
      const cart = await cartsApi.getById(id);
      setSelectedCart(cart);
    } catch (err) {
      setError(err.message || t('errors.carts_load'));
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <>
      <SectionHeader
        title={t('carts.title')}
        subtitle={t('carts.subtitle')}
        icon={<Icon name="carts" className="icon" />}
        meta={pagination ? `${t('common.total')}: ${pagination.total}` : ''}
      />
      <Notice type="error" message={error} />

      <div className="toolbar">
        <input
          type="text"
          placeholder={t('carts.search_placeholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="inline-group">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">{t('carts.status_all')}</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="CONVERTED">CONVERTED</option>
            <option value="ABANDONED">ABANDONED</option>
          </select>
          <span className="muted">
            {loading ? t('common.loading') : `${items.length} ${t('common.results')}`}
          </span>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'id', label: t('table.id') },
          {
            key: 'user_email',
            label: t('table.customer'),
            render: (row) => row.user_email || row.session_id || '-'
          },
          { key: 'status', label: t('table.status') },
          { key: 'item_count', label: t('carts.items_count') },
          { key: 'subtotal', label: t('table.total') },
          { key: 'updated_at', label: t('table.updated') },
          {
            key: 'actions',
            label: t('table.actions'),
            align: 'right',
            render: (row) => (
              <button className="ghost-button" type="button" onClick={() => handleOpenCart(row.id)}>
                {t('carts.view')}
              </button>
            )
          }
        ]}
        rows={items}
        emptyMessage={t('carts.empty')}
      />

      {(selectedCart || detailsLoading) && (
        <div className="form-card">
          <SectionHeader
            title={t('carts.details_title')}
            subtitle={selectedCart ? `#${selectedCart.id}` : t('common.loading')}
            icon={<Icon name="carts" className="icon" />}
          />

          {detailsLoading && <p className="muted">{t('common.loading')}</p>}

          {selectedCart && !detailsLoading && (
            <div className="card-stack">
              <div className="details-grid">
                <div>
                  <strong>{t('table.customer')}:</strong>{' '}
                  {selectedCart.user_email || selectedCart.session_id || '-'}
                </div>
                <div>
                  <strong>{t('table.status')}:</strong> {selectedCart.status}
                </div>
                <div>
                  <strong>{t('carts.items_count')}:</strong> {selectedCart.item_count}
                </div>
                <div>
                  <strong>{t('table.total')}:</strong> {selectedCart.subtotal}
                </div>
              </div>

              <DataTable
                columns={[
                  { key: 'id', label: t('table.id') },
                  { key: 'name', label: t('table.product') },
                  {
                    key: 'variant_sku',
                    label: t('products.variant_sku'),
                    render: (row) => row.variant_sku || '-'
                  },
                  { key: 'quantity', label: t('table.stock') },
                  { key: 'unit_price', label: t('products.price') }
                ]}
                rows={selectedCart.items || []}
                emptyMessage={t('carts.items_empty')}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CartsPage;
