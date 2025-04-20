import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RankOption } from '../types';
import { Shield, DollarSign, Image, Save, Trash, RefreshCw, Plus, LogOut, Home, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

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

  // Check authentication status on component mount
  useEffect(() => {
    checkAuth();
  }, []);

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

  // Function to load ranks from database
  const loadRanks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .order('price', { ascending: true });
      
      if (error) throw error;
      
      // Add image field for component consistency
      const ranksWithFormattedImages = data.map(rank => ({
        ...rank,
        image: rank.image_url // Add image field that points to image_url for component use
      }));
      
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
    const newRank = {
      name: 'NEW RANK',
      price: 5.00,
      color: 'from-gray-500 to-gray-600',
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
            <button 
              onClick={loadRanks} 
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
        {/* Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <div className="flex space-x-4">
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
                        <th className="p-3 text-left">Color</th>
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
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={rank.color}
                              onChange={(e) => handleRankChange(rank.id, 'color', e.target.value)}
                              className="bg-gray-900 border border-gray-600 rounded p-1 w-full"
                            />
                            <div className={`h-2 w-full rounded mt-1 bg-gradient-to-r ${rank.color}`}></div>
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
                                color: rank.color,
                                description: rank.description
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
                  
                  <div className="p-4 border-t border-gray-700">
                    <button
                      onClick={handleAddRank}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded transition-colors flex items-center"
                      disabled={saving}
                    >
                      <Plus size={16} className="mr-2" />
                      Add New Rank
                    </button>
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
                                e.currentTarget.src = 'https://i.imgur.com/placeholder.png';
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
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin; 