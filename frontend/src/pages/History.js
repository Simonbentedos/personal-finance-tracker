import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './History.css';
import AddTransactionModal from '../components/AddTransactionModal';
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

const History = () => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [search, typeFilter, categoryFilter, sortBy]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (sortBy) params.append('sortBy', sortBy);

      const response = await axios.get(`${API_URL}/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAdded = () => {
    setShowModal(false);
    fetchTransactions();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <h2 className="page-title">Transaction History</h2>
          <p className="page-subtitle">View and manage all your transactions</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <span>+</span> Add Transaction
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="income">Income Only</option>
          <option value="expense">Expenses Only</option>
        </select>
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
        </select>
      </div>

      <div className="transactions-container">
        <div className="transactions-header">
          <span className="transactions-count">{transactions.length} Transactions</span>
          <button
            className="btn-secondary"
            onClick={async () => {
              try {
                const response = await axios.get(`${API_URL}/transactions/export`, {
                  headers: { Authorization: `Bearer ${token}` },
                  responseType: 'blob'
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'transactions.csv');
                document.body.appendChild(link);
                link.click();
                link.remove();
              } catch (err) {
                console.error('Error exporting transactions:', err);
              }
            }}
          >
            Export CSV
          </button>
        </div>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <p className="empty-message">No transactions found matching your criteria</p>
            <button className="btn-secondary" onClick={() => setShowModal(true)}>
              <span>+</span> Add Your First Transaction
            </button>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-main">
                    <span className="transaction-category">{transaction.category || 'Uncategorized'}</span>
                    <span className="transaction-description">{transaction.description || 'No description'}</span>
                  </div>
                  <span className="transaction-date">{formatDate(transaction.date)}</span>
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}{`${CURRENCY}${formatCurrency(transaction.amount)}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddTransactionModal
          onClose={() => setShowModal(false)}
          onSuccess={handleTransactionAdded}
        />
      )}
    </div>
  );
};

export default History;


