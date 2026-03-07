import React, { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Notice from '../components/Notice.jsx';
import { homeBannersApi } from '../api/index.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { Icon } from '../components/Icons.jsx';

const emptyForm = {
  title: '',
  subtitle: '',
  image_url: '',
  button_text: '',
  button_link: '',
  sort_order: 0,
  is_active: true
};

const HomeBannersPage = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const { t } = useI18n();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await homeBannersApi.list(1, 200);
      setItems(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || t('errors.pages_load'));
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
        String(item.title || '').toLowerCase().includes(term) ||
        String(item.subtitle || '').toLowerCase().includes(term)
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
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      image_url: form.image_url.trim(),
      button_text: form.button_text.trim() || null,
      button_link: form.button_link.trim() || null,
      sort_order: Number(form.sort_order || 0),
      is_active: Boolean(form.is_active)
    };

    try {
      if (editingId) {
        await homeBannersApi.update(editingId, payload);
        setNotice(t('home_banners.updated'));
      } else {
        await homeBannersApi.create(payload);
        setNotice(t('home_banners.created'));
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message || t('errors.pages_save'));
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({
      title: row.title || '',
      subtitle: row.subtitle || '',
      image_url: row.image_url || '',
      button_text: row.button_text || '',
      button_link: row.button_link || '',
      sort_order: row.sort_order ?? 0,
      is_active: Boolean(row.is_active)
    });
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(`${t('home_banners.delete_confirm')} "${row.title}"?`);
    if (!confirmed) return;

    setNotice('');
    setError('');
    try {
      await homeBannersApi.remove(row.id);
      setNotice(t('home_banners.deleted'));
      load();
    } catch (err) {
      setError(err.message || t('errors.pages_delete'));
    }
  };

  return (
    <>
      <SectionHeader
        title={t('home_banners.title')}
        subtitle={t('home_banners.subtitle')}
        icon={<Icon name="home_banners" className="icon" />}
        actionLabel={editingId ? t('home_banners.editing') : t('home_banners.create')}
        meta={pagination ? `${t('common.total')}: ${pagination.total}` : ''}
      />

      <Notice type="success" message={notice} />
      <Notice type="error" message={error} />

      <div className="form-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('home_banners.title_label')}</label>
            <input name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('home_banners.subtitle_label')}</label>
            <input name="subtitle" value={form.subtitle} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>{t('home_banners.image_url')}</label>
            <input name="image_url" value={form.image_url} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('home_banners.button_text')}</label>
            <input name="button_text" value={form.button_text} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>{t('home_banners.button_link')}</label>
            <input name="button_link" value={form.button_link} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>{t('home_banners.sort_order')}</label>
            <input type="number" name="sort_order" value={form.sort_order} onChange={handleChange} />
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
          placeholder={t('home_banners.title')}
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
          { key: 'title', label: t('table.title') },
          { key: 'sort_order', label: t('table.sort') },
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
        emptyMessage={t('home_banners.empty')}
      />
    </>
  );
};

export default HomeBannersPage;
