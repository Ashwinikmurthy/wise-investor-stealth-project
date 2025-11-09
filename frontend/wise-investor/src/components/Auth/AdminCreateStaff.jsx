import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle, 
  User, Building2, Send, Briefcase, Phone, ArrowLeft, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// API Configuration
const API_BASE_URL = '';

// All available staff roles (admin can create any of these)
const STAFF_ROLES = {
  // Fundraising
  major_gifts: { label: 'Major Gifts Officer', category: 'Fundraising' },
  director_annual_giving: { label: 'Director of Annual Giving', category: 'Fundraising' },
  planned_giving: { label: 'Planned Giving Officer', category: 'Fundraising' },
  
  // Donor Engagement
  stewardship: { label: 'Stewardship', category: 'Donor Engagement' },
  membership: { label: 'Membership', category: 'Donor Engagement' },
  donor: { label: 'Donor', category: 'Donor Engagement' },
  
  // Marketing
  marketing_comms: { label: 'Marketing & Communications', category: 'Marketing' },
  digital_strategy: { label: 'Digital Strategy', category: 'Marketing' },
  
  // Operations
  sales_team: { label: 'Sales Team', category: 'Operations' },
  event_organizer: { label: 'Event Organizer', category: 'Operations' },
  
  // Administration
  admin: { label: 'Administrator', category: 'Administration' }
};

const AdminCreateStaff = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, getToken } = useAuth();

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

  // Check authentication on component mount using AuthContext
  useEffect(() => {
    console.log('🔍 Checking authentication...');
    console.log('Is Authenticated:', isAuthenticated);
    console.log('Current User:', currentUser);
    
    if (!isAuthenticated) {
      console.log('❌ User not authenticated');
      setError('Please log in to access this page.');
      return;
    }

    // Check if user has admin role
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'superadmin') {
      console.log('❌ User is not an admin. Role:', currentUser?.role);
      setError(`Access denied. Admin privileges required. Current role: ${currentUser?.role || 'none'}`);
      return;
    }

    console.log('✅ Admin authenticated:', currentUser.email, 'Role:', currentUser.role);
  }, [isAuthenticated, currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }

    if (!formData.jobTitle.trim()) {
      setError('Job title is required');
      return false;
    }

    if (!formData.department.trim()) {
      setError('Department is required');
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
      console.log('📝 Creating staff member (admin action)...');
      
      // Use getToken() method from AuthContext
      const token = getToken();
      
      console.log('🔑 Token retrieved:', !!token);
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Try the standard staff endpoint first
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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

      // Log the response for debugging
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Staff creation failed' }));
        
        // Log the full error for debugging
        console.error('❌ Backend Error Response:', errorData);
        console.error('❌ Error Detail:', JSON.stringify(errorData, null, 2));
        
        // Handle FastAPI validation errors (array of errors)
        if (Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail.map(err => {
            const field = err.loc ? err.loc.join('.') : 'unknown';
            return `${field}: ${err.msg}`;
          }).join('\n');
          throw new Error(errorMessages);
        }
        
        // Handle simple string errors
        throw new Error(errorData.detail || errorData.message || 'Staff creation failed');
      }

      const data = await response.json();
      console.log('✅ Staff member created successfully!', data);
      setSuccess(true);

      // Reset form after successful creation
      setTimeout(() => {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          jobTitle: '',
          department: '',
          role: 'major_gifts'
        });
        setSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('❌ Staff creation error:', err);
      console.error('❌ Error message:', err.message);

      let errorMessage = 'Staff creation failed. Please try again.';
      
      if (err.message.includes('401')) {
        errorMessage = 'Authentication expired. Please log in again.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.message.includes('403')) {
        errorMessage = 'Access denied. Admin privileges required.';
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    },
    card: {
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      maxWidth: '600px',
      width: '100%',
      padding: '2.5rem'
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem'
    },
    adminBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: '600',
      marginBottom: '1rem'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#1a202c',
      marginBottom: '0.5rem'
    },
    subtitle: {
      color: '#718096',
      fontSize: '0.875rem'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#4a5568'
    },
    inputWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    inputIcon: {
      position: 'absolute',
      left: '1rem',
      color: '#a0aec0'
    },
    input: {
      width: '100%',
      padding: '0.75rem 1rem 0.75rem 3rem',
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      transition: 'all 0.2s',
      outline: 'none'
    },
    select: {
      width: '100%',
      padding: '0.75rem 1rem 0.75rem 3rem',
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      transition: 'all 0.2s',
      outline: 'none',
      backgroundColor: 'white',
      cursor: 'pointer'
    },
    passwordToggle: {
      position: 'absolute',
      right: '1rem',
      cursor: 'pointer',
      color: '#a0aec0'
    },
    submitButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '0.875rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      opacity: loading ? 0.7 : 1
    },
    alert: {
      padding: '1rem',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontSize: '0.875rem'
    },
    alertError: {
      backgroundColor: '#fee',
      color: '#c53030',
      border: '1px solid #feb2b2'
    },
    alertSuccess: {
      backgroundColor: '#f0fdf4',
      color: '#166534',
      border: '1px solid #86efac'
    },
    backButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#667eea',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      marginBottom: '1rem',
      padding: '0.5rem',
      border: 'none',
      background: 'none'
    }
  };

  // Show loading while checking authentication
  if (!isAuthenticated && !error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              border: '4px solid #e2e8f0',
              borderTopColor: '#667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ color: '#718096' }}>Verifying admin access...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button 
          style={styles.backButton}
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div style={styles.header}>
          <div style={styles.adminBadge}>
            <Shield size={16} />
            Admin Panel
          </div>
          <h1 style={styles.title}>Create Staff Member</h1>
          <p style={styles.subtitle}>
            {currentUser && `Logged in as: ${currentUser.email}`}
          </p>
        </div>

        {success && (
          <div style={{...styles.alert, ...styles.alertSuccess}}>
            <CheckCircle size={20} />
            <span>Staff member created successfully!</span>
          </div>
        )}

        {error && (
          <div style={{...styles.alert, ...styles.alertError}}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form style={styles.form} onSubmit={handleSubmit}>
          {/* Name Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="firstName">First Name</label>
              <div style={styles.inputWrapper}>
                <User size={20} style={styles.inputIcon} />
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  disabled={loading}
                  autoComplete="given-name"
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
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  disabled={loading}
                  autoComplete="family-name"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="email">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={20} style={styles.inputIcon} />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleInputChange}
                style={styles.input}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Phone */}
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

          {/* Job Title & Department Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="jobTitle">Job Title</label>
              <div style={styles.inputWrapper}>
                <Briefcase size={20} style={styles.inputIcon} />
                <input
                  id="jobTitle"
                  name="jobTitle"
                  type="text"
                  placeholder="Enter job title"
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
                  placeholder="Enter department"
                  value={formData.department}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  disabled={loading}
                  autoComplete="organization"
                />
              </div>
            </div>
          </div>

          {/* Role */}
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

          {/* Password */}
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="password">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={20} style={styles.inputIcon} />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create password (min. 8 characters)"
                value={formData.password}
                onChange={handleInputChange}
                style={styles.input}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              <div 
                style={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="confirmPassword">Confirm Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={20} style={styles.inputIcon} />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                style={styles.input}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              <div 
                style={styles.passwordToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Creating Staff Member...
              </>
            ) : (
              <>
                <Send size={20} />
                Create Staff Member
              </>
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        input:focus, select:focus {
          border-color: #667eea !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        select option {
          padding: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default AdminCreateStaff;
