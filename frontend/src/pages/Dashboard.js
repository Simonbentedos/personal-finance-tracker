import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';
import MetricCard from '../components/MetricCard';
import BudgetCard from '../components/BudgetCard';
import CategoriesCard from '../components/CategoriesCard';
import RemindersCard from '../components/RemindersCard';
import AddTransactionModal from '../components/AddTransactionModal';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, CURRENCY } from '../utils/format';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    transactions: 0
  });
  const [budget, setBudget] = useState({
    budget: 3000,
    spent: 0,
    remaining: 3000,
    percentage: 0
  });
  const [categories, setCategories] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [metricsRes, budgetRes, categoriesRes, remindersRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/metrics`, config),
        axios.get(`${API_URL}/dashboard/budget`, config),
        axios.get(`${API_URL}/dashboard/categories`, config),
        axios.get(`${API_URL}/budgets`, config)
      ]);

      // Normalize numeric fields to ensure numbers (backend may return strings/Decimal128)
      const rawMetrics = metricsRes.data || {};
      const normalizedMetrics = {
        totalIncome: Number(rawMetrics.totalIncome) || 0,
        totalExpenses: Number(rawMetrics.totalExpenses) || 0,
        balance: Number(rawMetrics.balance) || 0,
        transactions: rawMetrics.transactions || 0
      };
      setMetrics(normalizedMetrics);
      setBudget(budgetRes.data);
      setCategories(categoriesRes.data);
      setReminders(remindersRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAdded = () => {
    setShowModal(false);
    fetchDashboardData();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Dashboard</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <span>+</span> Add Transaction
        </button>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Total Income"
          value={`${CURRENCY}${formatCurrency(metrics.totalIncome)}`}
          period="This month"
          color="green"
          icon={null}
        />
        <MetricCard
          title="Total Expenses"
          value={`${CURRENCY}${formatCurrency(metrics.totalExpenses)}`}
          period="This month"
          color="red"
          icon={null}
        />
        <MetricCard
          title="Balance"
          value={`${CURRENCY}${formatCurrency(metrics.balance)}`}
          period={metrics.balance >= 0 ? "Surplus this month" : "Deficit this month"}
          color={metrics.balance >= 0 ? "green" : "red"}
          icon={null}
        />
        <MetricCard
          title="Transactions"
          value={metrics.transactions.toString()}
          period="This month"
          color="gray"
          icon={null}
        />
      </div>

      <div className="dashboard-content">
        <div className="dashboard-left">
          <BudgetCard budget={budget} />
        </div>
        <div className="dashboard-right">
          <CategoriesCard categories={categories} onAddTransaction={() => setShowModal(true)} />
        </div>
      </div>

      <div className="dashboard-bottom">
        <RemindersCard reminders={reminders} />
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

export default Dashboard;


