import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RankOption, Order } from '../types';
import { RankManager, OrderManager, ImageManager } from '../components/admin';

// Admin dashboard tabs
type AdminTab = 'ranks' | 'orders' | 'images';

export default function Admin() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('ranks');
  const navigate = useNavigate();

  // Check if the current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/');
          return;
        }

        // Check if user is in admins table
        const { data: adminData, error } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error || !adminData) {
          navigate('/');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [navigate]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl text-white font-semibold">Checking admin access...</h2>
        </div>
      </div>
    );
  }

  // Render not authorized state (should not reach here because of the redirect, but just in case)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500/20 p-6 rounded-lg border border-red-500/50 mb-4 max-w-md mx-auto">
            <h2 className="text-xl text-white font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-300">You don't have permission to access this page.</p>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition duration-200"
          >
            Return to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="p-4 sm:p-6 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-3">
          <img 
            src="/favicon/favicon-32x32.png" 
            alt="Champa Logo" 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-emerald-500"
          />
          <h1 className="text-white text-xl sm:text-2xl font-bold tracking-wider">CHAMPA ADMIN</h1>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="px-3 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition duration-200"
        >
          Back to Store
        </button>
      </header>

      {/* Tab Navigation */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex overflow-x-auto scrollbar-hide">
          <TabButton 
            label="Ranks" 
            isActive={activeTab === 'ranks'} 
            onClick={() => setActiveTab('ranks')} 
          />
          <TabButton 
            label="Orders" 
            isActive={activeTab === 'orders'} 
            onClick={() => setActiveTab('orders')} 
          />
          <TabButton 
            label="Images" 
            isActive={activeTab === 'images'} 
            onClick={() => setActiveTab('images')} 
          />
        </div>
      </div>

      {/* Content Area */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto bg-gray-800/50 rounded-lg p-4 sm:p-6">
          {activeTab === 'ranks' && <RankManager />}
          {activeTab === 'orders' && <OrderManager />}
          {activeTab === 'images' && <ImageManager />}
        </div>
      </main>
    </div>
  );
}

// Tab button component
function TabButton({ 
  label, 
  isActive, 
  onClick 
}: { 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 mr-1 whitespace-nowrap rounded-md font-medium transition duration-200 ${
        isActive 
          ? 'bg-emerald-600 text-white' 
          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
} 