import React from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';

const DataTable = ({ columns, rows, emptyMessage }) => {
  const { t } = useI18n();
  const hasRows = rows && rows.length;
  const emptyLabel = emptyMessage || t('common.no_data');
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ textAlign: col.align || 'left' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasRows ? (
            rows.map((row, index) => (
              <tr key={row.id || index} style={{ '--i': index }}>
                {columns.map((col) => (
                  <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="empty-cell">
                {emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
