import React, { useState, useEffect } from 'react';
import {
  Bell, Users, CheckCircle, XCircle, Clock, AlertCircle,
  Mail, Phone, Briefcase, Building2, User, Calendar,
  RefreshCw, Filter, Search, ChevronRight, MessageCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = '';

const UserRegistrationAdmin = () => {
  const { getToken, getOrganizationId } = useAuth();

  const [requests, setRequests] = useState([]);
  const [statistics, setStatistics] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [filterStatus]);

  const apiCall = async (endpoint, options = {}) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API request failed');
    }

    return response.json();
  };

  const loadRequests = async () => {
    setLoading(true);
    setError('');

    try {
      const orgId = getOrganizationId();
      const data = await apiCall(`/api/v1/admin/all-requests/${orgId}`);

      setRequests(data.requests);
      setStatistics(data.statistics);
    } catch (err) {
      setError(err.message || 'Failed to load registration requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setActionLoading(requestId);
    setError('');
    setSuccess('');

    try {
      await apiCall('/api/v1/admin/approve-request', {
        method: 'POST',
        body: JSON.stringify({ request_id: requestId })
      });

      setSuccess('Registration request approved! User can now log in.');
      loadRequests();
    } catch (err) {
      setError(err.message || 'Failed to approve request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
    setRejectionReason('');
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setActionLoading(selectedRequest.id);
    setError('');
    setSuccess('');

    try {
      await apiCall('/api/v1/admin/reject-request', {
        method: 'POST',
        body: JSON.stringify({
          request_id: selectedRequest.id,
          reason: rejectionReason
        })
      });

      setSuccess('Registration request rejected.');
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      loadRequests();
    } catch (err) {
      setError(err.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesSearch = searchTerm === '' ||
      req.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />
    };
    return icons[status];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Registration Requests</h1>
                <p className="text-gray-600">Review and manage pending user registrations</p>
              </div>
            </div>

            <button
              onClick={loadRequests}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900">{statistics.pending}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">Approved</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{statistics.approved}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800 mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">Rejected</span>
              </div>
              <p className="text-2xl font-bold text-red-900">{statistics.rejected}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm font-semibold">Total</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{statistics.total}</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, job title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending Only</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
              <p className="text-gray-600">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 text-lg font-semibold mb-1">No requests found</p>
              <p className="text-gray-500 text-sm">
                {searchTerm ? 'Try adjusting your search' : 'There are no registration requests to display'}
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.first_name} {request.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{request.job_title || 'No title specified'}</p>
                    </div>
                  </div>

                  <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    <span className="text-sm font-semibold capitalize">{request.status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{request.email}</span>
                  </div>

                  {request.phone_number && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{request.phone_number}</span>
                    </div>
                  )}

                  {request.department && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{request.department}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-gray-700">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-sm capitalize">{request.role.replace(/_/g, ' ')}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Requested: {formatDate(request.requested_at)}</span>
                  </div>

                  {request.reviewed_at && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Reviewed: {formatDate(request.reviewed_at)}</span>
                    </div>
                  )}
                </div>

                {request.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <MessageCircle className="w-4 h-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{request.rejection_reason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={actionLoading === request.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>

                    <button
                      onClick={() => handleRejectClick(request)}
                      disabled={actionLoading === request.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Registration Request</h3>

            <p className="text-gray-600 mb-4">
              You are about to reject the registration request from <strong>{selectedRequest?.first_name} {selectedRequest?.last_name}</strong>. Please provide a reason:
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason (required)..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim() || actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRegistrationAdmin;