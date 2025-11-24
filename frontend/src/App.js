import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Reports from './pages/Reports';
import Reminders from './pages/Reminders';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { useAuth } from './context/AuthContext';
import { useLocation } from 'react-router-dom';

const PrivateRoute = ({ element }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return element;
};

function App() {
  return (
    <Router>
      <div className="App">
        {/* Hide header and navigation on auth pages */}
        <AuthHeader />
        <div className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<PrivateRoute element={<Dashboard />} />} />
            <Route path="/history" element={<PrivateRoute element={<History />} />} />
            <Route path="/reports" element={<PrivateRoute element={<Reports />} />} />
            <Route path="/budget-planning" element={<PrivateRoute element={<Reminders />} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

function AuthHeader() {
  const location = useLocation();
  const hideOn = ['/login', '/signup'];
  if (hideOn.includes(location.pathname)) return null;
  return (
    <>
      <Header />
      {/* Navigation is integrated into Header visually but keep it for routing links */}
    </>
  );
}


