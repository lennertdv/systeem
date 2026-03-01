import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMenu } from '../../hooks/useMenu';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { MenuItem, OrderItem } from '../../types';
import { ShoppingBag, Plus, Minus, ChefHat, Store, LayoutDashboard, UtensilsCrossed, Search, Star, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';

// Initialize Stripe outside of component to avoid recreating it
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublicKey) {
  console.warn('VITE_STRIPE_PUBLIC_KEY is not set. Payment will not work correctly.');
}
const stripePromise = loadStripe(stripePublicKey || 'pk_test_dummy');

export default function CustomerView() {
  const { menuItems, categories, loading: menuLoading } = useMenu();
  const { settings, loading: settingsLoading } = useStoreSettings();
  
  const [cart, setCart] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem('bistro_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState(() => {
    return localStorage.getItem('bistro_table') || '';
  });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Persist cart and table number
  useEffect(() => {
    localStorage.setItem('bistro_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('bistro_table', tableNumber);
  }, [tableNumber]);

  // Handle Stripe redirect return
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const paymentIntent = query.get('payment_intent');
    const status = query.get('redirect_status');

    if (paymentIntent && status === 'succeeded' && cart.length > 0) {
      handleFinalizeOrder(paymentIntent);
    }
  }, []);

  const handleFinalizeOrder = async (paymentIntentId: string) => {
    if (isProcessingReturn) return;
    setIsProcessingReturn(true);
    
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      
      if (!db) throw new Error('Database not initialized');

      const { getDocs, query: firestoreQuery, where } = await import('firebase/firestore');
      const existingOrders = await getDocs(
        firestoreQuery(collection(db, 'orders'), where('paymentIntentId', '==', paymentIntentId))
      );

      if (!existingOrders.empty) {
        console.log('Order already exists for this payment intent');
        setCart([]);
        setTableNumber('');
        localStorage.removeItem('bistro_cart');
        localStorage.removeItem('bistro_table');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      await addDoc(collection(db, 'orders'), {
        tableNumber,
        items: cart,
        status: 'pending',
        totalPrice: total,
        timestamp: Date.now(),
        paymentIntentId,
      });

      // Clear everything
      setCart([]);
      setTableNumber('');
      localStorage.removeItem('bistro_cart');
      localStorage.removeItem('bistro_table');
      setOrderSuccess(true);
      setIsCartOpen(false);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setTimeout(() => setOrderSuccess(false), 5000);
    } catch (err) {
      console.error('Error finalizing order:', err);
      alert('Payment succeeded but failed to save order. Please show your confirmation to staff.');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  // Stripe state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);

  const addToCart = (item: MenuItem) => {
    if (item.soldOut || !settings.isOpen) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.menuItemId === id) {
          const newQ = item.quantity + delta;
          return newQ > 0 ? { ...item, quantity: newQ } : item;
        }
        return item;
      }).filter((item) => item.quantity > 0);
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const startCheckout = async () => {
    if (!tableNumber || cart.length === 0) return;
    
    if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      alert('Stripe public key is missing. Please add VITE_STRIPE_PUBLIC_KEY to your Vercel environment variables.');
      return;
    }

    setIsInitializingPayment(true);
    
    try {
      const apiUrl = `${window.location.origin}/api/create-payment-intent`;
      console.log('Starting checkout with URL:', apiUrl, 'Amount:', total);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total }),
      });
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = `Server responded with ${response.status}`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Not JSON, use the status text or first bit of body
          if (text.includes('Method Not Allowed')) {
            errorMessage = 'The payment server does not allow this request method (405). Please check your API configuration.';
          } else if (text.length > 0) {
            errorMessage = `Server Error: ${text.substring(0, 100)}...`;
          }
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('The server returned an invalid response format (not JSON).');
      }

      const data = await response.json();
      
      if (data.clientSecret && typeof data.clientSecret === 'string') {
        console.log('Payment intent created successfully');
        setClientSecret(data.clientSecret);
      } else {
        console.error('Invalid response data:', data);
        throw new Error('The server did not return a valid client secret.');
      }
    } catch (error: any) {
      console.error('Error starting checkout:', error);
      alert(`Failed to connect to payment server: ${error.message || 'Unknown error'}`);
    } finally {
      setIsInitializingPayment(false);
    }
  };

  const handleOrderSuccess = () => {
    setCart([]);
    setTableNumber('');
    setClientSecret(null);
    setOrderSuccess(true);
    setIsCartOpen(false);
    setTimeout(() => setOrderSuccess(false), 5000);
  };

  useEffect(() => {
    const handleScroll = () => {
      const categorySections = categories.map(c => document.getElementById(`category-${c.id}`));
      const scrollPosition = window.scrollY + 150;

      for (let i = categorySections.length - 1; i >= 0; i--) {
        const section = categorySections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveCategory(categories[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const offset = 140; // Header + Category Scroller height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (menuLoading || settingsLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading menu...</div>;
  }

  const filteredMenuItems = searchQuery.trim() === '' 
    ? menuItems 
    : menuItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="min-h-screen bg-neutral-50 pb-32 font-sans selection:bg-neutral-900 selection:text-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-neutral-900"
          >
            <div className="bg-neutral-900 p-1.5 rounded-lg shadow-lg shadow-neutral-900/20">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-black text-xl tracking-tighter uppercase italic">Bistro Live</h1>
          </motion.div>
          <div className="flex items-center gap-3">
            {!tableNumber && settings.isOpen && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setIsCartOpen(true)}
                className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl animate-pulse"
              >
                Set Table
              </motion.button>
            )}
            {tableNumber && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-neutral-200"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Tafel</span>
                <span className="text-sm font-black text-neutral-900">{tableNumber}</span>
              </motion.div>
            )}
            {!settings.isOpen ? (
              <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1">
                <Store className="w-3.5 h-3.5" /> Closed
              </span>
            ) : (
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 text-neutral-900 hover:bg-neutral-100 rounded-2xl transition-all active:scale-90"
              >
                <ShoppingBag className="w-6 h-6" />
                <AnimatePresence>
                  {cart.length > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                    >
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}
          </div>
        </div>

        {/* Search & Category Scroller */}
        <div className="bg-white border-b border-neutral-100">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search our delicious menu..."
                className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:bg-white transition-all"
              />
            </div>
          </div>
          
          {categories.length > 0 && searchQuery.trim() === '' && (
            <div className="overflow-x-auto no-scrollbar border-t border-neutral-50">
              <div className="max-w-4xl mx-auto px-4 flex gap-6 h-12 items-center whitespace-nowrap">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => scrollToCategory(category.id)}
                    className={`text-xs font-black uppercase tracking-widest transition-all relative h-full flex items-center ${
                      activeCategory === category.id ? 'text-neutral-900' : 'text-neutral-400'
                    }`}
                  >
                    {category.name}
                    {activeCategory === category.id && (
                      <motion.div 
                        layoutId="activeCategory"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 rounded-full" 
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Menu Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {searchQuery.trim() === '' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 relative h-48 rounded-[2.5rem] overflow-hidden group shadow-2xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000" 
              alt="Hero" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2"
              >
                Chef's Recommendation
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white text-3xl font-black tracking-tighter leading-none"
              >
                VIBRANT FLAVORS,<br />LIVE COOKING.
              </motion.h2>
            </div>
          </motion.div>
        )}

        {!settings.isOpen && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl mb-8 text-center">
            <Store className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <h2 className="text-lg font-bold">We are currently closed</h2>
            <p className="text-sm mt-1 opacity-80">You can browse our menu, but ordering is temporarily disabled.</p>
          </div>
        )}

        {orderSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl mb-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <ChefHat className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold">Order placed successfully!</h2>
            <p className="text-sm mt-1 opacity-80">The kitchen is preparing your food.</p>
          </div>
        )}

        {filteredMenuItems.length === 0 && searchQuery.trim() !== '' && (
          <div className="text-center py-20">
            <div className="bg-neutral-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-neutral-300" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">No matches found</h3>
            <p className="text-neutral-500 text-sm mt-1">Try searching for something else.</p>
          </div>
        )}

        {categories.length === 0 ? (
          <div className="text-center text-neutral-500 py-12">No menu items available.</div>
        ) : (
          categories.map((category) => {
            const items = filteredMenuItems.filter((item) => item.categoryId === category.id);
            if (items.length === 0) return null;

            return (
              <motion.section 
                key={category.id} 
                id={`category-${category.id}`} 
                className="mb-12 scroll-mt-40"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tight">{category.name}</h2>
                  <div className="h-px bg-neutral-200 flex-1" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <motion.div 
                      key={item.id} 
                      layout
                      className={`group bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-neutral-100 flex gap-4 relative overflow-hidden ${item.soldOut ? 'opacity-60 grayscale' : ''}`}
                    >
                      {item.imageUrl ? (
                        <div className="w-28 h-28 rounded-[1.5rem] bg-neutral-200 shrink-0 overflow-hidden relative">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          {item.soldOut && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">Sold Out</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-28 h-28 rounded-[1.5rem] bg-neutral-100 shrink-0 flex items-center justify-center text-neutral-300">
                          <UtensilsCrossed className="w-8 h-8 opacity-20" />
                        </div>
                      )}
                      
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-neutral-900 text-lg leading-tight">{item.name}</h3>
                            {item.price < 10 && !item.soldOut && (
                              <div className="bg-amber-100 text-amber-700 p-1 rounded-lg" title="Popular Choice">
                                <Star className="w-3 h-3 fill-current" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">{category.name}</p>
                          <p className="text-xs text-neutral-500 line-clamp-2 font-medium leading-relaxed">{item.description}</p>
                        </div>
                        
                        <div className="flex justify-between items-end mt-2">
                          <span className="font-black text-neutral-900 text-xl tracking-tighter">${item.price.toFixed(2)}</span>
                          {!item.soldOut && (
                            <button
                              onClick={() => addToCart(item)}
                              disabled={!settings.isOpen}
                              className="bg-neutral-900 text-white w-12 h-12 rounded-[1.25rem] flex items-center justify-center hover:bg-neutral-800 transition-all active:scale-90 disabled:opacity-50 shadow-xl shadow-neutral-900/20 group-hover:rotate-6"
                            >
                              <Plus className="w-6 h-6" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            );
          })
        )}
      </main>

      {/* Mobile Sticky Cart Bar */}
      {cart.length > 0 && settings.isOpen && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-neutral-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20 md:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-neutral-900 text-white py-3.5 rounded-xl font-medium flex items-center justify-between px-6"
          >
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded-md text-sm">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
              <span>View Order</span>
            </div>
            <span>${total.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Cart Modal/Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !clientSecret && setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">
                {clientSecret ? 'Checkout' : 'Your Order'}
              </h2>
              {!clientSecret && (
                <button onClick={() => setIsCartOpen(false)} className="text-neutral-500 hover:text-neutral-900">
                  Close
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {clientSecret ? (
                <div className="h-full flex flex-col">
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-neutral-500">Table Number</span>
                      <span className="font-bold text-neutral-900">{tableNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Total Amount</span>
                      <span className="font-bold text-neutral-900">${total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                    <CheckoutForm 
                      cart={cart} 
                      total={total} 
                      tableNumber={tableNumber}
                      onSuccess={handleOrderSuccess}
                      onCancel={() => setClientSecret(null)}
                    />
                  </Elements>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center text-neutral-500 mt-12">Your cart is empty</div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral-900">{item.name}</h4>
                        <div className="text-neutral-500">${(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-3 bg-neutral-100 rounded-full px-2 py-1">
                        <button onClick={() => updateQuantity(item.menuItemId, -1)} className="p-1 text-neutral-600 hover:text-neutral-900">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-medium w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.menuItemId, 1)} className="p-1 text-neutral-600 hover:text-neutral-900">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!clientSecret && (
              <div className="p-4 border-t border-neutral-100 bg-neutral-50">
                <div className="flex justify-between mb-4 text-lg font-bold text-neutral-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Table Number</label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <button
                  onClick={startCheckout}
                  disabled={cart.length === 0 || !tableNumber || isInitializingPayment}
                  className="w-full bg-neutral-900 text-white py-3.5 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
                >
                  {isInitializingPayment ? 'Preparing Checkout...' : 'Proceed to Payment'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
