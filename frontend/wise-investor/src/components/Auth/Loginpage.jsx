import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Target, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔐 Attempting login...');

      // Use AuthContext's login function
      await login('/api/v1/auth/login', {
        email: email.trim(),
        password: password
      });

      console.log('✅ Login successful!');
      setSuccess('Login successful! Redirecting...');

    } catch (err) {
      console.error('❌ Login error:', err);

      let errorMessage = 'Login failed. Please check your credentials.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg || e).join(', ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #E87A00 0%, #C86800 50%, #8B6F47 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    card: {
      background: 'white',
      borderRadius: '24px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      padding: '48px',
      width: '100%',
      maxWidth: '480px',
      position: 'relative',
      overflow: 'hidden'
    },
    decorativeCircle: {
      position: 'absolute',
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #E87A00, #C86800)',
      opacity: 0.1,
      top: '-100px',
      right: '-100px'
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '32px',
      position: 'relative',
      zIndex: 1
    },
    logoIcon: {
      width: '64px',
      height: '64px',
      background: 'linear-gradient(135deg, #E87A00, #C86800)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 10px 30px rgba(232, 122, 0, 0.4)',
      marginRight: '16px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #E87A00, #C86800)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: 0
    },
    subtitle: {
      fontSize: '16px',
      color: '#6b7280',
      textAlign: 'center',
      marginBottom: '32px',
      lineHeight: '1.5'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    inputGroup: {
      position: 'relative'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    inputWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    inputIcon: {
      position: 'absolute',
      left: '16px',
      color: '#9ca3af',
      pointerEvents: 'none',
      zIndex: 1
    },
    input: {
      width: '100%',
      padding: '14px 16px 14px 48px',
      fontSize: '16px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      outline: 'none',
      transition: 'all 0.2s',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      backgroundColor: '#fff'
    },
    passwordToggle: {
      position: 'absolute',
      right: '16px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      color: '#9ca3af',
      display: 'flex',
      alignItems: 'center',
      transition: 'color 0.2s',
      zIndex: 1
    },
    button: {
      width: '100%',
      padding: '16px',
      fontSize: '16px',
      fontWeight: '600',
      color: 'white',
      background: 'linear-gradient(135deg, #E87A00, #C86800)',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 4px 12px rgba(232, 122, 0, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none'
    },
    alert: {
      padding: '16px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
      animation: 'slideIn 0.3s ease',
      fontSize: '14px'
    },
    alertError: {
      background: '#fee2e2',
      border: '1px solid #fecaca',
      color: '#dc2626'
    },
    alertSuccess: {
      background: '#d1fae5',
      border: '1px solid #a7f3d0',
      color: '#059669'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      textAlign: 'center',
      margin: '24px 0',
      color: '#9ca3af',
      fontSize: '14px'
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      background: '#e5e7eb'
    },
    dividerText: {
      padding: '0 16px',
      fontWeight: '500'
    },
    demoSection: {
      marginTop: '24px',
      padding: '20px',
      background: '#fff7ed',
      borderRadius: '12px',
      border: '1px solid #fed7aa'
    },
    demoTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#92400e',
      marginBottom: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    demoButtons: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    demoButton: {
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      background: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      textAlign: 'left',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    demoEmail: {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#6b7280'
    },
    registerSection: {
      marginTop: '24px',
      padding: '16px',
      background: '#fef3c7',
      border: '1px solid #fcd34d',
      borderRadius: '12px',
      textAlign: 'center'
    },
    registerText: {
      fontSize: '14px',
      color: '#92400e',
      marginBottom: '8px'
    },
    registerButton: {
      display: 'inline-block',
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#E87A00',
      background: 'white',
      border: '1px solid #E87A00',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      textDecoration: 'none'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.decorativeCircle}></div>

        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}>
            <Target size={32} color="white" />
          </div>
          <div>
            <h1 style={styles.title}>Wise Investor</h1>
          </div>
        </div>

        <p style={styles.subtitle}>
          Sign in to access your nonprofit analytics dashboard
        </p>

        {error && (
          <div style={{...styles.alert, ...styles.alertError}}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{...styles.alert, ...styles.alertSuccess}}>
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="email">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={20} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="password">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={20} style={styles.inputIcon} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading && styles.buttonDisabled)
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>Demo Accounts</span>
          <div style={styles.dividerLine}></div>
        </div>

        <div style={styles.demoSection}>
          <div style={styles.demoTitle}>
            <Shield size={14} />
            Quick Login
          </div>
          <div style={styles.demoButtons}>
            <button
              type="button"
              style={styles.demoButton}
              onClick={() => handleDemoLogin('guerreroevan@example.net', 'Password123!')}
              disabled={loading}
            >
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Regular User</div>
                <div style={styles.demoEmail}>guerreroevan@example.net</div>
              </div>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>→</span>
            </button>
          </div>
        </div>

        <div style={styles.registerSection}>
          <div style={styles.registerText}>Don't have an organization account?</div>
          <button
            type="button"
            style={styles.registerButton}
            onClick={() => navigate('/register-organization')}
          >
            Create Organization
          </button>
        </div>

        <div style={{...styles.registerSection, background: '#fef3c7', borderColor: '#fcd34d'}}>
          <div style={{...styles.registerText, color: '#92400e'}}>Want to support as a donor?</div>
          <button
            type="button"
            style={{...styles.registerButton, color: '#E87A00', borderColor: '#E87A00'}}
            onClick={() => navigate('/register-donor')}
          >
            Register as Donor
          </button>
        </div>

        <div style={{...styles.registerSection, background: '#ede9fe', borderColor: '#c4b5fd'}}>
          <div style={{...styles.registerText, color: '#5b21b6'}}>Join as a user?</div>
          <button
            type="button"
            style={{...styles.registerButton, color: '#7c3aed', borderColor: '#7c3aed'}}
            onClick={() => navigate('/register-user')}
          >
            Register as Staff
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        input:focus {
          border-color: #E87A00 !important;
          box-shadow: 0 0 0 3px rgba(232, 122, 0, 0.1) !important;
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(232, 122, 0, 0.5);
        }
        button:hover:not(:disabled)[style*="background: white"] {
          background-color: #fff7ed !important;
          border-color: #C86800 !important;
        }
      `}</style>
    </div>
  );
};

export default Login;
