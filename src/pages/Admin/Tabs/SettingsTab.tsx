import React, { useState } from 'react';
import { useStoreSettings } from '../../../hooks/useStoreSettings';
import { Save, Store, Globe, Mail, MapPin, CreditCard } from 'lucide-react';

export default function SettingsTab() {
  const { settings, updateSettings } = useStoreSettings();
  const [formData, setFormData] = useState(settings);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateSettings(formData);
    setSaving(false);
    alert('Settings saved successfully!');
  };

  return (
    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-neutral-900 tracking-tight uppercase">Restaurant Settings</h2>
        <p className="text-neutral-500 font-medium">Configure your restaurant's profile and preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-neutral-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <Store className="w-3 h-3" /> Restaurant Name
              </label>
              <input
                type="text"
                value={formData.restaurantName || ''}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-bold"
                placeholder="Bistro Live"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <Globe className="w-3 h-3" /> Logo URL
              </label>
              <input
                type="text"
                value={formData.logoUrl || ''}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-bold"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
              <Mail className="text-neutral-400 w-3 h-3" /> Contact Email
            </label>
            <input
              type="email"
              value={formData.contactEmail || ''}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-bold"
              placeholder="hello@bistrolive.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
              <MapPin className="text-neutral-400 w-3 h-3" /> Address
            </label>
            <textarea
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-bold min-h-[100px]"
              placeholder="123 Culinary Street, Food City"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
              <CreditCard className="text-neutral-400 w-3 h-3" /> Currency Symbol
            </label>
            <input
              type="text"
              value={formData.currency || ''}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-bold"
              placeholder="€"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-neutral-900 text-white py-4 rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-neutral-900/20"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
