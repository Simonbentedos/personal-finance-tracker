import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Reports.css';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatPercent, CURRENCY } from '../utils/format';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

const Reports = () => {
  const { token } = useAuth();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState({
    income: 0,
    expenses: 0,
    netBalance: 0,
    transactions: 0,
    categories: [],
    dailyTrend: []
  });
  const [yearlyData, setYearlyData] = useState({
    income: Array(12).fill(0),
    expenses: Array(12).fill(0)
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportsData();
  }, [month, year]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const authConfig = { headers: { Authorization: `Bearer ${token}` } };
      const [monthlyRes, yearlyRes] = await Promise.all([
        axios.get(`${API_URL}/reports/monthly`, { params: { month, year }, ...authConfig }),
        axios.get(`${API_URL}/reports/yearly`, { params: { year }, ...authConfig })
      ]);

      // Normalize numeric fields to numbers
      const md = monthlyRes.data || {};
      const normalizedMonthly = {
        income: Number(md.income) || 0,
        expenses: Number(md.expenses) || 0,
        netBalance: Number(md.netBalance) || 0,
        transactions: md.transactions || 0,
        categories: md.categories || [],
        dailyTrend: md.dailyTrend || []
      };

      setMonthlyData(normalizedMonthly);
      setYearlyData(yearlyRes.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const chartData = yearlyData.income.map((income, index) => ({
    month: monthAbbr[index],
    Income: income,
    Expenses: yearlyData.expenses[index]
  }));

  const categoryData = monthlyData.categories.map(cat => ({
    name: cat.name,
    value: cat.total
  }));

  const dailyTrendData = Array.from({ length: 31 }, (_, i) => {
    const dayData = monthlyData.dailyTrend.find(d => d.day === i + 1);
    return {
      day: i + 1,
      amount: dayData ? dayData.amount : 0
    };
  });

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h2 className="page-title">Monthly Reports</h2>
          <p className="page-subtitle">Analyze your spending patterns and financial trends</p>
        </div>
        <div className="date-selectors">
          <select
            className="date-select"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {monthNames.map((name, index) => (
              <option key={index + 1} value={index + 1}>{name}</option>
            ))}
          </select>
          <select
            className="date-select"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard title="Monthly Income" value={`${CURRENCY}${formatCurrency(monthlyData.income)}`} color="green" icon={null} />
        <MetricCard title="Monthly Expenses" value={`${CURRENCY}${formatCurrency(monthlyData.expenses)}`} color="red" icon={null} />
        <MetricCard title="Net Balance" value={`${CURRENCY}${formatCurrency(monthlyData.netBalance)}`} color={monthlyData.netBalance >= 0 ? "green" : "red"} icon={null} />
        <MetricCard title="Transactions" value={monthlyData.transactions.toString()} color="gray" icon={null} />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">Spending by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${formatPercent(percent * 100, 0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${CURRENCY}${formatCurrency(value)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">No expense data available for this month</div>
          )}
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Daily Spending Trend</h3>
          {monthlyData.dailyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => `${CURRENCY}${formatCurrency(value)}`} />
                <Bar dataKey="amount" fill="#e74c3c" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">No transaction data available for this month</div>
          )}
        </div>
      </div>

      <div className="yearly-section">
        <h2 className="section-title">Yearly Overview - {year}</h2>
        <div className="chart-card large">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `${CURRENCY}${formatCurrency(value)}`} />
              <Legend />
              <Bar dataKey="Expenses" fill="#e74c3c" />
              <Bar dataKey="Income" fill="#27ae60" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, color, icon }) => {
  return (
    <div className={`metric-card metric-card-${color}`}>
      <div className="metric-header">
        <h3 className="metric-title">{title}</h3>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
    </div>
  );
};

export default Reports;


