import { useState, useEffect } from 'react';
import { useOrders } from '../../hooks/useOrders';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { formatDistanceToNow, format } from 'date-fns';
import { ChefHat, CheckCircle2, Clock, Hash } from 'lucide-react';

export default function KitchenView() {
  const { orders, loading } = useOrders(['pending', 'in-progress']);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (!db) return;
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completedAt = Date.now();
      }
      await updateDoc(doc(db, 'orders', orderId), updateData);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getWaitTimeColor = (timestamp: number) => {
    const diffMinutes = (now - timestamp) / 1000 / 60;
    if (diffMinutes < 10) return 'bg-emerald-50 border-emerald-200 text-emerald-900';
    if (diffMinutes < 20) return 'bg-amber-50 border-amber-200 text-amber-900';
    return 'bg-red-50 border-red-200 text-red-900';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">Loading orders...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-6 font-sans">
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-neutral-400" />
          <h1 className="text-2xl font-bold tracking-tight">Kitchen Display System</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-sm font-medium text-neutral-400 bg-neutral-800 px-4 py-2 rounded-xl hidden md:flex">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> &lt; 10m</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> 10-20m</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> &gt; 20m</div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-medium transition-colors">
              Menu
            </a>
            <a href="/admin" className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-medium transition-colors">
              Admin
            </a>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {orders.length === 0 ? (
          <div className="col-span-full text-center py-20 text-neutral-500 text-xl font-medium">
            Geen actieve bestellingen. De keuken is leeg!
          </div>
        ) : (
          orders.map((order) => {
            const colorClass = getWaitTimeColor(order.timestamp);
            return (
              <div 
                key={order.id} 
                className={`rounded-2xl border-2 p-5 shadow-lg flex flex-col h-full transition-colors duration-500 ${colorClass}`}
              >
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-black/10">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider opacity-70 block mb-1">Tafel</span>
                    <span className="text-3xl font-black">{order.tableNumber}</span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm font-bold opacity-70 justify-end mb-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(order.timestamp), 'HH:mm')}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold opacity-50 justify-end mb-2">
                      <Hash className="w-3 h-3" />
                      {order.id.slice(0, 6)}
                    </div>
                  </div>
                </div>

                <div className="flex-1 mb-6">
                  <ul className="space-y-3">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-lg font-medium">
                        <span className="font-bold opacity-50">{item.quantity}x</span>
                        <span className="leading-tight">{item.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t border-black/10">
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="flex-1 bg-black text-white hover:bg-black/80 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Afgewerkt
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
