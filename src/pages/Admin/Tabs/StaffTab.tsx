import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Users, UserPlus, Trash2, Shield, User } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: 'admin' | 'kitchen' | 'waiter';
  joinedAt: number;
}

export default function StaffTab() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: 'waiter' as StaffMember['role'] });

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'staff'), orderBy('joinedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const members: StaffMember[] = [];
      snapshot.forEach((doc) => {
        members.push({ id: doc.id, ...doc.data() } as StaffMember);
      });
      setStaff(members);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !newMember.name) return;
    await addDoc(collection(db, 'staff'), {
      ...newMember,
      joinedAt: Date.now()
    });
    setNewMember({ name: '', role: 'waiter' });
    setIsAdding(false);
  };

  const handleDeleteMember = async (id: string) => {
    if (!db || !confirm('Are you sure you want to remove this staff member?')) return;
    await deleteDoc(doc(db, 'staff', id));
  };

  if (loading) return <div className="text-neutral-500 font-bold">Loading staff...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-neutral-900 tracking-tight uppercase">Staff Management</h2>
          <p className="text-neutral-500 font-medium">Manage your team members and their roles.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-neutral-900 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-neutral-800 transition-all active:scale-95 shadow-xl shadow-neutral-900/20"
        >
          <UserPlus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <div key={member.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-neutral-100 group relative overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-lg leading-tight">{member.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Shield className="w-3 h-3 text-neutral-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{member.role}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => handleDeleteMember(member.id)}
                className="p-2 text-neutral-300 hover:text-red-500 transition-colors"
                title="Remove Member"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {staff.length === 0 && (
        <div className="text-center py-24 bg-neutral-50 rounded-[3rem] border-2 border-dashed border-neutral-200">
          <Users className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-neutral-400">No staff members yet</h3>
          <p className="text-neutral-400 text-sm mt-1">Click the button above to add your first team member.</p>
        </div>
      )}

      {/* Add Member Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-neutral-900 uppercase tracking-tight mb-6">Add Staff Member</h3>
            <form onSubmit={handleAddMember} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-bold"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Role</label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value as StaffMember['role'] })}
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-bold appearance-none"
                >
                  <option value="waiter">Waiter</option>
                  <option value="kitchen">Kitchen Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-neutral-500 hover:bg-neutral-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-neutral-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-800 transition-all active:scale-95 shadow-xl shadow-neutral-900/20"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
