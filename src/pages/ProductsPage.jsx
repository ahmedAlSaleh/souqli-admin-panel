import React, { useEffect, useMemo, useRef, useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Notice from '../components/Notice.jsx';
import AppImage from '../components/AppImage.jsx';
import { productApi, storeApi, subcategoryApi, uploadApi } from '../api/index.js';
import { slugify } from '../utils/slugify.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { Icon } from '../components/Icons.jsx';

const emptyForm = {
  category_id: '',
  name: '',
  slug: '',
  description: '',
  base_price: '',
  currency: 'USD',
  sku: '',
  is_active: true,
  is_new: false,
  is_deal: false,
  deal_price: '',
  deal_start_at: '',
  deal_end_at: '',
  is_popular: false,
  sort_order: 0
};

const emptyStock = {
  quantity: 0,
  reserved_quantity: 0
};

const emptyVariantForm = {
  sku: '',
  price: '',
  stock: 0,
  is_active: true
};

const ProductsPage = () => {
  const [items, setItems] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [attributeError, setAttributeError] = useState('');
  const [storeError, setStoreError] = useState('');
  const [templateAttributes, setTemplateAttributes] = useState([]);
  const [attributeValues, setAttributeValues] = useState({});
  const [templateLoading, setTemplateLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [storeSelections, setStoreSelections] = useState({});
  const [images, setImages] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [stock, setStock] = useState(emptyStock);
  const [variants, setVariants] = useState([]);
  const [variantForm, setVariantForm] = useState(emptyVariantForm);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [search, setSearch] = useState('');
  const { t } = useI18n();
  const previousCategoryRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [productsData, subcatsData, storesData] = await Promise.all([
        productApi.list(1, 50),
        subcategoryApi.list(1, 200),
        storeApi.list(1, 200)
      ]);
      setItems(productsData.items);
      setPagination(productsData.pagination);
      setSubcategories(subcatsData.items || []);
      setStores(storesData.items || []);
    } catch (err) {
      setError(err.message || t('errors.products_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const loadTemplate = async () => {
      if (!form.category_id) {
        setTemplateAttributes([]);
        if (!editingId) setAttributeValues({});
        previousCategoryRef.current = form.category_id;
        return;
      }
      const previous = previousCategoryRef.current;
      if (previous && previous !== form.category_id) {
        setAttributeValues({});
      } else if (!editingId) {
        setAttributeValues({});
      }
      previousCategoryRef.current = form.category_id;
      setTemplateLoading(true);
      try {
        const data = await subcategoryApi.listAttributes(form.category_id);
        setTemplateAttributes(data.items || []);
      } catch (err) {
        setError(err.message || t('errors.products_load'));
      } finally {
        setTemplateLoading(false);
      }
    };

    loadTemplate();
  }, [form.category_id]);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const term = search.toLowerCase();
    return items.filter(
      (item) =>
        String(item.name || '').toLowerCase().includes(term) ||
        String(item.slug || '').toLowerCase().includes(term) ||
        String(item.sku || '').toLowerCase().includes(term)
    );
  }, [items, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setTemplateAttributes([]);
    setAttributeValues({});
    setAttributeError('');
    setStoreSelections({});
    setStoreError('');
    setImages([]);
    setStock(emptyStock);
    setVariants([]);
    setVariantForm(emptyVariantForm);
    setEditingVariantId(null);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleStore = (storeId, checked) => {
    if (checked) setStoreError('');
    setStoreSelections((prev) => {
      if (checked) {
        return {
          ...prev,
          [storeId]: {
            store_id: storeId,
            stock: 0,
            price_override: '',
            is_available: true
          }
        };
      }
      const next = { ...prev };
      delete next[storeId];
      return next;
    });
  };

  const updateStoreField = (storeId, field, value) => {
    setStoreSelections((prev) => ({
      ...prev,
      [storeId]: {
        ...prev[storeId],
        [field]: value
      }
    }));
  };

  const createImageRow = (index = 0, url = '') => ({
    temp_id: `img-${Date.now()}-${Math.random()}`,
    url,
    alt: '',
    is_primary: index === 0,
    sort_order: index
  });

  const updateImageField = (id, field, value) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id || img.temp_id === id ? { ...img, [field]: value } : img))
    );
  };

  const ensurePrimaryImage = (list) => {
    if (!list.length) return list;
    if (list.some((img) => Boolean(img.is_primary))) return list;
    return list.map((img, index) => ({ ...img, is_primary: index === 0 }));
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setError('');
    setImageUploading(true);

    try {
      const uploaded = [];
      for (const file of files) {
        const data = await uploadApi.uploadImage(file, 'products');
        uploaded.push(data.url);
      }
      setImages((prev) => {
        const next = [...prev];
        uploaded.forEach((url) => {
          next.push(createImageRow(next.length, url));
        });
        return ensurePrimaryImage(next);
      });
    } catch (err) {
      setError(err.message || t('errors.image_upload'));
    } finally {
      setImageUploading(false);
      event.target.value = '';
    }
  };

  const setPrimaryImage = (id) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        is_primary: img.id === id || img.temp_id === id
      }))
    );
  };

  const removeImageRow = (id) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id && img.temp_id !== id);
      return ensurePrimaryImage(next);
    });
  };

  const handleStockChange = (event) => {
    const { name, value } = event.target;
    setStock((prev) => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (event) => {
    const { name, value, type, checked } = event.target;
    setVariantForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const loadVariants = async (productId) => {
    try {
      const data = await productApi.listVariants(productId);
      setVariants(data.items || []);
    } catch (err) {
      setError(err.message || t('errors.product_variants_load'));
    }
  };

  const handleVariantSubmit = async (event) => {
    event.preventDefault();
    if (!editingId) return;
    setNotice('');
    setError('');
    const payload = {
      sku: variantForm.sku.trim() || null,
      price: variantForm.price === '' ? null : Number(variantForm.price),
      stock: Number(variantForm.stock || 0),
      is_active: variantForm.is_active
    };
    try {
      if (editingVariantId) {
        await productApi.updateVariant(editingId, editingVariantId, payload);
        setNotice(t('products.variant_updated'));
      } else {
        await productApi.createVariant(editingId, payload);
        setNotice(t('products.variant_created'));
      }
      setVariantForm(emptyVariantForm);
      setEditingVariantId(null);
      loadVariants(editingId);
    } catch (err) {
      setError(err.message || t('errors.product_variants_save'));
    }
  };

  const handleVariantEdit = (variant) => {
    setEditingVariantId(variant.id);
    setVariantForm({
      sku: variant.sku || '',
      price: variant.price ?? '',
      stock: variant.stock ?? 0,
      is_active: Boolean(variant.is_active)
    });
  };

  const handleVariantDelete = async (variant) => {
    if (!editingId) return;
    const ok = window.confirm(`${t('products.variant_delete_confirm')} "${variant.sku || variant.id}"?`);
    if (!ok) return;
    setError('');
    try {
      await productApi.deleteVariant(editingId, variant.id);
      setNotice(t('products.variant_deleted'));
      loadVariants(editingId);
    } catch (err) {
      setError(err.message || t('errors.product_variants_delete'));
    }
  };

  const hasValue = (attr, value) => {
    if (!value) return false;
    if (attr.data_type === 'select') return value.option_id !== null && value.option_id !== undefined && value.option_id !== '';
    if (attr.data_type === 'number') return value.value_number !== null && value.value_number !== undefined && value.value_number !== '';
    if (attr.data_type === 'boolean') return value.value_boolean !== null && value.value_boolean !== undefined;
    if (attr.data_type === 'date') return value.value_date !== null && value.value_date !== undefined && value.value_date !== '';
    return value.value_text !== null && value.value_text !== undefined && value.value_text !== '';
  };

  const buildAttributePayload = (attr, value) => {
    const base = { attribute_id: attr.attribute_id };
    if (attr.data_type === 'select') return { ...base, option_id: value.option_id || null };
    if (attr.data_type === 'number')
      return { ...base, value_number: value.value_number === '' ? null : value.value_number };
    if (attr.data_type === 'boolean') return { ...base, value_boolean: value.value_boolean ?? null };
    if (attr.data_type === 'date')
      return { ...base, value_date: value.value_date === '' ? null : value.value_date };
    return { ...base, value_text: value.value_text === '' ? null : value.value_text };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice('');
    setError('');
    setAttributeError('');
    setStoreError('');

    const requiredMissing = templateAttributes.filter(
      (attr) => attr.is_required && !hasValue(attr, attributeValues[attr.attribute_id])
    );
    if (requiredMissing.length) {
      setAttributeError(t('products.attributes_required'));
      return;
    }

    const selectedStores = Object.values(storeSelections);
    if (!selectedStores.length) {
      setStoreError(t('products.stores_required'));
      return;
    }

    const payload = {
      category_id: Number(form.category_id),
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      base_price: Number(form.base_price || 0),
      currency: form.currency || 'USD',
      sku: form.sku.trim() || null,
      is_active: form.is_active,
      is_new: Boolean(form.is_new),
      is_deal: Boolean(form.is_deal),
      deal_price: form.deal_price === '' ? null : Number(form.deal_price),
      deal_start_at: form.deal_start_at || null,
      deal_end_at: form.deal_end_at || null,
      is_popular: Boolean(form.is_popular),
      sort_order: Number(form.sort_order || 0)
    };

    const attributesPayload = templateAttributes
      .map((attr) => buildAttributePayload(attr, attributeValues[attr.attribute_id] || {}))
      .filter((attrPayload) => {
        const template = templateAttributes.find((item) => item.attribute_id === attrPayload.attribute_id);
        return template && hasValue(template, attributeValues[attrPayload.attribute_id]);
      });

    if (attributesPayload.length) {
      payload.attributes = attributesPayload;
    }

    payload.stores = selectedStores.map((entry) => ({
      store_id: Number(entry.store_id),
      stock: Number(entry.stock || 0),
      price_override: entry.price_override === '' ? null : Number(entry.price_override),
      is_available: Boolean(entry.is_available)
    }));

    const normalizedImages = images
      .filter((img) => String(img.url || '').trim())
      .map((img, index) => ({
        url: String(img.url || '').trim(),
        alt: String(img.alt || '').trim() || null,
        is_primary: Boolean(img.is_primary),
        sort_order: Number(img.sort_order ?? index)
      }));

    if (normalizedImages.length || editingId) {
      payload.images = normalizedImages;
    }

    payload.stock = {
      quantity: Number(stock.quantity || 0),
      reserved_quantity: Number(stock.reserved_quantity || 0)
    };

    try {
      if (editingId) {
        await productApi.update(editingId, payload);
        setNotice(t('products.updated'));
      } else {
        await productApi.create(payload);
        setNotice(t('products.created'));
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message || t('errors.products_save'));
    }
  };

  const handleEdit = async (item) => {
    setEditingId(item.id);
    setError('');
    setAttributeError('');
    setVariants([]);
    setVariantForm(emptyVariantForm);
    setEditingVariantId(null);
    try {
      const product = await productApi.getById(item.id);
      setForm({
        category_id: String(product.category_id || ''),
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        base_price: product.base_price || '',
        currency: product.currency || 'USD',
        sku: product.sku || '',
        is_active: Boolean(product.is_active),
        is_new: Boolean(product.is_new),
        is_deal: Boolean(product.is_deal),
        deal_price: product.deal_price ?? '',
        deal_start_at: product.deal_start_at ? String(product.deal_start_at).slice(0, 10) : '',
        deal_end_at: product.deal_end_at ? String(product.deal_end_at).slice(0, 10) : '',
        is_popular: Boolean(product.is_popular),
        sort_order: product.sort_order ?? 0
      });

      const values = {};
      (product.attributes || []).forEach((attr) => {
        if (attr.data_type === 'select') {
          values[attr.attribute_id] = { option_id: attr.option_id || '' };
        } else if (attr.data_type === 'number') {
          values[attr.attribute_id] = { value_number: attr.value_number ?? '' };
        } else if (attr.data_type === 'boolean') {
          values[attr.attribute_id] = {
            value_boolean: attr.value_boolean === null ? null : Boolean(attr.value_boolean)
          };
        } else if (attr.data_type === 'date') {
          values[attr.attribute_id] = { value_date: attr.value_date || '' };
        } else {
          values[attr.attribute_id] = { value_text: attr.value_text || '' };
        }
      });
      setAttributeValues(values);

      const storeMap = {};
      (product.stores || []).forEach((store) => {
        storeMap[store.store_id] = {
          store_id: store.store_id,
          stock: store.stock ?? 0,
          price_override: store.price_override ?? '',
          is_available: Boolean(store.is_available)
        };
      });
      setStoreSelections(storeMap);
      setStoreError('');

      setImages(
        (product.images || []).map((img, index) => ({
          ...img,
          sort_order: img.sort_order ?? index
        }))
      );
      setStock({
        quantity: product.stock?.quantity ?? 0,
        reserved_quantity: product.stock?.reserved_quantity ?? 0
      });
      await loadVariants(item.id);
    } catch (err) {
      setError(err.message || t('errors.products_load'));
    }
  };

  const handleDelete = async (item) => {
    const ok = window.confirm(`${t('products.delete_confirm')} "${item.name}"?`);
    if (!ok) return;
    setError('');
    try {
      await productApi.remove(item.id);
      setNotice(t('products.deleted'));
      load();
    } catch (err) {
      setError(err.message || t('errors.products_delete'));
    }
  };

  return (
    <>
      <SectionHeader
        title={t('products.title')}
        subtitle={t('products.subtitle')}
        actionLabel={editingId ? t('products.editing') : t('products.create')}
        icon={<Icon name="products" className="icon" />}
        meta={pagination ? `${t('common.total')}: ${pagination.total}` : ''}
      />
      <Notice type="success" message={notice} />
      <Notice type="error" message={error} />
      <Notice type="error" message={attributeError} />
      <Notice type="error" message={storeError} />

      <div className="form-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('products.subcategory')}</label>
            <select name="category_id" value={form.category_id} onChange={handleChange} required>
              <option value="">{t('products.select_subcategory')}</option>
              {subcategories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.parent_name ? `(${item.parent_name})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{t('products.name')}</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('products.slug')}</label>
            <div className="inline-group">
              <input name="slug" value={form.slug} onChange={handleChange} required />
              <button
                className="ghost-button"
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, slug: slugify(prev.name) }))}
              >
                {t('products.auto')}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>{t('products.price')}</label>
            <input
              type="number"
              step="0.01"
              name="base_price"
              value={form.base_price}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>{t('products.currency')}</label>
            <input name="currency" value={form.currency} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>{t('products.sku')}</label>
            <input name="sku" value={form.sku} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>{t('products.sort_order')}</label>
            <input
              type="number"
              name="sort_order"
              value={form.sort_order}
              onChange={handleChange}
            />
          </div>
          <div className="form-group full-width">
            <label>{t('products.description')}</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="3" />
          </div>
          <div className="form-group full-width">
            <label>{t('products.home_sections')}</label>
            <div className="inline-group">
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  name="is_new"
                  checked={form.is_new}
                  onChange={handleChange}
                />
                {t('products.is_new')}
              </label>
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  name="is_popular"
                  checked={form.is_popular}
                  onChange={handleChange}
                />
                {t('products.is_popular')}
              </label>
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  name="is_deal"
                  checked={form.is_deal}
                  onChange={handleChange}
                />
                {t('products.is_deal')}
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>{t('products.deal_price')}</label>
            <input
              type="number"
              step="0.01"
              name="deal_price"
              value={form.deal_price}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>{t('products.deal_start')}</label>
            <input
              type="date"
              name="deal_start_at"
              value={form.deal_start_at}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>{t('products.deal_end')}</label>
            <input
              type="date"
              name="deal_end_at"
              value={form.deal_end_at}
              onChange={handleChange}
            />
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              {t('common.active')}
            </label>
          </div>
          <div className="form-group full-width">
            <label>{t('products.images')}</label>
            {images.length === 0 && (
              <p className="muted">{t('products.no_images')}</p>
            )}
            <div className="inline-group">
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
              {imageUploading && <span className="muted">{t('common.uploading')}</span>}
            </div>
            <div className="image-list">
              {images.map((img, index) => {
                const key = img.id || img.temp_id || index;
                return (
                  <div key={key} className="image-row">
                    <AppImage src={img.url} alt={img.alt || form.name} className="table-thumb" />
                    <input
                      type="text"
                      placeholder={t('products.image_alt')}
                      value={img.alt || ''}
                      onChange={(event) => updateImageField(key, 'alt', event.target.value)}
                    />
                    <label className="checkbox-inline">
                      <input
                        type="radio"
                        name="primary_image"
                        checked={Boolean(img.is_primary)}
                        onChange={() => setPrimaryImage(key)}
                      />
                      {t('products.primary')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={img.sort_order ?? index}
                      onChange={(event) => updateImageField(key, 'sort_order', event.target.value)}
                    />
                    <button
                      className="ghost-button danger"
                      type="button"
                      onClick={() => removeImageRow(key)}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="form-group full-width">
            <label>{t('products.inventory')}</label>
            <div className="inventory-grid">
              <div className="form-group">
                <label>{t('products.quantity')}</label>
                <input
                  type="number"
                  min="0"
                  name="quantity"
                  value={stock.quantity}
                  onChange={handleStockChange}
                />
              </div>
              <div className="form-group">
                <label>{t('products.reserved_quantity')}</label>
                <input
                  type="number"
                  min="0"
                  name="reserved_quantity"
                  value={stock.reserved_quantity}
                  onChange={handleStockChange}
                />
              </div>
            </div>
          </div>
          {templateLoading && <p className="muted full-width">{t('common.loading')}</p>}
          {templateAttributes.length > 0 && (
            <div className="form-group full-width">
              <label>{t('products.attributes')}</label>
              <div className="attribute-grid">
                {templateAttributes.map((attr) => {
                  const value = attributeValues[attr.attribute_id] || {};
                  return (
                    <div key={attr.attribute_id} className="attribute-item">
                      <label>
                        {attr.name}
                        {attr.is_required ? ' *' : ''}
                      </label>
                      {attr.data_type === 'select' ? (
                        <select
                          value={value.option_id || ''}
                          onChange={(event) =>
                            setAttributeValues((prev) => ({
                              ...prev,
                              [attr.attribute_id]: { option_id: event.target.value }
                            }))
                          }
                        >
                          <option value="">{t('products.select_option')}</option>
                          {(attr.options || []).map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.value}
                            </option>
                          ))}
                        </select>
                      ) : attr.data_type === 'number' ? (
                        <input
                          type="number"
                          value={value.value_number ?? ''}
                          onChange={(event) =>
                            setAttributeValues((prev) => ({
                              ...prev,
                              [attr.attribute_id]: { value_number: event.target.value }
                            }))
                          }
                        />
                      ) : attr.data_type === 'boolean' ? (
                        <select
                          value={
                            value.value_boolean === true
                              ? 'true'
                              : value.value_boolean === false
                              ? 'false'
                              : ''
                          }
                          onChange={(event) =>
                            setAttributeValues((prev) => ({
                              ...prev,
                              [attr.attribute_id]: {
                                value_boolean: event.target.value === '' ? null : event.target.value === 'true'
                              }
                            }))
                          }
                        >
                          <option value="">{t('products.select_boolean')}</option>
                          <option value="true">{t('products.boolean_yes')}</option>
                          <option value="false">{t('products.boolean_no')}</option>
                        </select>
                      ) : attr.data_type === 'date' ? (
                        <input
                          type="date"
                          value={value.value_date || ''}
                          onChange={(event) =>
                            setAttributeValues((prev) => ({
                              ...prev,
                              [attr.attribute_id]: { value_date: event.target.value }
                            }))
                          }
                        />
                      ) : (
                        <input
                          type="text"
                          value={value.value_text || ''}
                          onChange={(event) =>
                            setAttributeValues((prev) => ({
                              ...prev,
                              [attr.attribute_id]: { value_text: event.target.value }
                            }))
                          }
                        />
                      )}
                      {attr.unit && <span className="muted">{attr.unit}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="form-group full-width">
            <label>{t('products.stores')}</label>
            {stores.length === 0 ? (
              <p className="muted">{t('products.no_stores')}</p>
            ) : (
              <div className="store-grid">
                {stores.map((store) => {
                  const selected = storeSelections[store.id];
                  return (
                    <div
                      key={store.id}
                      className={`store-card ${selected ? 'selected' : ''}`}
                    >
                      <label className="store-header">
                        <input
                          type="checkbox"
                          checked={Boolean(selected)}
                          onChange={(event) => toggleStore(store.id, event.target.checked)}
                        />
                        <span>
                          {store.name} {store.city ? `- ${store.city}` : ''}
                        </span>
                      </label>
                      {selected && (
                        <div className="store-fields">
                          <div className="form-group">
                            <label>{t('products.store_stock')}</label>
                            <input
                              type="number"
                              min="0"
                              value={selected.stock ?? 0}
                              onChange={(event) =>
                                updateStoreField(store.id, 'stock', event.target.value)
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>{t('products.store_price_override')}</label>
                            <input
                              type="number"
                              step="0.01"
                              value={selected.price_override ?? ''}
                              onChange={(event) =>
                                updateStoreField(store.id, 'price_override', event.target.value)
                              }
                            />
                          </div>
                          <div className="form-group checkbox-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={Boolean(selected.is_available)}
                                onChange={(event) =>
                                  updateStoreField(store.id, 'is_available', event.target.checked)
                                }
                              />
                              {t('products.store_available')}
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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

      <div className="form-card">
        <SectionHeader
          title={t('products.variants')}
          subtitle={t('products.variants_subtitle')}
          actionLabel={editingVariantId ? t('products.variant_editing') : t('products.variant_create')}
          icon={<Icon name="products" className="icon" />}
        />
        {!editingId && <p className="muted">{t('products.variants_hint')}</p>}
        {editingId && (
          <>
            <form className="form-grid" onSubmit={handleVariantSubmit}>
              <div className="form-group">
                <label>{t('products.variant_sku')}</label>
                <input name="sku" value={variantForm.sku} onChange={handleVariantChange} />
              </div>
              <div className="form-group">
                <label>{t('products.variant_price')}</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={variantForm.price}
                  onChange={handleVariantChange}
                />
              </div>
              <div className="form-group">
                <label>{t('products.variant_stock')}</label>
                <input
                  type="number"
                  min="0"
                  name="stock"
                  value={variantForm.stock}
                  onChange={handleVariantChange}
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={variantForm.is_active}
                    onChange={handleVariantChange}
                  />
                  {t('products.variant_active')}
                </label>
              </div>
              <div className="form-actions">
                <button className="primary-button" type="submit">
                  {editingVariantId ? t('common.update') : t('common.create')}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    setVariantForm(emptyVariantForm);
                    setEditingVariantId(null);
                  }}
                >
                  {t('common.clear')}
                </button>
              </div>
            </form>

            <DataTable
              columns={[
                { key: 'id', label: t('table.id') },
                { key: 'sku', label: t('products.variant_sku') },
                { key: 'price', label: t('products.variant_price') },
                { key: 'stock', label: t('products.variant_stock') },
                {
                  key: 'is_active',
                  label: t('table.status'),
                  render: (row) => (row.is_active ? t('status.active') : t('status.inactive'))
                },
                {
                  key: 'actions',
                  label: t('table.actions'),
                  align: 'right',
                  render: (row) => (
                    <div className="row-actions">
                      <button className="ghost-button" type="button" onClick={() => handleVariantEdit(row)}>
                        {t('common.edit')}
                      </button>
                      <button
                        className="ghost-button danger"
                        type="button"
                        onClick={() => handleVariantDelete(row)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  )
                }
              ]}
              rows={variants}
              emptyMessage={t('products.variants_empty')}
            />
          </>
        )}
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder={t('products.search_placeholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <span className="muted">
          {loading ? t('common.loading') : `${filteredItems.length} ${t('common.results')}`}
        </span>
      </div>

      <DataTable
        columns={[
          { key: 'id', label: t('table.id') },
          {
            key: 'primary_image',
            label: t('table.image'),
            render: (row) => <AppImage src={row.primary_image} alt={row.name} className="table-thumb" />
          },
          { key: 'name', label: t('table.product') },
          { key: 'slug', label: t('table.slug') },
          {
            key: 'base_price',
            label: t('table.price'),
            render: (row) => `${row.base_price} ${row.currency || 'USD'}`
          },
          {
            key: 'status',
            label: t('table.status'),
            render: (row) => (row.is_active ? t('status.active') : t('status.inactive'))
          },
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
        rows={filteredItems}
        emptyMessage={t('products.empty')}
      />
    </>
  );
};

export default ProductsPage;
