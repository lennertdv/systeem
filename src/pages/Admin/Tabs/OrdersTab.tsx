import { useOrders } from '../../../hooks/useOrders';
import { format } from 'date-fns';
import { Search, Filter } from 'lucide-react';
import { useState } from 'react';

export default function OrdersTab() {
  const { orders, loading } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Order History</h2>
          <p className="text-neutral-500 mt-1">View and search through past orders.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search table or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm w-full md:w-64"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100 text-sm font-medium text-neutral-500">
                <th className="p-4">Order ID</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Table</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">No orders found matching your criteria.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 text-sm font-mono text-neutral-500">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="p-4 text-sm text-neutral-900">
                      <div className="font-medium">{format(new Date(order.timestamp), 'MMM d, yyyy')}</div>
                      <div className="text-neutral-500 text-xs">{format(new Date(order.timestamp), 'h:mm a')}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 text-neutral-900 font-bold text-sm">
                        {order.tableNumber}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-neutral-600 max-w-xs truncate">
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {order.items.reduce((sum, i) => sum + i.quantity, 0)} items total
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-neutral-900">
                      ${order.totalPrice.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        order.status === 'in-progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-neutral-100 text-neutral-700 border border-neutral-200'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
