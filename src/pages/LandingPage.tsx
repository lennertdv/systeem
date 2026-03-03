import React from 'react';
import { ShieldCheck, Zap, Globe, Smartphone, BarChart3, Clock, Check, ArrowRight, Users, Mail, MapPin, Phone } from 'lucide-react';

export default function LandingPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-black tracking-tight">OrderFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-neutral-400">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button>
            <button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">Over Ons</button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors">Contact</button>
            <a href="/super-admin/login" className="px-5 py-2 bg-white text-black rounded-full hover:bg-neutral-200 transition-all">Super Admin</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0,transparent_70%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-neutral-400 mb-8">
            <Zap className="w-3 h-3 text-amber-500" />
            The Future of Restaurant Management
          </div>
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.85]">
            DIGITALE MENU'S<br />
            <span className="text-neutral-500 italic">HERUITGEVONDEN.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-neutral-400 mb-12 leading-relaxed">
            Geef je restaurant een boost met QR-bestellingen, real-time keukenbeheer en diepgaande analytics. Alles in één krachtig platform.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button className="w-full md:w-auto px-10 py-5 bg-white text-black font-black rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2">
              Start Gratis Proefperiode <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full md:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all">
              Bekijk Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">ALLES WAT JE NODIG HEBT.</h2>
            <p className="text-neutral-500 text-lg max-w-xl">Een compleet ecosysteem ontworpen om de efficiëntie van je restaurant te maximaliseren.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] hover:bg-white/[0.04] transition-all group">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Smartphone className="w-7 h-7 text-neutral-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">QR Bestellingen</h3>
              <p className="text-neutral-500 leading-relaxed text-lg">Laat klanten direct vanaf hun tafel bestellen en betalen via hun eigen smartphone. Geen apps nodig, gewoon scannen en bestellen.</p>
            </div>
            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] hover:bg-white/[0.04] transition-all group">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7 text-neutral-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Real-time Keuken</h3>
              <p className="text-neutral-500 leading-relaxed text-lg">Directe synchronisatie tussen zaal en keuken. Bestellingen verschijnen onmiddellijk op het keukenscherm voor maximale snelheid.</p>
            </div>
            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] hover:bg-white/[0.04] transition-all group">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7 text-neutral-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Diepe Analytics</h3>
              <p className="text-neutral-500 leading-relaxed text-lg">Krijg inzicht in je best verkopende gerechten, drukste uren en totale omzet. Neem beslissingen op basis van echte data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">EENVOUDIGE PRIJZEN.</h2>
            <p className="text-neutral-500 text-lg">Geen verborgen kosten. Kies het plan dat bij jouw restaurant past.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="p-10 border border-white/10 rounded-[3rem] flex flex-col">
              <h3 className="text-xl font-bold mb-2">Starter</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black">€49</span>
                <span className="text-neutral-500">/maand</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-neutral-400"><Check className="w-5 h-5 text-emerald-500" /> Digitaal Menu</li>
                <li className="flex items-center gap-3 text-neutral-400"><Check className="w-5 h-5 text-emerald-500" /> QR Code Generatie</li>
                <li className="flex items-center gap-3 text-neutral-400"><Check className="w-5 h-5 text-emerald-500" /> Basis Analytics</li>
              </ul>
              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all">Kies Starter</button>
            </div>
            {/* Pro */}
            <div className="p-10 bg-white text-black rounded-[3rem] flex flex-col scale-105 shadow-2xl shadow-white/5">
              <div className="inline-flex self-start px-3 py-1 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-widest mb-4">Populair</div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black">€99</span>
                <span className="text-neutral-700">/maand</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 font-bold"><Check className="w-5 h-5 text-black" /> Alles in Starter</li>
                <li className="flex items-center gap-3 font-bold"><Check className="w-5 h-5 text-black" /> QR Bestellingen</li>
                <li className="flex items-center gap-3 font-bold"><Check className="w-5 h-5 text-black" /> Keuken Scherm</li>
                <li className="flex items-center gap-3 font-bold"><Check className="w-5 h-5 text-black" /> Geavanceerde Analytics</li>
              </ul>
              <button className="w-full py-4 bg-black text-white rounded-2xl font-black hover:opacity-90 transition-all">Kies Pro</button>
            </div>
            {/* Enterprise */}
            <div className="p-10 border border-white/10 rounded-[3rem] flex flex-col">
              <h3 className="text-xl font-bold mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black">€199</span>
                <span className="text-neutral-500">/maand</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-neutral-400"><Check className="w-5 h-5 text-emerald-500" /> Alles in Pro</li>
                <li className="flex items-center gap-3 text-neutral-400"><Check className="w-5 h-5 text-emerald-500" /> Multi-locatie Beheer</li>
                <li className="flex items-center gap-3 text-neutral-400"><Check className="w-5 h-5 text-emerald-500" /> Custom Integraties</li>
                <li className="flex items-center gap-3 text-neutral-400"><Check className="w-5 h-5 text-emerald-500" /> 24/7 Support</li>
              </ul>
              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all">Kies Enterprise</button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">WIJ ZIJN SYSTEEM SEVEN.</h2>
            <p className="text-neutral-400 text-lg leading-relaxed mb-6">
              Systeem Seven is een Belgisch technologiebedrijf dat zich richt op het moderniseren van de horecasector. Wij geloven dat technologie de menselijke ervaring in restaurants moet versterken, niet vervangen.
            </p>
            <p className="text-neutral-400 text-lg leading-relaxed mb-10">
              Onze missie is om restauranthouders de tools te geven die ze nodig hebben om te floreren in een digitale wereld, terwijl ze zich kunnen blijven concentreren op wat ze het beste doen: geweldig eten serveren.
            </p>
            <div className="flex items-center gap-8">
              <div>
                <div className="text-3xl font-black mb-1">50+</div>
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Restaurants</div>
              </div>
              <div>
                <div className="text-3xl font-black mb-1">10k+</div>
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Bestellingen</div>
              </div>
              <div>
                <div className="text-3xl font-black mb-1">99.9%</div>
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Uptime</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-white/5 rounded-[4rem] overflow-hidden border border-white/10 flex items-center justify-center p-12">
              <Users className="w-32 h-32 text-neutral-800" />
            </div>
            <div className="absolute -bottom-10 -left-10 p-8 bg-white text-black rounded-3xl shadow-2xl">
              <p className="font-black text-xl mb-1">"De horeca van morgen."</p>
              <p className="text-sm font-bold opacity-60">- Lennert Devlaminck, Founder</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 px-6 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            <div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">LATEN WE PRATEN.</h2>
              <p className="text-neutral-400 text-lg mb-12">Klaar om je restaurant te transformeren? Neem contact met ons op voor een vrijblijvende demo of meer informatie.</p>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                    <Mail className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Email</div>
                    <div className="font-bold">info@systeem-seven.be</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                    <Phone className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Telefoon</div>
                    <div className="font-bold">+32 470 00 00 00</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                    <MapPin className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Locatie</div>
                    <div className="font-bold">Gent, België</div>
                  </div>
                </div>
              </div>
            </div>
            <form className="space-y-6 p-10 bg-white/[0.02] border border-white/5 rounded-[3rem]">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Naam</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Email</label>
                  <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all" placeholder="john@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Bericht</label>
                <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all" placeholder="Hoe kunnen we je helpen?"></textarea>
              </div>
              <button type="button" className="w-full py-4 bg-white text-black font-black rounded-2xl hover:opacity-90 transition-all">Verstuur Bericht</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <span className="text-lg font-black tracking-tight">OrderFlow</span>
          </div>
          <div className="flex items-center gap-8 text-xs font-bold text-neutral-500 uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
          <p className="text-neutral-600 text-xs font-bold uppercase tracking-widest">
            © 2026 Systeem Seven. Crafted in Belgium.
          </p>
        </div>
      </footer>
    </div>
  );
}
