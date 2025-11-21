import React, { useState, useEffect, useRef } from 'react';
import {
  Target, Plus, Edit2, Trash2, Eye, Calendar, DollarSign,
  Users, Clock, TrendingUp, BarChart3, CheckCircle,
  AlertCircle, XCircle, ChevronRight, Search, Filter,
  Image, Tag, Award, Globe, Download, Share2, Loader,
  ArrowUp, ArrowDown, Star, Heart, ChevronLeft, X, Upload,
  Camera
} from 'lucide-react';
import CampaignAnalytics from './campaignAnalytics';

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

const getOrganizationId = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    return payload.organization_id || '25b71240-59b8-4add-bde5-b845722fb360';
  } catch (err) {
    console.error('Error decoding token:', err);
    return '25b71240-59b8-4add-bde5-b845722fb360';
  }
};

const CampaignManagement = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  // Image upload states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign_type: '',  // Changed from category
    goal_amount: '',
    start_date: '',
    end_date: '',
    image_url: '',
    impact_statement: '',
    is_featured: false,  // Changed from featured
    is_public: true,
    status: 'active',
    allow_anonymous_donations: true,  // Changed from allow_anonymous
    allow_recurring_donations: true   // Changed from allow_recurring
  });

  // Categories for campaigns
  const categories = [
    'Education', 'Healthcare', 'Environment', 'Community',
    'Arts & Culture', 'Animal Welfare', 'Disaster Relief',
    'Youth Programs', 'Senior Care', 'Research'
  ];

  // Load campaigns and stats on component mount
  useEffect(() => {
    loadCampaigns();
    loadCampaignStats();
  }, []);

  // Load campaigns from API
  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const organizationId = getOrganizationId();
      if (!token) {
        setError('Please log in to view campaigns.');
        setLoading(false);
        return;
      }

      if (!organizationId) {
        setError('Organization ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/campaigns?skip=0&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load campaigns');

      const data = await response.json();
      setCampaigns(data);
    } catch (err) {
      setError('Failed to load campaigns. Please try again.');
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load campaign statistics
  const loadCampaignStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const organizationId = getOrganizationId();
      if (!token || !organizationId) return;

      const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/organization/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load stats');

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Handle image file selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, GIF, etc.)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Upload image to backend
  const uploadImageToBackend = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('campaign_name', formData.title || 'campaign');

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload image');

      const data = await response.json();
      return data.image_url; // Backend should return the uploaded image URL
    } catch (err) {
      console.error('Error uploading image:', err);
      throw err;
    }
  };

  // Convert image to base64 (fallback if no backend upload endpoint)
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Create new campaign
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const organizationId = getOrganizationId();

      if (!token || !organizationId) {
        setError('Please log in to create campaigns.');
        setLoading(false);
        return;
      }

      // Validate required fields
      if (!formData.name || formData.name.trim() === '') {
        setError('Campaign name is required');
        setLoading(false);
        return;
      }

      if (!formData.campaign_type) {
        setError('Please select a campaign type');
        setLoading(false);
        return;
      }

      if (!formData.goal_amount || parseFloat(formData.goal_amount) <= 0) {
        setError('Please enter a valid goal amount');
        setLoading(false);
        return;
      }

      let imageUrl = formData.image_url;

      // Upload image if a file was selected
      if (imageFile) {
        setUploadingImage(true);
        try {
          // Try to upload to backend first
          imageUrl = await uploadImageToBackend(imageFile);
        } catch (uploadErr) {
          // If backend upload fails, convert to base64 as fallback
          console.log('Backend upload failed, using base64 encoding...');
          imageUrl = await convertImageToBase64(imageFile);
        }
        setUploadingImage(false);
      }

      // Prepare campaign data with proper date handling
      const campaignData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        campaign_type: formData.campaign_type,
        goal_amount: parseFloat(formData.goal_amount),
        start_date: formData.start_date || null,  // Send null if empty
        end_date: formData.end_date || null,      // Send null if empty
        image_url: imageUrl || null,
        impact_statement: formData.impact_statement.trim() || null,
        is_featured: formData.is_featured,
        is_public: formData.is_public,
        status: formData.status,
        allow_anonymous_donations: formData.allow_anonymous_donations,
        allow_recurring_donations: formData.allow_recurring_donations
      };

      // Fixed API endpoint - removed /v1 and added /api/campaigns
      const response = await fetch(`${API_BASE_URL}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.detail || 'Failed to create campaign');
      }

      const newCampaign = await response.json();
      setCampaigns([newCampaign, ...campaigns]);
      setSuccess('Campaign created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadCampaignStats();
    } catch (err) {
      setError(err.message || 'Failed to create campaign. Please try again.');
      console.error('Error creating campaign:', err);
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  // Update campaign
  const handleUpdateCampaign = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');

      let imageUrl = formData.image_url;

      // Upload image if a new file was selected
      if (imageFile) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadImageToBackend(imageFile);
        } catch (uploadErr) {
          imageUrl = await convertImageToBase64(imageFile);
        }
        setUploadingImage(false);
      }

      // Prepare campaign data with proper data types
      const campaignData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        campaign_type: formData.campaign_type,
        goal_amount: parseFloat(formData.goal_amount),
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        image_url: imageUrl || null,
        impact_statement: formData.impact_statement.trim() || null,
        is_featured: formData.is_featured,
        is_public: formData.is_public,
        status: formData.status,
        allow_anonymous_donations: formData.allow_anonymous_donations,
        allow_recurring_donations: formData.allow_recurring_donations
      };

      const response = await fetch(`${API_BASE_URL}/api/campaigns/${selectedCampaign.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.detail || 'Failed to update campaign');
      }

      const updatedCampaign = await response.json();
      setCampaigns(campaigns.map(c => c.id === selectedCampaign.id ? updatedCampaign : c));
      setSuccess('Campaign updated successfully!');
      setShowEditModal(false);
      setSelectedCampaign(null);
      resetForm();
      loadCampaignStats();
    } catch (err) {
      setError(err.message || 'Failed to update campaign. Please try again.');
      console.error('Error updating campaign:', err);
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete campaign');

      setCampaigns(campaigns.filter(c => c.id !== campaignId));
      setSuccess('Campaign deleted successfully!');
      loadCampaignStats();
    } catch (err) {
      setError('Failed to delete campaign. Please try again.');
      console.error('Error deleting campaign:', err);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      campaign_type: '',
      goal_amount: '',
      start_date: '',
      end_date: '',
      image_url: '',
      impact_statement: '',
      is_featured: false,
      is_public: true,
      status: 'active',
      allow_anonymous_donations: true,
      allow_recurring_donations: true
    });
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open edit modal
  const openEditModal = (campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      campaign_type: campaign.campaign_type || '',
      goal_amount: campaign.goal_amount,
      start_date: campaign.start_date || '',
      end_date: campaign.end_date || '',
      image_url: campaign.image_url || '',
      impact_statement: campaign.impact_statement || '',
      is_featured: campaign.is_featured || false,
      is_public: campaign.is_public !== false,
      status: campaign.status || 'active',
      allow_anonymous_donations: campaign.allow_anonymous_donations !== false,
      allow_recurring_donations: campaign.allow_recurring_donations !== false
    });
    setImagePreview(campaign.image_url || null);
    setShowEditModal(true);
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || campaign.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Calculate campaign progress
  const getCampaignProgress = (campaign) => {
    if (!campaign.goal_amount) return 0;
    const raised = campaign.raised_amount || 0;
    return Math.min((raised / campaign.goal_amount) * 100, 100);
  };

  // Format percentage display (show decimals for small percentages)
  const formatPercentage = (percentage) => {
    if (percentage === 0) return '0';
    if (percentage < 1) return percentage.toFixed(2); // Show 2 decimals for < 1%
    if (percentage < 10) return percentage.toFixed(1); // Show 1 decimal for < 10%
    return Math.round(percentage).toString(); // Show whole number for >= 10%
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return colors.accent;
      case 'completed': return colors.secondary;
      case 'draft': return colors.gray[400];
      default: return colors.gray[300];
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.gray[50],
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        padding: '48px 32px',
        color: colors.white,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Target size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0, marginBottom: '4px' }}>
                Campaign Management
              </h1>
              <p style={{ fontSize: '16px', margin: 0, opacity: 0.9 }}>
                Create and manage fundraising campaigns
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginTop: '24px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Total Campaigns</div>
                <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.total_campaigns || 0}</div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Active Campaigns</div>
                <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.active_campaigns || 0}</div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Total Raised</div>
                <div style={{ fontSize: '32px', fontWeight: '700' }}>
                  ${(stats.total_raised_amount || 0).toLocaleString()}
                </div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Avg. Goal Progress</div>
                <div style={{ fontSize: '32px', fontWeight: '700' }}>
                  {Math.round(stats.overall_completion_rate || 0)}%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        {/* Alerts */}
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#dc2626'
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#dc2626'
              }}
            >
              <X size={20} />
            </button>
          </div>
        )}

        {success && (
          <div style={{
            background: '#d1fae5',
            border: '1px solid #a7f3d0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#059669'
          }}>
            <CheckCircle size={20} />
            <span>{success}</span>
            <button
              onClick={() => setSuccess(null)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#059669'
              }}
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.gray[400]
              }}
            />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                border: `1px solid ${colors.gray[300]}`,
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            />
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              border: `1px solid ${colors.gray[300]}`,
              borderRadius: '10px',
              fontSize: '15px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">All Campaigns</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>

          {/* Create Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 24px',
              background: colors.primary,
              color: colors.white,
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: `0 4px 12px ${colors.primary}40`
            }}
          >
            <Plus size={20} />
            Create Campaign
          </button>
        </div>

        {/* Campaigns Grid */}
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '64px',
            color: colors.gray[500]
          }}>
            <Loader className="animate-spin" size={32} />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px',
            color: colors.gray[500]
          }}>
            <Target size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
              No campaigns found
            </h3>
            <p>Create your first campaign to get started!</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                style={{
                  background: colors.white,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                }}
              >
                {/* Campaign Image */}
                <div style={{
                  height: '200px',
                  background: campaign.image_url
                    ? `url(${campaign.image_url}) center/cover`
                    : `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                  position: 'relative'
                }}>
                  {!campaign.image_url && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: colors.white,
                      opacity: 0.5
                    }}>
                      <Image size={48} />
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    padding: '6px 12px',
                    background: getStatusColor(campaign.status),
                    color: colors.white,
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {campaign.status || 'Active'}
                  </div>
                  {campaign.featured && (
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      width: '32px',
                      height: '32px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Star size={18} style={{ color: colors.primary, fill: colors.primary }} />
                    </div>
                  )}
                </div>

                {/* Campaign Info */}
                <div style={{ padding: '20px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <Tag size={16} style={{ color: colors.gray[400] }} />
                    <span style={{
                      fontSize: '13px',
                      color: colors.gray[600],
                      textTransform: 'uppercase',
                      fontWeight: '600'
                    }}>
                      {campaign.category}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: colors.gray[900],
                    marginBottom: '8px',
                    lineHeight: '1.4'
                  }}>
                    {campaign.name}
                  </h3>

                  <p style={{
                    fontSize: '14px',
                    color: colors.gray[600],
                    lineHeight: '1.6',
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {campaign.description}
                  </p>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      <span style={{ color: colors.primary }}>
                        ${(campaign.raised_amount || 0).toLocaleString()}
                      </span>
                      <span style={{ color: colors.gray[600] }}>
                        ${(campaign.goal_amount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: colors.gray[200],
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${getCampaignProgress(campaign)}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: colors.gray[500],
                      marginTop: '4px'
                    }}>
                      {formatPercentage(getCampaignProgress(campaign))}% of goal reached
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    padding: '12px 0',
                    borderTop: `1px solid ${colors.gray[200]}`,
                    borderBottom: `1px solid ${colors.gray[200]}`,
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Users size={16} style={{ color: colors.gray[400] }} />
                      <span style={{ fontSize: '14px', color: colors.gray[600] }}>
                        {campaign.donor_count || 0} donors
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Calendar size={16} style={{ color: colors.gray[400] }} />
                      <span style={{ fontSize: '14px', color: colors.gray[600] }}>
                        {campaign.days_remaining || 0} days left
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '8px'
                  }}>
		    <button
  onClick={() => {
    setSelectedCampaign(campaign);
    setShowAnalytics(true);
  }}
  style={{
    padding: '10px 16px',
    background: colors.white,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = colors.primary;
    e.currentTarget.style.color = colors.white;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = colors.white;
    e.currentTarget.style.color = colors.primary;
  }}
  title="View Campaign Analytics"
>
  <BarChart3 size={18} />
  Analytics
</button>

                    <button
                      onClick={() => openEditModal(campaign)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: colors.primary,
                        color: colors.white,
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      style={{
                        padding: '10px',
                        background: colors.white,
                        color: colors.gray[700],
                        border: `1px solid ${colors.gray[300]}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics View Modal */}
      {showAnalytics && selectedCampaign && (
        <div style={{
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
        }}>
          <div style={{
            background: colors.white,
            borderRadius: '16px',
            width: '100%',
            maxWidth: '1400px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => {
                setShowAnalytics(false);
                setSelectedCampaign(null);
              }}
              style={{
                position: 'sticky',
                top: '20px',
                right: '20px',
                float: 'right',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                background: colors.gray[100],
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.danger;
                e.currentTarget.querySelector('svg').style.color = colors.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.gray[100];
                e.currentTarget.querySelector('svg').style.color = colors.gray[600];
              }}
            >
              <X size={20} color={colors.gray[600]} />
            </button>

            {/* Header */}
            <div style={{
              padding: '32px',
              borderBottom: `2px solid ${colors.gray[100]}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BarChart3 size={32} color={colors.primary} />
                <div>
                  <h2 style={{
                    margin: '0 0 4px 0',
                    fontSize: '24px',
                    fontWeight: '700',
                    color: colors.gray[800]
                  }}>
                    Campaign Analytics
                  </h2>
                  <p style={{
                    margin: 0,
                    fontSize: '16px',
                    color: colors.gray[600]
                  }}>
                    {selectedCampaign.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Analytics Component */}
            <CampaignAnalytics
              campaignId={selectedCampaign.id}
              organizationId={getOrganizationId()}
            />
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div style={{
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
        }}>
          <div style={{
            background: colors.white,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: `1px solid ${colors.gray[200]}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: colors.white,
              zIndex: 1
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: colors.gray[900],
                margin: 0
              }}>
                {showCreateModal ? 'Create Campaign' : 'Edit Campaign'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedCampaign(null);
                  resetForm();
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: colors.gray[100],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: colors.gray[600]
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={showCreateModal ? handleCreateCampaign : handleUpdateCampaign} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Title */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: colors.gray[700],
                    marginBottom: '6px'
                  }}>
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: `2px solid ${colors.gray[300]}`,
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: colors.gray[700],
                    marginBottom: '6px'
                  }}>
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: `2px solid ${colors.gray[300]}`,
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      minHeight: '100px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    rows={4}
                    required
                  />
                </div>

                {/* Category and Goal */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: colors.gray[700],
                      marginBottom: '6px'
                    }}>
                      Category *
                    </label>
                    <select
                      value={formData.campaign_type}
                      onChange={(e) => setFormData({...formData, campaign_type: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: `2px solid ${colors.gray[300]}`,
                        borderRadius: '10px',
                        fontSize: '15px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: colors.gray[700],
                      marginBottom: '6px'
                    }}>
                      Goal Amount ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.goal_amount}
                      onChange={(e) => setFormData({...formData, goal_amount: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: `2px solid ${colors.gray[300]}`,
                        borderRadius: '10px',
                        fontSize: '15px',
                        outline: 'none'
                      }}
                      min="100"
                      step="100"
                      required
                    />
                  </div>
                </div>

                {/* Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: colors.gray[700],
                      marginBottom: '6px'
                    }}>
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: `2px solid ${colors.gray[300]}`,
                        borderRadius: '10px',
                        fontSize: '15px',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: colors.gray[700],
                      marginBottom: '6px'
                    }}>
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: `2px solid ${colors.gray[300]}`,
                        borderRadius: '10px',
                        fontSize: '15px',
                        outline: 'none'
                      }}
                      min={formData.start_date}
                      required
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: colors.gray[700],
                    marginBottom: '6px'
                  }}>
                    Campaign Image
                  </label>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div style={{
                      position: 'relative',
                      marginBottom: '12px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: `2px solid ${colors.gray[300]}`
                    }}>
                      <img
                        src={imagePreview}
                        alt="Campaign preview"
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: colors.white,
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  {/* Upload Button */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center'
                  }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        background: colors.white,
                        color: colors.primary,
                        border: `2px dashed ${colors.primary}`,
                        borderRadius: '10px',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.light;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = colors.white;
                      }}
                    >
                      <Camera size={20} />
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                    </button>
                  </div>

                  <div style={{
                    fontSize: '13px',
                    color: colors.gray[500],
                    marginTop: '6px'
                  }}>
                    Recommended: 1200x600px, Max 5MB (PNG, JPG, GIF)
                  </div>

                  {/* Optional: URL input as fallback */}
                  <div style={{ marginTop: '12px' }}>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({...formData, image_url: e.target.value});
                        if (e.target.value) {
                          setImagePreview(e.target.value);
                        }
                      }}
                      placeholder="Or paste image URL here"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: `1px solid ${colors.gray[300]}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Impact Statement */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: colors.gray[700],
                    marginBottom: '6px'
                  }}>
                    Impact Statement
                  </label>
                  <textarea
                    value={formData.impact_statement}
                    onChange={(e) => setFormData({...formData, impact_statement: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: `2px solid ${colors.gray[300]}`,
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      minHeight: '80px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    rows={3}
                    placeholder="Describe the impact this campaign will have..."
                  />
                </div>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: colors.primary
                      }}
                    />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: colors.gray[700]
                    }}>
                      Featured Campaign
                    </span>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.allow_anonymous_donations}
                      onChange={(e) => setFormData({...formData, allow_anonymous_donations: e.target.checked})}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: colors.primary
                      }}
                    />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: colors.gray[700]
                    }}>
                      Allow Anonymous Donations
                    </span>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.allow_recurring_donations}
                      onChange={(e) => setFormData({...formData, allow_recurring_donations: e.target.checked})}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: colors.primary
                      }}
                    />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: colors.gray[700]
                    }}>
                      Allow Recurring Donations
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div style={{
                marginTop: '24px',
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedCampaign(null);
                    resetForm();
                  }}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: colors.white,
                    color: colors.gray[700],
                    border: `1px solid ${colors.gray[300]}`,
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingImage}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: colors.primary,
                    color: colors.white,
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: loading || uploadingImage ? 'not-allowed' : 'pointer',
                    opacity: loading || uploadingImage ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  {loading || uploadingImage ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      {uploadingImage ? 'Uploading...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      {showCreateModal ? <Plus size={20} /> : <CheckCircle size={20} />}
                      {showCreateModal ? 'Create Campaign' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>
        {`
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          input:focus, textarea:focus, select:focus {
            border-color: ${colors.primary} !important;
          }
        `}
      </style>
    </div>
  );
};

export default CampaignManagement;