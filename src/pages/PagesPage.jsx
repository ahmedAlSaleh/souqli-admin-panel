import React, { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Notice from '../components/Notice.jsx';
import { pagesApi } from '../api/index.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { Icon } from '../components/Icons.jsx';

const emptyForm = {
  key: '',
  title: '',
  content: ''
};

const PagesPage = () => {
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
      const data = await pagesApi.list(1, 200);
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
        String(item.key || '').toLowerCase().includes(term) ||
        String(item.title || '').toLowerCase().includes(term)
    );
  }, [items, search]);

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
      key: form.key.trim(),
      title: form.title.trim(),
      content: form.content.trim()
    };

    try {
      if (editingId) {
        await pagesApi.update(editingId, payload);
        setNotice(t('pages.updated'));
      } else {
        await pagesApi.create(payload);
        setNotice(t('pages.created'));
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
      key: row.key || '',
      title: row.title || '',
      content: row.content || ''
    });
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(`${t('pages.delete_confirm')} "${row.title}"?`);
    if (!confirmed) return;

    setNotice('');
    setError('');
    try {
      await pagesApi.remove(row.id);
      setNotice(t('pages.deleted'));
      load();
    } catch (err) {
      setError(err.message || t('errors.pages_delete'));
    }
  };

  return (
    <>
      <SectionHeader
        title={t('pages.title')}
        subtitle={t('pages.subtitle')}
        icon={<Icon name="pages" className="icon" />}
        actionLabel={editingId ? t('pages.editing') : t('pages.create')}
        meta={pagination ? `${t('common.total')}: ${pagination.total}` : ''}
      />

      <Notice type="success" message={notice} />
      <Notice type="error" message={error} />

      <div className="form-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('table.key')}</label>
            <input name="key" value={form.key} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('table.title')}</label>
            <input name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-group full-width">
            <label>{t('pages.content')}</label>
            <textarea name="content" rows="5" value={form.content} onChange={handleChange} required />
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
          placeholder={t('pages.search_placeholder')}
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
          { key: 'key', label: t('table.key') },
          { key: 'updated_at', label: t('table.updated') },
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
        emptyMessage={t('pages.empty')}
      />
    </>
  );
};

export default PagesPage;
