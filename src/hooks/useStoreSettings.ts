import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface StoreSettings {
  isOpen: boolean;
  restaurantName?: string;
  logoUrl?: string;
  currency?: string;
  contactEmail?: string;
  address?: string;
  phone?: string;
  website?: string;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
}

export function useStoreSettings(restaurantPath: string | null) {
  const [settings, setSettings] = useState<StoreSettings>({ 
    isOpen: true,
    restaurantName: 'Bistro Live',
    currency: '€'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !restaurantPath) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, restaurantPath, 'settings', 'general');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as StoreSettings);
      } else {
        // Initialize if it doesn't exist
        setDoc(docRef, { isOpen: true });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching store settings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantPath]);

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    if (!db || !restaurantPath) return;
    try {
      await setDoc(doc(db, restaurantPath, 'settings', 'general'), newSettings, { merge: true });
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  return { settings, loading, updateSettings };
}
