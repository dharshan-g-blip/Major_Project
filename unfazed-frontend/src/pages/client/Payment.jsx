import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import CheckoutForm from '../../components/payments/CheckoutForm';
import InvoiceView from '../../components/payments/InvoiceView';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export const Payment = () => {
  const [searchParams] = useSearchParams();
  const [completedPayment, setCompletedPayment] = useState(null);

  const amount = searchParams.get('amount') || 2500;
  const description = searchParams.get('desc') || 'Psychotherapy Consultation';

  return (
    <div className="min-h-[85vh] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 hover:text-teal-900"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Practice</span>
      </Link>

      {!completedPayment ? (
        <CheckoutForm
          amount={amount}
          itemDescription={description}
          onPaymentSuccess={(p) => setCompletedPayment(p)}
        />
      ) : (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center space-y-2">
            <CheckCircle className="w-8 h-8 mx-auto text-emerald-600" />
            <h3 className="text-lg font-bold">Payment Completed Successfully!</h3>
            <p className="text-xs text-emerald-700">
              Your GST tax invoice has been generated below.
            </p>
          </div>

          <InvoiceView payment={completedPayment} />
        </div>
      )}
    </div>
  );
};

export default Payment;
