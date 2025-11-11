import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, Users, DollarSign, TrendingUp, Clock,
  MapPin, Ticket, CheckCircle, AlertCircle, Eye, Edit2,
  Trash2, Download, Search, Filter, X, ChevronDown,
  ChevronRight, UserCheck, Mail, Phone, BarChart3, Save,
  RefreshCw, FileText, UserPlus, Tag, Activity, Target,
  Percent, CreditCard, ShoppingCart, History
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
    window.location.href = '/login';
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
      if (!headers) return;

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

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        headers
      });

      await handleApiError(response);

      if (response.ok || response.status === 204) {
        alert('Event deleted successfully!');
        fetchEvents();
        setActiveView('list');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(`Failed to delete event: ${error.message}`);
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
      <EventDetailsView
        event={selectedEvent}
        onClose={() => { setActiveView('list'); setSelectedEvent(null); }}
        onUpdate={fetchEvents}
        onDelete={handleDeleteEvent}
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
            value={events.filter(e => e.status === 'active').length}
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
                {['all', 'active', 'draft', 'completed', 'cancelled'].map(status => (
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
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      </div>
      <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
    </div>
  </div>
);

// Event Card Component
const EventCard = ({ event, onClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return colors.accent;
      case 'draft': return colors.gray[400];
      case 'completed': return colors.secondary;
      case 'cancelled': return '#EF4444';
      default: return colors.gray[400];
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold line-clamp-2" style={{ color: colors.secondary }}>
            {event.name}
          </h3>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: getStatusColor(event.status) }}
          >
            {event.status}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {event.description || 'No description available'}
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{new Date(event.start_date).toLocaleDateString()}</span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{event.registered_count || 0} / {event.capacity || '∞'} registered</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <span className="text-sm font-medium" style={{ color: colors.primary }}>
            ${event.registration_fee || 'Free'}
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

// Create Event Form Component
const CreateEventForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_type: 'Fundraising Gala',
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
      if (!headers) return;

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
                    <option value="Fundraising Gala">Fundraising Gala</option>
                    <option value="Capacity Building">Capacity Building</option>
                    <option value="Community Service">Community Service</option>
                    <option value="Charity Run/Walk">Charity Run/Walk</option>
                    <option value="Youth Program">Youth Program</option>
                    <option value="Training Program">Training Program</option>
                    <option value="Volunteer Event">Volunteer Event</option>
                    <option value="Community Outreach">Community Outreach</option>
                    <option value="Workshop">Workshop</option>
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

                <div className="col-span-2">
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

            {/* Location Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.secondary }}>
                Location
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': colors.primary }}
                    placeholder="Grand Convention Center"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="venue_address"
                    value={formData.venue_address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': colors.primary }}
                    placeholder="123 Main Street, City, State, ZIP"
                  />
                </div>
              </div>
            </div>

            {/* Registration Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.secondary }}>
                Registration
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': colors.primary }}
                    placeholder="100"
                    min="0"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': colors.primary }}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
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
                      Make event public (visible to all users)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6 border-t">
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
                className="flex-1 px-6 py-3 rounded-lg font-medium text-white transition-all disabled:opacity-50"
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

// Enhanced Event Details View with Tabs
const EventDetailsView = ({ event: initialEvent, onClose, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [event, setEvent] = useState(initialEvent);
  const [isEditing, setIsEditing] = useState(false);
  const [performance, setPerformance] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch event details
  const fetchEventDetails = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE_URL}/api/events/${event.id}`, { headers });
      await handleApiError(response);

      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };

  // Fetch performance metrics
  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE_URL}/api/events/${event.id}/performance`, { headers });
      await handleApiError(response);

      if (response.ok) {
        const data = await response.json();
        setPerformance(data);
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch registrations
  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE_URL}/api/events/${event.id}/registrations`, { headers });
      await handleApiError(response);

      if (response.ok) {
        const data = await response.json();
        setRegistrations(data);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE_URL}/api/events/${event.id}/tickets`, { headers });
      await handleApiError(response);

      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'performance') {
      fetchPerformance();
    } else if (activeTab === 'registrations') {
      fetchRegistrations();
    } else if (activeTab === 'tickets') {
      fetchTickets();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'registrations', label: 'Registrations', icon: Users },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'performance', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-2xl font-bold" style={{ color: colors.secondary }}>
                  {event.name}
                </h2>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: event.status === 'active' ? colors.accent : colors.gray[400] }}
                >
                  {event.status}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.start_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {event.location || 'No location'}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {event.registered_count || 0} / {event.capacity || '∞'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this event?')) {
                    onDelete(event.id);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b">
            <div className="flex gap-2 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${
                    activeTab === tab.id
                      ? 'border-b-2 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={activeTab === tab.id ? { borderColor: colors.primary, color: colors.primary } : {}}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab event={event} onUpdate={fetchEventDetails} />}
            {activeTab === 'registrations' && <RegistrationsTab eventId={event.id} registrations={registrations} onRefresh={fetchRegistrations} />}
            {activeTab === 'tickets' && <TicketsTab eventId={event.id} tickets={tickets} onRefresh={fetchTickets} />}
            {activeTab === 'performance' && <PerformanceTab performance={performance} loading={loading} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ event, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(event);
  const [submitting, setSubmitting] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const updateData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        registration_fee: formData.registration_fee ? parseFloat(formData.registration_fee) : null
      };

      const response = await fetch(`${API_BASE_URL}/api/events/${event.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      await handleApiError(response);

      if (response.ok) {
        alert('Event updated successfully!');
        setIsEditing(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert(`Failed to update event: ${error.message}`);
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

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: colors.primary }}
          >
            <Edit2 className="w-4 h-4" />
            Edit Event
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
            <p className="text-gray-900">{event.description || 'No description'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Event Type</label>
            <p className="text-gray-900">{event.event_type}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
            <p className="text-gray-900">{new Date(event.start_date).toLocaleString()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
            <p className="text-gray-900">{event.end_date ? new Date(event.end_date).toLocaleString() : 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
            <p className="text-gray-900">{event.location || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
            <p className="text-gray-900">{event.venue_address || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Capacity</label>
            <p className="text-gray-900">{event.capacity || 'Unlimited'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Registration Fee</label>
            <p className="text-gray-900">${event.registration_fee || 'Free'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Registration Deadline</label>
            <p className="text-gray-900">
              {event.registration_deadline ? new Date(event.registration_deadline).toLocaleString() : 'No deadline'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Public Event</label>
            <p className="text-gray-900">{event.is_public ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleUpdate} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': colors.primary }}
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': colors.primary }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
          <select
            name="event_type"
            value={formData.event_type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': colors.primary }}
          >
            <option value="Fundraising Gala">Fundraising Gala</option>
            <option value="Capacity Building">Capacity Building</option>
            <option value="Community Service">Community Service</option>
            <option value="Charity Run/Walk">Charity Run/Walk</option>
            <option value="Youth Program">Youth Program</option>
            <option value="Training Program">Training Program</option>
            <option value="Volunteer Event">Volunteer Event</option>
            <option value="Community Outreach">Community Outreach</option>
            <option value="Workshop">Workshop</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            name="status"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input
            type="datetime-local"
            name="start_date"
            value={formData.start_date?.slice(0, 16) || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': colors.primary }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <input
            type="datetime-local"
            name="end_date"
            value={formData.end_date?.slice(0, 16) || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': colors.primary }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': colors.primary }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <input
            type="text"
            name="venue_address"
            value={formData.venue_address || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': colors.primary }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': colors.primary }}
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Registration Fee</label>
          <input
            type="number"
            name="registration_fee"
            value={formData.registration_fee || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': colors.primary }}
            step="0.01"
            min="0"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Registration Deadline</label>
          <input
            type="datetime-local"
            name="registration_deadline"
            value={formData.registration_deadline?.slice(0, 16) || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': colors.primary }}
          />
        </div>

        <div className="col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_public"
              checked={formData.is_public || false}
              onChange={handleChange}
              className="w-4 h-4 rounded"
              style={{ accentColor: colors.primary }}
            />
            <span className="text-sm font-medium text-gray-700">Make event public</span>
          </label>
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            setFormData(event);
          }}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-6 py-3 rounded-lg font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: colors.primary }}
        >
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

// Registrations Tab Component
const RegistrationsTab = ({ eventId, registrations, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const handleCheckIn = async (registrationId) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE_URL}/api/events/registrations/${registrationId}/check-in`, {
        method: 'POST',
        headers
      });

      await handleApiError(response);

      if (response.ok) {
        alert('Registration checked in successfully!');
        onRefresh();
      }
    } catch (error) {
      console.error('Error checking in registration:', error);
      alert(`Failed to check in: ${error.message}`);
    }
  };

  const filteredRegistrations = filterStatus === 'all'
    ? registrations
    : registrations.filter(r => r.registration_status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold" style={{ color: colors.secondary }}>
            Event Registrations ({registrations.length})
          </h3>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
          style={{ backgroundColor: colors.primary }}
        >
          <UserPlus className="w-4 h-4" />
          Add Registration
        </button>
      </div>

      {/* Registrations list */}
      {filteredRegistrations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No registrations found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRegistrations.map(reg => (
            <div key={reg.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {reg.attendee_first_name} {reg.attendee_last_name}
                  </h4>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: reg.checked_in ? colors.accent : colors.gray[400] }}
                  >
                    {reg.checked_in ? 'Checked In' : reg.registration_status}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {reg.attendee_email}
                  </div>
                  {reg.attendee_phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {reg.attendee_phone}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Ticket className="w-4 h-4" />
                    {reg.number_of_tickets} ticket(s)
                  </div>
                  {reg.total_amount && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      ${reg.total_amount}
                    </div>
                  )}
                </div>
              </div>
              {!reg.checked_in && (
                <button
                  onClick={() => handleCheckIn(reg.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: colors.secondary }}
                >
                  <UserCheck className="w-4 h-4" />
                  Check In
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddRegistrationModal
          eventId={eventId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

// Add Registration Modal Component
const AddRegistrationModal = ({ eventId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    participant_name: '',
    participant_email: '',
    participant_phone: '',
    number_of_tickets: 1
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/registrations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      await handleApiError(response);

      if (response.ok) {
        alert('Registration created successfully!');
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating registration:', error);
      alert(`Failed to create registration: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold" style={{ color: colors.secondary }}>
            Add Registration
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Participant Name *</label>
            <input
              type="text"
              name="participant_name"
              required
              value={formData.participant_name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': colors.primary }}
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              name="participant_email"
              required
              value={formData.participant_email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': colors.primary }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              name="participant_phone"
              value={formData.participant_phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': colors.primary }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Tickets *</label>
            <input
              type="number"
              name="number_of_tickets"
              required
              min="1"
              value={formData.number_of_tickets}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': colors.primary }}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: colors.primary }}
            >
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Tickets Tab Component
const TicketsTab = ({ eventId, tickets, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket type?')) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE_URL}/api/events/tickets/${ticketId}`, {
        method: 'DELETE',
        headers
      });

      await handleApiError(response);

      if (response.ok || response.status === 204) {
        alert('Ticket type deleted successfully!');
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert(`Failed to delete ticket: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: colors.secondary }}>
          Ticket Types ({tickets.length})
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
          style={{ backgroundColor: colors.primary }}
        >
          <Plus className="w-4 h-4" />
          Add Ticket Type
        </button>
      </div>

      {/* Tickets list */}
      {tickets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No ticket types created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{ticket.ticket_type}</h4>
                  <p className="text-2xl font-bold mt-1" style={{ color: colors.primary }}>
                    ${ticket.price}
                  </p>
                </div>
                <span
                  className="px-2 py-1 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: ticket.is_active ? colors.accent : colors.gray[400] }}
                >
                  {ticket.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {ticket.description && (
                <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span>Available: {ticket.quantity_available || '∞'}</span>
                <span>Sold: {ticket.quantity_sold || 0}</span>
              </div>

              {ticket.quantity_available && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Remaining</span>
                    <span>{ticket.tickets_remaining}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${((ticket.quantity_sold || 0) / ticket.quantity_available) * 100}%`,
                        backgroundColor: colors.primary
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => setEditingTicket(ticket)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTicket(ticket.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddTicketModal
          eventId={eventId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            onRefresh();
          }}
        />
      )}

      {editingTicket && (
        <EditTicketModal
          ticket={editingTicket}
          onClose={() => setEditingTicket(null)}
          onSuccess={() => {
            setEditingTicket(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

// Add Ticket Modal Component
const AddTicketModal = ({ eventId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity_available: '',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity_available: formData.quantity_available ? parseInt(formData.quantity_available) : null
      };

      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/tickets`, {
        method: 'POST',
        headers,
        body: JSON.stringify(submitData)
      });

      await handleApiError(response);

      if (response.ok) {
        alert('Ticket type created successfully!');
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert(`Failed to create ticket: ${error.message}`);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold" style={{ color: colors.secondary }}>
            Add Ticket Type
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Type *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': colors.primary }}
              placeholder="e.g., General Admission, VIP"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': colors.primary }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price ($) *</label>
            <input
              type="number"
              name="price"
              required
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': colors.primary }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity Available (leave empty for unlimited)
            </label>
            <input
              type="number"
              name="quantity_available"
              min="1"
              value={formData.quantity_available}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': colors.primary }}
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 rounded"
                style={{ accentColor: colors.primary }}
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: colors.primary }}
            >
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Ticket Modal Component
const EditTicketModal = ({ ticket, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    ticket_type: ticket.ticket_type,
    description: ticket.description || '',
    price: ticket.price,
    quantity_available: ticket.quantity_available || '',
    is_active: ticket.is_active
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity_available: formData.quantity_available ? parseInt(formData.quantity_available) : null
      };

      const response = await fetch(`${API_BASE_URL}/api/events/tickets/${ticket.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(submitData)
      });

      await handleApiError(response);

      if (response.ok) {
        alert('Ticket type updated successfully!');
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert(`Failed to update ticket: ${error.message}`);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold" style={{ color: colors.secondary }}>
            Edit Ticket Type
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Type *</label>
            <input
              type="text"
              name="ticket_type"
              required
              value={formData.ticket_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': colors.primary }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': colors.primary }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price ($) *</label>
            <input
              type="number"
              name="price"
              required
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': colors.primary }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity Available
            </label>
            <input
              type="number"
              name="quantity_available"
              min="1"
              value={formData.quantity_available}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': colors.primary }}
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 rounded"
                style={{ accentColor: colors.primary }}
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: colors.primary }}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Performance Tab Component
const PerformanceTab = ({ performance, loading }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200"
             style={{ borderTopColor: colors.primary }}></div>
        <p className="mt-4 text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No performance data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-white p-4 rounded-lg border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5" style={{ color: colors.primary }} />
            <span className="text-sm font-medium text-gray-600">Registrations</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: colors.primary }}>
            {performance.registered_count}
          </p>
          {performance.capacity && (
            <p className="text-xs text-gray-500 mt-1">of {performance.capacity} capacity</p>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-lg border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-5 h-5" style={{ color: colors.secondary }} />
            <span className="text-sm font-medium text-gray-600">Occupancy</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: colors.secondary }}>
            {performance.occupancy_percentage}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            ${parseFloat(performance.total_revenue || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-lg border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Days Until</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {performance.days_until_event || 0}
          </p>
        </div>
      </div>

      {/* Registration Status */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold mb-4" style={{ color: colors.secondary }}>
          Registration Status
        </h4>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <p className={`text-lg font-semibold ${performance.is_registration_open ? 'text-green-600' : 'text-red-600'}`}>
              {performance.is_registration_open ? '✓ Open' : '✗ Closed'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Capacity Remaining</p>
            <p className="text-lg font-semibold" style={{ color: colors.primary }}>
              {performance.capacity_remaining !== null ? performance.capacity_remaining : 'Unlimited'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Registration Fee</p>
            <p className="text-lg font-semibold text-gray-900">
              ${performance.registration_fee || '0.00'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Event Status</p>
            <p className="text-lg font-semibold capitalize text-gray-900">
              {performance.status}
            </p>
          </div>
        </div>
      </div>

      {/* Ticket Statistics */}
      {performance.ticket_types_count > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold mb-4" style={{ color: colors.secondary }}>
            Ticket Statistics
          </h4>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ticket Types</p>
              <p className="text-lg font-semibold text-gray-900">
                {performance.ticket_types_count}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Tickets Available</p>
              <p className="text-lg font-semibold text-gray-900">
                {performance.total_tickets_available || 'Unlimited'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Tickets Sold</p>
              <p className="text-lg font-semibold" style={{ color: colors.accent }}>
                {performance.total_tickets_sold || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Event Timeline */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold mb-4" style={{ color: colors.secondary }}>
          Event Timeline
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Event Date</p>
              <p className="text-sm text-gray-600">
                {new Date(performance.start_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          {performance.end_date && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">End Date</p>
                <p className="text-sm text-gray-600">
                  {new Date(performance.end_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Days Until Event</p>
              <p className="text-sm text-gray-600">
                {performance.is_past_event ? 'Event has passed' : `${performance.days_until_event} days`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventManagement;