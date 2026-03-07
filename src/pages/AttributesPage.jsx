import React, { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Notice from '../components/Notice.jsx';
import OptionsPanel from '../components/OptionsPanel.jsx';
import { attributeApi } from '../api/index.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { Icon } from '../components/Icons.jsx';

const emptyForm = {
  code: '',
  name: '',
  data_type: 'text',
  unit: ''
};

const AttributesPage = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [optionAttribute, setOptionAttribute] = useState(null);
  const { t } = useI18n();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await attributeApi.list(1, 200);
      setItems(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || t('errors.attributes_load'));
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
        String(item.code || '').toLowerCase().includes(term)
    );
  }, [items, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice('');
    setError('');

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      data_type: form.data_type,
      unit: form.unit.trim() || null
    };

    try {
      if (editingId) {
        await attributeApi.update(editingId, payload);
        setNotice(t('attributes.updated'));
      } else {
        await attributeApi.create(payload);
        setNotice(t('attributes.created'));
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message || t('errors.attributes_save'));
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      code: item.code || '',
      name: item.name || '',
      data_type: item.data_type || 'text',
      unit: item.unit || ''
    });
  };

  const handleDelete = async (item) => {
    const ok = window.confirm(`${t('attributes.delete_confirm')} "${item.name}"?`);
    if (!ok) return;
    setError('');
    try {
      await attributeApi.remove(item.id);
      setNotice(t('attributes.deleted'));
      load();
    } catch (err) {
      setError(err.message || t('errors.attributes_delete'));
    }
  };

  return (
    <>
      <SectionHeader
        title={t('attributes.title')}
        subtitle={t('attributes.subtitle')}
        actionLabel={editingId ? t('attributes.editing') : t('attributes.create')}
        icon={<Icon name="attributes" className="icon" />}
        meta={pagination ? `${t('common.total')}: ${pagination.total}` : ''}
      />
      <Notice type="success" message={notice} />
      <Notice type="error" message={error} />

      <div className="form-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('attributes.code')}</label>
            <input name="code" value={form.code} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('attributes.name')}</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('attributes.data_type')}</label>
            <select name="data_type" value={form.data_type} onChange={handleChange}>
              <option value="text">{t('data_types.text')}</option>
              <option value="number">{t('data_types.number')}</option>
              <option value="boolean">{t('data_types.boolean')}</option>
              <option value="date">{t('data_types.date')}</option>
              <option value="select">{t('data_types.select')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{t('attributes.unit')}</label>
            <input name="unit" value={form.unit} onChange={handleChange} />
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
          placeholder={t('attributes.search_placeholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <span className="muted">
          {loading ? t('common.loading') : `${filteredItems.length} ${t('common.results')}`}
        </span>
      </div>

      <DataTable
        columns={[
          { key: 'code', label: t('attributes.code') },
          { key: 'name', label: t('attributes.name') },
          {
            key: 'data_type',
            label: t('attributes.data_type'),
            render: (row) => t(`data_types.${row.data_type}`) || row.data_type
          },
          { key: 'unit', label: t('attributes.unit') },
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
                    onClick={() => setOptionAttribute({ id: row.id, name: row.name })}
                  >
                    {t('attributes.manage_options')}
                  </button>
                )}
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
        emptyMessage={t('attributes.empty')}
      />

      <OptionsPanel attribute={optionAttribute} onClose={() => setOptionAttribute(null)} />
    </>
  );
};

export default AttributesPage;
