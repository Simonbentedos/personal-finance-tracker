import React, { useState } from 'react';
import axios from 'axios';
import './History.css';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [accountType, setAccountType] = useState('default');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/signup`, {
        username,
        email,
        mobile_no: mobile,
        password,
        account_type: accountType
      });
      // Do not auto-login after signup. Redirect user to sign in instead.
      navigate('/login');
    } catch (err) {
      setError('Failed to sign up. The email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <h2 className="page-title">Create Account</h2>
          <p className="page-subtitle">Sign up to start tracking your finances with M3R</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="mobile">Mobile Number</label>
          <input
            id="mobile"
            type="text"
            className="form-input"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="accountType">Account Type</label>
          <select id="accountType" className="form-select" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
            <option value="default">Default Account</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="credit">Credit</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
        <p className="page-subtitle">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;


