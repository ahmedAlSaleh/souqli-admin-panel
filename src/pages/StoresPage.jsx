import React, { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Notice from '../components/Notice.jsx';
import AppImage from '../components/AppImage.jsx';
import { productApi, storeApi, uploadApi } from '../api/index.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { Icon } from '../components/Icons.jsx';

const emptyStoreForm = {
  name: '',
  logo_url: '',
  whatsapp: '',
  address: '',
  city: ''
};

const emptyPhoneForm = {
  phone: '',
  label: '',
  is_primary: false
};

const emptyStoreProductForm = {
  product_id: '',
  stock: 0,
  price_override: '',
  is_available: true
};

const buildDefaultHours = () =>
  Array.from({ length: 7 }, (_, index) => ({
    day_of_week: index,
    open_time: '',
    close_time: '',
    is_closed: false
  }));

const StoresPage = () => {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [form, setForm] = useState(emptyStoreForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('phones');

  const [phones, setPhones] = useState([]);
  const [phoneForm, setPhoneForm] = useState(emptyPhoneForm);
  const [editingPhoneId, setEditingPhoneId] = useState(null);

  const [hours, setHours] = useState(buildDefaultHours);

  const [products, setProducts] = useState([]);
  const [storeProducts, setStoreProducts] = useState([]);
  const [storeProductForm, setStoreProductForm] = useState(emptyStoreProductForm);
  const [editingStoreProductId, setEditingStoreProductId] = useState(null);

  const dayLabels = useMemo(
    () => [
      t('stores.days.sun'),
      t('stores.days.mon'),
      t('stores.days.tue'),
      t('stores.days.wed'),
      t('stores.days.thu'),
      t('stores.days.fri'),
      t('stores.days.sat')
    ],
    [t]
  );

  const loadStores = async (query = search) => {
    setLoading(true);
    setError('');
    try {
      const data = await storeApi.list(1, 200, query);
      setItems(data.items || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message || t('errors.stores_load'));
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productApi.list(1, 200);
      setProducts(data.items || []);
    } catch (err) {
      // Optional list for store products; keep UI usable.
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadStores(search);
  }, [search]);

  const resetForm = () => {
    setForm(emptyStoreForm);
    setEditingId(null);
    setTab('phones');
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
      name: form.name.trim(),
      logo_url: form.logo_url.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null
    };

    try {
      if (editingId) {
        await storeApi.update(editingId, payload);
        setNotice(t('stores.updated'));
      } else {
        await storeApi.create(payload);
        setNotice(t('stores.created'));
      }
      resetForm();
      await loadStores();
    } catch (err) {
      setError(err.message || t('errors.stores_save'));
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setLogoUploading(true);
    try {
      const data = await uploadApi.uploadImage(file, 'stores');
      setForm((prev) => ({ ...prev, logo_url: data.url || '' }));
    } catch (err) {
      setError(err.message || t('errors.image_upload'));
    } finally {
      setLogoUploading(false);
      event.target.value = '';
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      logo_url: item.logo_url || '',
      whatsapp: item.whatsapp || '',
      address: item.address || '',
      city: item.city || ''
    });
    setTab('phones');
  };

  const handleDelete = async (item) => {
    const ok = window.confirm(`${t('stores.delete_confirm')} "${item.name}"?`);
    if (!ok) return;
    setError('');
    try {
      await storeApi.remove(item.id);
      setNotice(t('stores.deleted'));
      if (editingId === item.id) {
        resetForm();
        setPhones([]);
        setHours(buildDefaultHours());
        setStoreProducts([]);
      }
      loadStores();
    } catch (err) {
      setError(err.message || t('errors.stores_delete'));
    }
  };

  const loadPhones = async (storeId) => {
    try {
      const data = await storeApi.listPhones(storeId);
      setPhones(data.items || []);
    } catch (err) {
      setError(err.message || t('errors.stores_phones_load'));
    }
  };

  const loadHours = async (storeId) => {
    try {
      const data = await storeApi.listHours(storeId);
      const map = new Map((data.items || []).map((item) => [Number(item.day_of_week), item]));
      const merged = Array.from({ length: 7 }, (_, index) => {
        const item = map.get(index);
        return {
          day_of_week: index,
          open_time: item?.open_time ? item.open_time.slice(0, 5) : '',
          close_time: item?.close_time ? item.close_time.slice(0, 5) : '',
          is_closed: item ? Boolean(item.is_closed) : false
        };
      });
      setHours(merged);
    } catch (err) {
      setError(err.message || t('errors.stores_hours_load'));
    }
  };

  const loadStoreProducts = async (storeId) => {
    try {
      const data = await storeApi.listProducts(storeId, 1, 200);
      setStoreProducts(data.items || []);
    } catch (err) {
      setError(err.message || t('errors.stores_products_load'));
    }
  };

  useEffect(() => {
    if (!editingId) return;
    loadPhones(editingId);
    loadHours(editingId);
    loadStoreProducts(editingId);
    setPhoneForm(emptyPhoneForm);
    setEditingPhoneId(null);
    setStoreProductForm(emptyStoreProductForm);
    setEditingStoreProductId(null);
  }, [editingId]);

  const handlePhoneChange = (event) => {
    const { name, value, type, checked } = event.target;
    setPhoneForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePhoneSubmit = async (event) => {
    event.preventDefault();
    if (!editingId) return;
    setNotice('');
    setError('');
    const payload = {
      phone: phoneForm.phone.trim(),
      label: phoneForm.label.trim() || null,
      is_primary: phoneForm.is_primary
    };
    try {
      if (editingPhoneId) {
        await storeApi.updatePhone(editingId, editingPhoneId, payload);
        setNotice(t('stores.phone_updated'));
      } else {
        await storeApi.createPhone(editingId, payload);
        setNotice(t('stores.phone_created'));
      }
      setPhoneForm(emptyPhoneForm);
      setEditingPhoneId(null);
      loadPhones(editingId);
    } catch (err) {
      setError(err.message || t('errors.stores_phones_save'));
    }
  };

  const handlePhoneEdit = (phone) => {
    setEditingPhoneId(phone.id);
    setPhoneForm({
      phone: phone.phone || '',
      label: phone.label || '',
      is_primary: Boolean(phone.is_primary)
    });
  };

  const handlePhoneDelete = async (phone) => {
    if (!editingId) return;
    const ok = window.confirm(`${t('stores.phone_delete_confirm')} "${phone.phone}"?`);
    if (!ok) return;
    setError('');
    try {
      await storeApi.deletePhone(editingId, phone.id);
      setNotice(t('stores.phone_deleted'));
      loadPhones(editingId);
    } catch (err) {
      setError(err.message || t('errors.stores_phones_delete'));
    }
  };

  const handleHourChange = (index, field, value) => {
    setHours((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: field === 'is_closed' ? value : value } : item
      )
    );
  };

  const handleSaveHours = async () => {
    if (!editingId) return;
    setNotice('');
    setError('');
    const payload = hours.map((item) => ({
      day_of_week: item.day_of_week,
      open_time: item.is_closed ? null : item.open_time || null,
      close_time: item.is_closed ? null : item.close_time || null,
      is_closed: item.is_closed
    }));
    try {
      await storeApi.upsertHours(editingId, { hours: payload });
      setNotice(t('stores.hours_saved'));
      loadHours(editingId);
    } catch (err) {
      setError(err.message || t('errors.stores_hours_save'));
    }
  };

  const handleStoreProductChange = (event) => {
    const { name, value, type, checked } = event.target;
    setStoreProductForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleStoreProductSubmit = async (event) => {
    event.preventDefault();
    if (!editingId) return;
    setNotice('');
    setError('');
    if (!storeProductForm.product_id) {
      setError(t('stores.select_product'));
      return;
    }
    const payload = {
      product_id: Number(storeProductForm.product_id),
      stock: Number(storeProductForm.stock || 0),
      price_override:
        storeProductForm.price_override === '' ? null : Number(storeProductForm.price_override),
      is_available: storeProductForm.is_available
    };
    try {
      if (editingStoreProductId) {
        await storeApi.updateProduct(editingId, editingStoreProductId, payload);
        setNotice(t('stores.store_product_updated'));
      } else {
        await storeApi.attachProduct(editingId, payload);
        setNotice(t('stores.store_product_created'));
      }
      setStoreProductForm(emptyStoreProductForm);
      setEditingStoreProductId(null);
      loadStoreProducts(editingId);
    } catch (err) {
      setError(err.message || t('errors.stores_products_save'));
    }
  };

  const handleStoreProductEdit = (item) => {
    setEditingStoreProductId(item.id);
    setStoreProductForm({
      product_id: String(item.product_id),
      stock: item.stock ?? 0,
      price_override: item.price_override ?? '',
      is_available: Boolean(item.is_available)
    });
  };

  const handleStoreProductDelete = async (item) => {
    if (!editingId) return;
    const ok = window.confirm(`${t('stores.store_product_delete_confirm')} "${item.product_name}"?`);
    if (!ok) return;
    setError('');
    try {
      await storeApi.removeProduct(editingId, item.id);
      setNotice(t('stores.store_product_deleted'));
      loadStoreProducts(editingId);
    } catch (err) {
      setError(err.message || t('errors.stores_products_delete'));
    }
  };

  return (
    <>
      <SectionHeader
        title={t('stores.title')}
        subtitle={t('stores.subtitle')}
        actionLabel={editingId ? t('stores.editing') : t('stores.create')}
        icon={<Icon name="stores" className="icon" />}
        meta={pagination ? `${t('common.total')}: ${pagination.total}` : ''}
      />
      <Notice type="success" message={notice} />
      <Notice type="error" message={error} />

      <div className="form-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('stores.name')}</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('stores.city')}</label>
            <input name="city" value={form.city} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>{t('stores.logo')}</label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} />
            {logoUploading && <span className="muted">{t('common.uploading')}</span>}
            <div className="image-preview-row">
              <AppImage src={form.logo_url} alt={form.name || t('stores.name')} className="table-thumb" />
              {form.logo_url && (
                <button
                  className="ghost-button danger"
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, logo_url: '' }))}
                >
                  {t('common.remove_image')}
                </button>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>{t('stores.whatsapp')}</label>
            <input name="whatsapp" value={form.whatsapp} onChange={handleChange} />
          </div>
          <div className="form-group full-width">
            <label>{t('stores.address')}</label>
            <textarea name="address" rows="2" value={form.address} onChange={handleChange} />
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
          placeholder={t('stores.search_placeholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <span className="muted">
          {loading ? t('common.loading') : `${items.length} ${t('common.results')}`}
        </span>
      </div>

      <DataTable
        columns={[
          { key: 'id', label: t('table.id') },
          {
            key: 'logo_url',
            label: t('table.image'),
            render: (row) => <AppImage src={row.logo_url} alt={row.name} className="table-thumb" />
          },
          { key: 'name', label: t('table.name') },
          { key: 'city', label: t('table.city') },
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
        emptyMessage={t('stores.empty')}
      />

      <div className="tab-bar">
        <button
          className={`tab-button ${tab === 'phones' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('phones')}
        >
          {t('stores.phones_title')}
        </button>
        <button
          className={`tab-button ${tab === 'hours' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('hours')}
        >
          {t('stores.hours_title')}
        </button>
        <button
          className={`tab-button ${tab === 'products' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('products')}
        >
          {t('stores.products_title')}
        </button>
      </div>

      {!editingId && <p className="muted">{t('stores.select_store_hint')}</p>}

      {editingId && tab === 'phones' && (
        <div className="card-stack">
          <div className="form-card">
            <form className="form-grid" onSubmit={handlePhoneSubmit}>
              <div className="form-group">
                <label>{t('stores.phone')}</label>
                <input name="phone" value={phoneForm.phone} onChange={handlePhoneChange} required />
              </div>
              <div className="form-group">
                <label>{t('stores.phone_label')}</label>
                <input name="label" value={phoneForm.label} onChange={handlePhoneChange} />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_primary"
                    checked={phoneForm.is_primary}
                    onChange={handlePhoneChange}
                  />
                  {t('stores.phone_primary')}
                </label>
              </div>
              <div className="form-actions">
                <button className="primary-button" type="submit">
                  {editingPhoneId ? t('common.update') : t('common.create')}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    setPhoneForm(emptyPhoneForm);
                    setEditingPhoneId(null);
                  }}
                >
                  {t('common.clear')}
                </button>
              </div>
            </form>
          </div>

          <DataTable
            columns={[
              { key: 'id', label: t('table.id') },
              { key: 'phone', label: t('stores.phone') },
              { key: 'label', label: t('stores.phone_label') },
              {
                key: 'is_primary',
                label: t('stores.phone_primary'),
                render: (row) => (row.is_primary ? t('common.active') : t('common.inactive'))
              },
              {
                key: 'actions',
                label: t('table.actions'),
                align: 'right',
                render: (row) => (
                  <div className="row-actions">
                    <button className="ghost-button" type="button" onClick={() => handlePhoneEdit(row)}>
                      {t('common.edit')}
                    </button>
                    <button
                      className="ghost-button danger"
                      type="button"
                      onClick={() => handlePhoneDelete(row)}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                )
              }
            ]}
            rows={phones}
            emptyMessage={t('stores.phones_empty')}
          />
        </div>
      )}

      {editingId && tab === 'hours' && (
        <div className="form-card">
          <div className="hours-grid">
            {hours.map((item, index) => (
              <div key={item.day_of_week} className="hours-row">
                <div className="hours-day">{dayLabels[index]}</div>
                <input
                  type="time"
                  value={item.open_time}
                  disabled={item.is_closed}
                  onChange={(event) => handleHourChange(index, 'open_time', event.target.value)}
                />
                <input
                  type="time"
                  value={item.close_time}
                  disabled={item.is_closed}
                  onChange={(event) => handleHourChange(index, 'close_time', event.target.value)}
                />
                <label className="checkbox-inline">
                  <input
                    type="checkbox"
                    checked={item.is_closed}
                    onChange={(event) => handleHourChange(index, 'is_closed', event.target.checked)}
                  />
                  {t('stores.closed')}
                </label>
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button className="primary-button" type="button" onClick={handleSaveHours}>
              {t('stores.hours_save')}
            </button>
          </div>
        </div>
      )}

      {editingId && tab === 'products' && (
        <div className="card-stack">
          <div className="form-card">
            <form className="form-grid" onSubmit={handleStoreProductSubmit}>
              <div className="form-group">
                <label>{t('stores.select_product')}</label>
                <select
                  name="product_id"
                  value={storeProductForm.product_id}
                  onChange={handleStoreProductChange}
                  required
                >
                  <option value="">{t('stores.select_product_placeholder')}</option>
                  {products.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t('stores.stock')}</label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  value={storeProductForm.stock}
                  onChange={handleStoreProductChange}
                />
              </div>
              <div className="form-group">
                <label>{t('stores.price_override')}</label>
                <input
                  type="number"
                  step="0.01"
                  name="price_override"
                  value={storeProductForm.price_override}
                  onChange={handleStoreProductChange}
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_available"
                    checked={storeProductForm.is_available}
                    onChange={handleStoreProductChange}
                  />
                  {t('stores.is_available')}
                </label>
              </div>
              <div className="form-actions">
                <button className="primary-button" type="submit">
                  {editingStoreProductId ? t('common.update') : t('stores.attach_product')}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    setStoreProductForm(emptyStoreProductForm);
                    setEditingStoreProductId(null);
                  }}
                >
                  {t('common.clear')}
                </button>
              </div>
            </form>
          </div>

          <DataTable
            columns={[
              { key: 'id', label: t('table.id') },
              { key: 'product_name', label: t('table.product') },
              { key: 'stock', label: t('table.stock') },
              {
                key: 'price_override',
                label: t('stores.price_override'),
                render: (row) => (row.price_override !== null ? row.price_override : '-')
              },
              {
                key: 'is_available',
                label: t('stores.is_available'),
                render: (row) => (row.is_available ? t('status.active') : t('status.inactive'))
              },
              {
                key: 'actions',
                label: t('table.actions'),
                align: 'right',
                render: (row) => (
                  <div className="row-actions">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => handleStoreProductEdit(row)}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      className="ghost-button danger"
                      type="button"
                      onClick={() => handleStoreProductDelete(row)}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                )
              }
            ]}
            rows={storeProducts}
            emptyMessage={t('stores.products_empty')}
          />
        </div>
      )}
    </>
  );
};

export default StoresPage;
