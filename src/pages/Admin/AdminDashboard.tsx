import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { LogOut, LayoutDashboard, UtensilsCrossed, History, Store, Map as MapIcon } from 'lucide-react';
import AnalyticsTab from './Tabs/AnalyticsTab';
import MenuTab from './Tabs/MenuTab';
import OrdersTab from './Tabs/OrdersTab';
import TableLayout from './TableLayout';
import { useStoreSettings } from '../../hooks/useStoreSettings';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'menu' | 'orders' | 'tables'>('analytics');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { settings, updateSettings } = useStoreSettings();

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
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${
              activeTab === 'tables' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <MapIcon className="w-5 h-5" />
            Table Layout
          </button>
          
          <div className="h-px bg-neutral-100 my-2 hidden md:block"></div>
          
          <div className="px-4 py-3 hidden md:block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Restaurant Status</span>
            </div>
            <button
              onClick={() => updateSettings({ isOpen: !settings.isOpen })}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-colors ${
                settings.isOpen 
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              <Store className="w-4 h-4" />
              {settings.isOpen ? 'Open' : 'Closed'}
            </button>
          </div>

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
        {activeTab === 'tables' && <TableLayout />}
      </main>
    </div>
  );
}
