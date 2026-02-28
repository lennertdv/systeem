import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { LogOut, LayoutDashboard, UtensilsCrossed, History } from 'lucide-react';
import AnalyticsTab from './Tabs/AnalyticsTab';
import MenuTab from './Tabs/MenuTab';
import OrdersTab from './Tabs/OrdersTab';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'menu' | 'orders'>('analytics');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/admin/login');
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    navigate('/admin/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white shadow-sm md:h-screen sticky top-0 flex flex-col">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between md:justify-center">
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Admin Portal</h1>
          <button onClick={handleLogout} className="md:hidden text-neutral-500 hover:text-neutral-900">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${
              activeTab === 'analytics' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${
              activeTab === 'menu' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            Menu Items
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${
              activeTab === 'orders' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <History className="w-5 h-5" />
            Order History
          </button>
          
          <div className="h-px bg-neutral-100 my-2 hidden md:block"></div>
          
          <a
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-neutral-600 hover:bg-neutral-100 transition-colors whitespace-nowrap"
          >
            Menu View
          </a>
          <a
            href="/kitchen"
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-neutral-600 hover:bg-neutral-100 transition-colors whitespace-nowrap"
          >
            Kitchen View
          </a>
        </nav>

        <div className="p-4 border-t border-neutral-100 hidden md:block">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'menu' && <MenuTab />}
        {activeTab === 'orders' && <OrdersTab />}
      </main>
    </div>
  );
}
