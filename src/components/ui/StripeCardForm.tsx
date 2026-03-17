import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

type Props = {
  amount: number;
  registrationNumber: string;
  email?: string;
  onSuccess: (data: any) => void;
  onError?: (err: any) => void;
};

function InnerForm({ amount, registrationNumber, email, onSuccess, onError }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    try {
      const resp = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, registration_number: registrationNumber, receipt_email: email })
      });
      const json = await resp.json();
      if (!resp.ok) throw json;

      const clientSecret = json.client_secret;
      const card = elements.getElement(CardElement);
      if (!card) throw new Error('Card element not found');

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card, billing_details: { email } }
      });

      if (result.error) {
        if (onError) onError(result.error);
        setLoading(false);
        return;
      }

      if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // Inform server to finalize and create auth user
        const confirmResp = await fetch('/api/confirm-card-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_intent_id: result.paymentIntent.id, registration_number: registrationNumber })
        });
        const confirmJson = await confirmResp.json();
        if (!confirmResp.ok) throw confirmJson;
        onSuccess(confirmJson);
      } else {
        throw new Error('Payment not completed');
      }
    } catch (err) {
      console.error('Card payment error', err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="border p-3 rounded">
        <CardElement />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="bg-[#2E8B57] text-white px-4 py-2 rounded"
        >
          {loading ? 'Processing...' : `Pay KSh ${amount.toLocaleString()}`}
        </button>
      </div>
    </form>
  );
}

export default function StripeCardForm(props: Props) {
  return (
    <Elements stripe={stripePromise}>
      <InnerForm {...props} />
    </Elements>
  );
}
