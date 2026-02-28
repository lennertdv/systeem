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

    // Only order by timestamp to avoid Firestore composite index requirements
    const ordersQuery = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const newOrders: Order[] = [];
      const statuses = filterStatusStr ? filterStatusStr.split(',') : null;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter in memory to avoid complex Firestore index requirements
        if (!statuses || statuses.includes(data.status)) {
          newOrders.push({ id: doc.id, ...data } as Order);
        }
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
