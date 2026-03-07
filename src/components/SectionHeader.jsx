import React from 'react';

const SectionHeader = ({ title, subtitle, actionLabel, onAction, meta, icon }) => {
  return (
    <div className="section-header">
      <div>
        <div className="title-row">
          {icon && <span className="title-icon">{icon}</span>}
          <h2>{title}</h2>
        </div>
        {subtitle && <p className="muted">{subtitle}</p>}
        {meta && <p className="section-meta">{meta}</p>}
      </div>
      {actionLabel && (
        <button className="primary-button" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default SectionHeader;
