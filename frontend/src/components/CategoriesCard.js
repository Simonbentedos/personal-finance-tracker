import React from 'react';
import './CategoriesCard.css';
import { formatCurrency, CURRENCY } from '../utils/format';

const CategoriesCard = ({ categories, onAddTransaction }) => {
  const hasCategories = categories && categories.length > 0;

  return (
    <div className="categories-card">
      <div className="categories-header">
        <h3 className="card-title">Top Spending Categories</h3>
        <button className="btn-add-transaction" onClick={onAddTransaction}>
          <span>+</span> Add Transaction
        </button>
      </div>
      <div className="categories-content">
        {hasCategories ? (
          <div className="categories-list">
            {categories.map((category, index) => (
              <div key={index} className="category-item">
                <span className="category-name">{category.name}</span>
                <span className="category-amount">{`${CURRENCY}${formatCurrency(category.total)}`}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-message">No expenses recorded this month</p>
            <button className="btn-secondary" onClick={onAddTransaction}>
              Add your first expense
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesCard;


