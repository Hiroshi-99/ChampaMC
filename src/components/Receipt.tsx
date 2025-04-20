import React, { useRef, useCallback, useMemo } from 'react';
import { Download, X, Check, Info, User, Calendar, CreditCard, Shield, Printer } from 'lucide-react';
import { Order, RankOption } from '../types';
import { getPublicStorageUrl } from '../lib/supabase';

interface ReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  rankDetails: RankOption;
}

export function Receipt({ isOpen, onClose, order, rankDetails }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Format date for receipt - memoize to avoid recalculation
  const formattedDate = useMemo(() => {
    const date = new Date(order.created_at);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }, [order.created_at]);

  // Generate order number from timestamp - memoize to avoid recalculation
  const orderNumber = useMemo(() => 
    order.id || `ORDER-${new Date(order.created_at).getTime().toString().slice(-8)}`,
    [order.id, order.created_at]
  );

  // Get payment proof URL
  const paymentProofUrl = useMemo(() => {
    if (!order.payment_proof) return null;
    
    // Check if it's already a full URL
    if (order.payment_proof.startsWith('http')) {
      return order.payment_proof;
    }
    
    // Otherwise, construct URL from Supabase storage
    return getPublicStorageUrl('payment-proofs', order.payment_proof);
  }, [order.payment_proof]);

  // Handle printing the receipt
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Early return if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
      <div className="bg-gray-800/95 rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-2xl m-2 sm:m-4 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 sm:right-4 sm:top-4 text-gray-400 hover:text-white transition-colors no-print"
          aria-label="Close receipt"
        >
          <X size={24} />
        </button>

        {/* Success message (only visible on screen, not in print) */}
        <div className="text-center mb-6 no-print">
          <div className="inline-block bg-emerald-500 text-white rounded-full p-2 mb-3">
            <Check size={32} aria-hidden="true" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Order Confirmed!</h2>
          <p className="text-gray-400 text-sm sm:text-base">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
        </div>

        {/* Printable Receipt */}
        <div 
          ref={receiptRef}
          className="bg-white rounded-xl overflow-hidden text-gray-800 receipt-content shadow-lg"
        >
          {/* Receipt Header */}
          <div className={`bg-gradient-to-r ${rankDetails.color || 'from-emerald-500 to-emerald-600'} p-4 text-white`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img 
                  src="/favicon/favicon-32x32.png" 
                  alt="Champa Logo" 
                  className="w-8 h-8"
                  loading="lazy"
                />
                <h3 className="text-xl font-bold">Champa Store</h3>
              </div>
              <div className="text-sm">
                <div>Receipt #{orderNumber.slice(0, 12)}</div>
                <div>{formattedDate}</div>
              </div>
            </div>
          </div>

          {/* Receipt Content */}
          <div className="p-5 space-y-4 text-gray-700">
            {/* Status Banner */}
            <div className={`bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Info size={18} className="text-yellow-600" />
                <span>Order Status: <span className="font-semibold uppercase">{order.status}</span></span>
              </div>
              <span className="text-xs text-yellow-600">Est. delivery: 24 hours</span>
            </div>
            
            {/* Order Details */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Info size={18} className="text-emerald-600" aria-hidden="true" />
                Order Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-emerald-600" aria-hidden="true" />
                  <span className="font-medium">Username:</span>
                </div>
                <div>{order.username}</div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium">Platform:</span>
                </div>
                <div className="capitalize">{order.platform}</div>
                
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-emerald-600" aria-hidden="true" />
                  <span className="font-medium">Rank:</span>
                </div>
                <div className="font-semibold">{order.rank}</div>
                
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-emerald-600" aria-hidden="true" />
                  <span className="font-medium">Date:</span>
                </div>
                <div>{formattedDate}</div>
              </div>
            </div>

            {/* Rank Details with Preview */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Shield size={18} className="text-emerald-600" aria-hidden="true" />
                Rank Information
              </h4>
              
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 overflow-hidden rounded-lg border border-gray-200 flex-shrink-0">
                  <img 
                    src={rankDetails.image} 
                    alt={`${order.rank} Rank`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.currentTarget.src = '/assets/placeholder-rank.png';
                      e.currentTarget.onerror = null; // Prevent infinite loop
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-gray-800 text-lg">{rankDetails.name}</h5>
                  {rankDetails.description && (
                    <p className="text-sm text-gray-600 mt-1">{rankDetails.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-600" aria-hidden="true" />
                Payment Summary
              </h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">{order.rank} Rank</span>
                  <span>${order.price.toFixed(2)}</span>
                </div>
                <div className="font-bold flex justify-between text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-emerald-600">${order.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Proof */}
            {paymentProofUrl && (
              <div className="border-b pb-4">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CreditCard size={18} className="text-emerald-600" aria-hidden="true" />
                  Payment Proof
                </h4>
                <div className="flex justify-center">
                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-2 max-w-xs">
                    <img 
                      src={paymentProofUrl} 
                      alt="Payment Proof" 
                      className="max-h-48 w-auto object-contain mx-auto"
                      loading="lazy"
                      onError={(e) => {
                        console.error("Failed to load payment proof image:", paymentProofUrl);
                        e.currentTarget.src = '/assets/placeholder-payment.png';
                        e.currentTarget.onerror = null;
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="text-xs text-gray-500 mt-4 pt-4 border-t">
              <p className="mb-1">
                This purchase is subject to Champa Store terms and conditions. Your rank will be activated
                within 24 hours of purchase confirmation.
              </p>
              <p>
                For any issues or support, please contact us on our Discord server.
              </p>
              <div className="flex items-center justify-center mt-3">
                <div className="text-center">
                  <p className="font-semibold text-emerald-600">Thank You For Your Purchase!</p>
                  <p>Champa Store</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 bg-white hover:bg-gray-100 text-gray-800 rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
            aria-label="Print receipt"
          >
            <Printer size={18} aria-hidden="true" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-2.5 px-4 transition-colors text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 