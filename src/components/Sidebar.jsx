import React, { useMemo } from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { Icon } from './Icons.jsx';

const buildTree = (items = []) => {
  const map = new Map();
  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  const roots = [];
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => {
      const orderA = Number(a.sort_order || 0);
      const orderB = Number(b.sort_order || 0);
      if (orderA !== orderB) return orderA - orderB;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
    nodes.forEach((node) => sortNodes(node.children));
  };

  sortNodes(roots);
  return roots;
};

const Sidebar = ({
  items,
  active,
  onSelect,
  categories = [],
  categoriesLoading = false,
  onRefresh = () => {}
}) => {
  const { t } = useI18n();
  const tree = useMemo(() => buildTree(categories), [categories]);

  const renderTree = (nodes, depth = 0) => {
    return nodes.map((node) => (
      <div className="category-node" key={node.id}>
        <button
          type="button"
          className="category-link"
          style={{ '--depth': depth }}
          onClick={() => onSelect('subcategories')}
          title={node.name}
        >
          <span className="category-dot" />
          {node.name}
        </button>
        {node.children.length > 0 && renderTree(node.children, depth + 1)}
      </div>
    ));
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" />
        <div>
          <p className="brand-title">Souqli</p>
          <p className="brand-subtitle">{t('common.admin_control')}</p>
        </div>
      </div>

      <nav className="nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={active === item.id ? 'nav-item active' : 'nav-item'}
            onClick={() => onSelect(item.id)}
            type="button"
          >
            <span className="nav-icon">
              <Icon name={item.icon || item.id} className="icon" />
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <div className="title-row">
            <span className="title-icon">
              <Icon name="categories" className="icon" />
            </span>
            <span className="sidebar-section-title">{t('sidebar.catalog')}</span>
          </div>
          <div className="sidebar-section-actions">
            <button
              className="ghost-button small"
              type="button"
              onClick={() => onSelect('main_categories')}
            >
              {t('sidebar.manage')}
            </button>
            <button className="ghost-button small" type="button" onClick={onRefresh}>
              {t('sidebar.refresh')}
            </button>
          </div>
        </div>

        {categoriesLoading ? (
          <p className="sidebar-muted">{t('sidebar.loading')}</p>
        ) : tree.length ? (
          <div className="sidebar-tree">{renderTree(tree)}</div>
        ) : (
          <p className="sidebar-muted">{t('sidebar.empty')}</p>
        )}
      </div>

      <div className="sidebar-footer">
        <p className="helper-label">{t('common.environment')}</p>
        <div className="env-pill">
          <span className="status status-live" />
          {t('common.production_ready')}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
