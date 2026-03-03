import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tighter">Systeem</div>
          <button 
            onClick={() => navigate('/super-admin')}
            className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Super Admin
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
            Het slimste bestelsysteem voor restaurants
          </h1>
          <p className="text-xl text-neutral-500 mb-10 max-w-2xl mx-auto">
            Digitale menukaarten, realtime bestellingen en keukenweergave — alles in één platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto px-8 py-4 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all">
              Vraag een demo
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white border border-neutral-200 rounded-2xl font-bold hover:bg-neutral-50 transition-all">
              Meer info
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="text-4xl">📱</div>
              <h3 className="text-xl font-bold">Digitale menukaart</h3>
              <p className="text-neutral-500 leading-relaxed">
                Klanten scannen een QR-code en bestellen direct vanaf hun eigen telefoon. Geen wachttijden meer.
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-4xl">🍳</div>
              <h3 className="text-xl font-bold">Keuken display</h3>
              <p className="text-neutral-500 leading-relaxed">
                Realtime bestellingen direct op het keukenscherm. Georganiseerd, snel en foutloos.
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-4xl">📊</div>
              <h3 className="text-xl font-bold">Analytics</h3>
              <p className="text-neutral-500 leading-relaxed">
                Inzicht in omzet, populaire gerechten en piekuren. Neem beslissingen op basis van data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-8">Klaar om te starten?</h2>
          <button className="px-10 py-4 bg-white text-neutral-900 rounded-2xl font-bold hover:bg-neutral-100 transition-all">
            Neem contact op
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-neutral-400">
          © 2025 Systeem. Alle rechten voorbehouden.
        </div>
      </footer>
    </div>
  );
}
