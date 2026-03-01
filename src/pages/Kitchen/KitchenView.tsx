import { useState, useEffect, useRef, useMemo } from 'react';
import { useOrders } from '../../hooks/useOrders';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { format } from 'date-fns';
import { ChefHat, CheckCircle2, Clock, History, LayoutGrid, Utensils, Beer, Bell, BellOff } from 'lucide-react';

export default function KitchenView() {
  const [view, setView] = useState<'active' | 'completed'>('active');
  const [filter, setFilter] = useState<'all' | 'food' | 'drinks'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const { orders: allOrders, loading } = useOrders(view === 'active' ? ['pending', 'in-progress'] : ['completed']);
  const [now, setNow] = useState(Date.now());
  const prevOrdersCount = useRef<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000); // Live timer every second
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading && view === 'active' && soundEnabled && audioUnlocked) {
      if (prevOrdersCount.current !== null && allOrders.length > prevOrdersCount.current) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play blocked', e));
      }
      prevOrdersCount.current = allOrders.length;
    } else if (!loading) {
      prevOrdersCount.current = allOrders.length;
    }
  }, [allOrders.length, view, soundEnabled, loading, audioUnlocked]);

  const unlockAudio = () => {
    setAudioUnlocked(true);
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => {}); // Silent play to unlock
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (!db) return;
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completedAt = Date.now();
      }
      await updateDoc(doc(db, 'orders', orderId), updateData);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean[]>>({});

  const toggleItemCheck = (orderId: string, itemIdx: number) => {
    setCheckedItems(prev => {
      const orderChecks = prev[orderId] || [];
      const newChecks = [...orderChecks];
      newChecks[itemIdx] = !newChecks[itemIdx];
      return { ...prev, [orderId]: newChecks };
    });
  };

  const togglePriority = async (orderId: string, currentPriority: boolean) => {
    if (!db) return;
    await updateDoc(doc(db, 'orders', orderId), { priority: !currentPriority });
  };

  const filteredOrders = allOrders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'food') return order.items.some(item => !item.category || item.category.toLowerCase() !== 'drinks');
    if (filter === 'drinks') return order.items.some(item => item.category && item.category.toLowerCase() === 'drinks');
    return true;
  });

  const prepSummary = useMemo(() => {
    if (view !== 'active') return [];
    const summary: Record<string, number> = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        summary[item.name] = (summary[item.name] || 0) + item.quantity;
      });
    });
    return Object.entries(summary).sort((a, b) => b[1] - a[1]);
  }, [filteredOrders, view]);

  const getWaitTimeColor = (timestamp: number, priority?: boolean) => {
    if (view === 'completed') return 'bg-neutral-800 border-neutral-700 text-neutral-400';
    if (priority) return 'bg-purple-500/20 border-purple-500/50 text-purple-100 ring-2 ring-purple-500/50';
    const diffMinutes = (now - timestamp) / 1000 / 60;
    if (diffMinutes < 5) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    if (diffMinutes < 10) return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    return 'bg-red-500/10 border-red-500/20 text-red-400';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">Loading orders...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-6 font-sans">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-neutral-800 p-2 rounded-xl">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">KITCHEN DISPLAY</h1>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Live Order Management</p>
            </div>
          </div>
          <button 
            onClick={() => soundEnabled ? setSoundEnabled(false) : unlockAudio()}
            className="lg:hidden p-2 text-neutral-400 hover:text-white transition-colors"
          >
            {soundEnabled ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {!audioUnlocked && (
            <button 
              onClick={unlockAudio}
              className="bg-amber-500 text-black px-4 py-2 rounded-xl text-xs font-black animate-pulse"
            >
              ACTIVATE SOUND
            </button>
          )}
          <div className="flex bg-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => setView('active')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                view === 'active' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              ACTIEF ({allOrders.filter(o => ['pending', 'in-progress'].includes(o.status)).length})
            </button>
            <button
              onClick={() => setView('completed')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                view === 'completed' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              HISTORIE
            </button>
          </div>

          <div className="h-8 w-px bg-neutral-800 hidden md:block" />

          <div className="flex bg-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === 'all' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              ALLES
            </button>
            <button
              onClick={() => setFilter('food')}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === 'food' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Utensils className="w-3 h-3" /> ETEN
            </button>
            <button
              onClick={() => setFilter('drinks')}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === 'drinks' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Beer className="w-3 h-3" /> DRANK
            </button>
          </div>

          <button 
            onClick={() => soundEnabled ? setSoundEnabled(false) : unlockAudio()}
            className="hidden lg:flex items-center gap-2 px-4 py-2 bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-colors"
          >
            {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            <span className="text-xs font-bold">{soundEnabled ? (audioUnlocked ? 'AAN' : 'READY') : 'UIT'}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Prep Summary Sidebar */}
        {view === 'active' && prepSummary.length > 0 && (
          <aside className="xl:w-64 shrink-0 bg-neutral-800/50 rounded-[2rem] p-6 border border-neutral-800 h-fit sticky top-32">
            <div className="flex items-center gap-2 mb-6">
              <Utensils className="w-5 h-5 text-neutral-400" />
              <h2 className="text-sm font-black uppercase tracking-widest text-neutral-400">Prep Summary</h2>
            </div>
            <div className="space-y-3">
              {prepSummary.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between bg-neutral-900/50 p-3 rounded-xl border border-neutral-800">
                  <span className="text-sm font-bold text-neutral-300 truncate mr-2">{name}</span>
                  <span className="bg-white text-black text-xs font-black px-2 py-1 rounded-md min-w-[1.5rem] text-center">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        )}

        <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full text-center py-32">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-neutral-800 rounded-full mb-6">
                <ChefHat className="w-10 h-10 text-neutral-600" />
              </div>
              <h2 className="text-xl font-bold text-neutral-400">Geen bestellingen gevonden</h2>
              <p className="text-neutral-600 mt-2">Zodra er een bestelling binnenkomt, verschijnt deze hier.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const colorClass = getWaitTimeColor(order.timestamp, (order as any).priority);
              const waitTimeMs = now - order.timestamp;
              const waitTimeMinutes = Math.floor(waitTimeMs / 1000 / 60);
              const waitTimeSeconds = Math.floor((waitTimeMs / 1000) % 60);
              const isPriority = (order as any).priority;
              
              return (
                <div 
                  key={order.id} 
                  className={`rounded-3xl border-2 p-6 shadow-2xl flex flex-col h-full transition-all duration-300 ${colorClass} backdrop-blur-sm relative overflow-hidden group`}
                >
                  {isPriority && (
                    <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                      PRIORITY
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-6 pb-4 border-b border-white/10">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 block mb-1">Tafel</span>
                      <span className="text-5xl font-black tracking-tighter">{order.tableNumber}</span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-xs font-black opacity-50 justify-end mb-2">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(order.timestamp), 'HH:mm:ss')}
                      </div>
                      {view === 'active' && (
                        <div className={`text-2xl font-black font-mono tabular-nums ${waitTimeMinutes >= 10 && !isPriority ? 'animate-pulse text-red-500' : ''}`}>
                          {waitTimeMinutes.toString().padStart(2, '0')}:{waitTimeSeconds.toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 mb-8">
                    <ul className="space-y-4">
                      {order.items
                        .filter(item => {
                          if (filter === 'all') return true;
                          if (filter === 'food') return !item.category || item.category.toLowerCase() !== 'drinks';
                          if (filter === 'drinks') return item.category && item.category.toLowerCase() === 'drinks';
                          return true;
                        })
                        .map((item, idx) => {
                          const isChecked = checkedItems[order.id]?.[idx];
                          return (
                            <li 
                              key={idx} 
                              className={`flex items-start gap-4 cursor-pointer transition-opacity ${isChecked ? 'opacity-30' : 'opacity-100'}`}
                              onClick={() => toggleItemCheck(order.id, idx)}
                            >
                              <div className={`px-2 py-1 rounded-lg text-sm font-black min-w-[2.5rem] text-center transition-colors ${isChecked ? 'bg-white/5' : 'bg-white/10'}`}>
                                {item.quantity}x
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-xl font-bold leading-tight ${isChecked ? 'line-through' : ''}`}>{item.name}</span>
                                {item.category && (
                                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                    </ul>
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/10 flex gap-3">
                    {view === 'active' && (
                      <>
                        <button
                          onClick={() => togglePriority(order.id, isPriority)}
                          className={`p-4 rounded-2xl transition-all active:scale-95 border-2 ${
                            isPriority 
                              ? 'bg-purple-500 border-purple-400 text-white' 
                              : 'bg-transparent border-white/10 text-white/50 hover:text-white hover:border-white/30'
                          }`}
                          title="Toggle Priority"
                        >
                          <Bell className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="flex-1 bg-white text-black hover:bg-neutral-200 font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl"
                        >
                          <CheckCircle2 className="w-6 h-6" />
                          AFWERKEN
                        </button>
                      </>
                    )}
                    {view === 'completed' && (
                      <div className="w-full text-center">
                        <span className="text-xs font-bold opacity-50 italic">
                          Afgewerkt om {order.completedAt ? format(new Date(order.completedAt), 'HH:mm') : 'onbekend'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}
