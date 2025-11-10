import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Lock, Mail, AlertCircle, Target, CheckCircle,
  User, Building2, ArrowLeft, Send, Briefcase, Phone, Users
} from 'lucide-react';

const API_BASE_URL = '';

// Available roles for users
const USER_ROLES = {
  // Fundraising
  major_gifts: { label: 'Major Gifts Officer', category: 'Fundraising' },
  director_annual_giving: { label: 'Director of Annual Giving', category: 'Fundraising' },
  planned_giving: { label: 'Planned Giving Officer', category: 'Fundraising' },
  grants_manager: { label: 'Grants Manager', category: 'Fundraising' },

  // Donor Engagement
  stewardship: { label: 'Stewardship Officer', category: 'Donor Engagement' },
  membership: { label: 'Membership Manager', category: 'Donor Engagement' },
  donor_relations: { label: 'Donor Relations', category: 'Donor Engagement' },

  // Marketing & Communications
  marketing_comms: { label: 'Marketing & Communications', category: 'Marketing' },
  digital_strategy: { label: 'Digital Strategy', category: 'Marketing' },
  content_manager: { label: 'Content Manager', category: 'Marketing' },

  // Operations
  finance: { label: 'Finance', category: 'Operations' },
  operations: { label: 'Operations', category: 'Operations' },
  event_organizer: { label: 'Event Organizer', category: 'Operations' },

  // Leadership
  executive_director: { label: 'Executive Director', category: 'Leadership' },
  development_director: { label: 'Development Director', category: 'Leadership' },
  program_director: { label: 'Program Director', category: 'Leadership' }
};

const RegisterUserRequest = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    organizationId: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    jobTitle: '',
    department: '',
    role: 'major_gifts',
    password: '',
    confirmPassword: ''
  });

  const [organizations, setOrganizations] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedOrgName, setSubmittedOrgName] = useState('');

  // Load organizations on mount
  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/public/organizations`);
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.organizationId) {
      setError('Please select an organization');
      return false;
    }
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
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
      console.log('📝 Submitting registration request...');

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: formData.organizationId,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim(),
          phone_number: formData.phoneNumber.trim() || null,
          job_title: formData.jobTitle.trim() || null,
          department: formData.department.trim() || null,
          role: formData.role,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration request failed');
      }

      console.log('✅ Registration request submitted!', data);
      setSubmittedOrgName(data.organization_name);
      setSuccess(true);

    } catch (err) {
      console.error('❌ Registration error:', err);

      let errorMessage = 'Registration request failed. Please try again.';

      if (err.message.includes('already registered')) {
        errorMessage = 'This email is already registered. Please use a different email or contact your organization admin.';
      } else if (err.message.includes('pending approval')) {
        errorMessage = 'A registration request with this email is already pending approval.';
      } else if (err.message.includes('not found')) {
        errorMessage = 'Organization not found. Please select a valid organization.';
      } else {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Group roles by category
  const rolesByCategory = Object.entries(USER_ROLES).reduce((acc, [key, value]) => {
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
      background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #4c1d95 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    card: {
      background: 'white',
      borderRadius: '24px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      padding: '48px',
      width: '100%',
      maxWidth: '580px',
      position: 'relative',
      overflow: 'hidden',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    decorativeCircle: {
      position: 'absolute',
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
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
      background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 10px 30px rgba(124, 58, 237, 0.4)',
      marginRight: '16px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: 0
    },
    subtitle: {
      fontSize: '15px',
      color: '#6b7280',
      textAlign: 'center',
      marginBottom: '32px',
      lineHeight: '1.6'
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
      fontSize: '15px',
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
      fontSize: '15px',
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
      background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
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
    infoBox: {
      padding: '16px',
      background: '#ede9fe',
      border: '1px solid #c4b5fd',
      borderRadius: '12px',
      marginBottom: '24px'
    },
    infoTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#5b21b6',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    infoText: {
      fontSize: '13px',
      color: '#6b21a8',
      lineHeight: '1.5'
    },
    successCard: {
      textAlign: 'center'
    },
    successIcon: {
      width: '80px',
      height: '80px',
      background: 'linear-gradient(135deg, #059669, #047857)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 24px',
      boxShadow: '0 10px 30px rgba(5, 150, 105, 0.3)'
    },
    successTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '16px'
    },
    successMessage: {
      fontSize: '15px',
      color: '#6b7280',
      lineHeight: '1.6',
      marginBottom: '24px'
    },
    loginLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 24px',
      fontSize: '15px',
      fontWeight: '600',
      color: '#7c3aed',
      background: 'white',
      border: '2px solid #7c3aed',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      textDecoration: 'none',
      marginTop: '16px'
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
    twoColumn: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.decorativeCircle}></div>

          <div style={styles.successCard}>
            <div style={styles.successIcon}>
              <CheckCircle size={40} color="white" />
            </div>

            <h2 style={styles.successTitle}>Request Submitted!</h2>

            <p style={styles.successMessage}>
              Your registration request has been sent to the administrators at <strong>{submittedOrgName}</strong>.
              <br /><br />
              You will receive a notification once your account is approved. Please check your email regularly.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoTitle}>
                <AlertCircle size={14} />
                What Happens Next?
              </div>
              <div style={styles.infoText}>
                1. Organization admin will review your request<br />
                2. You'll receive an email notification when approved<br />
                3. You can then log in with your credentials
              </div>
            </div>

            <button
              type="button"
              style={styles.loginLink}
              onClick={() => navigate('/login')}
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>
          </div>
        </div>
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
            <Users size={32} color="white" />
          </div>
          <div>
            <h1 style={styles.title}>Join Organization</h1>
          </div>
        </div>

        <p style={styles.subtitle}>
          Request access to join an existing organization. Your request will be reviewed by the organization administrator.
        </p>

        <div style={styles.infoBox}>
          <div style={styles.infoTitle}>
            <AlertCircle size={14} />
            Registration Process
          </div>
          <div style={styles.infoText}>
            After submitting this form, an administrator from your selected organization will review and approve your request. You'll be notified by email once approved.
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
            <label style={styles.label} htmlFor="organizationId">Organization *</label>
            <div style={styles.inputWrapper}>
              <Building2 size={20} style={styles.inputIcon} />
              <select
                id="organizationId"
                name="organizationId"
                value={formData.organizationId}
                onChange={handleInputChange}
                style={styles.select}
                required
                disabled={loading || loadingOrgs}
              >
                <option value="">Select an organization...</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.twoColumn}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="firstName">First Name *</label>
              <div style={styles.inputWrapper}>
                <User size={20} style={styles.inputIcon} />
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="lastName">Last Name *</label>
              <div style={styles.inputWrapper}>
                <User size={20} style={styles.inputIcon} />
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="email">Email Address *</label>
            <div style={styles.inputWrapper}>
              <Mail size={20} style={styles.inputIcon} />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={handleInputChange}
                style={styles.input}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="phoneNumber">Phone Number</label>
            <div style={styles.inputWrapper}>
              <Phone size={20} style={styles.inputIcon} />
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                style={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.twoColumn}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="jobTitle">Job Title</label>
              <div style={styles.inputWrapper}>
                <Briefcase size={20} style={styles.inputIcon} />
                <input
                  id="jobTitle"
                  name="jobTitle"
                  type="text"
                  placeholder="Development Officer"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  style={styles.input}
                  disabled={loading}
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
                  placeholder="Fundraising"
                  value={formData.department}
                  onChange={handleInputChange}
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="role">Role *</label>
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
            <label style={styles.label} htmlFor="password">Password *</label>
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
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="confirmPassword">Confirm Password *</label>
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
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.passwordToggle}
                disabled={loading}
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
                Submitting Request...
              </>
            ) : (
              <>
                <Send size={20} />
                Submit Registration Request
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
          border-color: #7c3aed !important;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1) !important;
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        button[type="submit"]:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5);
        }
      `}</style>
    </div>
  );
};

export default RegisterUserRequest;
