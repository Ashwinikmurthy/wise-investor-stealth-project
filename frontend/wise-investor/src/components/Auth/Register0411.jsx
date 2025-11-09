import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Lock, Mail, AlertCircle, Target, CheckCircle,
  User, Building2, Shield, ArrowLeft, Send
} from 'lucide-react';

// API Configuration
// Change this to your backend URL if different
const API_BASE_URL = '';

// Create API client with base configuration
const createApiClient = () => {
  return {
    post: async (url, data, config = {}) => {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        const err = new Error('Request failed');
        err.response = { status: response.status, data: error };
        throw err;
      }

      return response.json();
    }
  };
};

const Register = () => {
  const navigate = useNavigate();

  // User registration form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationId: ''
  });

  // Admin authorization state
  const [adminAuth, setAdminAuth] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // 1: User Details, 2: Admin Auth, 3: Success

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdminAuthChange = (e) => {
    const { name, value } = e.target;
    setAdminAuth(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.organizationId.trim()) {
      setError('Organization ID is required');
      return false;
    }
    return true;
  };

  const handleContinue = (e) => {
    e.preventDefault();
    setError('');

    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('📝 Submitting registration request...');

      const api = createApiClient();

      // First, authenticate the admin
      console.log('🔐 Authenticating admin...');
      const authData = await api.post('/api/v1/auth/login', {
        email: adminAuth.email.trim(),
        password: adminAuth.password
      });

      console.log('✅ Admin authenticated');
      const token = authData.access_token;

      if (!token) {
        throw new Error('Failed to obtain authentication token');
      }

      console.log('👤 Creating user with admin authorization...');

      // Then create the user with admin authorization
      const userData = await api.post(
        '/api/v1/users',
        {
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          organization_id: formData.organizationId.trim()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('✅ User registration successful!', userData);
      setSuccess('User account created successfully! Request has been sent to the organization admin.');
      setStep(3);

    } catch (err) {
      console.error('❌ Registration error:', err);

      let errorMessage = 'Registration failed. Please check your information and try again.';

      if (err.response?.status === 401) {
        errorMessage = 'Admin authentication failed. Please verify the admin credentials.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Insufficient permissions. Only superadmin or organization admin can create users.';
      } else if (err.response?.status === 404) {
        errorMessage = 'API endpoint not found. Please check your server configuration.';
      } else if (err.response?.status === 409) {
        errorMessage = 'This email is already registered.';
      } else if (err.response?.data?.detail) {
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
      maxWidth: '520px',
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
    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'none',
      border: 'none',
      color: '#6b7280',
      cursor: 'pointer',
      padding: '8px 0',
      marginBottom: '24px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'color 0.2s'
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
    stepIndicator: {
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      marginBottom: '32px'
    },
    stepDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#e5e7eb',
      transition: 'all 0.3s'
    },
    stepDotActive: {
      width: '24px',
      background: 'linear-gradient(135deg, #E87A00, #C86800)',
      borderRadius: '4px'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
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
      gap: '8px',
      marginTop: '8px'
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
    infoBox: {
      padding: '16px',
      background: '#fff7ed',
      border: '1px solid #fed7aa',
      borderRadius: '12px',
      marginBottom: '24px'
    },
    infoTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#92400e',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    infoText: {
      fontSize: '13px',
      color: '#92400e',
      lineHeight: '1.6'
    },
    successCard: {
      textAlign: 'center',
      padding: '32px 0'
    },
    successIcon: {
      width: '80px',
      height: '80px',
      background: 'linear-gradient(135deg, #10b981, #059669)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 24px',
      boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)'
    },
    successTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#059669',
      marginBottom: '12px'
    },
    successMessage: {
      fontSize: '16px',
      color: '#6b7280',
      lineHeight: '1.6',
      marginBottom: '32px'
    },
    loginLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#E87A00',
      background: 'white',
      border: '2px solid #E87A00',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      textDecoration: 'none'
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
    }
  };

  // Step 1: User Details Form
  const renderUserDetailsForm = () => (
    <>
      <button
        type="button"
        style={styles.backButton}
        onClick={() => navigate('/login')}
      >
        <ArrowLeft size={16} />
        Back to Login
      </button>

      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>
          <Target size={32} color="white" />
        </div>
        <div>
          <h1 style={styles.title}>Wise Investor</h1>
        </div>
      </div>

      <p style={styles.subtitle}>
        Create a new user account
      </p>

      <div style={styles.stepIndicator}>
        <div style={{...styles.stepDot, ...styles.stepDotActive}}></div>
        <div style={styles.stepDot}></div>
        <div style={styles.stepDot}></div>
      </div>

      {error && (
        <div style={{...styles.alert, ...styles.alertError}}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form style={styles.form} onSubmit={handleContinue}>
        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="fullName">Full Name</label>
          <div style={styles.inputWrapper}>
            <User size={20} style={styles.inputIcon} />
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleInputChange}
              style={styles.input}
              required
              disabled={loading}
              autoComplete="name"
            />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="email">Email Address</label>
          <div style={styles.inputWrapper}>
            <Mail size={20} style={styles.inputIcon} />
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              style={styles.input}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="organizationId">Organization ID</label>
          <div style={styles.inputWrapper}>
            <Building2 size={20} style={styles.inputIcon} />
            <input
              id="organizationId"
              name="organizationId"
              type="text"
              placeholder="Enter organization ID"
              value={formData.organizationId}
              onChange={handleInputChange}
              style={styles.input}
              required
              disabled={loading}
              autoComplete="off"
            />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="password">Password</label>
          <div style={styles.inputWrapper}>
            <Lock size={20} style={styles.inputIcon} />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password (min. 8 characters)"
              value={formData.password}
              onChange={handleInputChange}
              style={styles.input}
              required
              disabled={loading}
              autoComplete="new-password"
              minLength={8}
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

        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="confirmPassword">Confirm Password</label>
          <div style={styles.inputWrapper}>
            <Lock size={20} style={styles.inputIcon} />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              style={styles.input}
              required
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.passwordToggle}
              disabled={loading}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
          Continue
        </button>
      </form>

      <div style={styles.divider}>
        <div style={styles.dividerLine}></div>
        <span style={styles.dividerText}>or</span>
        <div style={styles.dividerLine}></div>
      </div>

      <button
        type="button"
        style={{
          ...styles.loginLink,
          width: '100%',
          justifyContent: 'center'
        }}
        onClick={() => navigate('/login')}
      >
        Already have an account? Sign In
      </button>
    </>
  );

  // Step 2: Admin Authorization Form
  const renderAdminAuthForm = () => (
    <>
      <button
        type="button"
        style={styles.backButton}
        onClick={() => {
          setStep(1);
          setError('');
        }}
      >
        <ArrowLeft size={16} />
        Back to User Details
      </button>

      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>
          <Shield size={32} color="white" />
        </div>
        <div>
          <h1 style={styles.title}>Admin Authorization</h1>
        </div>
      </div>

      <p style={styles.subtitle}>
        Enter superadmin or organization admin credentials to create this user
      </p>

      <div style={styles.stepIndicator}>
        <div style={styles.stepDot}></div>
        <div style={{...styles.stepDot, ...styles.stepDotActive}}></div>
        <div style={styles.stepDot}></div>
      </div>

      <div style={styles.infoBox}>
        <div style={styles.infoTitle}>
          <Shield size={14} />
          Authorization Required
        </div>
        <div style={styles.infoText}>
          Only superadmin or organization admin can create new user accounts.
          The admin credentials will be verified before creating the account for <strong>{formData.email}</strong>.
        </div>
      </div>

      {error && (
        <div style={{...styles.alert, ...styles.alertError}}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form style={styles.form} onSubmit={handleSubmit}>
        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="adminEmail">Admin Email</label>
          <div style={styles.inputWrapper}>
            <Mail size={20} style={styles.inputIcon} />
            <input
              id="adminEmail"
              name="email"
              type="email"
              placeholder="Enter admin email"
              value={adminAuth.email}
              onChange={handleAdminAuthChange}
              style={styles.input}
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="adminPassword">Admin Password</label>
          <div style={styles.inputWrapper}>
            <Lock size={20} style={styles.inputIcon} />
            <input
              id="adminPassword"
              name="password"
              type={showAdminPassword ? 'text' : 'password'}
              placeholder="Enter admin password"
              value={adminAuth.password}
              onChange={handleAdminAuthChange}
              style={styles.input}
              required
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowAdminPassword(!showAdminPassword)}
              style={styles.passwordToggle}
              disabled={loading}
              aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
            >
              {showAdminPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
              Creating Account...
            </>
          ) : (
            <>
              <Send size={20} />
              Create Account
            </>
          )}
        </button>
      </form>
    </>
  );

  // Step 3: Success Message
  const renderSuccessMessage = () => (
    <>
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>
          <Target size={32} color="white" />
        </div>
        <div>
          <h1 style={styles.title}>Wise Investor</h1>
        </div>
      </div>

      <div style={styles.stepIndicator}>
        <div style={styles.stepDot}></div>
        <div style={styles.stepDot}></div>
        <div style={{...styles.stepDot, ...styles.stepDotActive}}></div>
      </div>

      <div style={styles.successCard}>
        <div style={styles.successIcon}>
          <CheckCircle size={40} color="white" />
        </div>
        <h2 style={styles.successTitle}>Account Created Successfully!</h2>
        <p style={styles.successMessage}>
          The user account for <strong>{formData.email}</strong> has been created successfully.
          A notification has been sent to the organization admin at <strong>{formData.organizationId}</strong>.
        </p>

        <div style={styles.infoBox}>
          <div style={styles.infoTitle}>
            <AlertCircle size={14} />
            Next Steps
          </div>
          <div style={styles.infoText}>
            The new user can now log in with their credentials. They will have access to the organization's
            nonprofit analytics dashboard and all associated features.
          </div>
        </div>

        <button
          type="button"
          style={styles.loginLink}
          onClick={() => navigate('/login')}
        >
          <ArrowLeft size={16} />
          Go to Login
        </button>
      </div>
    </>
  );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.decorativeCircle}></div>

        {step === 1 && renderUserDetailsForm()}
        {step === 2 && renderAdminAuthForm()}
        {step === 3 && renderSuccessMessage()}
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
        }
        button[type="submit"]:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(232, 122, 0, 0.5);
        }
        button:hover:not(:disabled)[style*="border: 2px solid"] {
          background-color: #fff7ed !important;
          border-color: #C86800 !important;
        }
      `}</style>
    </div>
  );
};

export default Register;