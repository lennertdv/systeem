import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MenuItem, Category } from '../types';

export function useMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const itemsQuery = query(collection(db, 'menu_items'));
    const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
      const items: MenuItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as MenuItem);
      });
      setMenuItems(items);
    }, (error) => {
      console.error("Error fetching menu items:", error);
      setLoading(false);
    });

    const categoriesQuery = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const cats: Category[] = [];
      snapshot.forEach((doc) => {
        cats.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(cats);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching categories:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeItems();
      unsubscribeCategories();
    };
  }, []);

  return { menuItems, categories, loading };
}
