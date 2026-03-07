import React, { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Notice from '../components/Notice.jsx';
import { categoryApi } from '../api/index.js';
import { slugify } from '../utils/slugify.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { Icon } from '../components/Icons.jsx';

const emptyForm = {
  name: '',
  slug: '',
  image_url: '',
  is_active: true,
  sort_order: 0
};

const CategoriesPage = ({ onCategoriesChanged }) => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const { t } = useI18n();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await categoryApi.list(1, 200);
      const mains = (data.items || []).filter((item) => !item.parent_id);
      setItems(mains);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message || t('errors.categories_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const term = search.toLowerCase();
    return items.filter(
      (item) =>
        String(item.name || '').toLowerCase().includes(term) ||
        String(item.slug || '').toLowerCase().includes(term)
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

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
      sort_order: Number(form.sort_order || 0)
    };

    try {
      if (editingId) {
        await categoryApi.update(editingId, payload);
        setNotice(t('main_categories.updated'));
      } else {
        await categoryApi.create(payload);
        setNotice(t('main_categories.created'));
      }
      resetForm();
      load();
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err) {
      setError(err.message || t('errors.categories_save'));
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      slug: item.slug || '',
      image_url: item.image_url || '',
      is_active: Boolean(item.is_active),
      sort_order: item.sort_order || 0
    });
  };

  const handleDelete = async (item) => {
    const ok = window.confirm(`${t('main_categories.delete_confirm')} "${item.name}"?`);
    if (!ok) return;
    setError('');
    try {
      await categoryApi.remove(item.id);
      setNotice(t('main_categories.deleted'));
      load();
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err) {
      setError(err.message || t('errors.categories_delete'));
    }
  };

  return (
    <>
      <SectionHeader
        title={t('main_categories.title')}
        subtitle={t('main_categories.subtitle')}
        actionLabel={editingId ? t('main_categories.editing') : t('main_categories.create')}
        icon={<Icon name="categories" className="icon" />}
        meta={pagination ? `${t('common.total')}: ${pagination.total}` : ''}
      />
      <Notice type="success" message={notice} />
      <Notice type="error" message={error} />

      <div className="form-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('main_categories.name')}</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('main_categories.slug')}</label>
            <div className="inline-group">
              <input name="slug" value={form.slug} onChange={handleChange} required />
              <button
                className="ghost-button"
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, slug: slugify(prev.name) }))}
              >
                {t('main_categories.auto')}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>{t('main_categories.image_url')}</label>
            <input
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="form-group">
            <label>{t('main_categories.sort_order')}</label>
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
          placeholder={t('main_categories.search_placeholder')}
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
            key: 'image',
            label: t('table.image'),
            render: (row) =>
              row.image_url ? (
                <img src={row.image_url} alt={row.name} className="table-thumb" />
              ) : (
                <span className="muted">-</span>
              )
          },
          { key: 'name', label: t('table.name') },
          { key: 'slug', label: t('table.slug') },
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
        emptyMessage={t('main_categories.empty')}
      />
    </>
  );
};

export default CategoriesPage;
