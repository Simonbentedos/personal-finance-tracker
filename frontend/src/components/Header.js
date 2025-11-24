import React from 'react';
import './Header.css';
import Navigation from './Navigation';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <div>
          <h1 className="header-title">M3R</h1>
          <p className="header-subtitle">Track your expenses, manage your budget, and achieve your financial goals</p>
        </div>
      </div>

      <div className="header-center">
        <Navigation />
      </div>

      <div className="header-right">
        {token ? (
          <>
            <span className="header-user">{user?.username || user?.name || 'User'}</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <></>
        )}
      </div>
    </header>
  );
};

export default Header;


