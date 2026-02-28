import { useState } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { MenuItem, OrderItem } from '../../types';
import { ShoppingBag, Plus, Minus, ChefHat } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function CustomerView() {
  const { menuItems, categories, loading } = useMenu();
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const addToCart = (item: MenuItem) => {
    if (item.soldOut) return;
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

  const submitOrder = async () => {
    if (!tableNumber || cart.length === 0 || !db) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        tableNumber,
        items: cart,
        status: 'pending',
        totalPrice: total,
        timestamp: Date.now(),
      });
      setCart([]);
      setTableNumber('');
      setOrderSuccess(true);
      setIsCartOpen(false);
      setTimeout(() => setOrderSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading menu...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-900">
            <ChefHat className="w-6 h-6" />
            <h1 className="font-bold text-xl tracking-tight">Bistro Live</h1>
          </div>
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
        </div>
      </header>

      {/* Menu Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {orderSuccess && (
          <div className="bg-green-50 text-green-800 p-4 rounded-xl mb-8 flex items-center justify-center font-medium">
            Order placed successfully! The kitchen is preparing your food.
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
                              className="bg-neutral-900 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
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

      {/* Cart Modal/Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Your Order</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-neutral-500 hover:text-neutral-900">
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
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
                  className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <button
                onClick={submitOrder}
                disabled={cart.length === 0 || !tableNumber || isSubmitting}
                className="w-full bg-neutral-900 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Footer Links for Testing */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-neutral-400">
        <div className="flex items-center justify-center gap-4">
          <a href="/kitchen" className="hover:text-neutral-900 transition-colors">Kitchen View</a>
          <span>&bull;</span>
          <a href="/admin" className="hover:text-neutral-900 transition-colors">Admin Dashboard</a>
        </div>
      </footer>
    </div>
  );
}
