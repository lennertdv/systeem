import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useLocation } from 'react-router-dom';

interface RestaurantContextType {
  restaurantSlug: string | null;
  restaurantPath: string | null;
  loading: boolean;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const resolveSlug = async () => {
      // 1. Check Subdomain
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      
      // Handle local dev (e.g. mario.localhost) or production subdomains
      if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
        if (isMounted) {
          setRestaurantSlug(parts[0]);
          setLoading(false);
        }
        return;
      }

      // 2. Check Query Param (Local Dev Fallback)
      const params = new URLSearchParams(window.location.search);
      const querySlug = params.get('slug');
      if (querySlug) {
        if (isMounted) {
          setRestaurantSlug(querySlug);
          setLoading(false);
        }
        return;
      }

      // 3. Check Auth User (for Admin Panel)
      if (!auth || !db) {
        if (isMounted) setLoading(false);
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              if (data.restaurantSlug && isMounted) {
                setRestaurantSlug(data.restaurantSlug);
              }
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
          }
        }
        if (isMounted) setLoading(false);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    };

    const cleanup = resolveSlug();
    return () => {
      if (typeof cleanup === 'function') {
        // @ts-ignore
        cleanup();
      }
    };
  }, []);

  const restaurantPath = restaurantSlug ? `restaurants/${restaurantSlug}` : null;

  // Skip "Not Found" for super-admin and login
  const isSpecialRoute = location.pathname.startsWith('/super-admin') || 
                         location.pathname === '/admin/login' ||
                         location.pathname === '/setup';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!restaurantSlug && !isSpecialRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-4">Restaurant Not Found</h1>
          <p className="text-neutral-400 mb-8">We couldn't determine which restaurant you're looking for. Please check the URL or use a valid subdomain.</p>
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Debug Info</p>
            <p className="text-sm font-mono text-neutral-300">Hostname: {window.location.hostname}</p>
            <p className="text-sm font-mono text-neutral-300">Path: {location.pathname}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RestaurantContext.Provider value={{ restaurantSlug, restaurantPath, loading }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
