import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Lock, Mail, AlertCircle, Target, CheckCircle,
  User, Building2, ArrowLeft, Send, Briefcase, Phone
} from 'lucide-react';

// API Configuration
const API_BASE_URL = '';

// Limited roles available for staff self-registration
// TODO: Update these based on your actual available roles
const STAFF_ROLES = {
  // Fundraising
  major_gifts: { label: 'Major Gifts Officer', category: 'Fundraising' },
  director_annual_giving: { label: 'Director of Annual Giving', category: 'Fundraising' },
  planned_giving: { label: 'Planned Giving Officer', category: 'Fundraising' },

  // Donor Engagement
  stewardship: { label: 'Stewardship', category: 'Donor Engagement' },
  membership: { label: 'Membership', category: 'Donor Engagement' },

  // Marketing
  marketing_comms: { label: 'Marketing & Communications', category: 'Marketing' },
  digital_strategy: { label: 'Digital Strategy', category: 'Marketing' },

  // Operations
  sales_team: { label: 'Sales Team', category: 'Operations' },
  event_organizer: { label: 'Event Organizer', category: 'Operations' }
};

const RegisterStaff = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    jobTitle: '',
    department:'',
    role: 'major_gifts'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
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
    /*if (!formData.organizationId.trim()) {
      setError('Organization ID is required');
      return false;
    }*/
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Registering staff member...');

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: formData.firstName.trim(),
	  last_name: formData.lastName.trim(),
          email: formData.email.trim(),
	  job_title: formData.jobTitle.trim(),
          password: formData.password,
	  department: formData.department,
          phone: formData.phone.trim(),
          role: formData.role
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await response.json();
      console.log('✅ Registration successful!', data);
      setSuccess(true);

    } catch (err) {
      console.error('❌ Registration error:', err);

      let errorMessage = 'Registration failed. Please try again.';

      if (err.message.includes('404')) {
        errorMessage = 'Organization not found. Please check the Organization ID.';
      } else if (err.message.includes('409')) {
        errorMessage = 'This email is already registered.';
      } else {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Group roles by category
  const rolesByCategory = Object.entries(STAFF_ROLES).reduce((acc, [key, value]) => {
    if (!acc[value.category]) {
      acc[value.category] = [];
    }
    acc[value.category].push({ key, ...value });
    return acc;
  }, {});

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
    select: {
      width: '100%',
      padding: '14px 16px 14px 48px',
      fontSize: '16px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      outline: 'none',
      transition: 'all 0.2s',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      backgroundColor: '#fff',
      cursor: 'pointer'
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

  if (success) {
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

          <div style={styles.successCard}>
            <div style={styles.successIcon}>
              <CheckCircle size={40} color="white" />
            </div>
            <h2 style={styles.successTitle}>Registration Successful!</h2>
            <p style={styles.successMessage}>
              Your staff account for <strong>{formData.email}</strong> has been created successfully.
              You can now log in with your credentials.
            </p>

            <button
              type="button"
              style={styles.loginLink}
              onClick={() => navigate('/login')}
            >
              <ArrowLeft size={16} />
              Go to Login
            </button>
          </div>
        </div>

        <style>{`
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
          button:hover:not(:disabled) {
            transform: translateY(-2px);
          }
          button:hover:not(:disabled)[style*="border: 2px solid"] {
            background-color: #fff7ed !important;
            border-color: #C86800 !important;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.decorativeCircle}></div>

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
          Register as a staff member
        </p>

        <div style={styles.infoBox}>
          <div style={styles.infoTitle}>
            <Briefcase size={14} />
            Staff Registration
          </div>
          <div style={styles.infoText}>
            Create your staff account with limited role options. For admin access or other roles,
            contact your organization administrator for an invitation.
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
            <label style={styles.label} htmlFor="firstName">First Name</label>
            <div style={styles.inputWrapper}>
              <User size={20} style={styles.inputIcon} />
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={handleInputChange}
                style={styles.input}
                required
                disabled={loading}
                autoComplete="name"
              />
            </div>
          </div>
           <div style={styles.inputGroup}>
                      <label style={styles.label} htmlFor="lastName">Last Name</label>
                      <div style={styles.inputWrapper}>
                        <User size={20} style={styles.inputIcon} />
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          placeholder="Enter your last name"
                          value={formData.lastName}
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
            <label style={styles.label} htmlFor="phone">Phone Number</label>
            <div style={styles.inputWrapper}>
              <Phone size={20} style={styles.inputIcon} />
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={handleInputChange}
                style={styles.input}
                required
                disabled={loading}
                autoComplete="tel"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="jobTitle">Job Title</label>
            <div style={styles.inputWrapper}>
              <Briefcase size={20} style={styles.inputIcon} />
              <input
                id="jobTitle"
                name="jobTitle"
                type="text"
                placeholder="Enter your job title"
                value={formData.jobTitle}
                onChange={handleInputChange}
                style={styles.input}
                required
                disabled={loading}
                autoComplete="organization-title"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="department">Department</label>
            <div style={styles.inputWrapper}>
              <Building2 size={20} style={styles.inputIcon} />
              <input
                id="department"
                name="department"
                type="text"
                placeholder="Enter your department"
                value={formData.department}
                onChange={handleInputChange}
                style={styles.input}
                required
                disabled={loading}
                autoComplete="organization"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="role">Role</label>
            <div style={styles.inputWrapper}>
              <Briefcase size={20} style={styles.inputIcon} />
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                style={styles.select}
                required
                disabled={loading}
              >
                {Object.entries(rolesByCategory).map(([category, roles]) => (
                  <optgroup key={category} label={category}>
                    {roles.map(role => (
                      <option key={role.key} value={role.key}>
                        {role.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
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
                Create Staff Account
              </>
            )}
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
        input:focus, select:focus {
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

export default RegisterStaff;