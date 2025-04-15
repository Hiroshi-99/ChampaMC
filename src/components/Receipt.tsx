import React, { useRef } from 'react';
import { Download, X, Check, Info, User, Calendar, CreditCard } from 'lucide-react';
import { Order, RankOption } from '../types';

interface ReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  rankDetails: RankOption;
}

export function Receipt({ isOpen, onClose, order, rankDetails }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Format date for receipt
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Generate order number from timestamp
  const orderNumber = order.id || `ORDER-${new Date(order.created_at).getTime().toString().slice(-8)}`;

  // Handle printing the receipt
  const handlePrint = () => {
    // Fallback method if react-to-print is not available
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
      <div className="bg-gray-800/95 rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-2xl m-2 sm:m-4 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 sm:right-4 sm:top-4 text-gray-400 hover:text-white transition-colors no-print"
          aria-label="Close receipt"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6 no-print">
          <div className="inline-block bg-emerald-500 text-white rounded-full p-2 mb-3">
            <Check size={32} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Order Confirmed!</h2>
          <p className="text-gray-400 text-sm sm:text-base">
            Thank you for your purchase. Your order has been received.
          </p>
        </div>

        {/* Printable Receipt */}
        <div 
          ref={receiptRef}
          className="bg-white rounded-xl overflow-hidden text-gray-800 receipt-content"
        >
          {/* Receipt Header */}
          <div className="bg-emerald-500 p-4 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img 
                  src="/favicon/favicon-32x32.png" 
                  alt="Champa Logo" 
                  className="w-8 h-8"
                />
                <h3 className="text-xl font-bold">Champa Store</h3>
              </div>
              <div className="text-sm">
                <div>Receipt #{orderNumber}</div>
                <div>{formatDate(order.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Receipt Content */}
          <div className="p-5 space-y-4 text-gray-700">
            {/* Order Details */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Info size={18} className="text-emerald-600" />
                Order Details
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-emerald-600" />
                  <span className="font-medium">Username:</span>
                </div>
                <div>{order.username}</div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium">Platform:</span>
                </div>
                <div className="capitalize">{order.platform}</div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium">Rank:</span>
                </div>
                <div>{order.rank}</div>
                
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-emerald-600" />
                  <span className="font-medium">Date:</span>
                </div>
                <div>{formatDate(order.created_at)}</div>
              </div>
            </div>

            {/* Payment Summary */}
            <div>
              <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-600" />
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

            {/* Rank Preview */}
            <div className="flex items-center justify-center py-3">
              <div className="w-24 h-24 overflow-hidden rounded-lg">
                <img 
                  src={rankDetails.image} 
                  alt={`${order.rank} Rank`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="text-xs text-gray-500 mt-4 pt-4 border-t">
              <p className="mb-1">
                This purchase is subject to Champa Store terms and conditions. Your rank will be activated
                within 24 hours of purchase confirmation.
              </p>
              <p>
                For any issues or support, please contact us on our Discord server.
              </p>
              <div className="flex items-center justify-center mt-2">
                <div className="text-center">
                  <p className="font-semibold text-emerald-600">Thank You For Your Purchase!</p>
                  <p>Champa Store</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 bg-white hover:bg-gray-100 text-gray-800 rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
          >
            <Download size={18} />
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