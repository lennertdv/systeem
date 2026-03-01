import { useState, useEffect } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { MenuItem, OrderItem } from '../../types';
import { ShoppingBag, Plus, Minus, ChefHat, Store } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';

// Initialize Stripe outside of component to avoid recreating it
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_dummy');

export default function CustomerView() {
  const { menuItems, categories, loading: menuLoading } = useMenu();
  const { settings, loading: settingsLoading } = useStoreSettings();
  
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  
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
    setIsInitializingPayment(true);
    
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total }),
      });
      
      const data = await response.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        alert('Failed to initialize payment. Please try again.');
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert('Failed to connect to payment server.');
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

  if (menuLoading || settingsLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading menu...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-32">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-900">
            <ChefHat className="w-6 h-6" />
            <h1 className="font-bold text-xl tracking-tight">Bistro Live</h1>
          </div>
          {!settings.isOpen ? (
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
              <Store className="w-4 h-4" /> Closed
            </span>
          ) : (
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <ShoppingBag className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Menu Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
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

        {categories.length === 0 ? (
          <div className="text-center text-neutral-500 py-12">No menu items available.</div>
        ) : (
          categories.map((category) => {
            const items = menuItems.filter((item) => item.categoryId === category.id);
            if (items.length === 0) return null;

            return (
              <section key={category.id} className="mb-10">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">{category.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className={`bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex gap-4 ${item.soldOut ? 'opacity-60 grayscale' : ''}`}
                    >
                      {item.imageUrl ? (
                        <div className="w-24 h-24 rounded-xl bg-neutral-200 shrink-0 overflow-hidden">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-neutral-100 shrink-0 flex items-center justify-center text-neutral-400">
                          No Image
                        </div>
                      )}
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-semibold text-neutral-900">{item.name}</h3>
                            <span className="font-medium text-neutral-900">${item.price.toFixed(2)}</span>
                          </div>
                          <p className="text-sm text-neutral-500 line-clamp-2">{item.description}</p>
                        </div>
                        
                        <div className="flex justify-end mt-2">
                          {item.soldOut ? (
                            <span className="text-sm font-medium text-red-500 bg-red-50 px-2 py-1 rounded-md">Sold Out</span>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              disabled={!settings.isOpen}
                              className="bg-neutral-900 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
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
