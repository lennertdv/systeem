import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Table } from '../types';

export function useTables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, 'tables'), orderBy('number', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tablesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Table[];
      setTables(tablesData);
      setLoading(loading && false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addTable = async (table: Omit<Table, 'id'>) => {
    if (!db) return;
    await addDoc(collection(db, 'tables'), table);
  };

  const updateTable = async (id: string, table: Partial<Table>) => {
    if (!db) return;
    const tableRef = doc(db, 'tables', id);
    await updateDoc(tableRef, table);
  };

  const deleteTable = async (id: string) => {
    if (!db) return;
    const tableRef = doc(db, 'tables', id);
    await deleteDoc(tableRef);
  };

  return { tables, loading, addTable, updateTable, deleteTable };
}
