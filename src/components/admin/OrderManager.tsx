import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Clock, CheckCircle, XCircle, Eye, ArrowUpDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Order } from '../../types';

type OrderStatus = 'pending' | 'completed' | 'rejected';
type SortField = 'created_at' | 'username' | 'platform' | 'rank' | 'price' | 'status';
type SortDirection = 'asc' | 'desc';

interface ExtendedOrder extends Order {
  id: string;
  notes?: string;
  processed_at?: string;
  processed_by?: string;
}

export default function OrderManager() {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewingOrder, setViewingOrder] = useState<ExtendedOrder | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');

  // Fetch orders from the database
  useEffect(() => {
    fetchOrders();
  }, [sortField, sortDirection, selectedStatus]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('orders')
        .select('*');
      
      // Apply status filter
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }
      
      // Apply sorting
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
      
      const { data, error } = await query;

      if (error) throw error;

      setOrders(data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle viewing order details
  const handleViewOrder = (order: ExtendedOrder) => {
    setViewingOrder(order);
  };

  // Handle closing order details modal
  const handleCloseOrderView = () => {
    setViewingOrder(null);
  };

  // Handle updating order status
  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    try {
      setError(null);
      setSuccess(null);
      
      // Get the current user ID before making the update
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          processed_at: new Date().toISOString(),
          processed_by: userId
        })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update the order in the local state
      setOrders(orders.map(order => 
        order.id === id 
          ? { 
              ...order, 
              status, 
              processed_at: new Date().toISOString(),
              processed_by: userId
            } 
          : order
      ));
      
      // If we're viewing the order details, update that too
      if (viewingOrder && viewingOrder.id === id) {
        setViewingOrder({
          ...viewingOrder,
          status,
          processed_at: new Date().toISOString(),
          processed_by: userId
        });
      }
      
      setSuccess(`Order status updated to ${status}.`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.message || 'Failed to update order status. Please try again.');
    }
  };

  // Handle adding notes to an order
  const handleAddNotes = async (id: string, notes: string) => {
    try {
      setError(null);
      setSuccess(null);
      
      const { error } = await supabase
        .from('orders')
        .update({ notes })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update the order in the local state
      setOrders(orders.map(order => 
        order.id === id ? { ...order, notes } : order
      ));
      
      // If we're viewing the order details, update that too
      if (viewingOrder && viewingOrder.id === id) {
        setViewingOrder({ ...viewingOrder, notes });
      }
      
      setSuccess('Order notes updated.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating order notes:', err);
      setError(err.message || 'Failed to update order notes. Please try again.');
    }
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon 
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="opacity-30" />;
    return sortDirection === 'asc' 
      ? <ArrowUpDown size={14} className="text-emerald-400" /> 
      : <ArrowUpDown size={14} className="text-emerald-400 rotate-180" />;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-white">Loading orders...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Manage Orders</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1 rounded-md transition ${
              selectedStatus === 'all' 
                ? 'bg-gray-700 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedStatus('pending')}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1 ${
              selectedStatus === 'pending' 
                ? 'bg-yellow-500/30 text-yellow-100' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Clock size={14} />
            <span>Pending</span>
          </button>
          <button
            onClick={() => setSelectedStatus('completed')}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1 ${
              selectedStatus === 'completed' 
                ? 'bg-green-500/30 text-green-100' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <CheckCircle size={14} />
            <span>Completed</span>
          </button>
          <button
            onClick={() => setSelectedStatus('rejected')}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1 ${
              selectedStatus === 'rejected' 
                ? 'bg-red-500/30 text-red-100' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <XCircle size={14} />
            <span>Rejected</span>
          </button>
        </div>
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

      {/* Orders table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900/50">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  {getSortIcon('created_at')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('username')}
              >
                <div className="flex items-center gap-1">
                  <span>Username</span>
                  {getSortIcon('username')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('platform')}
              >
                <div className="flex items-center gap-1">
                  <span>Platform</span>
                  {getSortIcon('platform')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('rank')}
              >
                <div className="flex items-center gap-1">
                  <span>Rank</span>
                  {getSortIcon('rank')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center gap-1">
                  <span>Price</span>
                  {getSortIcon('price')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-white">{formatDate(order.created_at)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-white">{order.username}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-white capitalize">{order.platform}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-white">{order.rank}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-white">${parseFloat(order.price.toString()).toFixed(2)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {order.status === 'pending' && <Clock size={12} className="mr-1" />}
                      {order.status === 'completed' && <CheckCircle size={12} className="mr-1" />}
                      {order.status === 'rejected' && <XCircle size={12} className="mr-1" />}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'rejected')}
                            className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-white">Order Details</h3>
                <button
                  onClick={handleCloseOrderView}
                  className="p-1 hover:bg-gray-700 rounded-full"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Order ID</p>
                    <p className="text-white">{viewingOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Date</p>
                    <p className="text-white">{formatDate(viewingOrder.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Minecraft Username</p>
                    <p className="text-white font-medium">{viewingOrder.username}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Platform</p>
                    <p className="text-white capitalize">{viewingOrder.platform}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Rank</p>
                    <p className="text-white">{viewingOrder.rank}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Price</p>
                    <p className="text-white font-medium">${parseFloat(viewingOrder.price.toString()).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      viewingOrder.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : viewingOrder.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingOrder.status === 'pending' && <Clock size={12} className="mr-1" />}
                      {viewingOrder.status === 'completed' && <CheckCircle size={12} className="mr-1" />}
                      {viewingOrder.status === 'rejected' && <XCircle size={12} className="mr-1" />}
                      {viewingOrder.status.charAt(0).toUpperCase() + viewingOrder.status.slice(1)}
                    </span>
                  </div>
                  {viewingOrder.processed_at && (
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Processed At</p>
                      <p className="text-white">{formatDate(viewingOrder.processed_at)}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-1">Payment Proof</p>
                  <div className="mt-2">
                    <a 
                      href={viewingOrder.payment_proof} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block rounded-lg overflow-hidden border border-gray-700"
                    >
                      <img 
                        src={viewingOrder.payment_proof} 
                        alt="Payment Proof" 
                        className="w-full max-h-60 object-contain bg-black"
                      />
                    </a>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-1">Admin Notes</p>
                  <div className="mt-2">
                    <textarea
                      value={viewingOrder.notes || ''}
                      onChange={e => setViewingOrder({ ...viewingOrder, notes: e.target.value })}
                      className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-emerald-500"
                      placeholder="Add notes about this order..."
                      rows={3}
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => handleAddNotes(viewingOrder.id, viewingOrder.notes || '')}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm"
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>
                </div>

                {viewingOrder.status === 'pending' && (
                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        handleUpdateStatus(viewingOrder.id, 'completed');
                        handleCloseOrderView();
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
                    >
                      <Check size={16} />
                      <span>Approve Order</span>
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateStatus(viewingOrder.id, 'rejected');
                        handleCloseOrderView();
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1"
                    >
                      <X size={16} />
                      <span>Reject Order</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 