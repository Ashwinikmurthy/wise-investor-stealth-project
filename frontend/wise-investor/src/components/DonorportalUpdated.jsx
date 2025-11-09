import React, { useState, useEffect } from 'react';
import {
  Heart, User, LogIn, UserPlus, DollarSign, Calendar,
  Gift, TrendingUp, Building, ArrowLeft, Check, Clock,
  Mail, Phone, MapPin, CreditCard, Lock, Eye, EyeOff,
  Download, Receipt, Home, BarChart3
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
// Import the corrected API service
import { campaignAPI, donationAPI } from '../utils/api_service';

const colors = {
  primary: '#e87500',
  secondary: '#154734',
  accent: '#5fe0b7',
  light: '#FFF5ED',
};

const DonorPortal = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const [activeView, setActiveView] = useState('campaigns'); // campaigns, donate, lookup, dashboard
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [donorProfile, setDonorProfile] = useState(null);
  const [donorDashboard, setDonorDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [lookupEmail, setLookupEmail] = useState('');
  const [donationForm, setDonationForm] = useState({
    amount: '',
    donor_email: '',
    donor_full_name: '',
    donor_phone: '',
    address_line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'USA',
    payment_method: 'credit_card',
    is_anonymous: false,
    recurring_frequency: null,
    dedication_type: null,
    dedication_name: '',
    notes: ''
  });

  useEffect(() => {
    // Check if donor is logged in (has partyId)
    const partyId = localStorage.getItem('donor_party_id');
    const email = localStorage.getItem('donor_email');
    if (partyId && email) {
      fetchDonorDashboard(partyId);
    }

    // Fetch campaigns
    fetchCampaigns();

    // If campaignId provided, navigate to donate view
    if (campaignId) {
      setActiveView('donate');
      fetchCampaignDetail(campaignId);
    }
  }, [campaignId]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      // Use the corrected API endpoint
      const data = await campaignAPI.getPublicCampaigns(1, 20, 'active', 'created_at');
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignDetail = async (id) => {
    try {
      setLoading(true);
      // Use the corrected API endpoint
      const data = await campaignAPI.getPublicCampaign(id);
      setSelectedCampaign(data);
      setError('');
    } catch (err) {
      console.error('Error fetching campaign:', err);
      setError('Campaign not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchDonorDashboard = async (partyId) => {
    try {
      setLoading(true);
      // Use the corrected API endpoint
      const data = await donationAPI.getDonorDashboard(partyId);
      setDonorProfile(data.profile);
      setDonorDashboard(data);
      setActiveView('dashboard');
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      localStorage.removeItem('donor_party_id');
      localStorage.removeItem('donor_email');
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDonorLookup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Use the corrected API endpoint for donor lookup
      const donor = await donationAPI.lookupDonor(lookupEmail);

      // Store donor info
      localStorage.setItem('donor_party_id', donor.id);
      localStorage.setItem('donor_email', donor.email);

      // Fetch full dashboard
      await fetchDonorDashboard(donor.id);
      setSuccess('Welcome back!');
    } catch (err) {
      console.error('Donor lookup error:', err);
      setError('No donor account found with this email. Make a donation to create your profile!');
    } finally {
      setLoading(false);
    }
  };

  const handleDonation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const donationData = {
        campaign_id: selectedCampaign.id,
        amount: parseFloat(donationForm.amount),
        currency: 'USD',
        donor_email: donationForm.donor_email,
        donor_full_name: donationForm.donor_full_name,
        donor_phone: donationForm.donor_phone || null,
        address_line1: donationForm.address_line1 || null,
        city: donationForm.city || null,
        state: donationForm.state || null,
        postal_code: donationForm.postal_code || null,
        country: donationForm.country || 'USA',
        payment_method: donationForm.payment_method,
        is_anonymous: donationForm.is_anonymous,
        recurring_frequency: donationForm.recurring_frequency || null,
        dedication_type: donationForm.dedication_type || null,
        dedication_name: donationForm.dedication_name || null,
        notes: donationForm.notes || null
      };

      // Use the corrected API endpoint
      const donation = await donationAPI.createDonation(donationData);

      // Confirm the donation
      const confirmation = await donationAPI.confirmDonation(donation.id);

      if (confirmation.success) {
        setSuccess(`Thank you for your donation! Transaction ID: ${confirmation.transaction_id}`);

        // Store donor info for future lookup
        localStorage.setItem('donor_email', donationForm.donor_email);

        // Reset form amount and notes only
        setDonationForm({
          ...donationForm,
          amount: '',
          notes: '',
          dedication_name: ''
        });

        // Refresh campaign data
        await fetchCampaignDetail(selectedCampaign.id);
      }
    } catch (err) {
      console.error('Donation error:', err);
      setError(err.message || 'Donation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('donor_party_id');
    localStorage.removeItem('donor_email');
    setDonorProfile(null);
    setDonorDashboard(null);
    setActiveView('campaigns');
    setSuccess('Logged out successfully');
  };

  // Campaign List View
  const CampaignsView = () => (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4" style={{ color: colors.secondary }}>
          Support a Campaign
        </h1>
        <p className="text-xl text-gray-600">
          Choose a cause that matters to you
        </p>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
            {campaign.image_url && (
              <img
                src={campaign.image_url}
                alt={campaign.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Building className="w-4 h-4" />
                <span>{campaign.organization_name}</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{campaign.name}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {campaign.description}
              </p>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold" style={{ color: colors.secondary }}>
                    ${campaign.amount_raised?.toLocaleString() || '0'}
                  </span>
                  <span className="text-gray-500">
                    of ${campaign.goal_amount?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(campaign.progress_percentage || 0, 100)}%`,
                      backgroundColor: colors.primary
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                  <span>{campaign.donor_count || 0} donors</span>
                  {campaign.days_remaining && (
                    <span>{campaign.days_remaining} days left</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedCampaign(campaign);
                  setActiveView('donate');
                }}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all"
                style={{ backgroundColor: colors.primary }}
              >
                Donate Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Donate View
  const DonateView = () => {
    if (!selectedCampaign) return null;

    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => setActiveView('campaigns')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Campaigns
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {selectedCampaign.image_url && (
            <img
              src={selectedCampaign.image_url}
              alt={selectedCampaign.name}
              className="w-full h-64 object-cover"
            />
          )}

          <div className="p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Building className="w-4 h-4" />
                <span>{selectedCampaign.organization_name}</span>
              </div>
              <h1 className="text-3xl font-bold mb-4" style={{ color: colors.secondary }}>
                {selectedCampaign.name}
              </h1>
              <p className="text-gray-600 mb-6">{selectedCampaign.description}</p>

              {/* Campaign Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                    ${selectedCampaign.amount_raised?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Raised</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                    ${selectedCampaign.goal_amount?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Goal</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {selectedCampaign.donor_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Donors</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(selectedCampaign.progress_percentage || 0, 100)}%`,
                    backgroundColor: colors.primary
                  }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 text-center">
                {selectedCampaign.progress_percentage?.toFixed(1) || 0}% of goal reached
              </div>
            </div>

            {/* Donation Form */}
            <form onSubmit={handleDonation} className="space-y-6">
              <h2 className="text-2xl font-bold" style={{ color: colors.secondary }}>
                Make Your Donation
              </h2>

              {/* Quick Amount Selection */}
              <div>
                <label className="block text-sm font-semibold mb-3">Select Amount</label>
                <div className="grid grid-cols-4 gap-3">
                  {[25, 50, 100, 250].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDonationForm({...donationForm, amount: amt.toString()})}
                      className={`py-3 rounded-xl font-semibold border-2 transition-all ${
                        donationForm.amount === amt.toString()
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-300 hover:border-orange-300'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="block text-sm font-semibold mb-2">Or Enter Custom Amount *</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={donationForm.amount}
                    onChange={(e) => setDonationForm({...donationForm, amount: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              {/* Donor Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={donationForm.donor_full_name}
                    onChange={(e) => setDonationForm({...donationForm, donor_full_name: e.target.value})}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={donationForm.donor_email}
                    onChange={(e) => setDonationForm({...donationForm, donor_email: e.target.value})}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  value={donationForm.donor_phone}
                  onChange={(e) => setDonationForm({...donationForm, donor_phone: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:border-orange-500 focus:outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* Address (Optional) */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold">Address (Optional)</label>
                <input
                  type="text"
                  value={donationForm.address_line1}
                  onChange={(e) => setDonationForm({...donationForm, address_line1: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:border-orange-500 focus:outline-none"
                  placeholder="Street Address"
                />
                <div className="grid md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={donationForm.city}
                    onChange={(e) => setDonationForm({...donationForm, city: e.target.value})}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={donationForm.state}
                    onChange={(e) => setDonationForm({...donationForm, state: e.target.value})}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="State"
                  />
                  <input
                    type="text"
                    value={donationForm.postal_code}
                    onChange={(e) => setDonationForm({...donationForm, postal_code: e.target.value})}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="ZIP Code"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold mb-3">Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  {['credit_card', 'bank_transfer', 'check'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setDonationForm({...donationForm, payment_method: method})}
                      className={`py-3 px-4 rounded-xl font-semibold border-2 transition-all capitalize ${
                        donationForm.payment_method === method
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-300 hover:border-orange-300'
                      }`}
                    >
                      {method.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recurring Donation */}
              <div>
                <label className="block text-sm font-semibold mb-3">Make this recurring? (Optional)</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: null, label: 'One-time' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: 'Quarterly' },
                    { value: 'annually', label: 'Annually' }
                  ].map(option => (
                    <button
                      key={option.value || 'onetime'}
                      type="button"
                      onClick={() => setDonationForm({...donationForm, recurring_frequency: option.value})}
                      className={`py-3 rounded-xl font-semibold border-2 transition-all ${
                        donationForm.recurring_frequency === option.value
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-300 hover:border-orange-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dedication (Optional) */}
              <div>
                <label className="block text-sm font-semibold mb-2">Dedication (Optional)</label>
                <select
                  value={donationForm.dedication_type || ''}
                  onChange={(e) => setDonationForm({
                    ...donationForm,
                    dedication_type: e.target.value || null
                  })}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:border-orange-500 focus:outline-none mb-3"
                >
                  <option value="">No dedication</option>
                  <option value="in_honor">In Honor Of</option>
                  <option value="in_memory">In Memory Of</option>
                </select>
                {donationForm.dedication_type && (
                  <input
                    type="text"
                    value={donationForm.dedication_name}
                    onChange={(e) => setDonationForm({...donationForm, dedication_name: e.target.value})}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="Enter name"
                  />
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold mb-2">Notes (Optional)</label>
                <textarea
                  value={donationForm.notes}
                  onChange={(e) => setDonationForm({...donationForm, notes: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:border-orange-500 focus:outline-none"
                  rows="3"
                  placeholder="Any special instructions or notes..."
                ></textarea>
              </div>

              {/* Anonymous Checkbox */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={donationForm.is_anonymous}
                  onChange={(e) => setDonationForm({...donationForm, is_anonymous: e.target.checked})}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="anonymous" className="text-sm font-medium">
                  Make this donation anonymous
                </label>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                {loading ? 'Processing Donation...' : `Donate $${donationForm.amount || '0'}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Donor Lookup View
  const LookupView = () => (
    <div className="max-w-md mx-auto px-6 py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: colors.secondary }}>
          Access Your Donor Portal
        </h2>
        <p className="text-gray-600 text-center mb-8">
          Enter your email to view your donation history and impact
        </p>

        <form onSubmit={handleDonorLookup} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:border-orange-500 focus:outline-none"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: colors.primary }}
          >
            {loading ? 'Looking up...' : 'Access My Portal'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Your donor profile is automatically created when you make your first donation.
            No password required!
          </p>
        </div>
      </div>
    </div>
  );

  // Dashboard View
  const DashboardView = () => {
    if (!donorProfile || !donorDashboard) return null;

    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: colors.secondary }}>
            Welcome back, {donorProfile.full_name || donorProfile.display_name}!
          </h1>
          <p className="text-gray-600">Here's your giving impact</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700">
            {success}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <DollarSign className="w-10 h-10 mb-3" style={{ color: colors.primary }} />
            <div className="text-3xl font-bold mb-1" style={{ color: colors.secondary }}>
              ${donorDashboard.total_impact?.toLocaleString() || '0'}
            </div>
            <p className="text-gray-600">Total Impact</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <Gift className="w-10 h-10 mb-3" style={{ color: colors.primary }} />
            <div className="text-3xl font-bold mb-1" style={{ color: colors.secondary }}>
              {donorProfile.donation_count || 0}
            </div>
            <p className="text-gray-600">Total Donations</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <Building className="w-10 h-10 mb-3" style={{ color: colors.primary }} />
            <div className="text-3xl font-bold mb-1" style={{ color: colors.secondary }}>
              {donorDashboard.organizations_supported || 0}
            </div>
            <p className="text-gray-600">Organizations Supported</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <Heart className="w-10 h-10 mb-3" style={{ color: colors.accent }} />
            <div className="text-3xl font-bold mb-1" style={{ color: colors.secondary }}>
              {donorDashboard.campaigns_supported || 0}
            </div>
            <p className="text-gray-600">Campaigns Supported</p>
          </div>
        </div>

        {/* Donor Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Your Profile</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Email</label>
              <p className="text-lg">{donorProfile.email}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Name</label>
              <p className="text-lg">{donorProfile.full_name || donorProfile.display_name}</p>
            </div>
            {donorProfile.phone && (
              <div>
                <label className="text-sm font-semibold text-gray-600">Phone</label>
                <p className="text-lg">{donorProfile.phone}</p>
              </div>
            )}
            {donorProfile.first_donation_date && (
              <div>
                <label className="text-sm font-semibold text-gray-600">Member Since</label>
                <p className="text-lg">
                  {new Date(donorProfile.first_donation_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Donations */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Recent Donations</h2>
          {donorDashboard.recent_donations && donorDashboard.recent_donations.length > 0 ? (
            <div className="space-y-4">
              {donorDashboard.recent_donations.map((donation) => (
                <div key={donation.id} className="flex items-center justify-between p-4 border-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{donation.campaign_name}</h3>
                    <p className="text-sm text-gray-600">{donation.organization_name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(donation.donation_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    {donation.is_recurring && (
                      <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        Recurring
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                      ${donation.amount?.toLocaleString() || '0'}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      donation.payment_status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {donation.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No donations yet</p>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setActiveView('campaigns')}
            className="px-8 py-4 rounded-xl font-bold text-white text-lg transition-all"
            style={{ backgroundColor: colors.primary }}
          >
            Make Another Donation
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigate('/')}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                     style={{ backgroundColor: colors.primary }}>
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold" style={{ color: colors.secondary }}>
                  Wise Investor
                </span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveView('campaigns')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeView === 'campaigns' ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-gray-600'
                  }`}
                >
                  Campaigns
                </button>
                {donorProfile && (
                  <button
                    onClick={() => setActiveView('dashboard')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeView === 'dashboard' ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-gray-600'
                    }`}
                  >
                    My Dashboard
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {donorProfile ? (
                <>
                  <span className="text-sm text-gray-600">
                    {donorProfile.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2 rounded-lg font-semibold text-white"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setActiveView('lookup')}
                  className="px-6 py-2 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: colors.primary }}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  Donor Portal
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="min-h-screen">
        {activeView === 'campaigns' && <CampaignsView />}
        {activeView === 'donate' && <DonateView />}
        {activeView === 'lookup' && <LookupView />}
        {activeView === 'dashboard' && <DashboardView />}
      </div>
    </div>
  );
};

export default DonorPortal;
