import React, { useEffect, useState } from 'react';
import { attributeApi } from '../api/index.js';
import Notice from './Notice.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';

const OptionsPanel = ({ attribute, onClose }) => {
  const { t } = useI18n();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ value: '', sort_order: 0 });

  const load = async () => {
    if (!attribute) return;
    setLoading(true);
    setError('');
    try {
      const data = await attributeApi.listOptions(attribute.id);
      setOptions(data.items || []);
    } catch (err) {
      setError(err.message || t('errors.options_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    setForm({ value: '', sort_order: 0 });
  }, [attribute?.id]);

  const handleOptionChange = (id, field, value) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, [field]: value } : opt))
    );
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    setNotice('');
    setError('');
    try {
      await attributeApi.createOption(attribute.id, {
        value: form.value.trim(),
        sort_order: Number(form.sort_order || 0)
      });
      setForm({ value: '', sort_order: 0 });
      setNotice(t('options.created'));
      load();
    } catch (err) {
      setError(err.message || t('errors.options_save'));
    }
  };

  const handleSave = async (option) => {
    setNotice('');
    setError('');
    try {
      await attributeApi.updateOption(option.id, {
        value: option.value,
        sort_order: Number(option.sort_order || 0)
      });
      setNotice(t('options.updated'));
      load();
    } catch (err) {
      setError(err.message || t('errors.options_save'));
    }
  };

  const handleDelete = async (option) => {
    const ok = window.confirm(`${t('options.delete_confirm')} "${option.value}"?`);
    if (!ok) return;
    setNotice('');
    setError('');
    try {
      await attributeApi.deleteOption(option.id);
      setNotice(t('options.deleted'));
      load();
    } catch (err) {
      setError(err.message || t('errors.options_delete'));
    }
  };

  if (!attribute) return null;

  return (
    <div className="form-card">
      <div className="options-header">
        <div>
          <h3>{t('options.title')}</h3>
          <p className="muted">{attribute.name}</p>
        </div>
        <button className="ghost-button" type="button" onClick={onClose}>
          {t('common.clear')}
        </button>
      </div>

      <Notice type="success" message={notice} />
      <Notice type="error" message={error} />

      {loading ? (
        <p className="muted">{t('common.loading')}</p>
      ) : options.length ? (
        <div className="options-list">
          {options.map((option) => (
            <div className="options-row" key={option.id}>
              <input
                type="text"
                value={option.value || ''}
                onChange={(event) => handleOptionChange(option.id, 'value', event.target.value)}
              />
              <input
                type="number"
                value={option.sort_order || 0}
                onChange={(event) => handleOptionChange(option.id, 'sort_order', event.target.value)}
              />
              <button className="ghost-button" type="button" onClick={() => handleSave(option)}>
                {t('common.update')}
              </button>
              <button className="ghost-button danger" type="button" onClick={() => handleDelete(option)}>
                {t('common.delete')}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">{t('options.empty')}</p>
      )}

      <form className="options-add" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder={t('options.value')}
          value={form.value}
          onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
          required
        />
        <input
          type="number"
          placeholder={t('options.sort_order')}
          value={form.sort_order}
          onChange={(event) => setForm((prev) => ({ ...prev, sort_order: event.target.value }))}
        />
        <button className="primary-button" type="submit">
          {t('options.add')}
        </button>
      </form>
    </div>
  );
};

export default OptionsPanel;
