import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';

export function useOrders(filterStatus?: string[]) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const filterStatusStr = filterStatus?.join(',') || '';

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    let ordersQuery = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    
    if (filterStatusStr) {
      const statuses = filterStatusStr.split(',');
      ordersQuery = query(
        collection(db, 'orders'),
        where('status', 'in', statuses),
        orderBy('timestamp', 'desc')
      );
    }

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const newOrders: Order[] = [];
      snapshot.forEach((doc) => {
        newOrders.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(newOrders);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filterStatusStr]);

  return { orders, loading };
}
