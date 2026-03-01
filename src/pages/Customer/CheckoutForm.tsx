import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { OrderItem } from '../../types';

interface CheckoutFormProps {
  cart: OrderItem[];
  total: number;
  tableNumber: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CheckoutForm({ cart, total, tableNumber, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !db) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment succeeded, save order to Firestore
      try {
        await addDoc(collection(db, 'orders'), {
          tableNumber,
          items: cart,
          status: 'pending',
          totalPrice: total,
          timestamp: Date.now(),
          paymentIntentId: paymentIntent.id,
        });
        
        // Clear local storage for this order
        localStorage.removeItem('bistro_cart');
        localStorage.removeItem('bistro_table');
        
        onSuccess();
      } catch (err) {
        console.error('Error saving order:', err);
        setErrorMessage('Payment succeeded but failed to save order. Please contact staff.');
        setIsProcessing(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {errorMessage && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 py-3 rounded-xl font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-neutral-900 text-white py-3 rounded-xl font-medium disabled:opacity-50 hover:bg-neutral-800 transition-colors"
        >
          {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}
