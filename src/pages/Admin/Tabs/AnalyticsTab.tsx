import { useOrders } from '../../../hooks/useOrders';
import { useMemo } from 'react';
import { format, startOfDay, isSameDay, subDays, eachDayOfInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, Clock, DollarSign, Users, Calendar } from 'lucide-react';

const COLORS = ['#171717', '#404040', '#737373', '#a3a3a3', '#d4d4d4'];

export default function AnalyticsTab() {
  const { orders, loading } = useOrders();

  const analytics = useMemo(() => {
    if (!orders.length) return { 
      dailyRevenue: 0, 
      topItems: [], 
      hourlyData: [], 
      revenueHistory: [],
      categoryData: [],
      totalRevenue: 0
    };

    const today = new Date();
    
    // Total Revenue
    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    // Daily Revenue (Today)
    const dailyRevenue = orders
      .filter(o => isSameDay(new Date(o.timestamp), today) && o.status === 'completed')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    // Revenue History (Last 7 Days)
    const last7Days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today
    });

    const revenueHistory = last7Days.map(day => {
      const dayRevenue = orders
        .filter(o => isSameDay(new Date(o.timestamp), day) && o.status === 'completed')
        .reduce((sum, o) => sum + o.totalPrice, 0);
      return {
        date: format(day, 'MMM dd'),
        revenue: dayRevenue
      };
    });

    // Category Distribution
    const categoryCounts: Record<string, number> = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        const cat = item.category || 'Other';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + item.quantity;
      });
    });
    const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

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

    return { dailyRevenue, topItems, hourlyData, revenueHistory, categoryData, totalRevenue };
  }, [orders]);

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Analytics Overview</h2>
        <p className="text-neutral-500 mt-1">Real-time insights from your restaurant data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
          <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">Today's Revenue</p>
          <p className="text-3xl font-black text-neutral-900">${analytics.dailyRevenue.toFixed(2)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
          <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">Total Orders</p>
          <p className="text-3xl font-black text-neutral-900">{orders.length}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
          <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-4">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">Avg Wait Time</p>
          <p className="text-3xl font-black text-neutral-900">
            {orders.filter(o => o.completedAt).length > 0 
              ? Math.round(orders.filter(o => o.completedAt).reduce((sum, o) => sum + (o.completedAt! - o.timestamp), 0) / orders.filter(o => o.completedAt).length / 60000) 
              : 0}m
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
          <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
            <DollarSign className="w-5 h-5" />
          </div>
          <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-3xl font-black text-neutral-900">${analytics.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tight">Revenue History</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-400">
              <Calendar className="w-4 h-4" />
              Last 7 Days
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.revenueHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#a3a3a3', fontSize: 12, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a3a3a3', fontSize: 12, fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                />
                <Line type="monotone" dataKey="revenue" stroke="#171717" strokeWidth={4} dot={{r: 6, fill: '#171717', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-neutral-100">
          <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tight mb-8">Category Mix</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {analytics.categoryData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                  <span className="text-sm font-bold text-neutral-600">{entry.name}</span>
                </div>
                <span className="text-sm font-black text-neutral-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-neutral-100">
          <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tight mb-8">Busiest Hours</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#a3a3a3', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a3a3a3', fontSize: 12, fontWeight: 'bold'}} />
                <Tooltip 
                  cursor={{fill: '#f5f5f5'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                />
                <Bar dataKey="orders" fill="#171717" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-neutral-100">
          <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tight mb-8">Top Sellers</h3>
          <div className="space-y-6">
            {analytics.topItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-neutral-100 mx-auto mb-4" />
                <p className="text-neutral-400 font-bold">No sales yet.</p>
              </div>
            ) : (
              analytics.topItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-50 flex items-center justify-center text-sm font-black text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white transition-all">
                      {index + 1}
                    </div>
                    <span className="font-bold text-neutral-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-neutral-900">{item.count}</p>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Units</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
