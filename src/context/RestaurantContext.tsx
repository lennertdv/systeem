import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useLocation } from 'react-router-dom';

interface RestaurantContextType {
  restaurantSlug: string | null;
  restaurantPath: string | null;
  loading: boolean;
  isRootDomain: boolean;
  isAdminSubdomain: boolean;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [isRootDomain, setIsRootDomain] = useState(false);
  const [isAdminSubdomain, setIsAdminSubdomain] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const resolveSlug = async () => {
      const hostname = window.location.hostname;
      const pathname = window.location.pathname;
      const parts = hostname.split('.');
      const pathParts = pathname.split('/');
      
      // 1. Path-based detection (Primary for .vercel.app)
      // URL format: /r/restaurant-slug/...
      if (pathParts[1] === 'r' && pathParts[2]) {
        if (isMounted) {
          setRestaurantSlug(pathParts[2]);
          setIsRootDomain(false);
          if (pathParts[3] === 'admin') {
            setIsAdminSubdomain(true);
          }
          setLoading(false);
        }
        return;
      }

      // 2. Subdomain logic (For custom domains)
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
      const isBaseDomain = parts.length <= (hostname.includes('vercel.app') ? 3 : 2) && !isLocal;

      if (isBaseDomain || isLocal) {
        if (isMounted) {
          setIsRootDomain(true);
          const params = new URLSearchParams(window.location.search);
          const querySlug = params.get('slug');
          if (querySlug) setRestaurantSlug(querySlug);
        }
      } else if (parts.length > (hostname.includes('vercel.app') ? 3 : 2)) {
        const slug = parts[0];
        const secondPart = parts[1];
        if (isMounted) {
          setRestaurantSlug(slug);
          setIsRootDomain(false);
          if (secondPart === 'admin') setIsAdminSubdomain(true);
        }
      }

      // Auth User Fallback
      if (!restaurantSlug && auth && db) {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user && isMounted) {
            try {
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.restaurantSlug) setRestaurantSlug(data.restaurantSlug);
              }
            } catch (error) {
              console.error("Error fetching user profile:", error);
            }
          }
          if (isMounted) setLoading(false);
        });
        return unsubscribe;
      }

      if (isMounted) setLoading(false);
    };

    resolveSlug();
    return () => { isMounted = false; };
  }, [restaurantSlug, location.pathname]);

  const restaurantPath = restaurantSlug ? `restaurants/${restaurantSlug}` : null;

  // Skip "Not Found" for super-admin, login, and root domain
  const isSpecialRoute = location.pathname.startsWith('/super-admin') || 
                         location.pathname === '/admin/login' ||
                         location.pathname === '/setup' ||
                         isRootDomain;

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
    <RestaurantContext.Provider value={{ restaurantSlug, restaurantPath, loading, isRootDomain, isAdminSubdomain }}>
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
