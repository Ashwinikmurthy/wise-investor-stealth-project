import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = '';

/**
 * NotificationBell Component
 *
 * Displays a bell icon with a badge showing the number of pending user registration requests.
 * Only visible to organization admins and superadmins.
 *
 * Usage:
 * <NotificationBell />
 *
 * Place this in your navigation header or dashboard
 */
const NotificationBell = () => {
  const { getToken, getOrganizationId, user } = useAuth();
  const navigate = useNavigate();

  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load for admins
    if (user && (user.is_superadmin || user.is_org_admin)) {
      loadNotificationCount();

      // Poll every 30 seconds for updates
      const interval = setInterval(loadNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotificationCount = async () => {
    try {
      const orgId = getOrganizationId();
      const token = getToken();

      const response = await fetch(
        `${API_BASE_URL}/api/v1/admin/notifications/${orgId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.pending_count);
      }
    } catch (err) {
      console.error('Failed to load notification count:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    navigate('/admin/registration-requests');
  };

  // Don't show bell if not admin or if loading
  if (!user || (!user.is_superadmin && !user.is_org_admin) || loading) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
      title={`${pendingCount} pending registration request${pendingCount !== 1 ? 's' : ''}`}
    >
      <Bell className="w-6 h-6" />

      {pendingCount > 0 && (
        <span className="absolute top-0 right-0 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-600 rounded-full transform translate-x-1/4 -translate-y-1/4">
          {pendingCount > 99 ? '99+' : pendingCount}
        </span>
      )}

      {pendingCount > 0 && (
        <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 rounded-full animate-ping opacity-75 transform translate-x-1/4 -translate-y-1/4" />
      )}
    </button>
  );
};

export default NotificationBell;

/**
 * Alternative Inline Badge Version
 * Use this for dropdown menus or sidebar items
 */
export const NotificationBadge = () => {
  const { getToken, getOrganizationId, user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user && (user.is_superadmin || user.is_org_admin)) {
      const loadCount = async () => {
        try {
          const orgId = getOrganizationId();
          const token = getToken();
          const response = await fetch(
            `${API_BASE_URL}/api/v1/admin/notifications/${orgId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            setPendingCount(data.pending_count);
          }
        } catch (err) {
          console.error('Failed to load notification count:', err);
        }
      };

      loadCount();
      const interval = setInterval(loadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (pendingCount === 0) return null;

  return (
    <span className="ml-auto px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-full">
      {pendingCount}
    </span>
  );
};