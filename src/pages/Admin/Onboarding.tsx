import React, { useState, useEffect } from 'react';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { useRestaurant } from '../../context/RestaurantContext';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Store, 
  Utensils, 
  LayoutGrid, 
  PartyPopper, 
  Upload, 
  Plus, 
  Trash2,
  Globe,
  Phone,
  MapPin,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MenuItemInput {
  name: string;
  description: string;
  price: string;
  category: string;
}

export default function Onboarding() {
  const { restaurantPath, restaurantSlug } = useRestaurant();
  const { settings, updateSettings, loading: settingsLoading } = useStoreSettings(restaurantPath);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Step 2 State
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: '',
    address: '',
    phone: '',
    website: '',
    currency: '€'
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Step 3 State
  const [menuItems, setMenuItems] = useState<MenuItemInput[]>([
    { name: '', description: '', price: '', category: '' },
    { name: '', description: '', price: '', category: '' }
  ]);

  // Step 4 State
  const [tableCount, setTableCount] = useState(10);
  const [tableShape, setTableShape] = useState<'round' | 'square'>('square');

  useEffect(() => {
    if (settings) {
      setRestaurantInfo({
        name: settings.restaurantName || '',
        address: settings.address || '',
        phone: settings.phone || '',
        website: settings.website || '',
        currency: settings.currency || '€'
      });
      if (settings.onboardingStep) {
        setStep(settings.onboardingStep);
      }
    }
  }, [settings]);

  const handleNext = async () => {
    if (!restaurantPath) return;
    setIsSaving(true);
    try {
      if (step === 2) {
        let logoUrl = settings.logoUrl;
        if (logoFile && storage && restaurantSlug) {
          const logoRef = ref(storage, `restaurants/${restaurantSlug}/logo`);
          await uploadBytes(logoRef, logoFile);
          logoUrl = await getDownloadURL(logoRef);
        }
        await updateSettings({
          restaurantName: restaurantInfo.name,
          address: restaurantInfo.address,
          phone: restaurantInfo.phone,
          website: restaurantInfo.website,
          currency: restaurantInfo.currency,
          logoUrl,
          onboardingStep: 3
        });
      } else if (step === 3) {
        if (menuItems.some(item => item.name)) {
          const validItems = menuItems.filter(item => item.name);
          for (const item of validItems) {
            await addDoc(collection(db!, restaurantPath, 'menu_items'), {
              name: item.name,
              description: item.description,
              price: parseFloat(item.price) || 0,
              category: item.category || 'Algemeen',
              available: true,
              image: `https://picsum.photos/seed/${item.name}/400/300`
            });
          }
        }
        await updateSettings({ onboardingStep: 4 });
      } else if (step === 4) {
        const rows = Math.ceil(Math.sqrt(tableCount));
        const cols = Math.ceil(tableCount / rows);
        for (let i = 0; i < tableCount; i++) {
          const row = Math.floor(i / cols);
          const col = i % cols;
          await addDoc(collection(db!, restaurantPath, 'tables'), {
            number: (i + 1).toString(),
            seats: 4,
            status: 'available',
            x: (col + 1) * (100 / (cols + 1)),
            y: (row + 1) * (100 / (rows + 1)),
            shape: tableShape
          });
        }
        await updateSettings({ onboardingStep: 5 });
      }
      setStep(step + 1);
    } catch (error) {
      console.error("Error saving onboarding step:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!restaurantPath) return;
    setIsSaving(true);
    try {
      const nextStep = step + 1;
      await updateSettings({ onboardingStep: nextStep });
      setStep(nextStep);
    } catch (error) {
      console.error("Error skipping step:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = async () => {
    if (!restaurantPath) return;
    setIsSaving(true);
    try {
      await updateSettings({ onboardingCompleted: true });
      window.location.href = '/admin';
    } catch (error) {
      console.error("Error finishing onboarding:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (settingsLoading) return null;

  const steps = [
    { id: 1, title: 'Welkom' },
    { id: 2, title: 'Instellingen' },
    { id: 3, title: 'Menu' },
    { id: 4, title: 'Tafels' },
    { id: 5, title: 'Klaar' }
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-neutral-100 z-50">
        <motion.div 
          className="h-full bg-neutral-900"
          initial={{ width: 0 }}
          animate={{ width: `${(step / 5) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Header */}
      <div className="max-w-4xl mx-auto w-full px-6 pt-12 pb-8 flex justify-between items-center">
        <div className="flex gap-4">
          {steps.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s.id ? 'bg-neutral-900 text-white shadow-lg scale-110' : 
                step > s.id ? 'bg-emerald-500 text-white' : 'bg-neutral-100 text-neutral-400'
              }`}>
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className={`text-xs font-bold uppercase tracking-widest hidden md:block ${
                step === s.id ? 'text-neutral-900' : 'text-neutral-400'
              }`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 pb-24 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="space-y-12 py-12"
            >
              <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tight leading-none">
                  Welkom bij <span className="text-neutral-400">OrderFlow</span>, {restaurantInfo.name || 'Partner'}
                </h1>
                <p className="text-xl text-neutral-500 max-w-2xl">
                  Laten we je restaurant in een paar stappen klaarstomen voor de toekomst van bestellen.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: Store, title: 'Restaurant Setup', desc: 'Stel je logo, adres en valuta in.' },
                  { icon: Utensils, title: 'Menu Items', desc: 'Voeg je gerechten en dranken toe.' },
                  { icon: LayoutGrid, title: 'Tafel Plan', desc: 'Creëer je digitale vloerplan.' }
                ].map((item, i) => (
                  <div key={i} className="p-8 bg-neutral-50 rounded-[2rem] space-y-4 border border-neutral-100">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <item.icon className="w-6 h-6 text-neutral-900" />
                    </div>
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => setStep(2)}
                  className="px-12 py-5 bg-neutral-900 text-white rounded-2xl font-bold text-lg hover:bg-neutral-800 transition-all flex items-center gap-3 active:scale-95 shadow-xl"
                >
                  Aan de slag <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="space-y-12 py-12"
            >
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tight">Jouw restaurant instellen</h2>
                <p className="text-neutral-500">Basisgegevens voor je digitale menukaart.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Restaurant Naam</label>
                    <input 
                      type="text"
                      value={restaurantInfo.name}
                      onChange={e => setRestaurantInfo({...restaurantInfo, name: e.target.value})}
                      className="w-full px-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-all"
                      placeholder="Bijv. Bistro de Haven"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Adres</label>
                    <div className="relative">
                      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input 
                        type="text"
                        value={restaurantInfo.address}
                        onChange={e => setRestaurantInfo({...restaurantInfo, address: e.target.value})}
                        className="w-full pl-14 pr-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-all"
                        placeholder="Straatnaam 123, Stad"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Telefoon</label>
                      <div className="relative">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input 
                          type="text"
                          value={restaurantInfo.phone}
                          onChange={e => setRestaurantInfo({...restaurantInfo, phone: e.target.value})}
                          className="w-full pl-14 pr-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-all"
                          placeholder="06 12345678"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Valuta</label>
                      <select 
                        value={restaurantInfo.currency}
                        onChange={e => setRestaurantInfo({...restaurantInfo, currency: e.target.value})}
                        className="w-full px-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-all appearance-none"
                      >
                        <option value="€">Euro (€)</option>
                        <option value="$">Dollar ($)</option>
                        <option value="£">Pound (£)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Website</label>
                    <div className="relative">
                      <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input 
                        type="text"
                        value={restaurantInfo.website}
                        onChange={e => setRestaurantInfo({...restaurantInfo, website: e.target.value})}
                        className="w-full pl-14 pr-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-all"
                        placeholder="www.jouwrestaurant.nl"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Restaurant Logo</label>
                  <div className="relative group">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full aspect-square bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-[3rem] flex flex-col items-center justify-center gap-4 group-hover:bg-neutral-100 transition-all overflow-hidden relative">
                      {logoPreview || settings.logoUrl ? (
                        <img 
                          src={logoPreview || settings.logoUrl} 
                          alt="Logo Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm">
                            <Upload className="w-8 h-8 text-neutral-400" />
                          </div>
                          <div className="text-center">
                            <p className="font-bold">Upload Logo</p>
                            <p className="text-xs text-neutral-400">PNG, JPG of SVG</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <button 
                  onClick={() => setStep(1)}
                  className="px-8 py-4 text-neutral-500 font-bold flex items-center gap-2 hover:text-neutral-900 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" /> Terug
                </button>
                <button 
                  onClick={handleNext}
                  disabled={isSaving || !restaurantInfo.name}
                  className="px-12 py-4 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? 'Opslaan...' : 'Volgende'} <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="space-y-12 py-12"
            >
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black tracking-tight">Voeg je eerste menu-items toe</h2>
                  <p className="text-neutral-500">Begin met je populairste gerechten.</p>
                </div>
                <button 
                  onClick={handleSkip}
                  className="text-sm font-bold text-neutral-400 hover:text-neutral-900 underline underline-offset-4"
                >
                  Sla over, doe later
                </button>
              </div>

              <div className="space-y-4">
                {menuItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 bg-neutral-50 rounded-3xl border border-neutral-100 group animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Naam</label>
                      <input 
                        type="text"
                        value={item.name}
                        onChange={e => {
                          const newItems = [...menuItems];
                          newItems[index].name = e.target.value;
                          setMenuItems(newItems);
                        }}
                        className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                        placeholder={index === 0 ? "Bijv. Klassieke Burger" : "Bijv. Verse Munt Thee"}
                      />
                    </div>
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Categorie</label>
                      <input 
                        type="text"
                        value={item.category}
                        onChange={e => {
                          const newItems = [...menuItems];
                          newItems[index].category = e.target.value;
                          setMenuItems(newItems);
                        }}
                        className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                        placeholder={index === 0 ? "Hoofdgerechten" : "Dranken"}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Prijs ({restaurantInfo.currency})</label>
                      <input 
                        type="text"
                        value={item.price}
                        onChange={e => {
                          const newItems = [...menuItems];
                          newItems[index].price = e.target.value;
                          setMenuItems(newItems);
                        }}
                        className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                        placeholder="14.50"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-end justify-end">
                      {menuItems.length > 1 && (
                        <button 
                          onClick={() => setMenuItems(menuItems.filter((_, i) => i !== index))}
                          className="p-2 text-neutral-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {menuItems.length < 5 && (
                  <button 
                    onClick={() => setMenuItems([...menuItems, { name: '', description: '', price: '', category: '' }])}
                    className="w-full py-4 border-2 border-dashed border-neutral-200 rounded-3xl text-neutral-400 font-bold hover:border-neutral-900 hover:text-neutral-900 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Item toevoegen
                  </button>
                )}
              </div>

              <div className="flex justify-between pt-8">
                <button 
                  onClick={() => setStep(2)}
                  className="px-8 py-4 text-neutral-500 font-bold flex items-center gap-2 hover:text-neutral-900 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" /> Terug
                </button>
                <button 
                  onClick={handleNext}
                  disabled={isSaving}
                  className="px-12 py-4 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? 'Opslaan...' : 'Volgende'} <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="space-y-12 py-12"
            >
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black tracking-tight">Stel je tafels in</h2>
                  <p className="text-neutral-500">Hoeveel tafels heb je in je restaurant?</p>
                </div>
                <button 
                  onClick={handleSkip}
                  className="text-sm font-bold text-neutral-400 hover:text-neutral-900 underline underline-offset-4"
                >
                  Sla over, doe later
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-12">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Aantal Tafels</label>
                      <span className="text-3xl font-black">{tableCount}</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="30"
                      value={tableCount}
                      onChange={e => setTableCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                    />
                  </div>

                  <div className="space-y-6">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Tafel Vorm</label>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setTableShape('square')}
                        className={`flex-1 py-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                          tableShape === 'square' ? 'border-neutral-900 bg-neutral-900 text-white shadow-xl scale-105' : 'border-neutral-100 text-neutral-400 hover:border-neutral-200'
                        }`}
                      >
                        <div className="w-12 h-12 border-4 border-current rounded-xl" />
                        <span className="font-bold">Vierkant</span>
                      </button>
                      <button 
                        onClick={() => setTableShape('round')}
                        className={`flex-1 py-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                          tableShape === 'round' ? 'border-neutral-900 bg-neutral-900 text-white shadow-xl scale-105' : 'border-neutral-100 text-neutral-400 hover:border-neutral-200'
                        }`}
                      >
                        <div className="w-12 h-12 border-4 border-current rounded-full" />
                        <span className="font-bold">Rond</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-[3rem] p-12 aspect-square border border-neutral-100 relative overflow-hidden">
                  <div className="grid grid-cols-5 gap-4">
                    {Array.from({ length: Math.min(tableCount, 25) }).map((_, i) => (
                      <motion.div 
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className={`aspect-square border-2 border-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-400 ${
                          tableShape === 'round' ? 'rounded-full' : 'rounded-lg'
                        }`}
                      >
                        {i + 1}
                      </motion.div>
                    ))}
                  </div>
                  {tableCount > 25 && (
                    <div className="absolute bottom-6 right-6 bg-neutral-900 text-white px-4 py-2 rounded-full text-xs font-bold">
                      + {tableCount - 25} meer
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <button 
                  onClick={() => setStep(3)}
                  className="px-8 py-4 text-neutral-500 font-bold flex items-center gap-2 hover:text-neutral-900 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" /> Terug
                </button>
                <button 
                  onClick={handleNext}
                  disabled={isSaving}
                  className="px-12 py-4 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? 'Opslaan...' : 'Volgende'} <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-12 py-12 relative"
            >
              {/* Confetti */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 50 }).map((_, i) => (
                  <div 
                    key={i}
                    className="absolute w-2 h-2 rounded-sm animate-confetti"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `-20px`,
                      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
                      animationDelay: `${Math.random() * 3}s`,
                      animationDuration: `${2 + Math.random() * 3}s`
                    }}
                  />
                ))}
              </div>

              <div className="relative">
                <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-bounce-slow">
                  <Check className="w-16 h-16 text-white" strokeWidth={4} />
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center animate-pulse">
                  <PartyPopper className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-5xl font-black tracking-tight">Je bent er klaar voor!</h2>
                <p className="text-xl text-neutral-500 max-w-lg mx-auto">
                  Gefeliciteerd! Je restaurant is nu volledig ingesteld en klaar om bestellingen te ontvangen.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="flex-1 px-8 py-5 bg-neutral-100 text-neutral-900 rounded-2xl font-bold hover:bg-neutral-200 transition-all flex items-center justify-center gap-3"
                >
                  Bekijk mijn menu <ChevronRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleFinish}
                  className="flex-1 px-8 py-5 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  Naar Dashboard <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
