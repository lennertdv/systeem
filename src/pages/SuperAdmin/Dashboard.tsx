import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Users, 
  Store, 
  TrendingUp, 
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

interface Stats {
  activeRestaurants: number;
  totalOrdersToday: number;
  totalRevenueToday: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    activeRestaurants: 0,
    totalOrdersToday: 0,
    totalRevenueToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch('/api/super-admin/health');
        if (response.ok) {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      } catch (error) {
        setApiStatus('offline');
      }
    };

    const fetchStats = async () => {
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        // 1. Fetch Restaurants using the same logic as Restaurants.tsx for consistency
        const { collectionGroup } = await import('firebase/firestore');
        const qSettings = query(collectionGroup(db, 'settings'));
        const settingsSnapshot = await getDocs(qSettings);
        
        let activeCount = 0;
        const restaurantSlugs: string[] = [];

        settingsSnapshot.forEach((doc) => {
          if (doc.id === 'general') {
            const data = doc.data();
            if (data.isOpen !== false) { // Default to true if missing
              activeCount++;
              restaurantSlugs.push(doc.ref.parent.parent?.id || '');
            }
          }
        });

        // 2. Fetch Orders Today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayTimestamp = startOfDay.getTime();

        let totalOrders = 0;
        let totalRevenue = 0;

        // In a real app, we'd have a global orders collection or use a cloud function
        // For this demo, we'll iterate through active restaurants
        for (const slug of restaurantSlugs) {
          const ordersQuery = query(
            collection(db, 'restaurants', slug, 'orders'),
            where('timestamp', '>=', todayTimestamp)
          );
          const ordersSnapshot = await getDocs(ordersQuery);
          totalOrders += ordersSnapshot.size;
          ordersSnapshot.forEach(doc => {
            totalRevenue += doc.data().totalPrice || 0;
          });
        }

        setStats({
          activeRestaurants: activeCount,
          totalOrdersToday: totalOrders,
          totalRevenueToday: totalRevenue
        });
      } catch (error) {
        console.error("Error fetching superadmin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    checkApi();
  }, []);

  const statCards = [
    { 
      label: 'Active Restaurants', 
      value: stats.activeRestaurants, 
      icon: Store, 
      trend: '+12%', 
      trendUp: true 
    },
    { 
      label: 'Total Orders Today', 
      value: stats.totalOrdersToday, 
      icon: ShoppingCart, 
      trend: '+5.4%', 
      trendUp: true 
    },
    { 
      label: 'Total Revenue Today', 
      value: `€${stats.totalRevenueToday.toFixed(2)}`, 
      icon: TrendingUp, 
      trend: '-2.1%', 
      trendUp: false 
    },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5" />
          ))}
        </div>
        <div className="h-96 bg-white/5 rounded-2xl border border-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-neutral-500 mt-1">Real-time performance across all OrderFlow restaurants.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                <card.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${card.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.trend}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-400">{card.label}</p>
              <p className="text-3xl font-bold tracking-tight">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-neutral-400" />
              <h2 className="text-lg font-bold">System Health</h2>
            </div>
            <div className="flex items-center gap-2">
              {apiStatus === 'checking' ? (
                <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
              ) : apiStatus === 'online' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-500 uppercase tracking-widest">Backend Online</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-red-500 uppercase tracking-widest">Backend Offline</span>
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            {[
              { label: 'API Latency', value: apiStatus === 'online' ? '42ms' : 'N/A', status: apiStatus === 'online' ? 'optimal' : 'error' },
              { label: 'Database Load', value: '12%', status: 'optimal' },
              { label: 'Auth Service', value: '100%', status: 'optimal' },
              { label: 'Payment Gateway', value: '100%', status: 'optimal' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">{item.label}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono font-bold">{item.value}</span>
                  <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${item.status === 'optimal' ? 'bg-emerald-500' : 'bg-red-500'} w-full`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
            <TrendingUp className="w-8 h-8 text-neutral-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Growth Insights</h2>
          <p className="text-neutral-500 text-sm max-w-xs mx-auto">
            Restaurant signups are up 24% this month. Consider launching the "Pro" plan for high-volume venues.
          </p>
          <button className="mt-8 px-6 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-neutral-200 transition-all">
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
