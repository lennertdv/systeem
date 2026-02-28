import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-6 mx-auto">
          <Lock className="w-8 h-8 text-neutral-600" />
        </div>
        <h1 className="text-2xl font-bold text-center text-neutral-900 mb-6">
          Admin Login
        </h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white py-3 rounded-xl font-medium disabled:opacity-50 hover:bg-neutral-800 transition-colors mt-6"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
