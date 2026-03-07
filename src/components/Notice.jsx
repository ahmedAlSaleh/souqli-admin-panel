import React from 'react';

const Notice = ({ type = 'info', message }) => {
  if (!message) return null;
  return <div className={`notice notice-${type}`}>{message}</div>;
};

export default Notice;
