import React, { useState } from 'react';
import { useMenu } from '../../../hooks/useMenu';
import { MenuItem, Category } from '../../../types';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';

export default function MenuTab() {
  const { menuItems, categories, loading } = useMenu();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    imageUrl: '',
    soldOut: false,
  });

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        categoryId: item.categoryId,
        imageUrl: item.imageUrl,
        soldOut: item.soldOut,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        categoryId: categories[0]?.id || '',
        imageUrl: '',
        soldOut: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    const data = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      categoryId: formData.categoryId,
      imageUrl: formData.imageUrl,
      soldOut: formData.soldOut,
    };

    try {
      if (editingItem) {
        await updateDoc(doc(db, 'menu_items', editingItem.id), data);
      } else {
        await addDoc(collection(db, 'menu_items'), data);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Failed to save menu item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, 'menu_items', id));
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  const toggleSoldOut = async (item: MenuItem) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'menu_items', item.id), { soldOut: !item.soldOut });
    } catch (error) {
      console.error('Error toggling sold out status:', error);
    }
  };

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !categoryName.trim()) return;
    try {
      await addDoc(collection(db, 'categories'), {
        name: categoryName.trim(),
        order: categories.length
      });
      setIsCategoryModalOpen(false);
      setCategoryName('');
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category');
    }
  };

  if (loading) return <div>Loading menu items...</div>;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Menu Management</h2>
          <p className="text-neutral-500 mt-1">Add, edit, or remove items from your menu.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-white border border-neutral-200 text-neutral-900 px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-neutral-50 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-neutral-900 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100 text-sm font-medium text-neutral-500">
              <th className="p-4">Item</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {menuItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-500">No menu items found.</td>
              </tr>
            ) : (
              menuItems.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-neutral-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-neutral-900">{item.name}</div>
                        <div className="text-xs text-neutral-500 truncate max-w-[200px]">{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-neutral-600">
                    {categories.find(c => c.id === item.categoryId)?.name || 'Unknown'}
                  </td>
                  <td className="p-4 text-sm font-medium text-neutral-900">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleSoldOut(item)}
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                        item.soldOut 
                          ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {item.soldOut ? 'Sold Out' : 'Available'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-neutral-900 mb-6">
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                  >
                    <option value="" disabled>Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="soldOut"
                  checked={formData.soldOut}
                  onChange={(e) => setFormData({...formData, soldOut: e.target.checked})}
                  className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <label htmlFor="soldOut" className="text-sm font-medium text-neutral-700">Mark as Sold Out</label>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                >
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCategoryModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-neutral-900 mb-6">Add Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="e.g. Starters, Mains, Drinks"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
