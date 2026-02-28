import { useOrders } from '../../../hooks/useOrders';
import { useMemo } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, Clock } from 'lucide-react';

export default function AnalyticsTab() {
  const { orders, loading } = useOrders();

  const analytics = useMemo(() => {
    if (!orders.length) return { dailyRevenue: 0, topItems: [], hourlyData: [] };

    const today = new Date();
    
    // Daily Revenue
    const dailyRevenue = orders
      .filter(o => isSameDay(new Date(o.timestamp), today) && o.status === 'completed')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    // Top Items
    const itemCounts: Record<string, { name: string; count: number }> = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        if (!itemCounts[item.menuItemId]) {
          itemCounts[item.menuItemId] = { name: item.name, count: 0 };
        }
        itemCounts[item.menuItemId].count += item.quantity;
      });
    });
    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Busiest Hours
    const hourCounts: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      hourCounts[`${i.toString().padStart(2, '0')}:00`] = 0;
    }
    
    orders.forEach(o => {
      const hour = format(new Date(o.timestamp), 'HH:00');
      if (hourCounts[hour] !== undefined) {
        hourCounts[hour]++;
      }
    });
    
    const hourlyData = Object.entries(hourCounts).map(([hour, count]) => ({
      hour,
      orders: count
    }));

    return { dailyRevenue, topItems, hourlyData };
  }, [orders]);

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Analytics Overview</h2>
        <p className="text-neutral-500 mt-1">Real-time insights from your restaurant data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Today's Revenue</p>
            <p className="text-2xl font-bold text-neutral-900">${analytics.dailyRevenue.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Total Orders</p>
            <p className="text-2xl font-bold text-neutral-900">{orders.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Avg Wait Time</p>
            <p className="text-2xl font-bold text-neutral-900">
              {orders.filter(o => o.completedAt).length > 0 
                ? Math.round(orders.filter(o => o.completedAt).reduce((sum, o) => sum + (o.completedAt! - o.timestamp), 0) / orders.filter(o => o.completedAt).length / 60000) 
                : 0} min
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Orders by Hour</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#a3a3a3', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a3a3a3', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f5f5f5'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="orders" fill="#171717" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Top 5 Items</h3>
          <div className="space-y-4">
            {analytics.topItems.length === 0 ? (
              <p className="text-neutral-500 text-sm">No data available yet.</p>
            ) : (
              analytics.topItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-500">
                      {index + 1}
                    </span>
                    <span className="font-medium text-neutral-900">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-neutral-500">{item.count} sold</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
