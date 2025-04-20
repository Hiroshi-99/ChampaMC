import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Save, Plus, X, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { RankOption } from '../../types';

interface ExtendedRankOption extends RankOption {
  id: string;
  description?: string;
  discount?: number;
  isNew?: boolean;
  isEditing?: boolean;
}

export default function RankManager() {
  const [ranks, setRanks] = useState<ExtendedRankOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch ranks from the database
  useEffect(() => {
    const fetchRanks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('ranks')
          .select('*')
          .order('price', { ascending: true });

        if (error) throw error;

        setRanks(data || []);
      } catch (err: any) {
        console.error('Error fetching ranks:', err);
        setError('Failed to load ranks. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRanks();
  }, []);

  // Handle adding a new rank
  const handleAddRank = () => {
    const newRank: ExtendedRankOption = {
      id: 'new-' + Date.now(),
      name: '',
      price: 0,
      color: 'from-gray-500 to-gray-600',
      image: '',
      description: '',
      discount: 0,
      isNew: true,
      isEditing: true
    };

    setRanks([...ranks, newRank]);
  };

  // Handle editing a rank
  const handleEditRank = (id: string) => {
    setRanks(ranks.map(rank => 
      rank.id === id ? { ...rank, isEditing: true } : rank
    ));
  };

  // Handle canceling edit
  const handleCancelEdit = (id: string) => {
    setRanks(ranks.filter(rank => {
      // If it's a new rank, remove it completely
      if (rank.id === id && rank.isNew) {
        return false;
      }
      // Otherwise just cancel the edit mode
      return rank.id === id ? { ...rank, isEditing: false } : true;
    }));
  };

  // Handle saving a rank
  const handleSaveRank = async (id: string) => {
    try {
      setError(null);
      setSuccess(null);
      
      const rankToSave = ranks.find(r => r.id === id);
      if (!rankToSave) return;
      
      // Validate required fields
      if (!rankToSave.name || !rankToSave.image || rankToSave.price < 0) {
        setError('Please fill all required fields with valid values.');
        return;
      }
      
      const { isNew, isEditing, ...rankData } = rankToSave;
      
      let result;
      
      if (isNew) {
        // Insert new rank
        const { id, ...newRankData } = rankData; // Remove the temp id
        result = await supabase.from('ranks').insert(newRankData);
      } else {
        // Update existing rank
        result = await supabase
          .from('ranks')
          .update(rankData)
          .eq('id', id);
      }
      
      if (result.error) throw result.error;
      
      // Refresh ranks after update
      const { data: updatedRanks, error: fetchError } = await supabase
        .from('ranks')
        .select('*')
        .order('price', { ascending: true });
        
      if (fetchError) throw fetchError;
      
      setRanks(updatedRanks || []);
      setSuccess(isNew ? 'Rank added successfully.' : 'Rank updated successfully.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving rank:', err);
      setError(err.message || 'Failed to save rank. Please try again.');
    }
  };

  // Handle deleting a rank
  const handleDeleteRank = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rank? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError(null);
      
      // If it's a new unsaved rank, just remove it from the state
      if (id.startsWith('new-')) {
        setRanks(ranks.filter(r => r.id !== id));
        return;
      }
      
      // Delete from database
      const { error } = await supabase
        .from('ranks')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update state
      setRanks(ranks.filter(r => r.id !== id));
      setSuccess('Rank deleted successfully.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting rank:', err);
      setError(err.message || 'Failed to delete rank. Please try again.');
    }
  };

  // Handle field change
  const handleFieldChange = (id: string, field: keyof ExtendedRankOption, value: any) => {
    setRanks(ranks.map(rank => 
      rank.id === id ? { ...rank, [field]: value } : rank
    ));
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-white">Loading ranks...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Manage Ranks</h2>
        <button
          onClick={handleAddRank}
          className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition duration-200"
        >
          <Plus size={16} />
          <span>Add Rank</span>
        </button>
      </div>

      {/* Error and success messages */}
      {error && (
        <div className="bg-red-500/20 p-3 rounded-md border border-red-500/50 mb-4 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-500" />
          <p className="text-white text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/20 p-3 rounded-md border border-green-500/50 mb-4 flex items-center gap-2">
          <Check size={16} className="text-green-500" />
          <p className="text-white text-sm">{success}</p>
        </div>
      )}

      {/* Ranks table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Discount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {ranks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No ranks found. Click "Add Rank" to create one.
                </td>
              </tr>
            ) : (
              ranks.map((rank) => (
                <tr key={rank.id} className={`${rank.isEditing ? 'bg-gray-700/30' : ''}`}>
                  <td className="px-4 py-3">
                    {rank.isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={rank.name}
                          onChange={e => handleFieldChange(rank.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-emerald-500"
                          placeholder="Rank name"
                        />
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Color (gradient)</label>
                          <input
                            type="text"
                            value={rank.color}
                            onChange={e => handleFieldChange(rank.id, 'color', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-emerald-500"
                            placeholder="from-color-500 to-color-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Description</label>
                          <textarea
                            value={rank.description || ''}
                            onChange={e => handleFieldChange(rank.id, 'description', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-emerald-500"
                            placeholder="Rank description"
                            rows={2}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium text-white">{rank.name}</div>
                        <div className="text-xs text-gray-400">{rank.description}</div>
                        <div className={`h-2 w-12 my-1 rounded bg-gradient-to-r ${rank.color}`}></div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {rank.isEditing ? (
                      <input
                        type="number"
                        value={rank.price}
                        onChange={e => handleFieldChange(rank.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-emerald-500"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <div className="font-medium text-white">${rank.price.toFixed(2)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {rank.isEditing ? (
                      <input
                        type="number"
                        value={rank.discount || 0}
                        onChange={e => handleFieldChange(rank.id, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-emerald-500"
                        min="0"
                        max="100"
                        step="1"
                      />
                    ) : (
                      <div className="font-medium text-white">
                        {rank.discount ? `${rank.discount}%` : 'None'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {rank.isEditing ? (
                      <input
                        type="text"
                        value={rank.image}
                        onChange={e => handleFieldChange(rank.id, 'image', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-emerald-500"
                        placeholder="Image URL"
                      />
                    ) : (
                      <div className="flex items-center">
                        <img src={rank.image} alt={rank.name} className="w-10 h-10 object-contain mr-2" />
                        <a 
                          href={rank.image} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-emerald-400 text-xs truncate hover:underline"
                        >
                          View
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {rank.isEditing ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSaveRank(rank.id)}
                          className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          title="Save"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={() => handleCancelEdit(rank.id)}
                          className="p-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditRank(rank.id)}
                          className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteRank(rank.id)}
                          className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 