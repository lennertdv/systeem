import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { ShieldAlert, ArrowLeftCircle } from 'lucide-react';

export default function ImpersonationBanner() {
  const navigate = useNavigate();
  const isImpersonating = sessionStorage.getItem('impersonating_as_super_admin');
  const restaurantName = sessionStorage.getItem('impersonating_restaurant_name');

  if (!isImpersonating) return null;

  const handleStopImpersonation = async () => {
    try {
      await signOut(auth!);
      sessionStorage.removeItem('impersonating_as_super_admin');
      sessionStorage.removeItem('impersonating_restaurant_name');
      // Redirect to super admin login
      // We could potentially store a temporary token to auto-login back, 
      // but for security, re-login is safer.
      navigate('/super-admin/login');
    } catch (error) {
      console.error("Error stopping impersonation:", error);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-black px-4 py-2 shadow-lg animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5" />
          <span className="text-sm font-bold">
            ⚠️ Je bekijkt dit als eigenaar van <span className="underline">{restaurantName}</span> — Je bent Super Admin
          </span>
        </div>
        <button
          onClick={handleStopImpersonation}
          className="flex items-center gap-2 bg-black text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-neutral-800 transition-all active:scale-95"
        >
          <ArrowLeftCircle className="w-4 h-4" />
          ← Terug naar Super Admin
        </button>
      </div>
    </div>
  );
}
