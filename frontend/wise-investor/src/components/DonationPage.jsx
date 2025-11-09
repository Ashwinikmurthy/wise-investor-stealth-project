import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, DollarSign, CreditCard, Building, Mail, User } from 'lucide-react';
import axios from 'axios';

// UT Dallas Brand Colors (matching your landing page)
const colors = {
  primary: '#e87500',
  secondary: '#154734',
  accent: '#5fe0b7',
  light: '#FFF5ED',
};

const DonationPage = () => {
  const { id } = useParams(); // Campaign ID from URL
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [donorInfo, setDonorInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    anonymous: false
  });

  const suggestedAmounts = [25, 50, 100, 250, 500, 1000];

  // Fetch campaign details
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await axios.get(
          `/api/public/campaigns/${id}`
        );
        setCampaign(response.data);
      } catch (error) {
        console.error('Error fetching campaign:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  const handleAmountSelect = (value) => {
    setAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    setAmount(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const donationAmount = customAmount || amount;

    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      alert('Please enter a valid donation amount');
      return;
    }

    if (!donorInfo.firstName || !donorInfo.lastName || !donorInfo.email) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      // STEP 1: Create the donation
      const donationData = {
        campaign_id: id,
        amount: parseFloat(donationAmount),
        first_name: donorInfo.firstName,
        last_name: donorInfo.lastName,
        email: donorInfo.email,
        phone: donorInfo.phone || null,
        is_anonymous: donorInfo.anonymous,
        payment_method: 'credit_card',
        payment_status: 'completed'
      };

      console.log('Step 1: Creating donation...', donationData);

      const createResponse = await axios.post(
        '/api/public/donations',
        donationData
      );

      console.log('Donation created:', createResponse.data);

      // STEP 2: Confirm the donation
      const donationId = createResponse.data.id || createResponse.data.donation_id;

      if (!donationId) {
        throw new Error('No donation ID received from server');
      }

      console.log('Step 2: Confirming donation...', donationId);

      const confirmResponse = await axios.post(
        '/api/public/donations/confirm',
        null,
        {
          params: {
            donation_id: donationId
          }
        }
      );

      console.log('Donation confirmed:', confirmResponse.data);

      // Show success message with confirmation details
      const confirmData = confirmResponse.data;
      alert(
        `Thank you for your donation of $${donationAmount}!\n\n` +
        `${confirmData.message || 'Your donation has been confirmed.'}\n\n` +
        `Transaction ID: ${confirmData.transaction_id || donationId}\n\n` +
        `A confirmation email will be sent to: ${confirmData.confirmation_email || donorInfo.email}`
      );

      // Navigate back to landing page after successful donation
      setTimeout(() => {
        navigate('/');
      }, 1000);

    } catch (error) {
      console.error('Donation error:', error);
      console.error('Error details:', error.response?.data);

      const errorMessage = error.response?.data?.detail ||
                          error.response?.data?.message ||
                          error.message ||
                          'There was an error processing your donation. Please try again.';

      alert(`Error: ${errorMessage}`);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Campaign Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="text-orange-600 hover:text-orange-700 font-semibold"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Campaigns
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Campaign Info - Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h2 className="text-2xl font-bold mb-4" style={{ color: colors.secondary }}>
                {campaign.name}
              </h2>

              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Building className="w-4 h-4" />
                  <span>{campaign.organization_name}</span>
                </div>

                {campaign.description && (
                  <p className="text-gray-600 text-sm">{campaign.description}</p>
                )}
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold" style={{ color: colors.secondary }}>
                    ${parseFloat(campaign.raised_amount || 0).toLocaleString()}
                  </span>
                  <span className="text-gray-500">
                    of ${parseFloat(campaign.goal_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(campaign.progress_percentage || 0, 100)}%`,
                      background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                    }}
                  ></div>
                </div>
                <div className="mt-2 text-center">
                  <span className="text-lg font-bold" style={{ color: colors.primary }}>
                    {campaign.progress_percentage?.toFixed(0) || 0}% funded
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Donors</span>
                  <span className="font-semibold">{campaign.donor_count || 0}</span>
                </div>
                {campaign.days_remaining && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Days Remaining</span>
                    <span className="font-semibold">{campaign.days_remaining}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Donation Form - Right Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl" style={{ backgroundColor: `${colors.primary}15` }}>
                  <Heart className="w-8 h-8" style={{ color: colors.primary }} />
                </div>
                <h1 className="text-3xl font-bold" style={{ color: colors.secondary }}>
                  Make a Donation
                </h1>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Amount Selection */}
                <div className="mb-8">
                  <label className="block text-lg font-semibold mb-4" style={{ color: colors.secondary }}>
                    Select Amount
                  </label>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {suggestedAmounts.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleAmountSelect(value)}
                        className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                          amount === value && !customAmount
                            ? 'text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        style={
                          amount === value && !customAmount
                            ? { background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }
                            : {}
                        }
                      >
                        ${value}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      placeholder="Custom amount"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                      min="1"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Donor Information */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: colors.secondary }}>
                    Your Information
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          required
                          value={donorInfo.firstName}
                          onChange={(e) => setDonorInfo({ ...donorInfo, firstName: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          required
                          value={donorInfo.lastName}
                          onChange={(e) => setDonorInfo({ ...donorInfo, lastName: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        required
                        value={donorInfo.email}
                        onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={donorInfo.anonymous}
                      onChange={(e) => setDonorInfo({ ...donorInfo, anonymous: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="anonymous" className="text-sm text-gray-600">
                      Make this donation anonymous
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-4 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    submitting ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl transform hover:scale-105'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                  }}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Donate {amount && `$${amount}`}
                    </>
                  )}
                </button>

                <p className="text-sm text-gray-500 text-center mt-4">
                  🔒 Your information is secure and will never be shared
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationPage;
