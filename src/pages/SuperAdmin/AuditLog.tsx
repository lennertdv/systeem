import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';
import { Shield, Clock, User, Store } from 'lucide-react';

interface AuditEvent {
  id: string;
  action: string;
  superAdminUid: string;
  superAdminEmail: string;
  targetUid: string;
  slug: string;
  timestamp: number;
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    if (!db) return;
    try {
      const q = query(
        collection(db, 'audit_log'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditEvent[];
      setLogs(list);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-neutral-500 mt-1">Track all administrative actions and impersonations.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Super Admin</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Action</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Target Restaurant</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-8 h-16 bg-white/[0.01]" />
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-neutral-500 italic">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{log.superAdminEmail || 'Unknown'}</span>
                          <span className="text-[10px] text-neutral-600 font-mono">{log.superAdminUid}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                        <Shield className="w-3 h-3" />
                        {log.action}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm font-bold text-neutral-300">/{log.slug}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-neutral-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">{format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
