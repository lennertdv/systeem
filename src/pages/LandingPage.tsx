import React from 'react';
import { ShieldCheck, Zap, Globe, Smartphone, BarChart3, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-black tracking-tight">OrderFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="/super-admin" className="px-5 py-2 bg-white text-black rounded-full hover:bg-neutral-200 transition-all">Super Admin</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-neutral-400 mb-8">
            <Zap className="w-3 h-3 text-amber-500" />
            The Future of Restaurant Management
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            DIGITALE MENU'S<br />
            <span className="text-neutral-500 italic">HERUITGEVONDEN.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-neutral-400 mb-12 leading-relaxed">
            Geef je restaurant een boost met QR-bestellingen, real-time keukenbeheer en diepgaande analytics. Alles in één krachtig platform.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button className="w-full md:w-auto px-8 py-4 bg-white text-black font-black rounded-2xl hover:scale-105 transition-all">
              Start Gratis Proefperiode
            </button>
            <button className="w-full md:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all">
              Bekijk Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:bg-white/[0.04] transition-all">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
              <Smartphone className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-xl font-bold mb-4">QR Bestellingen</h3>
            <p className="text-neutral-500 leading-relaxed">Laat klanten direct vanaf hun tafel bestellen en betalen. Geen wachttijden meer.</p>
          </div>
          <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:bg-white/[0.04] transition-all">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
              <Clock className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-xl font-bold mb-4">Real-time Keuken</h3>
            <p className="text-neutral-500 leading-relaxed">Directe synchronisatie tussen zaal en keuken. Minimaliseer fouten en versnel de service.</p>
          </div>
          <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:bg-white/[0.04] transition-all">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
              <BarChart3 className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-xl font-bold mb-4">Diepe Analytics</h3>
            <p className="text-neutral-500 leading-relaxed">Krijg inzicht in je best verkopende gerechten, drukste uren en totale omzet.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <div className="max-w-7xl mx-auto">
          <p className="text-neutral-600 text-sm font-bold uppercase tracking-widest">
            © 2026 Systeem Seven. Alle rechten voorbehouden.
          </p>
        </div>
      </footer>
    </div>
  );
}
