import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Building,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Globe,
  Target,
  TrendingUp,
  Users,
  Shield
} from 'lucide-react';

// Vite uses import.meta.env instead of process.env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const SUPERADMIN_USERNAME = import.meta.env.VITE_SUPERADMIN_USERNAME || 'superadmin';
const SUPERADMIN_PASSWORD = import.meta.env.VITE_SUPERADMIN_PASSWORD || 'SuperAdmin@123';

const Register = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [createdOrgId, setCreatedOrgId] = useState(null);

  const [organizationData, setOrganizationData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'United States',
    ein: '',
    website: '',
    mission: ''
  });

  const [adminData, setAdminData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleOrgChange = (e) => {
    setOrganizationData({
      ...organizationData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleAdminChange = (e) => {
    setAdminData({
      ...adminData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateStep1 = () => {
    if (!organizationData.name.trim()) {
      setError('Organization name is required');
      return false;
    }
    if (!organizationData.email.trim() || !organizationData.email.includes('@')) {
      setError('Valid organization email is required');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!adminData.full_name.trim()) {
      setError('Admin name is required');
      return false;
    }
    if (!adminData.email.trim() || !adminData.email.includes('@')) {
      setError('Valid admin email is required');
      return false;
    }
    if (adminData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (adminData.password !== adminData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(1);
  };

  const getSuperadminToken = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/superadmin/login`, {
        username: SUPERADMIN_USERNAME,
        password: SUPERADMIN_PASSWORD
      });
      return response.data.access_token;
    } catch (err) {
      console.error('Failed to get superadmin token:', err);
      throw new Error('System authentication failed. Please contact support.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      const superadminToken = await getSuperadminToken();

      const orgResponse = await axios.post(
        `${API_BASE_URL}/api/v1/superadmin/organizations`,
        {
          name: organizationData.name,
          email: organizationData.email,
          phone: organizationData.phone || '',
          address: organizationData.address || '',
          city: organizationData.city || '',
          state: organizationData.state || '',
          zip_code: organizationData.zip_code || '',
          country: organizationData.country,
          ein: organizationData.ein || '',
          website: organizationData.website || '',
          mission: organizationData.mission || '',
          fiscal_year_end: '12-31',
          annual_budget: 0,
          is_active: true,
          slug: organizationData.name.toLowerCase().replace(/\s+/g, '-')
        },
        {
          headers: {
            'Authorization': `Bearer ${superadminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const organizationId = orgResponse.data.id;
      setCreatedOrgId(organizationId);

      // Create admin user with 'admin' role - this user will be able to create other users
      await axios.post(
        `${API_BASE_URL}/api/v1/superadmin/users`,
        {
          email: adminData.email,
          password: adminData.password,
          full_name: adminData.full_name,
          organization_id: organizationId,
          role: 'admin', // Organization admin role
          is_active: true,
          is_superadmin: false
        },
        {
          headers: {
            'Authorization': `Bearer ${superadminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setStep(3);
    } catch (err) {
      console.error('Registration error:', err);

      let errorMessage = 'Registration failed. Please try again.';

      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail[0]?.msg || errorMessage;
        }
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
    wrapper: {
      display: 'flex',
      gap: '24px',
      width: '100%',
      maxWidth: '1200px',
      alignItems: 'stretch'
    },
    card: {
      background: 'white',
      borderRadius: '24px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      padding: '48px',
      flex: 1,
      maxWidth: '600px',
      position: 'relative',
      overflow: 'hidden'
    },
    sidePanel: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '24px',
      padding: '48px',
      width: '400px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
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
      marginBottom: '24px'
    },
    logoIcon: {
      width: '56px',
      height: '56px',
      background: 'linear-gradient(135deg, #E87A00, #C86800)',
      borderRadius: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 24px rgba(232, 122, 0, 0.4)',
      marginRight: '12px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #E87A00, #C86800)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: 0,
      marginBottom: '8px'
    },
    subtitle: {
      fontSize: '15px',
      color: '#6b7280',
      textAlign: 'center',
      marginBottom: '24px'
    },
    progressBar: {
      width: '100%',
      height: '4px',
      background: '#e5e7eb',
      borderRadius: '2px',
      marginBottom: '32px',
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #E87A00, #C86800)',
      transition: 'width 0.3s ease',
      borderRadius: '2px'
    },
    alert: {
      padding: '14px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '16px',
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
    infoBanner: {
      padding: '12px 16px',
      borderRadius: '10px',
      background: '#fff7ed',
      border: '1px solid #fed7aa',
      color: '#92400e',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '24px',
      fontSize: '14px',
      fontWeight: '500'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '6px'
    },
    inputWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    inputIcon: {
      position: 'absolute',
      left: '14px',
      color: '#9ca3af',
      pointerEvents: 'none',
      zIndex: 1
    },
    input: {
      width: '100%',
      padding: '12px 14px 12px 44px',
      fontSize: '15px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      outline: 'none',
      transition: 'all 0.2s',
      boxSizing: 'border-box',
      fontFamily: 'inherit'
    },
    inputNoIcon: {
      padding: '12px 14px'
    },
    textarea: {
      width: '100%',
      padding: '12px 14px',
      fontSize: '15px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      outline: 'none',
      transition: 'all 0.2s',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      minHeight: '80px',
      resize: 'vertical'
    },
    passwordToggle: {
      position: 'absolute',
      right: '14px',
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
    helpText: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '4px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '8px'
    },
    button: {
      padding: '14px 24px',
      fontSize: '15px',
      fontWeight: '600',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      flex: 1
    },
    buttonPrimary: {
      background: 'linear-gradient(135deg, #E87A00, #C86800)',
      color: 'white',
      boxShadow: '0 4px 12px rgba(232, 122, 0, 0.3)'
    },
    buttonSecondary: {
      background: 'white',
      color: '#374151',
      border: '2px solid #e5e7eb'
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    buttonFull: {
      width: '100%'
    },
    checkbox: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      marginTop: '4px'
    },
    checkboxInput: {
      marginTop: '2px',
      cursor: 'pointer'
    },
    checkboxLabel: {
      fontSize: '13px',
      color: '#4b5563',
      cursor: 'pointer',
      lineHeight: '1.5'
    },
    footer: {
      textAlign: 'center',
      marginTop: '24px',
      paddingTop: '24px',
      borderTop: '1px solid #e5e7eb'
    },
    footerText: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '8px'
    },
    linkButton: {
      background: 'none',
      border: 'none',
      color: '#E87A00',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px',
      textDecoration: 'underline',
      padding: 0
    },
    successContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: '24px 0'
    },
    successIcon: {
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #10b981, #059669)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '24px',
      color: 'white',
      boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
    },
    successTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '12px'
    },
    successMessage: {
      fontSize: '16px',
      color: '#4b5563',
      marginBottom: '8px',
      lineHeight: '1.6'
    },
    successDetails: {
      background: '#f9fafb',
      borderRadius: '12px',
      padding: '20px',
      margin: '24px 0',
      width: '100%'
    },
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid #e5e7eb'
    },
    detailLabel: {
      fontWeight: '600',
      color: '#4b5563'
    },
    detailValue: {
      color: '#1f2937'
    },
    nextSteps: {
      textAlign: 'left',
      marginTop: '24px',
      padding: '20px',
      background: '#fff7ed',
      borderRadius: '12px',
      border: '1px solid #fed7aa'
    },
    nextStepsTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#92400e',
      marginBottom: '12px'
    },
    nextStepsList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    nextStepsItem: {
      fontSize: '14px',
      color: '#78350f',
      padding: '8px 0',
      paddingLeft: '24px',
      position: 'relative'
    },
    sidePanelTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '16px'
    },
    sidePanelIntro: {
      fontSize: '15px',
      color: '#6b7280',
      marginBottom: '32px',
      lineHeight: '1.6'
    },
    featureList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    featureItem: {
      display: 'flex',
      gap: '16px'
    },
    featureIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      background: 'linear-gradient(135deg, #E87A00, #C86800)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      color: 'white',
      fontSize: '18px',
      fontWeight: '700',
      boxShadow: '0 4px 12px rgba(232, 122, 0, 0.3)'
    },
    featureContent: {
      flex: 1
    },
    featureTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '4px'
    },
    featureDescription: {
      fontSize: '14px',
      color: '#6b7280',
      lineHeight: '1.5'
    }
  };

  const renderStep1 = () => (
    <>
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>
          <Building size={28} color="white" />
        </div>
        <div>
          <h1 style={styles.title}>Create Organization</h1>
        </div>
      </div>

      <p style={styles.subtitle}>Step 1 of 2: Organization Information</p>

      <div style={styles.progressBar}>
        <div style={{...styles.progressFill, width: '50%'}}></div>
      </div>

      {error && (
        <div style={{...styles.alert, ...styles.alertError}}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form style={styles.form} onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="org-name">Organization Name *</label>
          <div style={styles.inputWrapper}>
            <Building size={20} style={styles.inputIcon} />
            <input
              type="text"
              id="org-name"
              name="name"
              value={organizationData.name}
              onChange={handleOrgChange}
              placeholder="Hope Foundation"
              style={styles.input}
              required
            />
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="org-email">Organization Email *</label>
            <div style={styles.inputWrapper}>
              <Mail size={20} style={styles.inputIcon} />
              <input
                type="email"
                id="org-email"
                name="email"
                value={organizationData.email}
                onChange={handleOrgChange}
                placeholder="contact@hope.org"
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="org-phone">Phone Number</label>
            <div style={styles.inputWrapper}>
              <Phone size={20} style={styles.inputIcon} />
              <input
                type="tel"
                id="org-phone"
                name="phone"
                value={organizationData.phone}
                onChange={handleOrgChange}
                placeholder="(555) 123-4567"
                style={styles.input}
              />
            </div>
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="org-address">Address</label>
          <div style={styles.inputWrapper}>
            <MapPin size={20} style={styles.inputIcon} />
            <input
              type="text"
              id="org-address"
              name="address"
              value={organizationData.address}
              onChange={handleOrgChange}
              placeholder="123 Main Street"
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="org-city">City</label>
            <input
              type="text"
              id="org-city"
              name="city"
              value={organizationData.city}
              onChange={handleOrgChange}
              placeholder="New York"
              style={{...styles.input, ...styles.inputNoIcon}}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="org-state">State</label>
            <input
              type="text"
              id="org-state"
              name="state"
              value={organizationData.state}
              onChange={handleOrgChange}
              placeholder="NY"
              style={{...styles.input, ...styles.inputNoIcon}}
            />
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="org-zip">ZIP Code</label>
            <input
              type="text"
              id="org-zip"
              name="zip_code"
              value={organizationData.zip_code}
              onChange={handleOrgChange}
              placeholder="10001"
              style={{...styles.input, ...styles.inputNoIcon}}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="org-ein">EIN (Optional)</label>
            <input
              type="text"
              id="org-ein"
              name="ein"
              value={organizationData.ein}
              onChange={handleOrgChange}
              placeholder="12-3456789"
              style={{...styles.input, ...styles.inputNoIcon}}
            />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="org-website">Website</label>
          <div style={styles.inputWrapper}>
            <Globe size={20} style={styles.inputIcon} />
            <input
              type="url"
              id="org-website"
              name="website"
              value={organizationData.website}
              onChange={handleOrgChange}
              placeholder="https://www.hopefoundation.org"
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="org-mission">Mission Statement</label>
          <textarea
            id="org-mission"
            name="mission"
            value={organizationData.mission}
            onChange={handleOrgChange}
            placeholder="Describe your organization's mission and purpose..."
            style={styles.textarea}
          />
        </div>

        <button type="submit" style={{...styles.button, ...styles.buttonPrimary, ...styles.buttonFull}}>
          Continue to Admin Setup
          <ArrowRight size={20} />
        </button>
      </form>

      <div style={styles.footer}>
        <p style={styles.footerText}>Already have an account?</p>
        <button
          type="button"
          style={styles.linkButton}
          onClick={() => navigate('/login')}
        >
          Sign In
        </button>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>
          <User size={28} color="white" />
        </div>
        <div>
          <h1 style={styles.title}>Create Admin Account</h1>
        </div>
      </div>

      <p style={styles.subtitle}>Step 2 of 2: Administrator Information</p>

      <div style={styles.progressBar}>
        <div style={{...styles.progressFill, width: '100%'}}></div>
      </div>

      {error && (
        <div style={{...styles.alert, ...styles.alertError}}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={styles.infoBanner}>
        <Building size={16} />
        <span>Organization: {organizationData.name}</span>
      </div>

      <form style={styles.form} onSubmit={handleSubmit}>
        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="admin-name">Full Name *</label>
          <div style={styles.inputWrapper}>
            <User size={20} style={styles.inputIcon} />
            <input
              type="text"
              id="admin-name"
              name="full_name"
              value={adminData.full_name}
              onChange={handleAdminChange}
              placeholder="John Doe"
              style={styles.input}
              required
            />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="admin-email">Email Address *</label>
          <div style={styles.inputWrapper}>
            <Mail size={20} style={styles.inputIcon} />
            <input
              type="email"
              id="admin-email"
              name="email"
              value={adminData.email}
              onChange={handleAdminChange}
              placeholder="john.doe@hopefoundation.org"
              style={styles.input}
              required
            />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="admin-password">Password *</label>
          <div style={styles.inputWrapper}>
            <Lock size={20} style={styles.inputIcon} />
            <input
              type={showPassword ? 'text' : 'password'}
              id="admin-password"
              name="password"
              value={adminData.password}
              onChange={handleAdminChange}
              placeholder="Minimum 8 characters"
              style={styles.input}
              required
              minLength="8"
            />
            <button
              type="button"
              style={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <small style={styles.helpText}>Must be at least 8 characters</small>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="admin-confirm-password">Confirm Password *</label>
          <div style={styles.inputWrapper}>
            <Lock size={20} style={styles.inputIcon} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="admin-confirm-password"
              name="confirmPassword"
              value={adminData.confirmPassword}
              onChange={handleAdminChange}
              placeholder="Re-enter your password"
              style={styles.input}
              required
            />
            <button
              type="button"
              style={styles.passwordToggle}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div style={styles.checkbox}>
          <input
            type="checkbox"
            id="terms"
            required
            style={styles.checkboxInput}
          />
          <label htmlFor="terms" style={styles.checkboxLabel}>
            I agree to the Terms of Service and Privacy Policy
          </label>
        </div>

        <div style={styles.buttonGroup}>
          <button
            type="button"
            style={{...styles.button, ...styles.buttonSecondary}}
            onClick={handleBack}
            disabled={loading}
          >
            Back
          </button>
          <button
            type="submit"
            style={{
              ...styles.button,
              ...styles.buttonPrimary,
              ...(loading && styles.buttonDisabled)
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}></div>
                <span>Creating...</span>
              </>
            ) : (
              'Create Organization'
            )}
          </button>
        </div>
      </form>
    </>
  );

  const renderStep3 = () => (
    <div style={styles.successContainer}>
      <div style={styles.successIcon}>
        <CheckCircle size={50} />
      </div>
      <h1 style={styles.successTitle}>Account Created Successfully!</h1>
      <p style={styles.successMessage}>
        Your organization <strong>{organizationData.name}</strong> has been created with an administrator account.
      </p>
      <p style={styles.successMessage}>
        You can now sign in and start managing your nonprofit's data and analytics.
      </p>

      <div style={styles.successDetails}>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Organization:</span>
          <span style={styles.detailValue}>{organizationData.name}</span>
        </div>
        <div style={{...styles.detailRow, borderBottom: 'none'}}>
          <span style={styles.detailLabel}>Admin Email:</span>
          <span style={styles.detailValue}>{adminData.email}</span>
        </div>
      </div>

      <button
        style={{...styles.button, ...styles.buttonPrimary, ...styles.buttonFull}}
        onClick={() => navigate('/login')}
      >
        Go to Login
        <ArrowRight size={20} />
      </button>

      <div style={styles.nextSteps}>
        <h3 style={styles.nextStepsTitle}>Next Steps:</h3>
        <ul style={styles.nextStepsList}>
          <li style={styles.nextStepsItem}>✓ Sign in with your admin credentials</li>
          <li style={styles.nextStepsItem}>✓ Complete your organization profile</li>
          <li style={styles.nextStepsItem}>✓ Create user accounts for your team members</li>
          <li style={styles.nextStepsItem}>✓ Import donor and donation data</li>
          <li style={styles.nextStepsItem}>✓ Explore analytics dashboards</li>
        </ul>
      </div>
    </div>
  );

  const renderSidePanel = () => (
    <div style={styles.sidePanel}>
      <h2 style={styles.sidePanelTitle}>Join Nonprofit Leaders</h2>
      <p style={styles.sidePanelIntro}>
        Trusted by hundreds of nonprofit organizations to make data-driven decisions
      </p>
      <ul style={styles.featureList}>
        <li style={styles.featureItem}>
          <div style={styles.featureIcon}>
            <Target size={20} />
          </div>
          <div style={styles.featureContent}>
            <div style={styles.featureTitle}>Complete Analytics Suite</div>
            <p style={styles.featureDescription}>
              40+ comprehensive dashboards covering all aspects of your nonprofit
            </p>
          </div>
        </li>
        <li style={styles.featureItem}>
          <div style={styles.featureIcon}>
            <Users size={20} />
          </div>
          <div style={styles.featureContent}>
            <div style={styles.featureTitle}>Donor Intelligence</div>
            <p style={styles.featureDescription}>
              Track lifetime value, segments, and upgrade readiness
            </p>
          </div>
        </li>
        <li style={styles.featureItem}>
          <div style={styles.featureIcon}>
            <TrendingUp size={20} />
          </div>
          <div style={styles.featureContent}>
            <div style={styles.featureTitle}>Real-time Insights</div>
            <p style={styles.featureDescription}>
              Make informed decisions with up-to-date analytics
            </p>
          </div>
        </li>
        <li style={styles.featureItem}>
          <div style={styles.featureIcon}>
            <Shield size={20} />
          </div>
          <div style={styles.featureContent}>
            <div style={styles.featureTitle}>Secure & Compliant</div>
            <p style={styles.featureDescription}>
              Bank-level security with multi-tenant isolation
            </p>
          </div>
        </li>
      </ul>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.decorativeCircle}></div>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {step !== 3 && renderSidePanel()}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input:focus, textarea:focus {
          border-color: #E87A00 !important;
          box-shadow: 0 0 0 3px rgba(232, 122, 0, 0.1) !important;
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        button[style*="linear-gradient"]:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(232, 122, 0, 0.5) !important;
        }
        @media (max-width: 968px) {
          .wrapper {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;