import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { RankOption } from '../types';
import { Shield, DollarSign, Image, Save, Trash, RefreshCw, Plus, LogOut, Home, Lock, Tag, PercentIcon, Calendar, Clock, Check, Info, Settings, Upload, Eye, CreditCard, Bell, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { proxyImage } from '../lib/imageProxy';
import '../styles/admin.css'; // Import from styles directory

// Add the Order interface
interface Order {
  id: string;
  created_at: string;
  user_id: string;
  status: string;
  total: number;
  [key: string]: any;
}

// Add BirdFlop gradient interface
interface GradientPreset {
  id: string;
  name: string;
  startColor: string;
  endColor: string;
  preview: string;
}

// Enhanced Admin UI with Discount Management
const Admin = () => {
  const navigate = useNavigate();
  const [ranks, setRanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('ranks');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [orderStats, setOrderStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [bulkDiscount, setBulkDiscount] = useState<number>(0);
  const [bulkDiscountExpiry, setBulkDiscountExpiry] = useState<string | null>(null);
  const [applyingBulkDiscount, setApplyingBulkDiscount] = useState(false);
  const [paymentImageUrl, setPaymentImageUrl] = useState('');
  const [savingPaymentImage, setSavingPaymentImage] = useState(false);
  const [realtimeNotifications, setRealtimeNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [realtimeOrderCount, setRealtimeOrderCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [ordersData, setOrdersData] = useState<Order[] | null>(null);
  const [gradientPresets, setGradientPresets] = useState<GradientPreset[]>([]);
  const [loadingGradients, setLoadingGradients] = useState(false);
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Check authentication status on component mount
  useEffect(() => {
    checkAuth();
    loadGradientPresets();
  }, []);

  // Set up real-time auto-refresh for data
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (isAdmin && autoRefreshEnabled) {
      // Auto-refresh data every 30 seconds
      intervalId = setInterval(() => {
        refreshAllData();
        setLastUpdateTime(new Date());
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAdmin, autoRefreshEnabled]);

  // Function to refresh all data
  const refreshAllData = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      await Promise.all([
        loadRanks(),
        loadOrderStats(),
        loadPaymentDetails()
      ]);
      console.log('Data refreshed automatically at', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error in auto-refresh:', error);
    }
  }, [isAdmin]);

  // Load gradient presets from local data instead of external API
  const loadGradientPresets = async () => {
    setLoadingGradients(true);
    try {
      // Instead of fetching from external API that's blocked by CSP,
      // use local predefined gradients
      const localPresets: GradientPreset[] = [
        {
          id: 'blue-purple',
          name: 'Blue to Purple',
          startColor: '#3b82f6',
          endColor: '#8b5cf6',
          preview: 'linear-gradient(to right, #3b82f6, #8b5cf6)'
        },
        {
          id: 'green-teal',
          name: 'Green to Teal',
          startColor: '#10b981',
          endColor: '#0d9488',
          preview: 'linear-gradient(to right, #10b981, #0d9488)'
        },
        {
          id: 'orange-red',
          name: 'Orange to Red',
          startColor: '#f97316',
          endColor: '#ef4444',
          preview: 'linear-gradient(to right, #f97316, #ef4444)'
        },
        {
          id: 'yellow-amber',
          name: 'Yellow to Amber',
          startColor: '#eab308',
          endColor: '#f59e0b',
          preview: 'linear-gradient(to right, #eab308, #f59e0b)'
        },
        {
          id: 'pink-rose',
          name: 'Pink to Rose',
          startColor: '#ec4899',
          endColor: '#e11d48',
          preview: 'linear-gradient(to right, #ec4899, #e11d48)'
        },
        {
          id: 'indigo-violet',
          name: 'Indigo to Violet',
          startColor: '#6366f1', 
          endColor: '#7c3aed',
          preview: 'linear-gradient(to right, #6366f1, #7c3aed)'
        },
        {
          id: 'cyan-sky',
          name: 'Cyan to Sky',
          startColor: '#06b6d4',
          endColor: '#0ea5e9',
          preview: 'linear-gradient(to right, #06b6d4, #0ea5e9)'
        },
        {
          id: 'emerald-green',
          name: 'Emerald to Green',
          startColor: '#10b981',
          endColor: '#22c55e',
          preview: 'linear-gradient(to right, #10b981, #22c55e)'
        },
        {
          id: 'lime-emerald',
          name: 'Lime to Emerald',
          startColor: '#84cc16',
          endColor: '#10b981',
          preview: 'linear-gradient(to right, #84cc16, #10b981)'
        },
        {
          id: 'slate-gray',
          name: 'Slate to Gray',
          startColor: '#64748b',
          endColor: '#4b5563',
          preview: 'linear-gradient(to right, #64748b, #4b5563)'
        },
        {
          id: 'purple-fuchsia',
          name: 'Purple to Fuchsia',
          startColor: '#a855f7',
          endColor: '#d946ef',
          preview: 'linear-gradient(to right, #a855f7, #d946ef)'
        },
        {
          id: 'amber-red',
          name: 'Amber to Red',
          startColor: '#f59e0b',
          endColor: '#ef4444',
          preview: 'linear-gradient(to right, #f59e0b, #ef4444)'
        }
      ];
      
      setGradientPresets(localPresets);
      console.log('Loaded local gradient presets');
    } catch (error) {
      console.error('Error loading gradient presets:', error);
      // Add basic default presets as fallback
      setGradientPresets([
        {
          id: 'default-1',
          name: 'Blue to Purple',
          startColor: '#3b82f6',
          endColor: '#8b5cf6',
          preview: 'linear-gradient(to right, #3b82f6, #8b5cf6)'
        },
        {
          id: 'default-2',
          name: 'Green to Teal',
          startColor: '#10b981',
          endColor: '#0d9488',
          preview: 'linear-gradient(to right, #10b981, #0d9488)'
        },
        {
          id: 'default-3',
          name: 'Orange to Red',
          startColor: '#f97316',
          endColor: '#ef4444',
          preview: 'linear-gradient(to right, #f97316, #ef4444)'
        }
      ]);
    } finally {
      setLoadingGradients(false);
    }
  };

  // Convert TailwindCSS gradient class to hex gradient
  const tailwindToHexGradient = (tailwindClass: string): { startColor: string, endColor: string } => {
    // Extract color names from tailwind class (e.g. "from-blue-500 to-purple-600")
    const fromMatch = tailwindClass.match(/from-([a-z]+-[0-9]+)/);
    const toMatch = tailwindClass.match(/to-([a-z]+-[0-9]+)/);
    
    // Default colors if we can't extract from the class
    let startColor = '#3b82f6'; // blue-500
    let endColor = '#8b5cf6';   // purple-500
    
    // Map of some common Tailwind colors to hex
    const colorMap: {[key: string]: string} = {
      'gray-500': '#6b7280',
      'gray-600': '#4b5563',
      'gray-700': '#374151',
      'blue-500': '#3b82f6',
      'purple-500': '#8b5cf6',
      'green-500': '#10b981',
      'red-500': '#ef4444',
      'emerald-500': '#10b981',
      'emerald-600': '#059669',
    };
    
    if (fromMatch && fromMatch[1] && colorMap[fromMatch[1]]) {
      startColor = colorMap[fromMatch[1]];
    }
    
    if (toMatch && toMatch[1] && colorMap[toMatch[1]]) {
      endColor = colorMap[toMatch[1]];
    }
    
    return { startColor, endColor };
  };
  
  // Generate gradient CSS from hex colors
  const generateGradientCss = (startColor: string, endColor: string): string => {
    return `linear-gradient(to right, ${startColor}, ${endColor})`;
  };

  // Set up real-time listeners for orders when authenticated as admin
  useEffect(() => {
    let orderSubscription: any = null;
    let settingsSubscription: any = null;
    
    if (isAdmin) {
      // Subscribe to new orders
      orderSubscription = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            const newOrder = payload.new;
            // Add to notifications
            setRealtimeNotifications(prev => [
              { 
                id: newOrder.id, 
                type: 'new_order', 
                message: `New order #${newOrder.id.substring(0, 8)} (${newOrder.status})`,
                timestamp: new Date().toISOString(),
                data: newOrder
              },
              ...prev.slice(0, 9) // Keep only last 10 notifications
            ]);
            
            // Increment realtime order counter
            setRealtimeOrderCount(prev => prev + 1);
            
            // Update stats if they exist
            if (orderStats) {
              setOrderStats((prev: {
                total_orders: number;
                pending_orders: number;
                [key: string]: any;
              }) => ({
                ...prev,
                total_orders: prev.total_orders + 1,
                pending_orders: prev.pending_orders + 1
              }));
            }
            
            // Show toast notification
            toast.success('New order received!', {
              icon: '🛒',
              duration: 5000,
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload) => {
            const updatedOrder = payload.new;
            // Add to notifications
            setRealtimeNotifications(prev => [
              { 
                id: updatedOrder.id, 
                type: 'updated_order', 
                message: `Order #${updatedOrder.id.substring(0, 8)} updated to ${updatedOrder.status}`,
                timestamp: new Date().toISOString(),
                data: updatedOrder
              },
              ...prev.slice(0, 9) // Keep only last 10 notifications
            ]);
          }
        )
        .subscribe();
      
      // Subscribe to settings changes (for payment image updates)
      settingsSubscription = supabase
        .channel('settings-changes')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'store_settings' },
          (payload) => {
            const updatedSetting = payload.new;
            if (updatedSetting.key === 'payment_details') {
              // Update payment image URL if it was changed in another admin session
              const paymentDetails = updatedSetting.value;
              setPaymentImageUrl(paymentDetails.qr_image_url);
              toast.success('Payment details updated', { duration: 3000 });
            }
          }
        )
        .subscribe();
    }
    
    // Cleanup subscriptions on unmount
    return () => {
      if (orderSubscription) orderSubscription.unsubscribe();
      if (settingsSubscription) settingsSubscription.unsubscribe();
    };
  }, [isAdmin, orderStats]);

  // Subscribe to order changes
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to all new orders
    const orderSubscription = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          // Add the new order to the state
          setOrdersData((prev: Order[] | null) => {
            if (!prev) return [payload.new as Order];
            return [payload.new as Order, ...prev];
          });
          
          // Show notification for new order
          toast.success('New order received!', {
            position: 'top-right',
            duration: 5000,
          });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(orderSubscription);
    };
  }, [user]);

  // Check if user is authenticated and an admin
  const checkAuth = async () => {
    setIsAuthLoading(true);
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsAuthenticated(true);
        
        // Check if user is an admin
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (adminData && !adminError) {
          setIsAdmin(true);
          loadRanks(); // Load ranks if user is an admin
          loadOrderStats(); // Load order statistics
          loadPaymentDetails(); // Load payment details
        } else {
          toast.error('You do not have admin privileges');
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Load payment details from store settings
  const loadPaymentDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'payment_details')
        .single();
      
      if (error) throw error;
      
      if (data && data.value) {
        const paymentDetails = data.value;
        setPaymentImageUrl(paymentDetails.qr_image_url || '');
      }
    } catch (error: any) {
      console.error('Error loading payment details:', error);
      toast.error('Failed to load payment details');
    }
  };

  // Save payment image URL
  const savePaymentImage = async () => {
    if (!paymentImageUrl.trim()) {
      toast.error('Please enter a valid image URL');
      return;
    }
    
    setSavingPaymentImage(true);
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .update({
          value: {
            qr_image_url: paymentImageUrl,
            updated_at: new Date().toISOString()
          }
        })
        .eq('key', 'payment_details');
      
      if (error) throw error;
      
      toast.success('Payment image updated successfully');
    } catch (error: any) {
      console.error('Error updating payment image:', error);
      toast.error('Failed to update payment image');
    } finally {
      setSavingPaymentImage(false);
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Check if the user is an admin
      if (data.user) {
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', data.user.id)
          .single();
        
        if (adminData && !adminError) {
          toast.success('Logged in successfully');
          setIsAuthenticated(true);
          setIsAdmin(true);
          loadRanks(); // Load ranks after successful login
          loadOrderStats(); // Load order statistics
          loadPaymentDetails(); // Load payment details
        } else {
          toast.error('You do not have admin privileges');
          await supabase.auth.signOut();
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Load order statistics
  const loadOrderStats = async () => {
    setLoadingStats(true);
    try {
      const { data, error } = await supabase
        .from('order_stats')
        .select('*')
        .single();
      
      if (error) throw error;
      setOrderStats(data);
    } catch (error: any) {
      console.error('Error loading order stats:', error);
      toast.error('Failed to load order statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  // Reset notification counter
  const clearNotificationCounter = () => {
    setRealtimeOrderCount(0);
    setShowNotifications(!showNotifications);
  };

  // Format relative time for notifications
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
    return `${Math.floor(diffSeconds / 86400)} days ago`;
  };

  // Function to load ranks from database
  const loadRanks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .order('price', { ascending: true });
      
      if (error) throw error;
      
      // Add image field for component consistency and handle discount expiry
      const ranksWithFormattedImages = data.map(rank => {
        // Convert from Tailwind class to hex gradient if needed
        let startColor = '#000000';
        let endColor = '#ffffff';
        
        if (rank.color && rank.color.includes('from-')) {
          const hexGradient = tailwindToHexGradient(rank.color);
          startColor = hexGradient.startColor;
          endColor = hexGradient.endColor;
        } else if (rank.color && rank.color.includes('#')) {
          // Parse existing hex gradient if it exists
          const parts = rank.color.split(',');
          if (parts.length === 2) {
            startColor = parts[0].trim();
            endColor = parts[1].trim();
          }
        }
        
        return {
          ...rank,
          image: rank.image_url, // Add image field that points to image_url for component use
          discount: rank.discount || 0, // Ensure discount has a default value
          is_discount_active: isDiscountActive(rank.discount, rank.discount_expires_at),
          discount_days_remaining: getDaysRemaining(rank.discount_expires_at),
          startColor, // Add hex colors
          endColor,
          gradientCss: generateGradientCss(startColor, endColor)
        };
      });
      
      setRanks(ranksWithFormattedImages || []);
    } catch (error: any) {
      console.error('Error loading ranks:', error);
      toast.error('Failed to load ranks data');
    } finally {
      setLoading(false);
    }
  };

  // Handle updating a rank
  const handleUpdateRank = async (id: string, updates: Partial<RankOption>) => {
    setSaving(true);
    try {
      // Convert from our component format to database format (image → image_url)
      const dbUpdates = { ...updates };
      if (dbUpdates.image !== undefined) {
        dbUpdates.image_url = dbUpdates.image;
        delete dbUpdates.image;
      }
      
      // Handle gradient colors if they exist
      if (dbUpdates.startColor && dbUpdates.endColor) {
        // Store as a simple comma-separated string
        dbUpdates.color = `${dbUpdates.startColor},${dbUpdates.endColor}`;
        delete dbUpdates.startColor;
        delete dbUpdates.endColor;
        delete dbUpdates.gradientCss;
      }

      const { error } = await supabase
        .from('ranks')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Rank updated successfully');
      await loadRanks(); // Reload data
    } catch (error: any) {
      console.error('Error updating rank:', error);
      toast.error('Failed to update rank');
    } finally {
      setSaving(false);
    }
  };

  // Handle adding a new rank
  const handleAddRank = async () => {
    // Default gradient
    const startColor = '#6b7280'; // gray-500
    const endColor = '#4b5563';   // gray-600
    
    const newRank = {
      name: 'NEW RANK',
      price: 5.00,
      discount: 0,
      color: `${startColor},${endColor}`, // Store as hex values
      image_url: 'https://i.imgur.com/placeholder.png',
      description: 'New rank description'
    };

    setSaving(true);
    try {
      const { error } = await supabase
        .from('ranks')
        .insert([newRank]);
      
      if (error) throw error;
      toast.success('Rank added successfully');
      await loadRanks(); // Reload data
    } catch (error: any) {
      console.error('Error adding rank:', error);
      toast.error('Failed to add rank');
    } finally {
      setSaving(false);
    }
  };

  // Handle deleting a rank
  const handleDeleteRank = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rank?')) return;
    
    try {
      const { error } = await supabase
        .from('ranks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Rank deleted successfully');
      await loadRanks(); // Reload data
    } catch (error: any) {
      console.error('Error deleting rank:', error);
      toast.error('Failed to delete rank');
    }
  };

  // Handle input change for a rank field
  const handleRankChange = (id: string, field: string, value: any) => {
    setRanks(ranks.map(rank => 
      rank.id === id ? { ...rank, [field]: value } : rank
    ));
  };

  // Handle image URL update
  const handleImageUrlUpdate = async (id: string, imageUrl: string) => {
    if (!imageUrl) return;
    
    try {
      await handleUpdateRank(id, { image: imageUrl });
      toast.success('Image URL updated successfully');
    } catch (error: any) {
      console.error('Error updating image URL:', error);
      toast.error('Failed to update image URL');
    }
  };

  // Calculate discounted price
  const getDiscountedPrice = (price: number, discount?: number): string => {
    if (!discount) return price.toFixed(2);
    return ((price * (100 - discount)) / 100).toFixed(2);
  };

  // Format date for display
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'No expiration';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if discount is active
  const isDiscountActive = (discount: number, expiryDate: string | null | undefined): boolean => {
    if (!discount) return false;
    if (!expiryDate) return true; // No expiry means active
    return new Date(expiryDate) > new Date();
  };

  // Get days remaining for a discount
  const getDaysRemaining = (expiryDate: string | null | undefined): number | null => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const now = new Date();
    if (expiry <= now) return 0;
    
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Add a function to apply discounts to all ranks
  const applyDiscountToAllRanks = async () => {
    if (bulkDiscount < 0 || bulkDiscount > 100) {
      toast.error("Discount must be between 0 and 100%");
      return;
    }

    setApplyingBulkDiscount(true);
    try {
      // Call the database function to apply the discount to all ranks
      const { data, error } = await supabase.rpc('rpc_apply_bulk_discount', {
        discount_value: bulkDiscount,
        expires_at: bulkDiscountExpiry
      });
      
      if (error) throw error;
      
      const updatedCount = data || 0;
      toast.success(`Discount of ${bulkDiscount}% applied to ${updatedCount} ranks`);
      await loadRanks(); // Reload all ranks with updated values
    } catch (error: any) {
      console.error('Error applying bulk discount:', error);
      toast.error('Failed to apply discount to all ranks: ' + error.message);
    } finally {
      setApplyingBulkDiscount(false);
    }
  };

  // Apply a gradient preset to a rank
  const applyGradientPreset = (rankId: string, presetId: string) => {
    const preset = gradientPresets.find(p => p.id === presetId);
    if (!preset) return;
    
    setRanks(ranks.map(rank => 
      rank.id === rankId ? {
        ...rank,
        startColor: preset.startColor,
        endColor: preset.endColor,
        gradientCss: generateGradientCss(preset.startColor, preset.endColor)
      } : rank
    ));
    
    // Auto-save the gradient
    handleUpdateRank(rankId, {
      startColor: preset.startColor,
      endColor: preset.endColor
    });
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <h2 className="text-xl text-white font-semibold">Checking authentication...</h2>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
          <div className="text-center mb-6">
            <Lock className="mx-auto text-emerald-500 h-12 w-12 mb-2" />
            <h1 className="text-2xl font-bold text-white">Admin Login</h1>
            <p className="text-gray-400">Sign in to access the admin dashboard</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              {loginLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link to="/" className="inline-flex items-center text-sm text-emerald-400 hover:text-emerald-300">
              <Home size={16} className="mr-1" />
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Champa Admin</h1>
          <div className="flex items-center space-x-4">
            {/* Auto-refresh toggle */}
            <div className="flex items-center mr-2">
              <button
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={`p-2 rounded-full transition-colors relative ${
                  autoRefreshEnabled ? 'text-emerald-400 hover:bg-emerald-900/30' : 'text-gray-400 hover:bg-gray-700'
                }`}
                title={autoRefreshEnabled ? "Auto-refresh is enabled" : "Auto-refresh is disabled"}
              >
                <RefreshCw size={18} className={autoRefreshEnabled ? "animate-spin-slow" : ""} />
              </button>
              <span className="text-xs text-gray-400 ml-1">
                {autoRefreshEnabled 
                  ? `Auto (${Math.floor((new Date().getTime() - lastUpdateTime.getTime()) / 1000)}s ago)` 
                  : 'Auto off'}
              </span>
            </div>
            
            <div className="relative">
              <button 
                onClick={clearNotificationCounter} 
                className="p-2 rounded-full hover:bg-gray-700 transition-colors relative"
                title="Notifications"
              >
                <Bell size={20} />
                {realtimeOrderCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {realtimeOrderCount}
                  </span>
                )}
              </button>
              
              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                  <div className="p-3 border-b border-gray-700">
                    <h3 className="font-medium">Recent Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {realtimeNotifications.length > 0 ? (
                      <div className="divide-y divide-gray-700">
                        {realtimeNotifications.map((notification) => (
                          <div key={notification.id + notification.timestamp} className="p-3 hover:bg-gray-750">
                            <div className="flex items-start">
                              <div className={`p-1.5 rounded-full mr-2 ${
                                notification.type === 'new_order' 
                                  ? 'bg-blue-500/20 text-blue-400' 
                                  : 'bg-green-500/20 text-green-400'
                              }`}>
                                {notification.type === 'new_order' ? <Plus size={14} /> : <RefreshCw size={14} />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(notification.timestamp)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-400 text-sm">
                        No new notifications
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-700">
                    <button 
                      onClick={() => setRealtimeNotifications([])} 
                      className="w-full py-1.5 bg-gray-700 hover:bg-gray-650 rounded text-sm"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => {
                refreshAllData();
                setLastUpdateTime(new Date());
                toast.success('Data refreshed');
              }} 
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={20} />
            </button>
            <Link 
              to="/"
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              title="Go to Store"
            >
              <Home size={20} />
            </Link>
            <button 
              onClick={handleLogout} 
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto p-4">
        {/* Dashboard Stats */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Dashboard</h2>
          
          {loadingStats ? (
            <div className="h-24 flex items-center justify-center">
              <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {orderStats && (
                <>
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-400 font-medium">Total Orders</h3>
                      <div className="p-2 bg-blue-500/20 rounded-full text-blue-400">
                        <Shield size={20} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{orderStats.total_orders || 0}</p>
                    <div className="flex mt-2 text-xs text-gray-400">
                      <span className="mr-2">Latest:</span>
                      <span>{orderStats.latest_order_date ? new Date(orderStats.latest_order_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-400 font-medium">Pending Orders</h3>
                      <div className="p-2 bg-yellow-500/20 rounded-full text-yellow-400">
                        <RefreshCw size={20} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{orderStats.pending_orders || 0}</p>
                    <div className="flex mt-2 text-xs">
                      <span className="text-emerald-400">{orderStats.completed_orders || 0} completed</span>
                      <span className="mx-1">•</span>
                      <span className="text-red-400">{orderStats.rejected_orders || 0} rejected</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-400 font-medium">Revenue</h3>
                      <div className="p-2 bg-emerald-500/20 rounded-full text-emerald-400">
                        <DollarSign size={20} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold">${parseFloat(orderStats.total_revenue || 0).toFixed(2)}</p>
                    <div className="flex mt-2 text-xs text-gray-400">
                      <span>From completed orders</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-400 font-medium">Available Ranks</h3>
                      <div className="p-2 bg-purple-500/20 rounded-full text-purple-400">
                        <Tag size={20} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{ranks.length}</p>
                    <div className="flex mt-2 text-xs">
                      {ranks.some(r => r.discount > 0) ? (
                        <span className="text-emerald-400">{ranks.filter(r => r.discount > 0).length} with discounts</span>
                      ) : (
                        <span className="text-gray-400">No active discounts</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <div className="flex space-x-4 overflow-x-auto pb-1">
            <button 
              onClick={() => setActiveTab('ranks')} 
              className={`py-3 px-4 flex items-center space-x-2 border-b-2 ${
                activeTab === 'ranks' 
                  ? 'border-emerald-500 text-emerald-400' 
                  : 'border-transparent hover:border-gray-600'
              } transition-colors`}
            >
              <Shield size={18} />
              <span>Ranks & Prices</span>
            </button>
            <button 
              onClick={() => setActiveTab('images')} 
              className={`py-3 px-4 flex items-center space-x-2 border-b-2 ${
                activeTab === 'images' 
                  ? 'border-emerald-500 text-emerald-400' 
                  : 'border-transparent hover:border-gray-600'
              } transition-colors`}
            >
              <Image size={18} />
              <span>Images</span>
            </button>
            <button 
              onClick={() => setActiveTab('discounts')} 
              className={`py-3 px-4 flex items-center space-x-2 border-b-2 ${
                activeTab === 'discounts' 
                  ? 'border-emerald-500 text-emerald-400' 
                  : 'border-transparent hover:border-gray-600'
              } transition-colors`}
            >
              <PercentIcon size={18} />
              <span>Discounts</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`py-3 px-4 flex items-center space-x-2 border-b-2 ${
                activeTab === 'settings' 
                  ? 'border-emerald-500 text-emerald-400' 
                  : 'border-transparent hover:border-gray-600'
              } transition-colors`}
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </div>
        </div>
        
        {/* Content area */}
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p>Loading data...</p>
            </div>
          ) : (
            <>
              {/* Ranks & Prices Tab */}
              {activeTab === 'ranks' && (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="p-3 text-left">Rank</th>
                        <th className="p-3 text-left">Price ($)</th>
                        <th className="p-3 text-left">Gradient</th>
                        <th className="p-3 text-left">Description</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {ranks.map(rank => (
                        <tr key={rank.id} className="hover:bg-gray-750">
                          <td className="p-3">
                            <input
                              type="text"
                              value={rank.name}
                              onChange={(e) => handleRankChange(rank.id, 'name', e.target.value)}
                              className="bg-gray-900 border border-gray-600 rounded p-1 w-full"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={rank.price}
                              onChange={(e) => handleRankChange(rank.id, 'price', parseFloat(e.target.value))}
                              className="bg-gray-900 border border-gray-600 rounded p-1 w-full"
                            />
                            {rank.discount > 0 && (
                              <div className="mt-1 text-xs text-emerald-400">
                                Discount: {rank.discount}% (${getDiscountedPrice(rank.price, rank.discount)})
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={rank.startColor || '#000000'}
                                  onChange={(e) => handleRankChange(rank.id, 'startColor', e.target.value)}
                                  className="w-10 h-6 rounded cursor-pointer"
                                  title="Start color"
                                />
                                <input
                                  type="color"
                                  value={rank.endColor || '#ffffff'}
                                  onChange={(e) => handleRankChange(rank.id, 'endColor', e.target.value)}
                                  className="w-10 h-6 rounded cursor-pointer"
                                  title="End color"
                                />
                                <select
                                  className="bg-gray-800 border border-gray-600 rounded text-sm flex-1"
                                  onChange={(e) => applyGradientPreset(rank.id, e.target.value)}
                                  value={selectedGradient || ''}
                                >
                                  <option value="">Select preset</option>
                                  {gradientPresets.map(preset => (
                                    <option key={preset.id} value={preset.id}>{preset.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div 
                                className="h-6 w-full rounded"
                                style={{ background: rank.gradientCss || `linear-gradient(to right, ${rank.startColor || '#000'}, ${rank.endColor || '#fff'})` }}
                              ></div>
                            </div>
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={rank.description}
                              onChange={(e) => handleRankChange(rank.id, 'description', e.target.value)}
                              className="bg-gray-900 border border-gray-600 rounded p-1 w-full"
                            />
                          </td>
                          <td className="p-3 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleUpdateRank(rank.id, {
                                name: rank.name,
                                price: rank.price,
                                startColor: rank.startColor,
                                endColor: rank.endColor,
                                description: rank.description,
                                discount: rank.discount
                              })}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                              disabled={saving}
                            >
                              <Save size={14} className="inline mr-1" />
                              Save
                            </button>
                            <button
                              onClick={() => handleDeleteRank(rank.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                            >
                              <Trash size={14} className="inline mr-1" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Presets section */}
                  <div className="p-4 border-t border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <Palette size={18} className="text-blue-400 mr-2" />
                        Gradient Presets
                      </h3>
                      <button
                        onClick={loadGradientPresets}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center"
                        disabled={loadingGradients}
                      >
                        <RefreshCw size={14} className={`mr-1 ${loadingGradients ? 'animate-spin' : ''}`} />
                        Refresh Presets
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
                      {loadingGradients ? (
                        <div className="col-span-full h-20 flex items-center justify-center">
                          <RefreshCw size={20} className="animate-spin mr-2" />
                          <span>Loading gradient presets...</span>
                        </div>
                      ) : (
                        gradientPresets.map(preset => (
                          <div 
                            key={preset.id} 
                            className="h-20 rounded-lg p-2 flex flex-col justify-between border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
                            onClick={() => setSelectedGradient(preset.id)}
                            style={{ background: preset.preview }}
                          >
                            <span className="text-xs font-medium bg-black/50 px-2 py-1 rounded self-start">
                              {preset.name}
                            </span>
                            <div className="flex justify-end">
                              <span className="text-[10px] bg-black/50 px-1 py-0.5 rounded">
                                {preset.startColor} → {preset.endColor}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <button
                        onClick={handleAddRank}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded transition-colors flex items-center"
                        disabled={saving}
                      >
                        <Plus size={16} className="mr-2" />
                        Add New Rank
                      </button>
                      
                      <p className="text-sm text-gray-400">
                        {autoRefreshEnabled ? (
                          <span className="flex items-center">
                            <RefreshCw size={14} className="animate-spin-slow mr-1" />
                            Auto-refresh enabled. Last update: {lastUpdateTime.toLocaleTimeString()}
                          </span>
                        ) : (
                          <span>Real-time updates paused</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Images Tab */}
              {activeTab === 'images' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {ranks.map(rank => (
                    <div key={rank.id} className="bg-gray-700 rounded-lg overflow-hidden shadow-md">
                      <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-700">
                        <h3 className="font-bold text-lg">{rank.name}</h3>
                      </div>
                      
                      <div className="p-4">
                        <div className="aspect-square mb-4 border border-gray-600 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                          {rank.image_url || rank.image ? (
                            <img 
                              src={rank.image_url || rank.image} 
                              alt={rank.name} 
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src = '/assets/placeholder-rank.png';
                                e.currentTarget.onerror = null; // Prevent infinite loop
                              }}
                            />
                          ) : (
                            <div className="text-gray-500">No image</div>
                          )}
                        </div>
                        
                        <div className="mt-4">
                          <label htmlFor={`image-url-${rank.id}`} className="block text-sm font-medium text-gray-400">
                            Image URL
                          </label>
                          <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                              type="text"
                              id={`image-url-${rank.id}`}
                              value={rank.image_url || rank.image || ''}
                              onChange={(e) => handleRankChange(rank.id, 'image_url', e.target.value)}
                              placeholder="Enter image URL (e.g., https://i.imgur.com/example.png)"
                              className="flex-grow min-w-0 bg-gray-800 border border-gray-600 rounded-l-md p-2 text-sm"
                            />
                            <button
                              onClick={() => handleImageUrlUpdate(rank.id, rank.image_url || rank.image || '')}
                              className="p-2 bg-blue-600 rounded-r-md hover:bg-blue-700 transition-colors"
                            >
                              <Save size={16} />
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-gray-400">
                            Use direct links to images (e.g., Imgur URLs)
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Discounts Tab */}
              {activeTab === 'discounts' && (
                <div className="overflow-x-auto">
                  <div className="p-4 bg-gray-750 border-b border-gray-700">
                    <h2 className="text-lg font-semibold flex items-center">
                      <PercentIcon size={18} className="text-emerald-400 mr-2" />
                      Manage Discounts
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Set discount percentages and expiration dates for each rank. Discounts will be applied automatically on the store.
                    </p>
                  </div>
                  
                  {/* Add bulk discount manager */}
                  <div className="p-4 mb-2 bg-gray-800 border-b border-gray-700">
                    <h3 className="text-md font-semibold flex items-center mb-3">
                      <Tag size={16} className="text-blue-400 mr-2" />
                      Bulk Discount Management
                    </h3>
                    
                    <div className="bg-gray-750 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-3">
                        Apply the same discount to all ranks at once. This will override any existing discounts.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">
                            Discount Percentage (0-100%)
                          </label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={bulkDiscount}
                              onChange={(e) => setBulkDiscount(Math.min(Math.max(0, parseInt(e.target.value) || 0), 100))}
                              className="bg-gray-800 border border-gray-600 rounded-l p-2 w-full"
                            />
                            <div className="bg-gray-700 px-2 py-2 rounded-r border-t border-r border-b border-gray-600">
                              %
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-400 mb-1 flex items-center">
                            <Calendar size={14} className="mr-1" />
                            Expiration Date (optional)
                          </label>
                          <div className="flex">
                            <input
                              type="datetime-local"
                              value={bulkDiscountExpiry ? new Date(bulkDiscountExpiry).toISOString().slice(0, 16) : ''}
                              onChange={(e) => setBulkDiscountExpiry(e.target.value ? new Date(e.target.value).toISOString() : null)}
                              className="bg-gray-800 border border-gray-600 rounded-l p-2 w-full"
                            />
                            <button 
                              type="button"
                              onClick={() => setBulkDiscountExpiry(null)}
                              className="bg-gray-700 px-2 py-2 rounded-r border-t border-r border-b border-gray-600 text-xs"
                              title="Remove expiration date"
                            >
                              ∞
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {bulkDiscountExpiry 
                              ? `Expires: ${formatDate(bulkDiscountExpiry)}` 
                              : 'No expiration date (discount never expires)'}
                          </p>
                        </div>
                        
                        <div className="flex items-end">
                          <button
                            onClick={applyDiscountToAllRanks}
                            disabled={applyingBulkDiscount}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-center transition-colors flex items-center justify-center"
                          >
                            {applyingBulkDiscount ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                Applying...
                              </>
                            ) : (
                              <>
                                <Check size={14} className="mr-1" />
                                Apply to All Ranks
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center">
                        <div className="flex-1 h-px bg-gray-700"></div>
                        <p className="px-2 text-sm text-gray-500">PREVIEW</p>
                        <div className="flex-1 h-px bg-gray-700"></div>
                      </div>
                      
                      <div className="mt-3 bg-gray-800/60 p-3 rounded border border-gray-700 text-sm text-gray-300">
                        <h4 className="font-medium mb-2 flex items-center">
                          <Info size={14} className="mr-1 text-blue-400" />
                          What will happen
                        </h4>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          {bulkDiscount > 0 ? (
                            <div className="px-2 py-1 bg-emerald-700/30 text-emerald-400 rounded-full text-xs">
                              {bulkDiscount}% discount on all {ranks.length} ranks
                            </div>
                          ) : (
                            <div className="px-2 py-1 bg-red-700/30 text-red-400 rounded-full text-xs">
                              Removing all discounts
                            </div>
                          )}
                          
                          {bulkDiscountExpiry ? (
                            <div className="px-2 py-1 bg-blue-700/30 text-blue-400 rounded-full text-xs flex items-center">
                              <Clock size={10} className="mr-1" />
                              Expires on {formatDate(bulkDiscountExpiry)}
                            </div>
                          ) : (
                            <div className="px-2 py-1 bg-purple-700/30 text-purple-400 rounded-full text-xs">
                              No expiration date
                            </div>
                          )}
                        </div>
                        
                        {bulkDiscount > 0 && (
                          <div className="text-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {ranks.slice(0, 3).map(rank => (
                              <div key={rank.id} className="bg-gray-750 p-2 rounded flex items-center justify-between">
                                <span>{rank.name}</span>
                                <div>
                                  <span className="line-through text-gray-500">${rank.price.toFixed(2)}</span>
                                  <span className="ml-2 text-emerald-400">${getDiscountedPrice(rank.price, bulkDiscount)}</span>
                                </div>
                              </div>
                            ))}
                            {ranks.length > 3 && (
                              <div className="bg-gray-750 p-2 rounded text-center text-gray-400">
                                +{ranks.length - 3} more ranks
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 flex items-center">
                        <div className="flex-1 h-px bg-gray-700"></div>
                        <p className="px-2 text-sm text-gray-500">QUICK PRESETS</p>
                        <div className="flex-1 h-px bg-gray-700"></div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
                        <button
                          onClick={() => {
                            setBulkDiscount(10);
                            setBulkDiscountExpiry(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
                          }}
                          className="bg-gray-700 py-1 px-2 rounded text-sm hover:bg-gray-650"
                        >
                          10% off (1 week)
                        </button>
                        <button
                          onClick={() => {
                            setBulkDiscount(20);
                            setBulkDiscountExpiry(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString());
                          }}
                          className="bg-gray-700 py-1 px-2 rounded text-sm hover:bg-gray-650"
                        >
                          20% off (3 days)
                        </button>
                        <button
                          onClick={() => {
                            setBulkDiscount(25);
                            setBulkDiscountExpiry(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
                          }}
                          className="bg-gray-700 py-1 px-2 rounded text-sm hover:bg-gray-650"
                        >
                          25% off (24 hours)
                        </button>
                        <button
                          onClick={() => {
                            setBulkDiscount(0);
                            setBulkDiscountExpiry(null);
                          }}
                          className="bg-red-700/50 py-1 px-2 rounded text-sm hover:bg-red-700/70"
                        >
                          Remove All Discounts
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ranks.map(rank => (
                        <div key={rank.id} className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center mb-3">
                            <div 
                              className={`w-8 h-8 rounded-full mr-2 flex items-center justify-center bg-gradient-to-r ${rank.color}`}
                            >
                              {rank.is_discount_active && <PercentIcon size={16} />}
                            </div>
                            <h3 className="font-medium">{rank.name}</h3>
                            {rank.is_discount_active && (
                              <div className="ml-auto bg-emerald-700/30 text-emerald-400 text-xs px-2 py-1 rounded-full flex items-center">
                                <Clock size={12} className="mr-1" />
                                {rank.discount_days_remaining === null 
                                  ? 'No Expiry' 
                                  : `${rank.discount_days_remaining} day${rank.discount_days_remaining !== 1 ? 's' : ''} left`
                                }
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center mb-3">
                            <span className="text-gray-400 mr-2">Original price:</span>
                            <span className="font-semibold">${rank.price.toFixed(2)}</span>
                          </div>
                          
                          <div className="mb-3">
                            <label htmlFor={`discount-${rank.id}`} className="block text-sm text-gray-400 mb-1">
                              Discount Percentage (0-100%)
                            </label>
                            <div className="flex items-center">
                              <input
                                id={`discount-${rank.id}`}
                                type="number"
                                min="0"
                                max="100"
                                value={rank.discount || 0}
                                onChange={(e) => handleRankChange(rank.id, 'discount', 
                                  Math.min(Math.max(0, parseInt(e.target.value) || 0), 100)
                                )}
                                className="bg-gray-800 border border-gray-600 rounded-l p-2 w-full"
                              />
                              <div className="bg-gray-700 px-2 py-2 rounded-r border-t border-r border-b border-gray-600">
                                %
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <label htmlFor={`expiry-${rank.id}`} className="block text-sm text-gray-400 mb-1 flex items-center">
                              <Calendar size={14} className="mr-1" />
                              Discount Expiration Date
                            </label>
                            <div className="flex">
                              <input
                                id={`expiry-${rank.id}`}
                                type="datetime-local"
                                value={rank.discount_expires_at ? new Date(rank.discount_expires_at).toISOString().slice(0, 16) : ''}
                                onChange={(e) => handleRankChange(rank.id, 'discount_expires_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                                className="bg-gray-800 border border-gray-600 rounded-l p-2 w-full"
                              />
                              <button 
                                type="button"
                                onClick={() => handleRankChange(rank.id, 'discount_expires_at', null)}
                                className="bg-gray-700 px-2 py-2 rounded-r border-t border-r border-b border-gray-600 text-xs"
                                title="Remove expiration date"
                              >
                                ∞
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {rank.discount_expires_at 
                                ? `Expires: ${formatDate(rank.discount_expires_at)}` 
                                : 'No expiration date (discount never expires)'}
                            </p>
                          </div>
                          
                          {rank.is_discount_active && rank.discount > 0 && (
                            <div className="mb-3 bg-emerald-900/20 border border-emerald-800 rounded p-2 flex items-center justify-between">
                              <div>
                                <div className="text-sm text-emerald-400">Discounted price:</div>
                                <div className="font-bold text-lg">${getDiscountedPrice(rank.price, rank.discount)}</div>
                              </div>
                              <div className="bg-emerald-700 text-white text-sm font-bold rounded-full px-2 py-1">
                                SAVE {rank.discount}%
                              </div>
                            </div>
                          )}
                          
                          {rank.discount > 0 && !rank.is_discount_active && (
                            <div className="mb-3 bg-red-900/20 border border-red-800 rounded p-2">
                              <div className="text-sm text-red-400">Discount expired</div>
                              <p className="text-xs text-gray-400 mt-1">
                                This discount is not active because it expired on {formatDate(rank.discount_expires_at)}
                              </p>
                            </div>
                          )}
                          
                          <button
                            onClick={() => handleUpdateRank(rank.id, {
                              discount: rank.discount || 0,
                              discount_expires_at: rank.discount_expires_at
                            })}
                            className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 rounded text-center transition-colors"
                            disabled={saving}
                          >
                            <Save size={14} className="inline mr-1" />
                            Save Discount
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <CreditCard size={18} className="text-blue-400 mr-2" />
                      Payment Details
                    </h2>
                    
                    <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                      <p className="text-sm text-gray-400 mb-4">
                        Configure the payment QR code image shown to customers during checkout. This should be a direct link to an image of your payment QR code.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Payment QR Code Image URL
                          </label>
                          <div className="flex">
                            <input
                              type="text"
                              value={paymentImageUrl}
                              onChange={(e) => setPaymentImageUrl(e.target.value)}
                              placeholder="https://example.com/qrcode.png"
                              className="flex-1 bg-gray-800 border border-gray-600 rounded-l p-2 text-sm"
                            />
                            <button
                              onClick={savePaymentImage}
                              disabled={savingPaymentImage}
                              className="p-2 bg-blue-600 rounded-r hover:bg-blue-700 transition-colors flex items-center"
                            >
                              {savingPaymentImage ? (
                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                              ) : (
                                <>
                                  <Save size={16} />
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Use a direct image URL. The image will be displayed to customers during checkout.
                          </p>
                          
                          <div className="mt-4 flex items-center gap-2">
                            <button
                              onClick={savePaymentImage}
                              disabled={savingPaymentImage}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center"
                            >
                              <Save size={16} className="mr-2" />
                              Save Image
                            </button>
                            <a
                              href={paymentImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-gray-700 hover:bg-gray-650 rounded transition-colors flex items-center"
                            >
                              <Eye size={16} className="mr-2" />
                              View Image
                            </a>
                          </div>
                        </div>
                        
                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          <h4 className="text-sm font-medium mb-2 text-gray-400">Preview</h4>
                          <div className="aspect-square max-h-60 border border-gray-600 rounded overflow-hidden flex items-center justify-center bg-white">
                            {paymentImageUrl ? (
                              <img 
                                src={paymentImageUrl} 
                                alt="Payment QR" 
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://placehold.co/400x400/gray/white?text=Invalid+Image';
                                }}
                              />
                            ) : (
                              <div className="text-gray-500 text-center p-4">
                                <Upload className="mx-auto mb-2 h-10 w-10" />
                                <p>No payment QR image set</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="bg-blue-900/20 border border-blue-800 rounded p-3 mt-3">
                            <p className="text-xs text-blue-400">
                              <span className="font-medium">Real-time Updates:</span> When you update this image, it will be instantly available to all customers. Any open checkout pages will show the new QR code.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin; 