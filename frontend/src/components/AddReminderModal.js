import React, { useState } from 'react';
import axios from 'axios';
import './AddReminderModal.css';
import { useAuth } from '../context/AuthContext';
import { CURRENCY } from '../utils/format';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const categories = [
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

const AddReminderModal = ({ onClose, onSuccess }) => {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('0.00');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const reminderData = {
        category_name: title,
        amount_limit: parseFloat(amount),
        category_type: category || null,
        start_date: dueDate,
        end_date: dueDate
      };

      await axios.post(`${API_URL}/budgets`, reminderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess();
    } catch (err) {
      setError('Failed to add reminder. Please try again.');
      console.error('Error adding reminder:', err);
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Budget</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p className="modal-description">
          Set up a budget limit for a specific spending category.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Category Name</label>
            <input
              type="text"
              id="title"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Groceries"
              required
            />
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
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <div className="date-input-container">
              <input
                type="date"
                id="dueDate"
                className="date-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
              <span className="date-icon">📅</span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReminderModal;


