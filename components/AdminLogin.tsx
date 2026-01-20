
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-10 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-emerald-500 to-indigo-600"></div>
      
      <div className="text-center mb-10">
        <div className="inline-block p-4 bg-slate-800 rounded-2xl border border-slate-700 mb-4 shadow-inner">
           <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-3xl font-black text-slate-100 tracking-tighter">Login Seguro</h2>
        <p className="text-slate-500 text-sm mt-1">Acesso administrativo via Supabase Auth</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">E-mail</label>
          <input 
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full p-4 bg-slate-800 border border-slate-700 text-white rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            placeholder="admin@exemplo.com"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Senha</label>
          <input 
            type="password" required value={password} onChange={e => setPassword(e.target.value)}
            className="w-full p-4 bg-slate-800 border border-slate-700 text-white rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            placeholder="••••••••"
          />
        </div>
        
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center space-x-3">
            <svg className="w-5 h-5 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-rose-400 text-xs font-bold leading-tight">{error}</p>
          </div>
        )}

        <button 
          disabled={loading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] transform"
        >
          {loading ? "Verificando..." : "Autenticar"}
        </button>
      </form>
      
      <div className="mt-8 pt-8 border-t border-slate-800 text-center">
         <p className="text-[9px] text-slate-600 uppercase tracking-widest leading-relaxed">
            As políticas de RLS garantem que apenas usuários autenticados possam modificar a escala.
         </p>
      </div>
    </div>
  );
};

export default AdminLogin;
