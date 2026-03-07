import React from 'react';

const EmptyState = ({ title, description, actionLabel, onAction }) => {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {description && <p className="muted">{description}</p>}
      {actionLabel && (
        <button className="primary-button" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
