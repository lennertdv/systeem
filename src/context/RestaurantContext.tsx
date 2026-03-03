import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface RestaurantContextType {
  slug: string;
  restaurantName: string;
  restaurantPath: string;
  loading: boolean;
  notFound: boolean;
}

const RestaurantContext = createContext<RestaurantContextType>({
  slug: '',
  restaurantName: '',
  restaurantPath: '',
  loading: true,
  notFound: false,
});

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchRestaurant = async () => {
      try {
        const infoSnap = await getDoc(doc(db, 'restaurants', slug, 'info', 'general'));
        if (infoSnap.exists()) {
          setRestaurantName(infoSnap.data().name || slug);
        } else {
          // Try subcollection fallback
          setRestaurantName(slug);
        }
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [slug]);

  if (!slug) return null;

  return (
    <RestaurantContext.Provider value={{
      slug,
      restaurantName,
      restaurantPath: `restaurants/${slug}`,
      loading,
      notFound,
    }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  return useContext(RestaurantContext);
}
