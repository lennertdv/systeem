import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Table } from '../types';

export function useTables(restaurantPath: string | null) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !restaurantPath) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, restaurantPath, 'tables'), orderBy('number', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tablesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Table[];
      setTables(tablesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantPath]);

  const addTable = async (table: Omit<Table, 'id'>) => {
    if (!db || !restaurantPath) return;
    await addDoc(collection(db, restaurantPath, 'tables'), table);
  };

  const updateTable = async (id: string, table: Partial<Table>) => {
    if (!db || !restaurantPath) return;
    const tableRef = doc(db, restaurantPath, 'tables', id);
    await updateDoc(tableRef, table);
  };

  const deleteTable = async (id: string) => {
    if (!db || !restaurantPath) return;
    const tableRef = doc(db, restaurantPath, 'tables', id);
    await deleteDoc(tableRef);
  };

  return { tables, loading, addTable, updateTable, deleteTable };
}
