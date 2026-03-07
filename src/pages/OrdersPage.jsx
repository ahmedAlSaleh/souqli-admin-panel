import React, { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Notice from '../components/Notice.jsx';
import { adminOrdersApi } from '../api/index.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { Icon } from '../components/Icons.jsx';

const OrdersPage = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [storesLoading, setStoresLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [nextStatusId, setNextStatusId] = useState('');
  const [itemStoreOptions, setItemStoreOptions] = useState({});
  const [itemStoreSelection, setItemStoreSelection] = useState({});
  const [assigningItemId, setAssigningItemId] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const { t } = useI18n();

  const loadStatuses = async () => {
    try {
      const data = await adminOrdersApi.listStatuses();
      setStatuses(data.items || []);
    } catch (err) {
      setError(err.message || t('errors.orders_load'));
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminOrdersApi.list(1, 100, search, statusFilter);
      setItems(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || t('errors.orders_load'));
    } finally {
      setLoading(false);
    }
  };

  const loadOrderItemStores = async (order) => {
    if (!order || !Array.isArray(order.items) || !order.items.length) {
      setItemStoreOptions({});
      setItemStoreSelection({});
      return;
    }

    setStoresLoading(true);
    try {
      const pairs = await Promise.all(
        order.items.map(async (item) => {
          const data = await adminOrdersApi.listItemStores(order.id, item.id);
          return [item.id, data.stores || []];
        })
      );

      const optionsMap = {};
      const selectionMap = {};

      pairs.forEach(([itemId, stores]) => {
        optionsMap[itemId] = stores;
        const selected = stores.find((store) => store.is_selected);
        selectionMap[itemId] = selected ? String(selected.store_id) : '';
      });

      setItemStoreOptions(optionsMap);
      setItemStoreSelection(selectionMap);
    } catch (err) {
      setError(err.message || t('errors.orders_store_load'));
    } finally {
      setStoresLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [search, statusFilter]);

  const handleOpenOrder = async (orderId) => {
    setDetailsLoading(true);
    setError('');
    setNotice('');
    try {
      const order = await adminOrdersApi.getById(orderId);
      setSelectedOrder(order);
      setNextStatusId(order.status_id ? String(order.status_id) : '');
      await loadOrderItemStores(order);
    } catch (err) {
      setError(err.message || t('errors.orders_load'));
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !nextStatusId) return;
    setError('');
    setNotice('');
    try {
      await adminOrdersApi.updateStatus(selectedOrder.id, { status_id: Number(nextStatusId) });
      setNotice(t('orders.status_updated'));
      await Promise.all([handleOpenOrder(selectedOrder.id), loadOrders()]);
    } catch (err) {
      setError(err.message || t('errors.orders_status_save'));
    }
  };

  const handleAssignStore = async (item) => {
    if (!selectedOrder) return;

    const selected = itemStoreSelection[item.id] || '';
    const storeId = selected ? Number(selected) : null;

    setAssigningItemId(item.id);
    setError('');
    setNotice('');
    try {
      await adminOrdersApi.assignItemStore(selectedOrder.id, item.id, storeId);
      setNotice(storeId ? t('orders.store_assigned') : t('orders.store_unassigned'));
      await Promise.all([handleOpenOrder(selectedOrder.id), loadOrders()]);
    } catch (err) {
      setError(err.message || t('errors.orders_store_save'));
    } finally {
      setAssigningItemId(null);
    }
  };

  const formatAddress = (order) => {
    const parts = [
      order.address_label,
      order.address_country,
      order.address_city,
      order.address_street,
      order.address_postal_code
    ].filter(Boolean);
    return parts.join(' - ');
  };

  return (
    <>
      <SectionHeader
        title={t('orders.title')}
        subtitle={t('orders.subtitle')}
        icon={<Icon name="orders" className="icon" />}
        meta={pagination ? `${t('common.total')}: ${pagination.total}` : ''}
      />
      <Notice type="success" message={notice} />
      <Notice type="error" message={error} />

      <div className="toolbar">
        <input
          type="text"
          placeholder={t('orders.search_placeholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="inline-group">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">{t('orders.status_filter_all')}</option>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
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
          { key: 'id', label: t('table.order_id') },
          {
            key: 'customer',
            label: t('table.customer'),
            render: (row) => row.user_full_name || row.user_email
          },
          { key: 'status_name', label: t('table.status') },
          {
            key: 'total_amount',
            label: t('table.total'),
            render: (row) => `${row.total_amount} ${row.currency || 'USD'}`
          },
          { key: 'created_at', label: t('table.date') },
          {
            key: 'actions',
            label: t('table.actions'),
            align: 'right',
            render: (row) => (
              <button className="ghost-button" type="button" onClick={() => handleOpenOrder(row.id)}>
                {t('orders.view')}
              </button>
            )
          }
        ]}
        rows={items}
        emptyMessage={t('orders.empty')}
      />

      {(selectedOrder || detailsLoading) && (
        <div className="form-card">
          <SectionHeader
            title={t('orders.details_title')}
            subtitle={selectedOrder ? `#${selectedOrder.id}` : t('common.loading')}
            icon={<Icon name="orders" className="icon" />}
          />

          {detailsLoading && <p className="muted">{t('common.loading')}</p>}

          {selectedOrder && !detailsLoading && (
            <div className="card-stack">
              <div className="details-grid">
                <div>
                  <strong>{t('table.customer')}:</strong>{' '}
                  {selectedOrder.user_full_name || '-'} ({selectedOrder.user_email || '-'})
                </div>
                <div>
                  <strong>{t('table.total')}:</strong> {selectedOrder.total_amount}{' '}
                  {selectedOrder.currency || 'USD'}
                </div>
                <div>
                  <strong>{t('table.status')}:</strong> {selectedOrder.status_name}
                </div>
                <div>
                  <strong>{t('orders.address')}:</strong>{' '}
                  {formatAddress(selectedOrder) || t('orders.no_address')}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>{t('orders.update_status')}</label>
                  <select value={nextStatusId} onChange={(event) => setNextStatusId(event.target.value)}>
                    <option value="">{t('orders.select_status')}</option>
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-actions">
                  <button className="primary-button" type="button" onClick={handleUpdateStatus}>
                    {t('orders.save_status')}
                  </button>
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
                  { key: 'unit_price', label: t('products.price') },
                  { key: 'line_total', label: t('table.total') },
                  {
                    key: 'store_name',
                    label: t('orders.assigned_store'),
                    render: (row) => row.store_name || t('orders.unassigned')
                  },
                  {
                    key: 'assign_store',
                    label: t('orders.assign_store'),
                    render: (row) => {
                      const storeRows = itemStoreOptions[row.id] || [];
                      const isBusy = storesLoading || assigningItemId === row.id;
                      return (
                        <div className="inline-group">
                          <select
                            value={itemStoreSelection[row.id] || ''}
                            onChange={(event) =>
                              setItemStoreSelection((prev) => ({
                                ...prev,
                                [row.id]: event.target.value
                              }))
                            }
                            disabled={isBusy}
                          >
                            <option value="">{t('orders.unassigned')}</option>
                            {storeRows.map((store) => (
                              <option
                                key={store.store_id}
                                value={store.store_id}
                                disabled={!store.can_assign && !store.is_selected}
                              >
                                {store.store_name} ({t('orders.available_qty')}: {store.available_qty})
                              </option>
                            ))}
                          </select>
                          <button
                            className="ghost-button"
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleAssignStore(row)}
                          >
                            {isBusy ? t('common.loading') : t('common.apply')}
                          </button>
                        </div>
                      );
                    }
                  }
                ]}
                rows={selectedOrder.items || []}
                emptyMessage={t('orders.items_empty')}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default OrdersPage;
