import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';
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
  AlertCircle,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';

interface RestaurantInfo {
  restaurantName: string;
  slug: string;
  ownerEmail: string;
  ownerUid: string;
  isOpen: boolean;
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
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug]);

  const fetchData = async () => {
    if (!slug || !db) return;
    try {
      // 1. Fetch Info
      const infoDoc = await getDoc(doc(db, 'restaurants', slug, 'settings', 'general'));
      if (infoDoc.exists()) {
        const infoData = infoDoc.data() as RestaurantInfo;
        setInfo(infoData);
        setEditName(infoData.restaurantName);
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

  const handleImpersonate = async () => {
    if (!info?.ownerUid || !auth.currentUser) return;
    setImpersonating(true);
    setImpersonateError(null);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch('/api/super-admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ ownerUid: info.ownerUid, slug: info.slug }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to impersonate owner');
      if (!result.customToken) throw new Error('No token received from server');
      sessionStorage.setItem('superadmin_impersonating', 'true');
      sessionStorage.setItem('superadmin_restaurant_slug', info.slug);
      sessionStorage.setItem('superadmin_restaurant_name', info.restaurantName);
      await signInWithCustomToken(auth, result.customToken);
      // Navigate to the restaurant's specific admin URL
      navigate(`/r/${info.slug}/admin`);
    } catch (error: any) {
      setImpersonateError(error.message || 'Something went wrong');
    } finally {
      setImpersonating(false);
    }
  };

  const handleUpdateName = async () => {
    if (!slug || !info) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'restaurants', slug, 'settings', 'general'), {
        restaurantName: editName
      });
      
      setInfo({ ...info, restaurantName: editName });
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
      await updateDoc(doc(db, 'restaurants', slug, 'settings', 'general'), {
        isOpen: !info.isOpen
      });
      
      setInfo({ ...info, isOpen: !info.isOpen });
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
      {showImpersonateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F0F0F] border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Impersonate Owner</h3>
                <p className="text-sm text-neutral-500">Je logt tijdelijk in als restauranthouder</p>
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-400">
                Je staat op het punt in te loggen als de eigenaar van{' '}
                <span className="font-bold text-amber-300">{info?.restaurantName}</span>.
                Je huidige super admin sessie wordt tijdelijk onderbroken.
                Ga terug via de oranje banner bovenaan de pagina.
              </p>
            </div>
            {impersonateError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{impersonateError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowImpersonateModal(false); setImpersonateError(null); }}
                disabled={impersonating}
                className="flex-1 py-3 rounded-xl font-bold text-sm border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleImpersonate}
                disabled={impersonating}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-amber-500 text-black hover:bg-amber-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {impersonating
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Inloggen...</>
                  : <><UserCheck className="w-4 h-4" />Doorgaan</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
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
                <h1 className="text-4xl font-black tracking-tight">{info.restaurantName}</h1>
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
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${info.isOpen ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {info.isOpen ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={toggleStatus}
          className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 ${info.isOpen ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'}`}
        >
          <Power className="w-4 h-4" />
          {info.isOpen ? 'Deactivate' : 'Activate'}
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
            <UserCheck className="w-8 h-8 text-neutral-600 mb-3" />
            <p className="text-sm text-neutral-400 mb-4">
              Log in als restauranthouder om hun dashboard te bekijken en te beheren.
            </p>
            <button
              onClick={() => setShowImpersonateModal(true)}
              className="px-6 py-2.5 bg-amber-500/10 text-amber-400 text-sm font-bold rounded-xl hover:bg-amber-500/20 transition-all border border-amber-500/20"
            >
              Impersonate Owner
            </button>
          </div>
        </div>
      </div>

      {/* Restaurant Information Section */}
    </div>
  );
}
