import React from 'react';
import './MetricCard.css';

const MetricCard = ({ title, value, period, color, icon }) => {
  return (
    <div className={`metric-card metric-card-${color}`}>
      <div className="metric-header">
        <h3 className="metric-title">{title}</h3>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-period">{period}</div>
    </div>
  );
};

export default MetricCard;


