import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Reminders.css';
import AddReminderModal from '../components/AddReminderModal';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, CURRENCY } from '../utils/format';

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

const Reminders = () => {
  const { token } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/budgets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBudgets(response.data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetSaved = () => {
    setShowModal(false);
    fetchBudgets();
  };

  const activeBudgets = budgets || [];
  const totalBudget = activeBudgets.reduce((sum, b) => sum + parseFloat(b.amount_limit || 0), 0);
  const totalSpent = activeBudgets.reduce((sum, b) => sum + parseFloat(b.spent || 0), 0);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="reminders-page">
      <div className="reminders-header">
        <div>
          <h2 className="page-title">Budget Planning</h2>
          <p className="page-subtitle">Set monthly budgets by category and track your spending against them</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <span>+</span> Add Budget
        </button>
      </div>

      <div className="reminders-metrics">
        <MetricCard title="Active Budgets" value={activeBudgets.length.toString()} icon={null} />
        <MetricCard title="Total Budget" value={`${CURRENCY}${formatCurrency(totalBudget)}`} color="orange" icon={null} />
        <MetricCard title="Total Spent" value={`${CURRENCY}${formatCurrency(totalSpent)}`} icon={null} />
      </div>

      <div className="reminders-list-container">
        <div className="reminders-list-header">
          <h3 className="list-title">
            Active Budgets
          </h3>
        </div>
        {activeBudgets.length === 0 ? (
          <div className="empty-state">
            <p className="empty-message">No active budgets.</p>
            <button className="btn-secondary" onClick={() => setShowModal(true)}>
              <span>+</span> Add Your First Budget
            </button>
          </div>
        ) : (
          <div className="reminders-list">
            {activeBudgets.map((budget) => (
              <div key={budget.budget_id} className="reminder-item">
                <div className="reminder-info">
                  <span className="reminder-title">{budget.category_name}</span>
                  <div className="reminder-details">
                    <span className="reminder-category">{budget.category_type}</span>
                    <span className="reminder-date">
                      Period: {formatDate(budget.start_date)} - {formatDate(budget.end_date)}
                    </span>
                  </div>
                </div>
                <span className="reminder-amount">
                  {`${CURRENCY}${formatCurrency(budget.spent || 0)} of ${CURRENCY}${formatCurrency(budget.amount_limit)}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddReminderModal
          onClose={() => setShowModal(false)}
          onSuccess={handleBudgetSaved}
        />
      )}
    </div>
  );
};

const MetricCard = ({ title, value, color = 'gray', icon }) => {
  return (
    <div className={`reminder-metric-card metric-card-${color}`}>
      <div className="metric-header">
        <h3 className="metric-title">{title}</h3>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
    </div>
  );
};

export default Reminders;


