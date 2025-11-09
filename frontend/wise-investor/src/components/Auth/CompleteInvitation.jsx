import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Eye, EyeOff, Lock, AlertCircle, Target, CheckCircle, 
  ArrowLeft, Send, Loader
} from 'lucide-react';

// API Configuration
const API_BASE_URL = '';

const CompleteInvitation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState(null);

  useEffect(() => {
    // Get token from URL
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      verifyToken(tokenFromUrl);
    } else {
      setError('Invalid invitation link. No token found.');
      setVerifying(false);
    }
  }, [searchParams]);

  const verifyToken = async (invitationToken) => {
    try {
      // You might want to verify the token first or just let it fail on submit
      // For now, we'll just set it and stop verifying
      setVerifying(false);
    } catch (err) {
      setError('Invalid or expired invitation link.');
      setVerifying(false);
    }
  };

  const validateForm = () => {
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (password !== confirmPassword) {
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
      console.log('🔐 Completing invitation...');
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/complete-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          password: password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to complete invitation' }));
        throw new Error(errorData.detail || 'Failed to complete invitation');
      }

      const data = await response.json();
      console.log('✅ Invitation completed!', data);
      
      setInvitationDetails(data);
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error('❌ Invitation completion error:', err);

      let errorMessage = 'Failed to complete invitation. Please try again.';
      
      if (err.message.includes('404') || err.message.includes('invalid')) {
        errorMessage = 'Invalid or expired invitation link.';
      } else if (err.message.includes('409')) {
        errorMessage = 'This invitation has already been completed.';
      } else {
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
    verifyingContainer: {
      textAlign: 'center',
      padding: '48px 0'
    },
    spinner: {
      width: '48px',
      height: '48px',
      border: '4px solid #e5e7eb',
      borderTopColor: '#E87A00',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      margin: '0 auto 24px'
    },
    verifyingText: {
      fontSize: '16px',
      color: '#6b7280'
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
            <h2 style={styles.successTitle}>Account Activated!</h2>
            <p style={styles.successMessage}>
              Your account has been successfully activated. You can now log in with your email and password.
              Redirecting you to login...
            </p>

            <button
              type="button"
              style={styles.loginLink}
              onClick={() => navigate('/login')}
            >
              <ArrowLeft size={16} />
              Go to Login Now
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

  if (verifying) {
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

          <div style={styles.verifyingContainer}>
            <div style={styles.spinner}></div>
            <div style={styles.verifyingText}>Verifying your invitation...</div>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

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
          Complete your invitation by setting a password
        </p>

        {error && (
          <div style={{...styles.alert, ...styles.alertError}}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="password">Create Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={20} style={styles.inputIcon} />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            disabled={loading || !token}
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
                Activating Account...
              </>
            ) : (
              <>
                <Send size={20} />
                Activate Account
              </>
            )}
          </button>
        </form>
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
      `}</style>
    </div>
  );
};

export default CompleteInvitation;
