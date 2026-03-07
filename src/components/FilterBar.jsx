import React from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';

const FilterBar = ({ filters = [] }) => {
  const { t } = useI18n();
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>{t('filters.search_label')}</label>
        <input type="text" placeholder={t('filters.search_placeholder')} />
      </div>
      {filters.map((filter) => (
        <div className="filter-group" key={filter.label}>
          <label>{filter.label}</label>
          <select defaultValue="">
            <option value="" disabled>
              {filter.placeholder}
            </option>
            {filter.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button className="ghost-button" type="button">
        {t('common.apply')}
      </button>
    </div>
  );
};

export default FilterBar;
