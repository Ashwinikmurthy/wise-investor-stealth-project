import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const SuperadminLogin = () => {
  const navigate = useNavigate();
  const { superadminLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await superadminLogin(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid superadmin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '440px' }}>
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#dc2626"/>
              <path d="M24 12L32 20L24 28L16 20L24 12Z" fill="white"/>
              <path d="M16 24L24 32L32 24" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="36" cy="12" r="6" fill="#fbbf24" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
          <h1 className="auth-title" style={{ color: '#dc2626' }}>
            Superadmin Access
          </h1>
          <p className="auth-subtitle">
            Platform-wide administrative login
          </p>
        </div>

        <div className="alert alert-warning">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <strong>Restricted Area</strong>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
              This area is for platform administrators only. Unauthorized access attempts are logged.
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', marginRight: '0.5rem' }}>
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Superadmin Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="superadmin@wiseinvestor.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', marginRight: '0.5rem' }}>
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Master Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              placeholder="Enter master password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-danger w-full"
            disabled={loading}
            style={{ background: '#dc2626' }}
          >
            {loading ? (
              <>
                <div className="spinner-sm"></div>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                </svg>
                <span>Access Platform</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>NOT A SUPERADMIN?</span>
        </div>

        <div className="auth-links">
          <p>
            <Link to="/login" className="link-primary">
              ← Back to Regular Login
            </Link>
          </p>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '1rem' }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', marginRight: '0.25rem' }}>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            All superadmin actions are logged and monitored
          </p>
        </div>
      </div>

      <div className="auth-footer">
        <p>© 2025 Wise Investor. All rights reserved.</p>
        <div className="auth-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Security</a>
        </div>
      </div>
    </div>
  );
};

export default SuperadminLogin;
