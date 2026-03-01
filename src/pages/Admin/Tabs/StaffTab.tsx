import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Users, UserPlus, Trash2, Shield, User, Phone, Star, Clock, Coffee, LogOut, CheckCircle } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: 'admin' | 'kitchen' | 'waiter';
  joinedAt: number;
  phone?: string;
  status: 'active' | 'on-break' | 'off-duty';
  ordersHandled: number;
  avatarUrl?: string;
}

export default function StaffTab() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newMember, setNewMember] = useState({ 
    name: '', 
    role: 'waiter' as StaffMember['role'],
    phone: ''
  });

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
      joinedAt: Date.now(),
      status: 'off-duty',
      ordersHandled: 0,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newMember.name}`
    });
    setNewMember({ name: '', role: 'waiter', phone: '' });
    setIsAdding(false);
  };

  const updateStaffStatus = async (id: string, status: StaffMember['status']) => {
    if (!db) return;
    await updateDoc(doc(db, 'staff', id), { status });
  };

  const handleDeleteMember = async (id: string) => {
    if (!db || !confirm('Are you sure you want to remove this staff member?')) return;
    await deleteDoc(doc(db, 'staff', id));
  };

  const getStatusColor = (status: StaffMember['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'on-break': return 'bg-amber-500';
      case 'off-duty': return 'bg-neutral-300';
      default: return 'bg-neutral-300';
    }
  };

  if (loading) return <div className="text-neutral-500 font-bold">Loading staff...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-neutral-900 tracking-tight uppercase">Staff Management</h2>
          <p className="text-neutral-500 font-medium">Manage your team members, their roles, and live status.</p>
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
          <div key={member.id} className="bg-white rounded-[2.5rem] shadow-sm border border-neutral-100 group relative overflow-hidden flex flex-col">
            {/* Status Bar */}
            <div className={`h-1.5 w-full ${getStatusColor(member.status)}`} />
            
            <div className="p-8 flex-1">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-neutral-50 shadow-inner bg-neutral-50">
                    <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-black text-neutral-900 text-xl leading-tight">{member.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Shield className="w-3 h-3 text-neutral-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{member.role}</span>
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  member.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                  member.status === 'on-break' ? 'bg-amber-100 text-amber-700' :
                  'bg-neutral-100 text-neutral-500'
                }`}>
                  {member.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Orders</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-lg font-black text-neutral-900">{member.ordersHandled || 0}</span>
                  </div>
                </div>
                <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Rating</span>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-lg font-black text-neutral-900">4.8</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-neutral-500">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-bold">{member.phone || 'No phone set'}</span>
                </div>
                <div className="flex items-center gap-3 text-neutral-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-bold">Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="px-8 py-6 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => updateStaffStatus(member.id, 'active')}
                  className={`p-2.5 rounded-xl transition-all ${member.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-white text-neutral-400 hover:text-emerald-500 border border-neutral-200'}`}
                  title="Clock In"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => updateStaffStatus(member.id, 'on-break')}
                  className={`p-2.5 rounded-xl transition-all ${member.status === 'on-break' ? 'bg-amber-500 text-white' : 'bg-white text-neutral-400 hover:text-amber-500 border border-neutral-200'}`}
                  title="On Break"
                >
                  <Coffee className="w-5 h-5" />
                </button>
                <button
                  onClick={() => updateStaffStatus(member.id, 'off-duty')}
                  className={`p-2.5 rounded-xl transition-all ${member.status === 'off-duty' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-400 hover:text-neutral-900 border border-neutral-200'}`}
                  title="Clock Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => handleDeleteMember(member.id)}
                className="p-2.5 text-neutral-300 hover:text-red-500 transition-colors"
                title="Remove Member"
              >
                <Trash2 className="w-5 h-5" />
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
                <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Phone Number</label>
                <input
                  type="tel"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-bold"
                  placeholder="+32 ..."
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
