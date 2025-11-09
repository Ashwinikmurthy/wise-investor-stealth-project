import React, { useState } from 'react';
import { 
  Mail, User, Send, CheckCircle, AlertCircle, Shield, 
  Phone, Briefcase, Building, Target
} from 'lucide-react';

// API Configuration
const API_BASE_URL = '';

// All available roles
const ALL_ROLES = {
  // System & Organization Admin
  superadmin: { label: 'Super Admin', category: 'Admin', color: '#dc2626' },
  org_admin: { label: 'Organization Admin', category: 'Admin', color: '#ea580c' },
  
  // Executive Leadership
  ceo: { label: 'CEO', category: 'Executive', color: '#7c3aed' },
  executive: { label: 'Executive', category: 'Executive', color: '#9333ea' },
  
  // Fundraising Teams
  major_gifts: { label: 'Major Gifts Officer', category: 'Fundraising', color: '#059669' },
  director_annual_giving: { label: 'Director of Annual Giving', category: 'Fundraising', color: '#10b981' },
  planned_giving: { label: 'Planned Giving Officer', category: 'Fundraising', color: '#14b8a6' },
  corporate_foundations: { label: 'Corporate & Foundation Relations', category: 'Fundraising', color: '#06b6d4' },
  
  // Donor Engagement
  stewardship: { label: 'Stewardship', category: 'Donor Engagement', color: '#0ea5e9' },
  membership: { label: 'Membership', category: 'Donor Engagement', color: '#3b82f6' },
  
  // Marketing & Communications
  marketing_comms: { label: 'Marketing & Communications', category: 'Marketing', color: '#6366f1' },
  digital_strategy: { label: 'Digital Strategy', category: 'Marketing', color: '#8b5cf6' },
  
  // Sales & Operations
  sales_team: { label: 'Sales Team', category: 'Sales & Operations', color: '#a855f7' },
  event_organizer: { label: 'Event Organizer', category: 'Sales & Operations', color: '#c026d3' },
  
  // Basic Access
  donor: { label: 'Donor', category: 'Basic Access', color: '#64748b' }
};

const InviteUser = ({ token, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    jobTitle: '',
    role: 'donor',
    sendEmail: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
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
      console.log('📧 Sending invitation...');
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/invite-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          department: formData.department.trim() || null,
          job_title: formData.jobTitle.trim() || null,
          role: formData.role,
          send_invitation_email: formData.sendEmail
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to send invitation' }));
        throw new Error(errorData.detail || 'Failed to send invitation');
      }

      const data = await response.json();
      console.log('✅ Invitation sent!', data);
      
      setInvitationDetails(data);
      setSuccess(true);
      
      if (onSuccess) {
        onSuccess(data);
      }

    } catch (err) {
      console.error('❌ Invitation error:', err);

      let errorMessage = 'Failed to send invitation. Please try again.';
      
      if (err.message.includes('403')) {
        errorMessage = 'Insufficient permissions. You cannot invite users with this role.';
      } else if (err.message.includes('409')) {
        errorMessage = 'This email is already registered or has a pending invitation.';
      } else {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      jobTitle: '',
      role: 'donor',
      sendEmail: true
    });
    setSuccess(false);
    setError('');
    setInvitationDetails(null);
  };

  // Group roles by category
  const rolesByCategory = Object.entries(ALL_ROLES).reduce((acc, [key, value]) => {
    if (!acc[value.category]) {
      acc[value.category] = [];
    }
    acc[value.category].push({ key, ...value });
    return acc;
  }, {});

  const styles = {
    container: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '32px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      padding: '32px',
      border: '1px solid #e5e7eb'
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    iconWrapper: {
      width: '64px',
      height: '64px',
      background: 'linear-gradient(135deg, #E87A00, #C86800)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px',
      boxShadow: '0 8px 20px rgba(232, 122, 0, 0.4)'
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #E87A00, #C86800)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '8px'
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    row: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
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
      padding: '12px 16px 12px 48px',
      fontSize: '14px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      outline: 'none',
      transition: 'all 0.2s',
      boxSizing: 'border-box',
      fontFamily: 'inherit'
    },
    select: {
      width: '100%',
      padding: '12px 16px 12px 48px',
      fontSize: '14px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      outline: 'none',
      transition: 'all 0.2s',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      cursor: 'pointer'
    },
    checkboxWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px',
      background: '#f9fafb',
      borderRadius: '8px'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    },
    checkboxLabel: {
      fontSize: '14px',
      color: '#374151',
      cursor: 'pointer',
      userSelect: 'none'
    },
    button: {
      width: '100%',
      padding: '14px',
      fontSize: '16px',
      fontWeight: '600',
      color: 'white',
      background: 'linear-gradient(135deg, #E87A00, #C86800)',
      border: 'none',
      borderRadius: '8px',
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
      cursor: 'not-allowed'
    },
    secondaryButton: {
      width: '100%',
      padding: '14px',
      fontSize: '16px',
      fontWeight: '600',
      color: '#E87A00',
      background: 'white',
      border: '2px solid #E87A00',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    alert: {
      padding: '14px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
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
    successCard: {
      textAlign: 'center'
    },
    successIcon: {
      width: '64px',
      height: '64px',
      background: 'linear-gradient(135deg, #10b981, #059669)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px',
      boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)'
    },
    successTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#059669',
      marginBottom: '8px'
    },
    successMessage: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '16px',
      lineHeight: '1.6'
    },
    detailsBox: {
      background: '#f9fafb',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      textAlign: 'left'
    },
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '14px'
    },
    detailLabel: {
      color: '#6b7280',
      fontWeight: '500'
    },
    detailValue: {
      color: '#111827',
      fontWeight: '600'
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successCard}>
            <div style={styles.successIcon}>
              <CheckCircle size={32} color="white" />
            </div>
            <h2 style={styles.successTitle}>Invitation Sent!</h2>
            <p style={styles.successMessage}>
              An invitation has been sent to <strong>{formData.email}</strong>. 
              {formData.sendEmail 
                ? ' They will receive an email with instructions to complete their registration.' 
                : ' Please share the invitation link with them manually.'}
            </p>

            <div style={styles.detailsBox}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Name:</span>
                <span style={styles.detailValue}>{formData.firstName} {formData.lastName}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Email:</span>
                <span style={styles.detailValue}>{formData.email}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Role:</span>
                <span style={styles.detailValue}>{ALL_ROLES[formData.role]?.label}</span>
              </div>
              {formData.department && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Department:</span>
                  <span style={styles.detailValue}>{formData.department}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={handleReset}
            >
              Invite Another User
            </button>
          </div>
        </div>

        <style>{`
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
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <Shield size={32} color="white" />
          </div>
          <h1 style={styles.title}>Invite New User</h1>
          <p style={styles.subtitle}>Send an invitation to join your organization</p>
        </div>

        {error && (
          <div style={{...styles.alert, ...styles.alertError}}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="firstName">First Name</label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="lastName">Last Name</label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Last name"
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
            <label style={styles.label} htmlFor="email">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={handleInputChange}
                style={styles.input}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="role">Role</label>
            <div style={styles.inputWrapper}>
              <Shield size={18} style={styles.inputIcon} />
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
            <label style={styles.label} htmlFor="phone">Phone Number (Optional)</label>
            <div style={styles.inputWrapper}>
              <Phone size={18} style={styles.inputIcon} />
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(555) 987-6543"
                value={formData.phone}
                onChange={handleInputChange}
                style={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="department">Department (Optional)</label>
              <div style={styles.inputWrapper}>
                <Building size={18} style={styles.inputIcon} />
                <input
                  id="department"
                  name="department"
                  type="text"
                  placeholder="e.g., Executive"
                  value={formData.department}
                  onChange={handleInputChange}
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="jobTitle">Job Title (Optional)</label>
              <div style={styles.inputWrapper}>
                <Briefcase size={18} style={styles.inputIcon} />
                <input
                  id="jobTitle"
                  name="jobTitle"
                  type="text"
                  placeholder="e.g., Chief Executive Officer"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div style={styles.checkboxWrapper}>
            <input
              type="checkbox"
              id="sendEmail"
              name="sendEmail"
              checked={formData.sendEmail}
              onChange={handleInputChange}
              style={styles.checkbox}
              disabled={loading}
            />
            <label htmlFor="sendEmail" style={styles.checkboxLabel}>
              Send invitation email automatically
            </label>
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
                  width: '18px',
                  height: '18px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}></div>
                Sending Invitation...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Invitation
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
          border-color: #E87A00 !important;
          box-shadow: 0 0 0 3px rgba(232, 122, 0, 0.1) !important;
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        button[type="submit"]:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(232, 122, 0, 0.5);
        }
      `}</style>
    </div>
  );
};

export default InviteUser;
