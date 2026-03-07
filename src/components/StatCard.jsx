import React from 'react';

const StatCard = ({ label, value, change, index }) => {
  return (
    <div className="card stat-card" style={{ '--i': index }}>
      <p className="card-label">{label}</p>
      <h3>{value}</h3>
      <p className="card-meta">{change}</p>
    </div>
  );
};

export default StatCard;
