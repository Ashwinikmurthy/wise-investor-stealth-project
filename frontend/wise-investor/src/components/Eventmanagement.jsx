import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, Users, DollarSign, TrendingUp, Clock,
  MapPin, Ticket, CheckCircle, AlertCircle, Eye, Edit2,
  Trash2, Download, Search, Filter, X, ChevronDown,
  ChevronRight, UserCheck, Mail, Phone, BarChart3
} from 'lucide-react';

// UT Dallas Brand Colors
const colors = {
  primary: '#e87500',      // UT Dallas Orange
  secondary: '#154734',    // UT Dallas Green
  accent: '#5fe0b7',       // Accent Green
  light: '#FFF5ED',        // Light Orange
  dark: '#0A1F16',         // Dark Green
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  }
};

const API_BASE_URL = '';

// Centralized token and API helper functions
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.error('No authentication token found');
    window.location.href = '/login'; // Redirect to login if no token
    return null;
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const handleApiError = async (response) => {
  if (response.status === 401) {
    console.error('Authentication failed - redirecting to login');
    localStorage.removeItem('token');
    window.location.href = '/login';
    return null;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `Request failed with status ${response.status}`);
  }

  return response;
};

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeView, setActiveView] = useState('list'); // list, details, create
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch events from API
  useEffect(() => {
    fetchEvents();
  }, [filterStatus]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return; // Token not available, already redirecting

      const params = new URLSearchParams();

      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      params.append('upcoming_only', 'true');

      const response = await fetch(`${API_BASE_URL}/api/events/?${params}`, { headers });
      await handleApiError(response);

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      alert(`Failed to load events: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeView === 'create') {
    return <CreateEventForm onClose={() => { setActiveView('list'); fetchEvents(); }} />;
  }

  if (activeView === 'details' && selectedEvent) {
    return (
      <EventDetails
        event={selectedEvent}
        onClose={() => { setActiveView('list'); setSelectedEvent(null); }}
        onUpdate={fetchEvents}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold" style={{ color: colors.secondary }}>
              Event Management
            </h2>
            <p className="text-gray-600 mt-2">Create and manage your events and registrations</p>
          </div>
          <button
            onClick={() => setActiveView('create')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            style={{ backgroundColor: colors.primary }}
          >
            <Plus className="w-5 h-5" />
            Create Event
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Calendar}
            label="Total Events"
            value={events.length}
            color={colors.primary}
          />
          <StatCard
            icon={Users}
            label="Total Registrations"
            value={events.reduce((sum, e) => sum + (e.registered_count || 0), 0)}
            color={colors.secondary}
          />
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`$${events.reduce((sum, e) => sum + ((e.registration_fee || 0) * (e.registered_count || 0)), 0).toLocaleString()}`}
            color={colors.accent}
          />
          <StatCard
            icon={CheckCircle}
            label="Active Events"
            value={events.filter(e => e.status === 'published').length}
            color={colors.primary}
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': colors.primary }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-5 h-5" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex gap-2">
                {['all', 'active', 'draft', 'completed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filterStatus === status
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={filterStatus === status ? { backgroundColor: colors.primary } : {}}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200"
                 style={{ borderTopColor: colors.primary }}></div>
            <p className="mt-4 text-gray-600">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Events Found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? 'Try adjusting your search criteria' : 'Create your first event to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setActiveView('create')}
                className="px-6 py-3 rounded-xl text-white font-medium"
                style={{ backgroundColor: colors.primary }}
              >
                Create First Event
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => {
                  setSelectedEvent(event);
                  setActiveView('details');
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
    </div>
    <p className="text-sm text-gray-600 mb-1">{label}</p>
    <p className="text-2xl font-bold" style={{ color: colors.secondary }}>{value}</p>
  </div>
);

// Event Card Component
const EventCard = ({ event, onClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1" style={{ color: colors.secondary }}>
            {event.name}
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(event.status)}`}>
            {event.status}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {event.description || 'No description provided'}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{formatDate(event.start_date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{event.location || 'Location TBD'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">
            {event.registered_count}/{event.capacity || '∞'} registered
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Occupancy</p>
            <p className="font-bold" style={{ color: colors.primary }}>
              {event.occupancy_percentage}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Days Left</p>
            <p className="font-bold" style={{ color: colors.secondary }}>
              {event.days_until_event || 0}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
};

// Create Event Form Component
const CreateEventForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_type: 'fundraiser',
    start_date: '',
    end_date: '',
    location: '',
    venue_address: '',
    capacity: '',
    registration_fee: '',
    status: 'draft',
    is_public: true,
    registration_deadline: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const headers = getAuthHeaders();
      if (!headers) return; // Token not available, already redirecting

      // Format the data for API
      const submitData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        registration_fee: formData.registration_fee ? parseFloat(formData.registration_fee) : null
      };

      const response = await fetch(`${API_BASE_URL}/api/events/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(submitData)
      });

      await handleApiError(response);

      if (response.ok) {
        alert('Event created successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert(`Failed to create event: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: colors.secondary }}>
              Create New Event
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.secondary }}>
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': colors.primary }}
                    placeholder="Annual Charity Gala 2025"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': colors.primary }}
                    placeholder="Describe your event..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type *
                  </label>
                  <select
                    name="event_type"
                    required
                    value={formData.event_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': colors.primary }}
                  >
                    <option value="fundraiser">Fundraiser</option>
                    <option value="gala">Gala</option>
                    <option value="workshop">Workshop</option>
                    <option value="conference">Conference</option>
                    <option value="webinar">Webinar</option>
                    <option value="networking">Networking</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="community">Community</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': colors.primary }}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.secondary }}>
                Date & Time
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    required
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': colors.primary }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': colors.primary }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Deadline
                  </label>
                  <input
                    type="datetime-local"
                    name="registration_deadline"
                    value={formData.registration_deadline}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': colors.primary }}
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.secondary }}>
                Location
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': colors.primary }}
                    placeholder="Grand Ballroom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Address
                  </label>
                  <input
                    type="text"
                    name="venue_address"
                    value={formData.venue_address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': colors.primary }}
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </div>
            </div>

            {/* Capacity and Fees */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.secondary }}>
                Capacity & Registration
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': colors.primary }}
                    placeholder="200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Fee ($)
                  </label>
                  <input
                    type="number"
                    name="registration_fee"
                    value={formData.registration_fee}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': colors.primary }}
                    placeholder="150.00"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_public"
                      checked={formData.is_public}
                      onChange={handleChange}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: colors.primary }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Make this event publicly visible
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                {submitting ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Event Details Component
const EventDetails = ({ event, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [registrations, setRegistrations] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  useEffect(() => {
    if (activeTab === 'registrations') {
      fetchRegistrations();
    } else if (activeTab === 'performance') {
      fetchPerformance();
    }
  }, [activeTab]);

  const fetchRegistrations = async () => {
    setLoadingRegistrations(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return; // Token not available, already redirecting

      const response = await fetch(
        `${API_BASE_URL}/api/events/${event.id}/registrations`,
        { headers }
      );

      await handleApiError(response);

      if (response.ok) {
        const data = await response.json();
        setRegistrations(data);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      alert(`Failed to load registrations: ${error.message}`);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const fetchPerformance = async () => {
    setLoadingPerformance(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return; // Token not available, already redirecting

      const response = await fetch(
        `${API_BASE_URL}/api/events/${event.id}/performance`,
        { headers }
      );

      await handleApiError(response);

      if (response.ok) {
        const data = await response.json();
        setPerformance(data);
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
      alert(`Failed to load performance data: ${error.message}`);
    } finally {
      setLoadingPerformance(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b" style={{ backgroundColor: colors.light }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold" style={{ color: colors.secondary }}>
                    {event.name}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    event.status === 'active' ? 'bg-green-100 text-green-700' :
                    event.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {event.status}
                  </span>
                </div>
                <p className="text-gray-600">{event.description}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <div className="flex gap-2 px-8">
              {['overview', 'registrations', 'performance'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={activeTab === tab ? { borderColor: colors.primary } : {}}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Event Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5" style={{ color: colors.primary }} />
                      <span className="text-sm font-medium text-gray-500">Start Date</span>
                    </div>
                    <p className="text-gray-900">{formatDate(event.start_date)}</p>
                  </div>

                  {event.end_date && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5" style={{ color: colors.primary }} />
                        <span className="text-sm font-medium text-gray-500">End Date</span>
                      </div>
                      <p className="text-gray-900">{formatDate(event.end_date)}</p>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5" style={{ color: colors.primary }} />
                      <span className="text-sm font-medium text-gray-500">Location</span>
                    </div>
                    <p className="text-gray-900">{event.location || 'TBD'}</p>
                    {event.venue_address && (
                      <p className="text-sm text-gray-500 mt-1">{event.venue_address}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5" style={{ color: colors.primary }} />
                      <span className="text-sm font-medium text-gray-500">Capacity</span>
                    </div>
                    <p className="text-gray-900">
                      {event.registered_count} / {event.capacity || '∞'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5" style={{ color: colors.primary }} />
                      <span className="text-sm font-medium text-gray-500">Registration Fee</span>
                    </div>
                    <p className="text-gray-900">
                      ${event.registration_fee || 'Free'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5" style={{ color: colors.primary }} />
                      <span className="text-sm font-medium text-gray-500">Days Until Event</span>
                    </div>
                    <p className="text-gray-900">{event.days_until_event || 0} days</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                    <p className="text-sm text-gray-600 mb-1">Occupancy Rate</p>
                    <p className="text-3xl font-bold" style={{ color: colors.primary }}>
                      {event.occupancy_percentage}%
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                    <p className="text-sm text-gray-600 mb-1">Registration Status</p>
                    <p className="text-lg font-bold" style={{ color: colors.secondary }}>
                      {event.is_registration_open ? 'Open' : 'Closed'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <p className="text-sm text-gray-600 mb-1">Spots Remaining</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {event.capacity_remaining || '∞'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'registrations' && (
              <div>
                {loadingRegistrations ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200"
                         style={{ borderTopColor: colors.primary }}></div>
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No registrations yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {registrations.map(reg => (
                      <div key={reg.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{reg.participant_name}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                reg.checked_in ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {reg.checked_in ? 'Checked In' : 'Not Checked In'}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{reg.participant_email}</span>
                              </div>
                              {reg.participant_phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">{reg.participant_phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{reg.number_of_tickets} ticket(s)</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold" style={{ color: colors.primary }}>
                              ${reg.total_amount || 0}
                            </p>
                            <p className="text-xs text-gray-500">{reg.payment_status}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'performance' && (
              <div>
                {loadingPerformance ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200"
                         style={{ borderTopColor: colors.primary }}></div>
                  </div>
                ) : performance ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-4 gap-6">
                      <div className="bg-white border-2 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-5 h-5" style={{ color: colors.primary }} />
                          <span className="text-sm text-gray-600">Total Revenue</span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: colors.secondary }}>
                          ${performance.total_revenue}
                        </p>
                      </div>
                      <div className="bg-white border-2 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-5 h-5" style={{ color: colors.primary }} />
                          <span className="text-sm text-gray-600">Registered</span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: colors.secondary }}>
                          {performance.registered_count}
                        </p>
                      </div>
                      <div className="bg-white border-2 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Ticket className="w-5 h-5" style={{ color: colors.primary }} />
                          <span className="text-sm text-gray-600">Ticket Types</span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: colors.secondary }}>
                          {performance.ticket_types_count}
                        </p>
                      </div>
                      <div className="bg-white border-2 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5" style={{ color: colors.primary }} />
                          <span className="text-sm text-gray-600">Occupancy</span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: colors.secondary }}>
                          {performance.occupancy_percentage}%
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No performance data available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventManagement;