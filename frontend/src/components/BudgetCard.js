import React from 'react';
import './BudgetCard.css';
import { formatCurrency, formatPercent, CURRENCY } from '../utils/format';

const BudgetCard = ({ budget }) => {
  const percentage = Math.min(budget.percentage || 0, 100);

  return (
    <div className="budget-card">
      <h3 className="card-title">Monthly Budget</h3>
      <div className="budget-amount">
        {`${CURRENCY}${formatCurrency(budget.spent)} of ${CURRENCY}${formatCurrency(budget.budget)}`}
      </div>
      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="progress-percentage">{formatPercent(percentage, 0)}%</span>
      </div>
      <div className="budget-remaining">
        {`${CURRENCY}${formatCurrency(budget.remaining)} remaining this month`}
      </div>
    </div>
  );
};

export default BudgetCard;


