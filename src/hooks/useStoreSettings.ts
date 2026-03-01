import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface StoreSettings {
  isOpen: boolean;
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>({ isOpen: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'settings', 'general');
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
  }, []);

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'settings', 'general'), newSettings, { merge: true });
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  return { settings, loading, updateSettings };
}
