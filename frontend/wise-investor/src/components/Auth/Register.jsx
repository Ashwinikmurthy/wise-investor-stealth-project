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
  Globe
} from 'lucide-react';
import './Auth.css';

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
    mission_statement: ''
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
          mission_statement: organizationData.mission_statement || '',
          fiscal_year_end: '10-27',
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

      await axios.post(
        `${API_BASE_URL}/api/v1/superadmin/users`,
        {
          email: adminData.email,
          password: adminData.password,
          full_name: adminData.full_name,
          organization_id: organizationId,
          role: 'admin',
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

  const renderStep1 = () => (
    <>
      <div className="auth-header">
        <div className="auth-logo">
          <Building size={40} />
        </div>
        <h1>Create Organization</h1>
        <p>Step 1 of 2: Organization Information</p>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: '50%' }}></div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="auth-form">
        <div className="form-group">
          <label htmlFor="org-name">Organization Name *</label>
          <div className="input-with-icon">
            <Building size={20} />
            <input
              type="text"
              id="org-name"
              name="name"
              value={organizationData.name}
              onChange={handleOrgChange}
              placeholder="Hope Foundation"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="org-email">Organization Email *</label>
          <div className="input-with-icon">
            <Mail size={20} />
            <input
              type="email"
              id="org-email"
              name="email"
              value={organizationData.email}
              onChange={handleOrgChange}
              placeholder="contact@hopefoundation.org"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="org-phone">Phone Number</label>
          <div className="input-with-icon">
            <Phone size={20} />
            <input
              type="tel"
              id="org-phone"
              name="phone"
              value={organizationData.phone}
              onChange={handleOrgChange}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="org-website">Website</label>
          <div className="input-with-icon">
            <Globe size={20} />
            <input
              type="url"
              id="org-website"
              name="website"
              value={organizationData.website}
              onChange={handleOrgChange}
              placeholder="https://hopefoundation.org"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="org-ein">EIN (Employer Identification Number)</label>
          <input
            type="text"
            id="org-ein"
            name="ein"
            value={organizationData.ein}
            onChange={handleOrgChange}
            placeholder="XX-XXXXXXX"
          />
        </div>
        <div className="form-group">
          <label htmlFor="fiscal-year-end">Fiscal Year End *</label>
          <div className="input-with-icon">
            <Building size={20} />
            <input
              type="text"
              id="fiscal-year-end"
              name="fiscal_year_end"
              value={organizationData.fiscal_year_end}
              onChange={handleOrgChange}
              placeholder="MM-DD (e.g., 12-31)"
              pattern="(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
              maxLength="5"
              required
            />
          </div>
          <small className="help-text">
            Enter the last day of your fiscal year (MM-DD format, e.g., 12-31 for December 31st)
          </small>
        </div>
        <div className="form-group">
          <label htmlFor="org-mission">Mission Statement</label>
          <textarea
            id="org-mission"
            name="mission_statement"
            value={organizationData.mission_statement}
            onChange={handleOrgChange}
            placeholder="Describe your organization's mission..."
            rows="3"
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="org-address">Address</label>
          <div className="input-with-icon">
            <MapPin size={20} />
            <input
              type="text"
              id="org-address"
              name="address"
              value={organizationData.address}
              onChange={handleOrgChange}
              placeholder="123 Main Street"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="org-city">City</label>
            <input
              type="text"
              id="org-city"
              name="city"
              value={organizationData.city}
              onChange={handleOrgChange}
              placeholder="New York"
            />
          </div>

          <div className="form-group">
            <label htmlFor="org-state">State</label>
            <input
              type="text"
              id="org-state"
              name="state"
              value={organizationData.state}
              onChange={handleOrgChange}
              placeholder="NY"
              maxLength="2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="org-zip">ZIP Code</label>
            <input
              type="text"
              id="org-zip"
              name="zip_code"
              value={organizationData.zip_code}
              onChange={handleOrgChange}
              placeholder="10001"
            />
          </div>
        </div>

        <button type="submit" className="btn-primary btn-block">
          Continue to Admin Setup
          <ArrowRight size={20} />
        </button>
      </form>

      <div className="auth-footer">
        <p>Already have an account?</p>
        <button
          type="button"
          className="link-button-large"
          onClick={() => navigate('/login')}
        >
          Sign In
        </button>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="auth-header">
        <div className="auth-logo">
          <User size={40} />
        </div>
        <h1>Create Admin Account</h1>
        <p>Step 2 of 2: Administrator Information</p>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: '100%' }}></div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="info-banner success">
        <Building size={16} />
        <span>Organization: {organizationData.name}</span>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="admin-name">Full Name *</label>
          <div className="input-with-icon">
            <User size={20} />
            <input
              type="text"
              id="admin-name"
              name="full_name"
              value={adminData.full_name}
              onChange={handleAdminChange}
              placeholder="John Doe"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="admin-email">Email Address *</label>
          <div className="input-with-icon">
            <Mail size={20} />
            <input
              type="email"
              id="admin-email"
              name="email"
              value={adminData.email}
              onChange={handleAdminChange}
              placeholder="john.doe@hopefoundation.org"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="admin-password">Password *</label>
          <div className="input-with-icon">
            <Lock size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              id="admin-password"
              name="password"
              value={adminData.password}
              onChange={handleAdminChange}
              placeholder="Minimum 8 characters"
              required
              minLength="8"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <small className="help-text">Must be at least 8 characters</small>
        </div>

        <div className="form-group">
          <label htmlFor="admin-confirm-password">Confirm Password *</label>
          <div className="input-with-icon">
            <Lock size={20} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="admin-confirm-password"
              name="confirmPassword"
              value={adminData.confirmPassword}
              onChange={handleAdminChange}
              placeholder="Re-enter your password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="form-footer">
          <label className="checkbox-label">
            <input type="checkbox" required />
            <span>I agree to the Terms of Service and Privacy Policy</span>
          </label>
        </div>

        <div className="button-group">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleBack}
            disabled={loading}
          >
            Back
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div>
                <span>Creating Account...</span>
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
    <div className="success-container">
      <div className="success-icon">
        <CheckCircle size={80} />
      </div>
      <h1>Account Created Successfully!</h1>
      <p className="success-message">
        Your organization <strong>{organizationData.name}</strong> has been created.
      </p>
      <p className="success-submessage">
        You can now sign in with your admin account and start using the platform.
      </p>
      
      <div className="success-details">
        <div className="detail-row">
          <span className="detail-label">Organization:</span>
          <span className="detail-value">{organizationData.name}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Admin Email:</span>
          <span className="detail-value">{adminData.email}</span>
        </div>
      </div>

      <button
        className="btn-primary btn-block btn-large"
        onClick={() => navigate('/login')}
      >
        Go to Login
        <ArrowRight size={20} />
      </button>

      <div className="next-steps">
        <h3>Next Steps:</h3>
        <ul>
          <li>Sign in with your admin credentials</li>
          <li>Complete your organization profile</li>
          <li>Add team members and assign roles</li>
          <li>Import your donor and donation data</li>
          <li>Explore the analytics dashboards</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card register-card">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {step !== 3 && (
          <div className="auth-side-panel">
            <div className="side-panel-content">
              <h2>Join Nonprofit Leaders</h2>
              <p className="side-panel-intro">
                Trusted by hundreds of nonprofit organizations to make data-driven decisions
              </p>
              <ul className="feature-list">
                <li>
                  <div className="feature-icon">✓</div>
                  <div>
                    <strong>Complete Analytics Suite</strong>
                    <p>40 comprehensive dashboards covering all aspects</p>
                  </div>
                </li>
                <li>
                  <div className="feature-icon">✓</div>
                  <div>
                    <strong>Donor Intelligence</strong>
                    <p>Track lifetime value, segments, and upgrade readiness</p>
                  </div>
                </li>
                <li>
                  <div className="feature-icon">✓</div>
                  <div>
                    <strong>Real-time Insights</strong>
                    <p>Make informed decisions with up-to-date data</p>
                  </div>
                </li>
                <li>
                  <div className="feature-icon">✓</div>
                  <div>
                    <strong>Secure & Compliant</strong>
                    <p>Bank-level security with multi-tenant isolation</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
