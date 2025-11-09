import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const userEmail = localStorage.getItem('user_email');
      const userName = localStorage.getItem('user_name');
      const userRole = localStorage.getItem('user_role');  
      const organizationId = localStorage.getItem('organization_id');
      const isSuperadmin = localStorage.getItem('is_superadmin') === 'true';

      if (token && userId) {
        setUser({
          id: userId,
          email: userEmail,
          name: userName,
          organizationId: organizationId,
          isSuperadmin: isSuperadmin,
          token: token,
	   role: userRole 
	  
        });
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
const login = async (endpoint, payload) => {
  try {
    const API_BASE_URL = '';

    // Make the API call
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',  // ✅ JSON format
         },
         body: JSON.stringify(payload)  // ✅ JSON stringify
       });
    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();

    // Store all user data - MATCH THE API RESPONSE FORMAT!
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user_id', data.user.id);
    localStorage.setItem('user_email', data.user.email);
    localStorage.setItem('user_name', data.user.full_name || data.user.email);
    localStorage.setItem('organization_id', data.user.organization_id || '');  // ✅ FIXED!
    localStorage.setItem('is_superadmin', data.user.is_superadmin || false);
    //localStorage.setItem('role',data.user.role);
     localStorage.setItem('user_role', data.user.role); 

    setUser({
      id: data.user.id,
      email: data.user.email,
      name: data.user.full_name || data.user.email,
      organizationId: data.user.organization_id,  // ✅ Store as camelCase in state
      isSuperadmin: data.user.is_superadmin || false,
      token: data.access_token,
      role: data.user.role

    });
    setIsAuthenticated(true);

    console.log('✅ User logged in:', data.user.email);
    return data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};
 /* const login = (userData) => {
    try {
      // Store all user data
      localStorage.setItem('access_token', userData.token);
      localStorage.setItem('user_id', userData.id);
      localStorage.setItem('user_email', userData.email);
      localStorage.setItem('user_name', userData.name || userData.email);
      localStorage.setItem('organization_id', userData.organization_id || '');
      localStorage.setItem('is_superadmin', userData.isSuperadmin || false);

      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email,
        organizationId: userData.organizationId,
        isSuperadmin: userData.isSuperadmin || false,
        token: userData.token
      });
      setIsAuthenticated(true);

      console.log('✅ User logged in:', userData.email);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };*/

  const logout = () => {
    try {
      // Clear all authentication data
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');
      localStorage.removeItem('organization_id');
      localStorage.removeItem('is_superadmin');

      setUser(null);
      setIsAuthenticated(false);

      console.log('✅ User logged out');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const getToken = () => {
    return localStorage.getItem('access_token');
  };

  const getOrganizationId = () => {
    const orgId = user?.organizationId || localStorage.getItem('organization_id');
    if (!orgId) {
      console.warn('⚠️ Organization ID not found');
    }
    return orgId;
  };

  const isSuperadmin = () => {
    return user?.isSuperadmin || localStorage.getItem('is_superadmin') === 'true';
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    getToken,
    getOrganizationId,
    isSuperadmin,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
