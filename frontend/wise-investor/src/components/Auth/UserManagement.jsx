import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Mail,
  User,
  Lock,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'viewer'
  });

  const roles = [
    { value: 'admin', label: 'Administrator', description: 'Full access to all features' },
    { value: 'program_manager', label: 'Program Manager', description: 'Manage programs and beneficiaries' },
    { value: 'fundraising_coordinator', label: 'Fundraising Coordinator', description: 'Manage donors and campaigns' },
    { value: 'finance_manager', label: 'Finance Manager', description: 'Manage financial data and reports' },
    { value: 'board_member', label: 'Board Member', description: 'View executive dashboards' },
    { value: 'analyst', label: 'Analyst', description: 'View and analyze data' },
    { value: 'viewer', label: 'Viewer', description: 'View-only access' }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const organizationId = localStorage.getItem('organizationId');

      await axios.post(
        `${API_BASE_URL}/api/v1/admin/users`,
        {
          ...newUser,
          organization_id: organizationId,
          is_active: true,
          is_superadmin: false
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('User created successfully!');
      setShowModal(false);
      setNewUser({ full_name: '', email: '', password: '', role: 'viewer' });
      loadUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to create user';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('User deleted successfully');
      loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: '#E87A00',
      program_manager: '#3b82f6',
      fundraising_coordinator: '#10b981',
      finance_manager: '#8b5cf6',
      board_member: '#f59e0b',
      analyst: '#06b6d4',
      viewer: '#6b7280'
    };
    return colors[role] || '#6b7280';
  };

  const styles = {
    container: {
      padding: '32px',
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#1f2937',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    titleIcon: {
      width: '48px',
      height: '48px',
      background: 'linear-gradient(135deg, #E87A00, #C86800)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    },
    addButton: {
      padding: '12px 24px',
      fontSize: '15px',
      fontWeight: '600',
      color: 'white',
      background: 'linear-gradient(135deg, #E87A00, #C86800)',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      boxShadow: '0 4px 12px rgba(232, 122, 0, 0.3)'
    },
    alert: {
      padding: '14px 16px',
      borderRadius: '10px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
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
    userGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '20px'
    },
    userCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #e5e7eb',
      transition: 'all 0.2s',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    userHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px'
    },
    userInfo: {
      flex: 1
    },
    userName: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '4px'
    },
    userEmail: {
      fontSize: '14px',
      color: '#6b7280',
      fontFamily: 'monospace'
    },
    roleBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600',
      color: 'white',
      marginTop: '12px'
    },
    userActions: {
      display: 'flex',
      gap: '8px'
    },
    iconButton: {
      width: '36px',
      height: '36px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      background: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
      color: '#6b7280'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modalContent: {
      background: 'white',
      borderRadius: '20px',
      padding: '32px',
      width: '100%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflowY: 'auto',
      position: 'relative'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    },
    modalTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937'
    },
    closeButton: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      border: 'none',
      background: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
      color: '#6b7280'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
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
      pointerEvents: 'none'
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
    select: {
      width: '100%',
      padding: '12px 14px',
      fontSize: '15px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      outline: 'none',
      transition: 'all 0.2s',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      cursor: 'pointer'
    },
    roleOption: {
      padding: '12px',
      marginBottom: '8px'
    },
    roleDescription: {
      fontSize: '13px',
      color: '#6b7280',
      marginTop: '4px'
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
      alignItems: 'center'
    },
    submitButton: {
      padding: '14px 24px',
      fontSize: '15px',
      fontWeight: '600',
      color: 'white',
      background: 'linear-gradient(135deg, #E87A00, #C86800)',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginTop: '8px',
      boxShadow: '0 4px 12px rgba(232, 122, 0, 0.3)'
    },
    submitButtonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <div style={styles.titleIcon}>
            <Users size={24} />
          </div>
          Team Management
        </h1>
        <button style={styles.addButton} onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Add User
        </button>
      </div>

      {error && (
        <div style={{...styles.alert, ...styles.alertError}}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{...styles.alert, ...styles.alertSuccess}}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      <div style={styles.userGrid}>
        {users.map((user) => (
          <div key={user.id} style={styles.userCard}>
            <div style={styles.userHeader}>
              <div style={styles.userInfo}>
                <div style={styles.userName}>{user.full_name}</div>
                <div style={styles.userEmail}>{user.email}</div>
                <div
                  style={{
                    ...styles.roleBadge,
                    background: getRoleBadgeColor(user.role)
                  }}
                >
                  <Shield size={14} style={{ marginRight: '4px' }} />
                  {roles.find(r => r.value === user.role)?.label || user.role}
                </div>
              </div>
              <div style={styles.userActions}>
                <button style={styles.iconButton}>
                  <Edit size={16} />
                </button>
                <button
                  style={styles.iconButton}
                  onClick={() => handleDeleteUser(user.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add New User</h2>
              <button style={styles.closeButton} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form style={styles.form} onSubmit={handleCreateUser}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name *</label>
                <div style={styles.inputWrapper}>
                  <User size={20} style={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address *</label>
                <div style={styles.inputWrapper}>
                  <Mail size={20} style={styles.inputIcon} />
                  <input
                    type="email"
                    placeholder="john.doe@organization.org"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password *</label>
                <div style={styles.inputWrapper}>
                  <Lock size={20} style={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    style={styles.input}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    style={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  style={styles.select}
                  required
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                style={{
                  ...styles.submitButton,
                  ...(loading && styles.submitButtonDisabled)
                }}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        button:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        input:focus, select:focus {
          border-color: #E87A00 !important;
          box-shadow: 0 0 0 3px rgba(232, 122, 0, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default UserManagement;
