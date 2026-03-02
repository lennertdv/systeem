import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, collectionGroup, query, where, setDoc, addDoc } from 'firebase/firestore';
import { initializeApp, deleteApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  ExternalLink, 
  Power, 
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface Restaurant {
  id: string;
  restaurantName: string;
  slug: string;
  ownerEmail: string;
  isOpen: boolean;
  createdAt: number;
  plan: string;
}

export default function RestaurantManagement() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Restaurant Form
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    password: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      // Use collectionGroup to find all 'general' settings documents across all restaurants
      const q = query(collectionGroup(db, 'settings'));
      const snapshot = await getDocs(q);
      const list: Restaurant[] = [];
      
      snapshot.forEach((doc) => {
        if (doc.id === 'general') {
          const data = doc.data();
          // Only add if it has a restaurantName (valid setting)
          if (data && data.restaurantName) {
            const restaurantId = doc.ref.parent.parent?.id || 'unknown';
            list.push({ 
              id: restaurantId, 
              ...data,
              createdAt: data.createdAt || Date.now() // Fallback for missing dates
            } as Restaurant);
          }
        }
      });
      
      setRestaurants(list);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    setFormData({ ...formData, name, slug });
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      setFormError("Database not initialized");
      return;
    }
    setFormLoading(true);
    setFormError(null);

    let secondaryApp;
    try {
      // 1. Create a secondary Firebase app to create the user without logging out the admin
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };

      const secondaryAppName = `secondary-${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      console.log(`[DEBUG] Creating user in secondary auth instance...`);
      
      // 2. Create the Auth User
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        formData.email, 
        formData.password
      );
      const uid = userCredential.user.uid;

      console.log(`[DEBUG] User created with UID: ${uid}. Writing Firestore records...`);

      // 3. Create Restaurant Parent Document
      await setDoc(doc(db, 'restaurants', formData.slug), {
        createdAt: Date.now(),
        slug: formData.slug
      });

      // 4. Create Restaurant Settings
      await setDoc(doc(db, 'restaurants', formData.slug, 'settings', 'general'), {
        restaurantName: formData.name,
        slug: formData.slug,
        ownerEmail: formData.email,
        ownerUid: uid,
        isOpen: true,
        createdAt: Date.now(),
        plan: 'starter',
        currency: '€'
      });

      // 5. Create User Record
      await setDoc(doc(db, 'users', uid), {
        role: 'tenant',
        restaurantSlug: formData.slug,
        email: formData.email
      });

      // 6. Seed empty menu category
      await addDoc(collection(db, 'restaurants', formData.slug, 'categories'), {
        name: 'Main Menu',
        order: 1
      });

      // 7. Sign out from secondary app and delete it
      await signOut(secondaryAuth);
      
      console.log(`[DEBUG] Restaurant creation successful!`);

      await fetchRestaurants();
      setIsAdding(false);
      setFormData({ name: '', slug: '', email: '', password: '' });
    } catch (err: any) {
      console.error("Create restaurant error:", err);
      let message = err.message;
      if (err.code === 'auth/email-already-in-use') {
        message = "This email is already registered.";
      } else if (err.code === 'auth/weak-password') {
        message = "Password should be at least 6 characters.";
      }
      setFormError(message);
    } finally {
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (e) {
          console.error("Error deleting secondary app:", e);
        }
      }
      setFormLoading(false);
    }
  };

  const toggleStatus = async (restaurant: Restaurant) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'restaurants', restaurant.slug, 'settings', 'general'), {
        isOpen: !restaurant.isOpen
      });
      
      await fetchRestaurants();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const filteredRestaurants = restaurants.filter(r => 
    (r.restaurantName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.slug || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.ownerEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurants</h1>
          <p className="text-neutral-500 mt-1">Manage all restaurant tenants on the platform.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-neutral-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Restaurant
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Search by name, slug, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Restaurant</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Owner</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Plan</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Created</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8 h-16 bg-white/[0.01]" />
                  </tr>
                ))
              ) : filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 italic">
                    No restaurants found.
                  </td>
                </tr>
              ) : (
                filteredRestaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{restaurant.restaurantName}</span>
                        <span className="text-xs text-neutral-500 font-mono">/{restaurant.slug}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-400">{restaurant.ownerEmail}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${restaurant.isOpen ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${restaurant.isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {restaurant.isOpen ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{restaurant.plan}</span>
                      <p className="text-[10px] text-neutral-600">€35/month</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-neutral-500">
                        {restaurant.createdAt ? format(new Date(restaurant.createdAt), 'MMM d, yyyy') : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => toggleStatus(restaurant)}
                          className={`p-2 rounded-lg transition-colors ${restaurant.isOpen ? 'text-red-400 hover:bg-red-400/10' : 'text-emerald-400 hover:bg-emerald-400/10'}`}
                          title={restaurant.isOpen ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <Link 
                          to={`/super-admin/restaurants/${restaurant.slug}`}
                          className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Restaurant Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F0F0F] border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold tracking-tight">New Restaurant</h3>
              <button onClick={() => setIsAdding(false)} className="text-neutral-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {formError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{formError}</p>
              </div>
            )}

            <form onSubmit={handleAddRestaurant} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Restaurant Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  placeholder="The Bistro"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Slug (URL)</label>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <span className="text-neutral-600 text-sm">/</span>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 bg-transparent text-sm focus:outline-none font-mono"
                    placeholder="the-bistro"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Owner Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  placeholder="owner@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Initial Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-neutral-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
