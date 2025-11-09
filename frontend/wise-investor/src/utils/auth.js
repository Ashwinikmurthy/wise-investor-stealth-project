// src/utils/auth.js - Simple auth utilities

export const getToken = () => {
  return localStorage.getItem('access_token');
};

export const getOrganizationId = () => {
  return localStorage.getItem('organization_id');
};

export const getCurrentUser = () => {
  return {
    id: localStorage.getItem('user_id'),
    email: localStorage.getItem('user_email'),
    name: localStorage.getItem('user_name'),
    organizationId: localStorage.getItem('organization_id'),
    role: localStorage.getItem('user_role'),
    isSuperadmin: localStorage.getItem('is_superadmin') === 'true'
  };
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const clearAuth = () => {
  localStorage.clear();
};