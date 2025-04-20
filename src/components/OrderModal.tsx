import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { X, Upload, Info, CreditCard, User, Shield } from 'lucide-react';
import { supabase, getPublicStorageUrl } from '../lib/supabase';
import toast from 'react-hot-toast';
import { RankOption, Order } from '../types';
import { WebhookService } from '../services/webhookService';
import { Receipt } from './Receipt';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to parse Supabase error
const parseSupabaseError = (error: any): string => {
  console.log('Raw Error Object:', error);
  
  if (!error) return 'Unknown error occurred';
  
  // Check for specific error types
  if (typeof error === 'object') {
    // Log all properties of the error object to aid debugging
    Object.keys(error).forEach(key => {
      console.log(`Error property ${key}:`, error[key]);
    });
    
    // Handle different error scenarios
    if (error.code === '42P01') {
      return 'Database table does not exist. Please ensure the orders table is properly set up.';
    }
    
    if (error.code === '23505') {
      return 'A duplicate order already exists.';
    }
    
    if (error.code === '23502') {
      return 'Missing required fields in the order.';
    }
    
    // Extract message if available
    if (error.message) {
      return error.message;
    }
    
    // Extract details if available
    if (error.details) {
      return error.details;
    }
  }
  
  // Fallback to string representation
  return String(error);
};

// Generate a fake order ID for local testing
const generateFakeOrderId = (): string => {
  return 'order_' + Math.random().toString(36).substring(2, 10);
};

// Username validation regex - compile once outside component
const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;

// Max file size constant (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function OrderModal({ isOpen, onClose }: OrderModalProps) {
  // Replace hardcoded RANKS with dynamic data
  const [ranks, setRanks] = useState<RankOption[]>([]);
  const [isLoadingRanks, setIsLoadingRanks] = useState(true);
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    platform: 'java' as 'java' | 'bedrock', // Fixed type
    rank: '' // Selected rank
  });
  const [selectedRank, setSelectedRank] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false); // Added missing demoMode state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Memoize selected rank to avoid recalculation on each render
  const selectedRankOption = useMemo(() => {
    return selectedRank 
      ? ranks.find(r => r.name === selectedRank)
      : null;
  }, [selectedRank, ranks]);
  
  // Memoize price to avoid recalculation
  const selectedRankPrice = useMemo(() => {
    if (!selectedRankOption) return 0;
    return calculateRankPrice(selectedRankOption);
  }, [selectedRankOption]);

  // Callbacks for event handlers
  const handleReceiptClose = useCallback(() => {
    setIsReceiptOpen(false);
    onClose();
  }, [onClose]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProofFile(e.target.files[0]);
    }
  }, []);

  const handlePlatformChange = useCallback((newPlatform: 'java' | 'bedrock') => {
    setFormData(prev => ({ ...prev, platform: newPlatform }));
  }, []);

  const handleRankSelect = useCallback((rankName: string) => {
    setSelectedRank(rankName);
  }, []);

  // Add useEffect to fetch ranks from database
  useEffect(() => {
    const fetchRanks = async () => {
      try {
        setIsLoadingRanks(true);
        const { data, error } = await supabase
          .from('ranks')
          .select('*')
          .order('price', { ascending: true });

        if (error) throw error;
        
        // Transform data if needed to match RankOption interface
        setRanks(data || []);
      } catch (err) {
        console.error('Error fetching ranks:', err);
        // Fallback to default ranks
        setRanks([
          { 
            name: 'VIP', 
            price: 4.99, 
            color: 'from-emerald-500 to-emerald-600',
            image: 'https://i.imgur.com/NX3RB4i.png'
          },
          { 
            name: 'MVP', 
            price: 9.99, 
            color: 'from-blue-500 to-blue-600',
            image: 'https://i.imgur.com/gmlFpV2.png'
          },
          { 
            name: 'MVP+', 
            price: 15, 
            color: 'from-purple-500 to-purple-600',
            image: 'https://i.imgur.com/C4VE5b0.png'
          },
          { 
            name: 'LEGEND', 
            price: 20, 
            color: 'from-yellow-500 to-yellow-600',
            image: 'https://i.imgur.com/fiqqcOY.png'
          },
          { 
            name: 'DEVIL', 
            price: 25, 
            color: 'from-red-500 to-red-600',
            image: 'https://i.imgur.com/z0zBiyZ.png'
          },
          { 
            name: 'INFINITY', 
            price: 30, 
            color: 'from-pink-500 to-pink-600',
            image: 'https://i.imgur.com/SW6dtYW.png'
          },
          { 
            name: 'CHAMPA', 
            price: 50, 
            color: 'from-orange-500 to-orange-600',
            image: 'https://i.imgur.com/5xEinAj.png'
          }
        ]);
      } finally {
        setIsLoadingRanks(false);
      }
    };

    if (isOpen) {
      fetchRanks();
    }
  }, [isOpen]);

  // Early return if modal is not open
  if (!isOpen) return null;

  // Send order data to Discord webhook
  const sendToDiscord = async (orderData: Order, paymentProofUrl: string) => {
    try {
      // Create webhook content using the service
      const webhookContent = WebhookService.createOrderNotification(orderData, paymentProofUrl);
      
      // Send the notification with a timeout to prevent hanging
      const success = await WebhookService.sendDiscordNotification(webhookContent);
      
      if (!success) {
        console.warn('Discord notification could not be sent, but order process will continue');
      }
    } catch (error) {
      console.error('Error in sendToDiscord function:', error);
      // Don't throw error to prevent blocking the order process
    }
  };

  // Function to calculate rank price with discount
  const calculateRankPrice = (rank: RankOption) => {
    if (!rank) return 0;
    
    // Apply discount if available
    if (rank.discount && rank.discount > 0) {
      const discountAmount = (rank.price * rank.discount) / 100;
      return rank.price - discountAmount;
    }
    
    return rank.price;
  };

  // Get selected rank details
  const selectedRankDetails = useMemo(() => {
    return ranks.find(r => r.name === selectedRank) || null;
  }, [ranks, selectedRank]);

  // Format price display with discount if applicable
  const renderRankPrice = (rank: RankOption | null) => {
    if (!rank) return '$0.00';
    
    if (rank.discount && rank.discount > 0) {
      const discountedPrice = calculateRankPrice(rank);
      return (
        <div className="flex items-center gap-1">
          <span className="line-through text-gray-400 text-xs">${rank.price.toFixed(2)}</span>
          <span className="text-emerald-400">${discountedPrice.toFixed(2)}</span>
          <span className="ml-1 text-xs bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded-sm">-{rank.discount}%</span>
        </div>
      );
    }
    return <span>${rank.price.toFixed(2)}</span>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate user inputs
      if (!paymentProofFile) throw new Error('Please upload payment proof');
      if (!formData.username.trim()) throw new Error('Please enter your username');

      // Validate username format
      if (!usernameRegex.test(formData.username.trim())) {
        throw new Error('Username must be 3-16 characters long and contain only letters, numbers, and underscores');
      }

      if (!selectedRankDetails) throw new Error('Please select a valid rank');

      // Validate file type
      if (!paymentProofFile.type.startsWith('image/')) {
        throw new Error('Please upload a valid image file');
      }

      // Validate file size
      if (paymentProofFile.size > MAX_FILE_SIZE) {
        throw new Error('Image size should be less than 5MB');
      }

      // Generate secure file path with timestamp and randomness
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      const fileName = `${timestamp}_${randomString}.jpg`;
      const filePath = `guest/${fileName}`;
      
      let uploadData;
      let publicUrl;
      
      try {
        // Upload file to Supabase storage
        const { error: uploadError, data } = await supabase.storage
          .from('payment-proofs')
          .upload(filePath, paymentProofFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: paymentProofFile.type
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload payment proof. Please try again.');
        }

        if (!data || !data.path) {
          throw new Error('Upload failed. No data returned.');
        }
        
        uploadData = data;

        // Construct the public URL
        publicUrl = getPublicStorageUrl('payment-proofs', filePath);
      } catch (uploadErr) {
        console.error('File upload failed:', uploadErr);
        // In demo mode, continue with a placeholder URL
        if (!demoMode) throw uploadErr;
        
        publicUrl = selectedRankDetails.image; // Use rank image as a fallback
        uploadData = { path: 'demo/payment-proof.jpg' };
        console.log('Using demo mode with placeholder image URL');
      }

      // Get current rank price with any discount applied
      const finalPrice = calculateRankPrice(selectedRankDetails);
      
      // Create order with required fields
      const orderData: Order = {
        id: demoMode ? generateFakeOrderId() : undefined,
        username: formData.username.trim(),
        platform: formData.platform,
        rank: selectedRank,
        price: finalPrice, // Use calculated price with discount
        payment_proof: uploadData.path,
        created_at: new Date().toISOString(),
        status: 'pending'
      };

      let orderInsertResult = null;

      try {
        // First, check if the orders table exists
        const { error: checkError, data: tableData } = await supabase
          .from('orders')
          .select('id')
          .limit(1);

        if (checkError) {
          console.error('Table check error details:', checkError);
          
          // If demo mode enabled, continue without database; otherwise throw error
          if (!demoMode) {
            throw new Error(`Table check failed: ${parseSupabaseError(checkError)}`);
          } else {
            console.log('Demo mode: Skipping database table check');
            setDemoMode(true);
          }
        }

        // Skip database insertion in demo mode
        if (!demoMode) {
          // Insert order into database
          const { error: orderError, data: insertResult } = await supabase
            .from('orders')
            .insert({
              username: orderData.username,
              platform: orderData.platform,
              rank: orderData.rank,
              price: orderData.price,
              payment_proof: orderData.payment_proof,
              status: orderData.status,
              created_at: orderData.created_at
            })
            .select();

          if (orderError) {
            console.error('Order insertion error details:', orderError);
            
            // Try once more with demo mode if this fails
            if (!demoMode) {
              console.log('Database insertion failed. Enabling demo mode for testing.');
              setDemoMode(true);
            } else {
              throw new Error(`Failed to create order: ${parseSupabaseError(orderError)}`);
            }
          } else {
            orderInsertResult = insertResult;
          }
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        
        // Only rethrow if we're not in demo mode
        if (!demoMode) {
          throw dbError;
        }
      }

      // Get the inserted order ID if available
      if (orderInsertResult && orderInsertResult.length > 0) {
        orderData.id = orderInsertResult[0].id;
      }

      // Send Discord notification
      try {
        if (!demoMode) {
          await sendToDiscord(orderData, publicUrl);
        }
      } catch (discordError) {
        console.error('Discord notification failed, but order was created:', discordError);
        // Continue with success even if Discord notification fails
      }

      // Store the completed order data for the receipt
      setCompletedOrder(orderData);
      
      // Show success message
      toast.success(demoMode 
        ? 'Demo order created! Here is your receipt.' 
        : 'Order submitted successfully! Your receipt is ready.');
      
      // Reset form
      setFormData({ username: '', platform: 'java', rank: '' });
      setSelectedRank('');
      setPaymentProofFile(null);
      
      // Show the receipt
      setIsReceiptOpen(true);
    } catch (error) {
      console.error('Submit error:', error);
      let errorMessage = 'An error occurred while processing your order.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Offer demo mode if it's a database error
      if (errorMessage.includes('Table check failed') || 
          errorMessage.includes('Failed to create order')) {
        toast.error(errorMessage + " Would you like to try demo mode?", {
          duration: 5000,
          icon: '🧪',
          position: 'top-center'
        });
        // Enable demo mode automatically for the next attempt
        setDemoMode(true);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
        <div className="bg-gray-800/95 rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-2xl m-2 sm:m-4 relative max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Complete Your Order</h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Select your platform and rank to proceed with the purchase
              {demoMode && <span className="ml-1 text-emerald-400">• Demo Mode</span>}
            </p>
          </div>

          {/* Order form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" ref={formRef}>
            {/* Order Summary */}
            <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4 border border-gray-600">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Info size={18} className="text-emerald-400" />
                Order Summary
              </h3>
              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex justify-between text-gray-300">
                  <span>Selected Rank:</span>
                  <span className="font-medium">{selectedRank}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Platform:</span>
                  <span className="font-medium capitalize">{formData.platform}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Price:</span>
                  <span className="font-medium text-emerald-400">{renderRankPrice(selectedRankDetails)}</span>
                </div>
              </div>
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                <User size={16} className="text-emerald-400" />
                Minecraft Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm sm:text-base"
                required
                placeholder="Enter your Minecraft username"
                pattern="[a-zA-Z0-9_]{3,16}"
                title="Username must be 3-16 characters long and contain only letters, numbers, and underscores"
                maxLength={16}
                autoComplete="username"
              />
            </div>

            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Platform
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePlatformChange('java')}
                  className={`flex-1 py-2 px-3 sm:px-4 rounded-lg border transition-colors text-sm sm:text-base ${
                    formData.platform === 'java'
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600/50'
                  }`}
                >
                  Java
                </button>
                <button
                  type="button"
                  onClick={() => handlePlatformChange('bedrock')}
                  className={`flex-1 py-2 px-3 sm:px-4 rounded-lg border transition-colors text-sm sm:text-base ${
                    formData.platform === 'bedrock'
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600/50'
                  }`}
                >
                  Bedrock
                </button>
              </div>
            </div>

            {/* Rank Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Select Rank
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {ranks.map((rank) => (
                  <button
                    key={rank.name}
                    type="button"
                    onClick={() => handleRankSelect(rank.name)}
                    className={`py-2 sm:py-3 px-2 sm:px-3 rounded-lg border transition-all transform hover:scale-[1.02] text-sm ${
                      selectedRank === rank.name
                        ? `bg-gradient-to-r ${rank.color} text-white border-transparent`
                        : 'bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600/50'
                    }`}
                  >
                    <div className="font-medium truncate">{rank.name}</div>
                    <div className="text-xs sm:text-sm">{renderRankPrice(rank)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rank Preview Section */}
            {selectedRankDetails && (
              <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4 border border-gray-600">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Shield size={18} className="text-emerald-400" />
                  {selectedRank} Rank Preview
                </h3>
                <div className="flex justify-center">
                  <img 
                    src={selectedRankDetails.image} 
                    alt={`${selectedRank} Kit Preview`}
                    className="w-auto h-auto max-w-full max-h-[250px] object-contain rounded-lg border border-gray-600"
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* Payment Details Section */}
            <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4 border border-gray-600">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-400" />
                Payment Details
              </h3>
              <div className="text-center">
                <p className="text-gray-300 mb-3 text-sm sm:text-base">Scan the QR code below to pay:</p>
                <div className="bg-white p-2 sm:p-4 rounded-lg inline-block">
                  <img 
                    src="https://i.imgur.com/xmzqO4S.jpeg" 
                    alt="Payment QR Code"
                    className="w-36 h-36 sm:w-48 sm:h-48 mx-auto"
                    loading="lazy"
                  />
                </div>
                <p className="text-xs sm:text-sm text-gray-400 mt-2">Amount: {renderRankPrice(selectedRankDetails)}</p>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Payment Proof (QR Code Screenshot)
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="payment-proof"
                  required
                  ref={fileInputRef}
                />
                <label
                  htmlFor="payment-proof"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 sm:py-3 px-3 sm:px-4 text-white flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-600/50 transition duration-300 text-sm sm:text-base"
                >
                  <Upload size={18} />
                  {paymentProofFile ? (
                    <span className="truncate max-w-full">{paymentProofFile.name}</span>
                  ) : (
                    'Upload QR Code Screenshot'
                  )}
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg py-3 px-4 transition duration-300 disabled:opacity-50 transform hover:scale-[1.02] text-sm sm:text-base font-medium mt-2"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Submit Order'}
            </button>
          </form>
        </div>
      </div>

      {/* Receipt Display */}
      {completedOrder && selectedRankDetails && (
        <Receipt 
          isOpen={isReceiptOpen} 
          onClose={handleReceiptClose} 
          order={completedOrder}
          rankDetails={selectedRankDetails}
        />
      )}
    </>
  );
}