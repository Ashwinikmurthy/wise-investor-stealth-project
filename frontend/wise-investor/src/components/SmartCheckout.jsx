import React, { useState, useEffect } from 'react';
import {
  CreditCard, Heart, DollarSign, CheckCircle, AlertCircle,
  User, Mail, Phone, MapPin, Calendar, Shield, Lock,
  ChevronRight, ChevronLeft, Loader, Gift, RefreshCw,
  Building, Award, Sparkles, TrendingUp, Clock, X
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

const SmartCheckout = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [step, setStep] = useState(1); // 1: Select Campaign, 2: Amount, 3: Info, 4: Payment, 5: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [donationData, setDonationData] = useState({
    amount: '',
    customAmount: '',
    isRecurring: false,
    recurringFrequency: 'monthly',
    isAnonymous: false,
    dedication: '',
    dedicationType: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    savePaymentMethod: false
  });

  const presetAmounts = [25, 50, 100, 250, 500, 1000];
  const recurringOptions = [
    { value: 'monthly', label: 'Monthly', description: 'Charge monthly' },
    { value: 'quarterly', label: 'Quarterly', description: 'Charge every 3 months' },
    { value: 'annual', label: 'Annual', description: 'Charge yearly' }
  ];

  // Load campaigns on mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/public/campaigns?featured=true&limit=10`);
      const data = await response.json();
      setCampaigns(data);
    } catch (err) {
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountSelect = (amount) => {
    setDonationData({ ...donationData, amount, customAmount: '' });
  };

  const handleCustomAmount = (value) => {
    setDonationData({ ...donationData, amount: '', customAmount: value });
  };

  const getTotalAmount = () => {
    return donationData.amount || donationData.customAmount || 0;
  };

  const processPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create payment intent
      const intentResponse = await fetch(
        `${API_BASE_URL}/api/v1/donations/create-payment-intent?amount=${getTotalAmount()}&campaign_id=${selectedCampaign.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!intentResponse.ok) throw new Error('Failed to create payment intent');

      const paymentIntent = await intentResponse.json();

      // Step 2: Process payment (in production, use Stripe.js here)
      // This is a simplified version
      const donationResponse = await fetch(`${API_BASE_URL}/api/v1/donations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: getTotalAmount(),
          campaign_id: selectedCampaign.id,
          donor_email: donationData.email,
          donor_first_name: donationData.firstName,
          donor_last_name: donationData.lastName,
          donor_phone: donationData.phone,
          is_anonymous: donationData.isAnonymous,
          is_recurring: donationData.isRecurring,
          recurring_frequency: donationData.recurringFrequency,
          dedication: donationData.dedication,
          payment_method_id: paymentIntent.payment_intent_id
        })
      });

      if (!donationResponse.ok) throw new Error('Failed to process donation');

      const donation = await donationResponse.json();
      setStep(5); // Success step
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 4) {
      processPayment();
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Step 1: Campaign Selection
  const CampaignSelection = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4" style={{ color: colors.secondary }}>
        Select a Campaign to Support
      </h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              onClick={() => {
                setSelectedCampaign(campaign);
                nextStep();
              }}
              className={`border rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedCampaign?.id === campaign.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{campaign.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{campaign.description}</p>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" style={{ color: colors.primary }} />
                      {campaign.progress_percentage}% funded
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {campaign.days_left} days left
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-400" />
                      {campaign.donor_count} donors
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, campaign.progress_percentage)}%`,
                          backgroundColor: colors.primary
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>${campaign.raised_amount?.toLocaleString()}</span>
                      <span>${campaign.goal_amount?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 ml-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Step 2: Amount Selection
  const AmountSelection = () => (
    <div className="space-y-6">
      <button
        onClick={prevStep}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.secondary }}>
          Choose Your Gift Amount
        </h2>
        <p className="text-gray-600">Supporting: {selectedCampaign?.title}</p>
      </div>

      {/* Preset Amounts */}
      <div className="grid grid-cols-3 gap-4">
        {presetAmounts.map(amount => (
          <button
            key={amount}
            onClick={() => handleAmountSelect(amount)}
            className={`p-4 rounded-xl border-2 font-semibold transition-all ${
              donationData.amount === amount
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            ${amount}
          </button>
        ))}
      </div>

      {/* Custom Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or enter a custom amount
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="number"
            placeholder="0.00"
            value={donationData.customAmount}
            onChange={(e) => handleCustomAmount(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ focusRingColor: colors.primary }}
            min="1"
          />
        </div>
      </div>

      {/* Recurring Option */}
      <div className="bg-gradient-to-r from-orange-50 to-green-50 rounded-xl p-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={donationData.isRecurring}
            onChange={(e) => setDonationData({...donationData, isRecurring: e.target.checked})}
            className="mt-1 w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-5 h-5" style={{ color: colors.primary }} />
              <span className="font-semibold">Make this a recurring donation</span>
            </div>
            <p className="text-sm text-gray-600">
              Your consistent support helps us plan ahead and make a lasting impact
            </p>
          </div>
        </label>

        {donationData.isRecurring && (
          <div className="mt-4 ml-7 space-y-2">
            {recurringOptions.map(option => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value={option.value}
                  checked={donationData.recurringFrequency === option.value}
                  onChange={(e) => setDonationData({...donationData, recurringFrequency: e.target.value})}
                  className="w-4 h-4 text-orange-500"
                />
                <div>
                  <span className="font-medium">{option.label}</span>
                  <span className="text-sm text-gray-500 ml-2">{option.description}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Dedication Option */}
      <div>
        <label className="flex items-center gap-3 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!donationData.dedication}
            onChange={(e) => setDonationData({
              ...donationData,
              dedication: e.target.checked ? donationData.dedication : ''
            })}
            className="w-4 h-4 text-orange-500 rounded"
          />
          <span className="font-medium">Add a dedication</span>
        </label>

        {donationData.dedication !== undefined && donationData.dedication !== null && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setDonationData({...donationData, dedicationType: 'honor'})}
                className={`px-4 py-2 rounded-lg ${
                  donationData.dedicationType === 'honor'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                In Honor Of
              </button>
              <button
                onClick={() => setDonationData({...donationData, dedicationType: 'memory'})}
                className={`px-4 py-2 rounded-lg ${
                  donationData.dedicationType === 'memory'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                In Memory Of
              </button>
            </div>
            <input
              type="text"
              placeholder="Name of person to honor"
              value={donationData.dedication}
              onChange={(e) => setDonationData({...donationData, dedication: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ focusRingColor: colors.primary }}
            />
          </div>
        )}
      </div>

      <button
        onClick={nextStep}
        disabled={!getTotalAmount()}
        className="w-full py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: colors.primary }}
      >
        Continue to Information
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

  // Step 3: Donor Information
  const DonorInformation = () => (
    <div className="space-y-6">
      <button
        onClick={prevStep}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.secondary }}>
          Your Information
        </h2>
        <p className="text-gray-600">Gift Amount: ${getTotalAmount()}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={donationData.firstName}
            onChange={(e) => setDonationData({...donationData, firstName: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ focusRingColor: colors.primary }}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={donationData.lastName}
            onChange={(e) => setDonationData({...donationData, lastName: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ focusRingColor: colors.primary }}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          value={donationData.email}
          onChange={(e) => setDonationData({...donationData, email: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
          style={{ focusRingColor: colors.primary }}
          required
        />
        <p className="text-xs text-gray-500 mt-1">We'll send your tax receipt to this email</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          value={donationData.phone}
          onChange={(e) => setDonationData({...donationData, phone: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
          style={{ focusRingColor: colors.primary }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address
        </label>
        <input
          type="text"
          value={donationData.address}
          onChange={(e) => setDonationData({...donationData, address: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
          style={{ focusRingColor: colors.primary }}
          placeholder="Street address"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <input
            type="text"
            value={donationData.city}
            onChange={(e) => setDonationData({...donationData, city: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ focusRingColor: colors.primary }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State
          </label>
          <input
            type="text"
            value={donationData.state}
            onChange={(e) => setDonationData({...donationData, state: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ focusRingColor: colors.primary }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ZIP Code
          </label>
          <input
            type="text"
            value={donationData.zipCode}
            onChange={(e) => setDonationData({...donationData, zipCode: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ focusRingColor: colors.primary }}
          />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={donationData.isAnonymous}
          onChange={(e) => setDonationData({...donationData, isAnonymous: e.target.checked})}
          className="w-4 h-4 text-orange-500 rounded"
        />
        <span className="text-sm font-medium">Make my donation anonymous</span>
      </label>

      <button
        onClick={nextStep}
        disabled={!donationData.firstName || !donationData.lastName || !donationData.email}
        className="w-full py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: colors.primary }}
      >
        Continue to Payment
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

  // Step 4: Payment
  const PaymentStep = () => (
    <div className="space-y-6">
      <button
        onClick={prevStep}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.secondary }}>
          Payment Information
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Shield className="w-4 h-4" />
          <span>Secure payment powered by Stripe</span>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold mb-4">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Campaign</span>
            <span className="font-medium">{selectedCampaign?.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount</span>
            <span className="font-medium">${getTotalAmount()}</span>
          </div>
          {donationData.isRecurring && (
            <div className="flex justify-between">
              <span className="text-gray-600">Frequency</span>
              <span className="font-medium capitalize">{donationData.recurringFrequency}</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span style={{ color: colors.primary }}>${getTotalAmount()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Number *
        </label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="1234 5678 9012 3456"
            value={donationData.cardNumber}
            onChange={(e) => setDonationData({...donationData, cardNumber: e.target.value})}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ focusRingColor: colors.primary }}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiry Date *
          </label>
          <input
            type="text"
            placeholder="MM/YY"
            value={donationData.expiryDate}
            onChange={(e) => setDonationData({...donationData, expiryDate: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ focusRingColor: colors.primary }}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CVV *
          </label>
          <input
            type="text"
            placeholder="123"
            value={donationData.cvv}
            onChange={(e) => setDonationData({...donationData, cvv: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ focusRingColor: colors.primary }}
            required
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">Payment Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      <button
        onClick={nextStep}
        disabled={loading}
        className="w-full py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: colors.primary }}
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Complete Donation
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Secure
        </span>
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Encrypted
        </span>
        <span>Powered by Stripe</span>
      </div>
    </div>
  );

  // Step 5: Success
  const SuccessStep = () => (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
           style={{ backgroundColor: `${colors.accent}20` }}>
        <CheckCircle className="w-12 h-12" style={{ color: colors.accent }} />
      </div>

      <h2 className="text-3xl font-bold mb-4" style={{ color: colors.secondary }}>
        Thank You for Your Generosity!
      </h2>

      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Your donation of <span className="font-semibold">${getTotalAmount()}</span> to{' '}
        <span className="font-semibold">{selectedCampaign?.title}</span> has been successfully processed.
      </p>

      <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto mb-8">
        <h3 className="font-semibold mb-4">What's Next?</h3>
        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Check Your Email</p>
              <p className="text-sm text-gray-600">We've sent a receipt to {donationData.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Track Your Impact</p>
              <p className="text-sm text-gray-600">Sign in to see how your donation makes a difference</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Share2 className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Spread the Word</p>
              <p className="text-sm text-gray-600">Share this campaign with friends and family</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 max-w-md mx-auto">
        <button
          onClick={() => {
            setStep(1);
            setSelectedCampaign(null);
            setDonationData({
              amount: '',
              customAmount: '',
              isRecurring: false,
              recurringFrequency: 'monthly',
              isAnonymous: false,
              dedication: '',
              dedicationType: '',
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              address: '',
              city: '',
              state: '',
              zipCode: '',
              country: 'USA',
              cardNumber: '',
              expiryDate: '',
              cvv: '',
              savePaymentMethod: false
            });
          }}
          className="flex-1 px-6 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
          style={{ borderColor: colors.gray[300] }}
        >
          Make Another Donation
        </button>
        <button
          className="flex-1 px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: colors.primary }}
        >
          View Campaign
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl shadow-lg mb-4"
               style={{ backgroundColor: colors.primary }}>
            <Heart className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: colors.secondary }}>
            Smart Donation Checkout
          </h1>
          <p className="text-gray-600 mt-2">Fast, secure, and impactful giving</p>
        </div>

        {/* Progress Steps */}
        {step < 5 && (
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                  style={{
                    backgroundColor: step >= s ? colors.primary : undefined
                  }}
                >
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-full h-1 mx-2 ${
                      step > s ? '' : 'bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: step > s ? colors.primary : undefined
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && <CampaignSelection />}
          {step === 2 && <AmountSelection />}
          {step === 3 && <DonorInformation />}
          {step === 4 && <PaymentStep />}
          {step === 5 && <SuccessStep />}
        </div>
      </div>
    </div>
  );
};

export default SmartCheckout;
