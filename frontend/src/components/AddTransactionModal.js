import React, { useState } from 'react';
import axios from 'axios';
import api from '../api';
import './AddTransactionModal.css';
import { useAuth } from '../context/AuthContext';
import { CURRENCY } from '../utils/format';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const expenseCategories = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Bills & Utilities',
  'Entertainment',
  'Healthcare',
  'Education',
  'Travel',
  'Other'
];

const incomeCategories = [
  'Salary',
  'Allowance',
  'Commission',
  'Gift',
  'Business/Freelance',
  'Investment',
  'Others'
];

const AddTransactionModal = ({ onClose, onSuccess }) => {
  const { token } = useAuth();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('0.00');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  };

  React.useEffect(() => {
    // when type changes, reset category to first option for that type
    const list = type === 'income' ? incomeCategories : expenseCategories;
    setCategory(list.length > 0 ? list[0] : '');
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const transactionData = {
        type,
        amount: parseFloat(amount),
        category: category || null,
        description: description || null,
        date: date
      };

      try {
        await api.post('/transactions', transactionData);
        onSuccess();
      } catch (innerErr) {
        // surface backend error message when available
        const msg = innerErr?.response?.data?.message || innerErr?.message || 'Unknown error';
        setError(`Failed to add transaction: ${msg}`);
        console.error('Error adding transaction:', innerErr);
      }
    } catch (err) {
      setError('Failed to add transaction. Please try again.');
      console.error('Error adding transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const incrementAmount = () => {
    setAmount((prev) => (parseFloat(prev || 0) + 1).toFixed(2));
  };

  const decrementAmount = () => {
    setAmount((prev) => Math.max(0, parseFloat(prev || 0) - 1).toFixed(2));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Transaction</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p className="modal-description">
          Record a new income or expense transaction to track your finances.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="transaction-type-toggle">
            <button
              type="button"
              className={`toggle-btn ${type === 'expense' ? 'active' : ''}`}
              onClick={() => setType('expense')}
            >
              Expense
            </button>
            <button
              type="button"
              className={`toggle-btn ${type === 'income' ? 'active' : ''}`}
              onClick={() => setType('income')}
            >
              Income
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <div className="amount-input-container">
              <span className="currency-symbol">{CURRENCY}</span>
              <input
                type="text"
                id="amount"
                className="amount-input"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                required
              />
              <div className="amount-controls">
                <button type="button" className="amount-btn" onClick={incrementAmount}>▲</button>
                <button type="button" className="amount-btn" onClick={decrementAmount}>▼</button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
              <select
                id="category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select a category</option>
                {(type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this transaction for?"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Date</label>
            <div className="date-input-container">
              <input
                type="date"
                id="date"
                className="date-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <span className="date-icon"></span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Adding...' : `Add ${type === 'expense' ? 'Expense' : 'Income'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;


