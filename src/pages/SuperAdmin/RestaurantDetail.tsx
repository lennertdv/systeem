import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  ArrowLeft, 
  Store, 
  Mail, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  ShoppingCart,
  Power,
  Edit2,
  Save,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface RestaurantInfo {
  name: string;
  slug: string;
  ownerEmail: string;
  active: boolean;
  createdAt: number;
  plan: string;
}

export default function RestaurantDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [info, setInfo] = useState<RestaurantInfo | null>(null);
  const [stats, setStats] = useState({ orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug]);

  const fetchData = async () => {
    if (!slug) return;
    try {
      // 1. Fetch Info
      const infoSnapshot = await getDocs(collection(db, 'restaurants', slug, 'info'));
      const infoData = infoSnapshot.docs[0]?.data() as RestaurantInfo;
      if (infoData) {
        setInfo(infoData);
        setEditName(infoData.name);
      }

      // 2. Fetch Stats
      const ordersSnapshot = await getDocs(collection(db, 'restaurants', slug, 'orders'));
      let totalRevenue = 0;
      ordersSnapshot.forEach(doc => {
        totalRevenue += doc.data().totalPrice || 0;
      });
      setStats({
        orders: ordersSnapshot.size,
        revenue: totalRevenue
      });
    } catch (error) {
      console.error("Error fetching restaurant detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!slug || !info) return;
    setSaving(true);
    try {
      const infoSnapshot = await getDocs(collection(db, 'restaurants', slug, 'info'));
      const infoDocId = infoSnapshot.docs[0]?.id;
      if (!infoDocId) return;

      await updateDoc(doc(db, 'restaurants', slug, 'info', infoDocId), {
        name: editName
      });
      
      setInfo({ ...info, name: editName });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating name:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!slug || !info) return;
    try {
      const infoSnapshot = await getDocs(collection(db, 'restaurants', slug, 'info'));
      const infoDocId = infoSnapshot.docs[0]?.id;
      if (!infoDocId) return;

      await updateDoc(doc(db, 'restaurants', slug, 'info', infoDocId), {
        active: !info.active
      });
      
      setInfo({ ...info, active: !info.active });
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 w-32 bg-white/5 rounded-lg" />
        <div className="h-64 bg-white/5 rounded-2xl border border-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-white/5 rounded-2xl border border-white/5" />
          <div className="h-32 bg-white/5 rounded-2xl border border-white/5" />
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-white/10">
        <AlertCircle className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-neutral-400">Restaurant not found</h3>
        <button onClick={() => navigate('/super-admin/restaurants')} className="mt-6 text-white font-bold underline">
          Go back to list
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate('/super-admin/restaurants')}
        className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold uppercase tracking-widest">Back to Restaurants</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center">
            <Store className="w-10 h-10 text-neutral-400" />
          </div>
          <div>
            {isEditing ? (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
                <button 
                  onClick={handleUpdateName}
                  disabled={saving}
                  className="p-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-2 bg-white/5 text-neutral-400 rounded-lg hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight">{info.name}</h1>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-neutral-500 hover:text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm font-mono text-neutral-500">/{info.slug}</span>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${info.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {info.active ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={toggleStatus}
          className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 ${info.active ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'}`}
        >
          <Power className="w-4 h-4" />
          {info.active ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4 text-neutral-400">
            <ShoppingCart className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Total Orders</span>
          </div>
          <p className="text-3xl font-bold tracking-tight">{stats.orders}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4 text-neutral-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Total Revenue</span>
          </div>
          <p className="text-3xl font-bold tracking-tight">€{stats.revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4 text-neutral-400">
            <CreditCard className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Plan</span>
          </div>
          <p className="text-3xl font-bold tracking-tight uppercase">{info.plan}</p>
          <p className="text-xs text-neutral-500 mt-1">€35.00 / month</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
        <h2 className="text-xl font-bold mb-8">Restaurant Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-neutral-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Owner Email</p>
                <p className="font-bold">{info.ownerEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-neutral-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Created At</p>
                <p className="font-bold">{format(new Date(info.createdAt), 'MMMM d, yyyy')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-neutral-400 mb-4">Need to manage this restaurant's menu or orders?</p>
            <button className="px-6 py-2.5 bg-white/5 text-white text-sm font-bold rounded-xl hover:bg-white/10 transition-all border border-white/10">
              Impersonate Owner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
