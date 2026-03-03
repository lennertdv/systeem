import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const impersonating = sessionStorage.getItem('superadmin_impersonating');
    const name = sessionStorage.getItem('superadmin_restaurant_name');
    if (impersonating === 'true') {
      setIsImpersonating(true);
      setRestaurantName(name || 'dit restaurant');
    }
  }, []);

  const handleReturn = async () => {
    await signOut(auth);
    sessionStorage.removeItem('superadmin_impersonating');
    sessionStorage.removeItem('superadmin_restaurant_slug');
    sessionStorage.removeItem('superadmin_restaurant_name');
    navigate('/super-admin');
  };

  if (!isImpersonating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-black px-4 py-2.5 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2 text-sm font-bold">
        <ShieldCheck className="w-4 h-4" />
        <span>
          Super Admin modus — Je bekijkt het dashboard van{' '}
          <span className="underline">{restaurantName}</span>
        </span>
      </div>
      <button
        onClick={handleReturn}
        className="flex items-center gap-2 text-sm font-black bg-black/20 hover:bg-black/30 px-4 py-1.5 rounded-lg transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Terug naar Super Admin
      </button>
    </div>
  );
}
