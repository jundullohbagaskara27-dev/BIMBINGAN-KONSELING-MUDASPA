import React, { useState } from 'react';
import { motion } from 'motion/react';
import BkLogo from './BkLogo.tsx';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'JUNDI123') {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-600 via-purple-600 to-indigo-800 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <BkLogo className="w-24 h-24 drop-shadow-lg" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">BK MUDASPA</h1>
              <p className="text-indigo-600 font-bold text-sm tracking-wide">BIMBINGAN & KONSELING</p>
              <p className="text-slate-500 text-xs font-medium mt-0.5">SMA MUHAMMADIYYAH SINGAPARNA</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-slate-700 font-semibold mb-2 text-sm">Password Akses</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password..." 
                  className={`w-full p-4 bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                />
                {error && <p className="text-red-500 text-xs mt-2 font-medium">Password yang Anda masukkan salah!</p>}
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                Masuk ke Dashboard
              </button>
            </form>
          </div>
          
          <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">© Jundi Jundulloh 2026</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
