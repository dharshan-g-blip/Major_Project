import React, { useState } from 'react';
import api from '../../api/axiosInstance';
import { CreditCard, ShieldCheck, CheckCircle2, Lock, Tag, X, Sparkles } from 'lucide-react';
import Button from '../common/Button';

export const CheckoutForm = ({
  therapist,
  client,
  session,
  packageData,
  amount,
  itemDescription,
  onPaymentSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountPercentage, description }
  const [couponError, setCouponError] = useState('');
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);

  const rawBaseAmount = Number(amount) || therapist?.sessionFee || 2000;
  const discountMultiplier = appliedCoupon ? (100 - appliedCoupon.discountPercentage) / 100 : 1;
  const finalPayableAmount = Math.round(rawBaseAmount * discountMultiplier);
  const discountSaved = rawBaseAmount - finalPayableAmount;

  // 18% GST calculation display on payable amount
  const taxableValue = Math.round((finalPayableAmount / 1.18) * 100) / 100;
  const gstValue = Math.round((finalPayableAmount - taxableValue) * 100) / 100;

  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    if (!couponCode.trim()) return;

    setVerifyingCoupon(true);
    setCouponError('');
    try {
      const res = await api.post('/payments/verify-coupon', { code: couponCode.trim() });
      if (res.data.valid) {
        setAppliedCoupon(res.data.coupon);
        setCouponError('');
      } else {
        setCouponError(res.data.message || 'Invalid or expired coupon code');
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code. Try WELCOME10 or HEAL15.');
    } finally {
      setVerifyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handlePay = async () => {
    try {
      setLoading(true);

      // 1. Create order from backend with final payable amount
      const orderRes = await api.post('/payments/create-order', {
        amount: finalPayableAmount,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
      });

      const orderData = orderRes.data.order;

      // 2. Complete payment verification
      const verifyRes = await api.post('/payments/verify', {
        razorpay_order_id: orderData.id,
        razorpay_payment_id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        razorpay_signature: 'simulated_valid_test_signature',
        therapistId: therapist?._id || session?.therapist_id,
        clientId: client?._id || session?.client_id,
        clientEmail: client?.email || session?.clientEmail,
        sessionId: session?._id,
        packageId: packageData?._id,
        amount: finalPayableAmount,
        couponCode: appliedCoupon?.code || null,
        discountApplied: discountSaved,
        itemDescription: itemDescription || (packageData ? packageData.name : 'Individual Therapy Session'),
        paymentMethod,
      });

      if (verifyRes.data.success) {
        if (onPaymentSuccess) {
          onPaymentSuccess(verifyRes.data.payment);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Advance Payment & Confirmation</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Secured via Razorpay Payment Gateway (Test Mode Enabled)
          </p>
        </div>
        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Item Summary */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
        <div className="flex justify-between items-center text-slate-600">
          <span>Consultation / Item:</span>
          <span className="font-bold text-slate-900">
            {itemDescription || (packageData ? packageData.name : 'Individual Psychotherapy (50m)')}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-500">
          <span>Practitioner:</span>
          <span className="font-semibold text-slate-800">{therapist?.name}</span>
        </div>
        {session?.startTime && (
          <div className="flex justify-between items-center text-slate-500">
            <span>Scheduled Date & Time:</span>
            <span className="font-semibold text-slate-800">
              {new Date(session.startTime).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center text-slate-500">
          <span>Standard Fee:</span>
          <span>₹{rawBaseAmount}</span>
        </div>

        {appliedCoupon && (
          <div className="flex justify-between items-center text-emerald-700 font-semibold bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Coupon Discount ({appliedCoupon.code} - {appliedCoupon.discountPercentage}% OFF):</span>
            </span>
            <span>-₹{discountSaved}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-slate-500">
          <span>Taxable Healthcare Service (SAC 999312):</span>
          <span>₹{taxableValue}</span>
        </div>
        <div className="flex justify-between items-center text-slate-500">
          <span>Integrated GST @ 18%:</span>
          <span>₹{gstValue}</span>
        </div>
        <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
          <div>
            <span className="font-bold text-slate-900 text-sm block">Total Payable Amount:</span>
            {appliedCoupon && (
              <span className="text-[11px] text-emerald-600 font-semibold">
                You saved ₹{discountSaved} with promo code {appliedCoupon.code}!
              </span>
            )}
          </div>
          <div className="text-right">
            {appliedCoupon && (
              <span className="text-xs text-slate-400 line-through mr-2">₹{rawBaseAmount}</span>
            )}
            <span className="text-xl font-black text-teal-900">₹{finalPayableAmount}</span>
          </div>
        </div>
      </div>

      {/* Coupon Code Section */}
      <div className="border border-dashed border-teal-200 rounded-xl p-3.5 bg-teal-50/40">
        <label className="block text-xs font-bold text-teal-950 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-teal-700" />
          <span>Have a Promo Coupon?</span>
        </label>

        {!appliedCoupon ? (
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME10, HEAL15, STUDENT20"
              className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl uppercase tracking-wider font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700"
            />
            <button
              type="submit"
              disabled={verifyingCoupon || !couponCode.trim()}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
            >
              {verifyingCoupon ? 'Verifying...' : 'Apply'}
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-300 text-xs">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-bold">{appliedCoupon.code}</span>
              <span className="text-slate-500">({appliedCoupon.description})</span>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
              title="Remove coupon"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {couponError && (
          <span className="text-[11px] text-rose-600 font-semibold mt-1.5 block">
            {couponError}
          </span>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-teal-900/80">
          <span>Popular codes:</span>
          {['WELCOME10', 'HEAL15', 'STUDENT20'].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setCouponCode(code);
                setCouponError('');
              }}
              className="underline font-bold hover:text-teal-950"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Select Payment Method
        </label>
        <div className="grid grid-cols-3 gap-3 text-xs">
          {['UPI', 'Card', 'NetBanking'].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`p-3 rounded-xl border text-center font-bold transition-all ${
                paymentMethod === method
                  ? 'border-teal-700 bg-teal-50 text-teal-900 ring-2 ring-teal-700/20'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Pay CTA */}
      <Button
        variant="primary"
        size="lg"
        loading={loading}
        onClick={handlePay}
        className="w-full shadow-md text-sm"
      >
        <Lock className="w-4 h-4 mr-2" />
        Pay ₹{finalPayableAmount} & Confirm Booking
      </Button>

      <p className="text-[11px] text-center text-slate-400">
        By clicking Pay, you agree to the practice cancellation policy. A GST Tax invoice will be generated
        automatically.
      </p>
    </div>
  );
};

export default CheckoutForm;
