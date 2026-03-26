import React, { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Notice from '../components/Notice.jsx';
import OptionsPanel from '../components/OptionsPanel.jsx';
import { categoryApi, subcategoryApi, attributeApi } from '../api/index.js';
import { slugify } from '../utils/slugify.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { Icon } from '../components/Icons.jsx';

const emptyForm = {
  name: '',
  slug: '',
  parent_id: '',
  is_active: true,
  sort_order: 0
};

const SubcategoriesPage = ({ onCategoriesChanged }) => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [parents, setParents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [templateCategoryId, setTemplateCategoryId] = useState('');
  const [templateItems, setTemplateItems] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState('');
  const [globalAttributes, setGlobalAttributes] = useState([]);
  const [selectedAttributeId, setSelectedAttributeId] = useState('');
  const [selectedRequired, setSelectedRequired] = useState(false);
  const [selectedSortOrder, setSelectedSortOrder] = useState(0);
  const [optionAttribute, setOptionAttribute] = useState(null);

  const { t } = useI18n();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [subs, cats] = await Promise.all([
        subcategoryApi.list(1, 200),
        categoryApi.list(1, 200)
      ]);
      setItems(subs.items || []);
      setPagination(subs.pagination || null);
      setParents(cats.items || []);
      if (!templateCategoryId && (subs.items || []).length) {
        setTemplateCategoryId(String(subs.items[0].id));
      }
    } catch (err) {
      setError(err.message || t('errors.subcategories_load'));
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalAttributes = async () => {
    try {
      const data = await attributeApi.list(1, 200);
      setGlobalAttributes(data.items || []);
    } catch (err) {
      // ignore here, handled by template section
    }
  };

  useEffect(() => {
    load();
    loadGlobalAttributes();
  }, []);

  const loadTemplate = async (categoryId) => {
    if (!categoryId) return;
    setTemplateLoading(true);
    setTemplateError('');
    try {
      const data = await subcategoryApi.listAttributes(categoryId);
      setTemplateItems(data.items || []);
    } catch (err) {
      setTemplateError(err.message || t('errors.subcategory_attributes_load'));
    } finally {
      setTemplateLoading(false);
    }
  };

  useEffect(() => {
    if (templateCategoryId) {
      loadTemplate(templateCategoryId);
    }
  }, [templateCategoryId]);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const term = search.toLowerCase();
    return items.filter(
      (item) =>
        String(item.name || '').toLowerCase().includes(term) ||
        String(item.slug || '').toLowerCase().includes(term) ||
        String(item.parent_name || '').toLowerCase().includes(term)
    );
  }, [items, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice('');
    setError('');

    if (!form.parent_id) {
      setError(t('subcategories.parent_required'));
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      parent_id: Number(form.parent_id),
      is_active: form.is_active,
      sort_order: Number(form.sort_order || 0)
    };

    try {
      if (editingId) {
        await categoryApi.update(editingId, payload);
        setNotice(t('subcategories.updated'));
      } else {
        await categoryApi.create(payload);
        setNotice(t('subcategories.created'));
      }
      resetForm();
      load();
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err) {
      setError(err.message || t('errors.subcategories_save'));
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      slug: item.slug || '',
      parent_id: item.parent_id ? String(item.parent_id) : '',
      is_active: Boolean(item.is_active),
      sort_order: item.sort_order || 0
    });
  };

  const handleDelete = async (item) => {
    const ok = window.confirm(`${t('subcategories.delete_confirm')} "${item.name}"?`);
    if (!ok) return;
    setError('');
    try {
      await categoryApi.remove(item.id);
      setNotice(t('subcategories.deleted'));
      load();
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err) {
      setError(err.message || t('errors.subcategories_delete'));
    }
  };

  const availableAttributes = useMemo(() => {
    const linked = new Set(templateItems.map((item) => Number(item.attribute_id)));
    return globalAttributes.filter((attr) => !linked.has(Number(attr.id)));
  }, [globalAttributes, templateItems]);

  const handleAttach = async (event) => {
    event.preventDefault();
    if (!templateCategoryId || !selectedAttributeId) return;
    setTemplateError('');
    try {
      await subcategoryApi.attachAttribute(templateCategoryId, {
        attribute_id: Number(selectedAttributeId),
        is_required: selectedRequired,
        sort_order: Number(selectedSortOrder || 0)
      });
      setSelectedAttributeId('');
      setSelectedRequired(false);
      setSelectedSortOrder(0);
      loadTemplate(templateCategoryId);
    } catch (err) {
      setTemplateError(err.message || t('errors.subcategory_attributes_save'));
    }
  };

  const handleToggleRequired = async (item) => {
    try {
      await subcategoryApi.updateAttribute(templateCategoryId, item.map_id, {
        is_required: !item.is_required
      });
      setTemplateItems((prev) =>
        prev.map((row) =>
          row.map_id === item.map_id ? { ...row, is_required: !row.is_required } : row
        )
      );
    } catch (err) {
      setTemplateError(err.message || t('errors.subcategory_attributes_save'));
    }
  };

  const handleSortOrder = async (item, value) => {
    const order = Number(value || 0);
    setTemplateItems((prev) =>
      prev.map((row) => (row.map_id === item.map_id ? { ...row, sort_order: order } : row))
    );
    try {
      await subcategoryApi.updateAttribute(templateCategoryId, item.map_id, {
        sort_order: order
      });
    } catch (err) {
      setTemplateError(err.message || t('errors.subcategory_attributes_save'));
    }
  };

  const handleRemoveAttribute = async (item) => {
    const ok = window.confirm(`${t('subcategories.attribute_remove')} "${item.name}"?`);
    if (!ok) return;
    setTemplateError('');
    try {
      await subcategoryApi.removeAttribute(templateCategoryId, item.map_id);
      loadTemplate(templateCategoryId);
    } catch (err) {
      setTemplateError(err.message || t('errors.subcategory_attributes_save'));
    }
  };

  return (
    <>
      <SectionHeader
        title={t('subcategories.title')}
        subtitle={t('subcategories.subtitle')}
        actionLabel={editingId ? t('subcategories.editing') : t('subcategories.create')}
        icon={<Icon name="subcategories" className="icon" />}
        meta={pagination ? `${t('common.total')}: ${pagination.total}` : ''}
      />
      <Notice type="success" message={notice} />
      <Notice type="error" message={error} />

      <div className="form-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('subcategories.name')}</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('subcategories.slug')}</label>
            <div className="inline-group">
              <input name="slug" value={form.slug} onChange={handleChange} required />
              <button
                className="ghost-button"
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, slug: slugify(prev.name) }))}
              >
                {t('subcategories.auto')}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>{t('subcategories.parent')}</label>
            <select name="parent_id" value={form.parent_id} onChange={handleChange} required>
              <option value="">{t('subcategories.select_parent')}</option>
              {parents
                .filter((item) => Number(item.id) !== Number(editingId))
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="form-group">
            <label>{t('subcategories.sort_order')}</label>
            <input
              type="number"
              name="sort_order"
              value={form.sort_order}
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
          placeholder={t('subcategories.search_placeholder')}
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
          { key: 'name', label: t('table.name') },
          { key: 'slug', label: t('table.slug') },
          { key: 'parent_name', label: t('table.parent') },
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
        emptyMessage={t('subcategories.empty')}
      />

      <SectionHeader
        title={t('subcategories.attributes_title')}
        subtitle={t('subcategories.attributes_subtitle')}
        icon={<Icon name="attributes" className="icon" />}
      />
      <Notice type="error" message={templateError} />

      <div className="form-card">
        <div className="form-grid">
          <div className="form-group">
            <label>{t('subcategories.select_subcategory')}</label>
            <select
              value={templateCategoryId}
              onChange={(event) => setTemplateCategoryId(event.target.value)}
            >
              <option value="">{t('subcategories.select_subcategory_placeholder')}</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{t('subcategories.add_attribute')}</label>
            <select
              value={selectedAttributeId}
              onChange={(event) => setSelectedAttributeId(event.target.value)}
            >
              <option value="">{t('subcategories.select_attribute')}</option>
              {availableAttributes.map((attr) => (
                <option key={attr.id} value={attr.id}>
                  {attr.name} ({attr.code})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{t('subcategories.sort_order')}</label>
            <input
              type="number"
              value={selectedSortOrder}
              onChange={(event) => setSelectedSortOrder(event.target.value)}
            />
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={selectedRequired}
                onChange={(event) => setSelectedRequired(event.target.checked)}
              />
              {t('subcategories.required')}
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-button" type="button" onClick={handleAttach}>
              {t('subcategories.attach')}
            </button>
          </div>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: t('table.name') },
          {
            key: 'data_type',
            label: t('table.type'),
            render: (row) => {
              const key = `data_types.${row.data_type}`;
              const label = t(key);
              return label === key ? row.data_type : label;
            }
          },
          {
            key: 'is_required',
            label: t('subcategories.required'),
            render: (row) => (
              <label className="inline-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(row.is_required)}
                  onChange={() => handleToggleRequired(row)}
                />
              </label>
            )
          },
          {
            key: 'sort_order',
            label: t('table.sort'),
            render: (row) => (
              <input
                type="number"
                className="inline-input"
                value={row.sort_order || 0}
                onChange={(event) => handleSortOrder(row, event.target.value)}
              />
            )
          },
          {
            key: 'actions',
            label: t('table.actions'),
            align: 'right',
            render: (row) => (
              <div className="row-actions">
                {row.data_type === 'select' && (
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => setOptionAttribute({ id: row.attribute_id, name: row.name })}
                  >
                    {t('subcategories.manage_options')}
                  </button>
                )}
                <button className="ghost-button danger" type="button" onClick={() => handleRemoveAttribute(row)}>
                  {t('common.delete')}
                </button>
              </div>
            )
          }
        ]}
        rows={templateItems}
        emptyMessage={
          templateLoading ? t('common.loading') : t('subcategories.attributes_empty')
        }
      />

      <OptionsPanel attribute={optionAttribute} onClose={() => setOptionAttribute(null)} />
    </>
  );
};

export default SubcategoriesPage;
