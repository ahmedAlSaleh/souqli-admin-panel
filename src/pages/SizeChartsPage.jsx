import React, { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';
import Notice from '../components/Notice.jsx';
import { subcategoryApi } from '../api/index.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { Icon } from '../components/Icons.jsx';

const emptyRow = (sort = 0) => ({
  size_code: '',
  chest_cm: '',
  waist_cm: '',
  hip_cm: '',
  shoulder_width_cm: '',
  sleeve_length_cm: '',
  shirt_length_cm: '',
  height_cm: '',
  sort_order: sort
});

const normalizeRows = (rows) =>
  rows
    .map((row, index) => ({
      size_code: String(row.size_code || '').trim().toUpperCase(),
      chest_cm: String(row.chest_cm || '').trim(),
      waist_cm: String(row.waist_cm || '').trim(),
      hip_cm: String(row.hip_cm || '').trim(),
      shoulder_width_cm: String(row.shoulder_width_cm || '').trim(),
      sleeve_length_cm: String(row.sleeve_length_cm || '').trim(),
      shirt_length_cm: String(row.shirt_length_cm || '').trim(),
      height_cm: String(row.height_cm || '').trim(),
      sort_order: Number(row.sort_order ?? index)
    }))
    .filter((row) => row.size_code);

const SizeChartsPage = () => {
  const { t } = useI18n();
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const selectedLabel = useMemo(() => {
    const found = subcategories.find((item) => String(item.id) === String(selectedSubcategoryId));
    return found ? `${found.name}${found.parent_name ? ` (${found.parent_name})` : ''}` : '';
  }, [subcategories, selectedSubcategoryId]);

  const loadSubcategories = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await subcategoryApi.list(1, 300);
      const items = data.items || [];
      setSubcategories(items);
      if (!selectedSubcategoryId && items.length) {
        setSelectedSubcategoryId(String(items[0].id));
      }
    } catch (err) {
      setError(err.message || t('errors.size_charts_load'));
    } finally {
      setLoading(false);
    }
  };

  const loadRows = async (subcategoryId) => {
    if (!subcategoryId) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await subcategoryApi.listSizeChart(subcategoryId);
      const items = data.items || [];
      if (!items.length) {
        setRows([
          emptyRow(0),
          emptyRow(1),
          emptyRow(2),
          emptyRow(3),
          emptyRow(4),
          emptyRow(5)
        ]);
      } else {
        setRows(
          items.map((row, index) => ({
            size_code: row.size_code || '',
            chest_cm: row.chest_cm || '',
            waist_cm: row.waist_cm || '',
            hip_cm: row.hip_cm || '',
            shoulder_width_cm: row.shoulder_width_cm || '',
            sleeve_length_cm: row.sleeve_length_cm || '',
            shirt_length_cm: row.shirt_length_cm || '',
            height_cm: row.height_cm || '',
            sort_order: row.sort_order ?? index
          }))
        );
      }
    } catch (err) {
      setError(err.message || t('errors.size_charts_load'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubcategories();
  }, []);

  useEffect(() => {
    if (selectedSubcategoryId) {
      loadRows(selectedSubcategoryId);
    }
  }, [selectedSubcategoryId]);

  const handleRowChange = (index, field, value) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow(prev.length)]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedSubcategoryId) return;
    setSaving(true);
    setNotice('');
    setError('');
    try {
      const payload = { items: normalizeRows(rows) };
      await subcategoryApi.replaceSizeChart(selectedSubcategoryId, payload);
      setNotice(t('size_charts.saved'));
      await loadRows(selectedSubcategoryId);
    } catch (err) {
      setError(err.message || t('errors.size_charts_save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionHeader
        title={t('size_charts.title')}
        subtitle={t('size_charts.subtitle')}
        icon={<Icon name="size_charts" className="icon" />}
        actionLabel={selectedLabel || ''}
      />
      <Notice type="success" message={notice} />
      <Notice type="error" message={error} />

      <div className="form-card">
        <div className="form-grid">
          <div className="form-group">
            <label>{t('size_charts.subcategory')}</label>
            <select
              value={selectedSubcategoryId}
              onChange={(event) => setSelectedSubcategoryId(event.target.value)}
            >
              <option value="">{t('size_charts.select_subcategory')}</option>
              {subcategories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.parent_name ? `(${item.parent_name})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button className="primary-button" type="button" onClick={handleSave} disabled={saving || loading}>
              {saving ? t('common.loading') : t('size_charts.save')}
            </button>
            <button className="ghost-button" type="button" onClick={addRow}>
              {t('size_charts.add_row')}
            </button>
          </div>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>{t('size_charts.columns.size')}</th>
              <th>{t('size_charts.columns.chest')}</th>
              <th>{t('size_charts.columns.waist')}</th>
              <th>{t('size_charts.columns.hip')}</th>
              <th>{t('size_charts.columns.shoulder')}</th>
              <th>{t('size_charts.columns.sleeve')}</th>
              <th>{t('size_charts.columns.length')}</th>
              <th>{t('size_charts.columns.height')}</th>
              <th>{t('table.sort')}</th>
              <th>{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="empty-cell" colSpan={10}>
                  {loading ? t('common.loading') : t('size_charts.empty')}
                </td>
              </tr>
            )}
            {rows.map((row, index) => (
              <tr key={`row-${index}`}>
                <td>
                  <input
                    value={row.size_code}
                    onChange={(event) => handleRowChange(index, 'size_code', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={row.chest_cm}
                    onChange={(event) => handleRowChange(index, 'chest_cm', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={row.waist_cm}
                    onChange={(event) => handleRowChange(index, 'waist_cm', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={row.hip_cm}
                    onChange={(event) => handleRowChange(index, 'hip_cm', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={row.shoulder_width_cm}
                    onChange={(event) => handleRowChange(index, 'shoulder_width_cm', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={row.sleeve_length_cm}
                    onChange={(event) => handleRowChange(index, 'sleeve_length_cm', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={row.shirt_length_cm}
                    onChange={(event) => handleRowChange(index, 'shirt_length_cm', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={row.height_cm}
                    onChange={(event) => handleRowChange(index, 'height_cm', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.sort_order}
                    onChange={(event) => handleRowChange(index, 'sort_order', event.target.value)}
                  />
                </td>
                <td>
                  <button className="ghost-button danger" type="button" onClick={() => removeRow(index)}>
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default SizeChartsPage;
