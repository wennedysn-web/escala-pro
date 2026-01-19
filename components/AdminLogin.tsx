
import React, { useState } from 'react';

interface Props {
  onLogin: (u: string, p: string) => boolean;
}

const AdminLogin: React.FC<Props> = ({ onLogin }) => {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(u, p)) {
      setError(true);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-10 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-emerald-500 to-indigo-600"></div>
      
      <div className="text-center mb-10">
        <div className="inline-block p-4 bg-slate-800 rounded-2xl border border-slate-700 mb-4 shadow-inner">
           <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-3xl font-black text-slate-100 tracking-tighter">Acesso Restrito</h2>
        <p className="text-slate-500 text-sm mt-1">Identifique-se para gerenciar as escalas</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Usuário</label>
          <input 
            type="text" value={u} onChange={e => setU(e.target.value)}
            className="w-full p-4 bg-slate-800 border border-slate-700 text-white rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow shadow-sm"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Senha</label>
          <input 
            type="password" value={p} onChange={e => setP(e.target.value)}
            className="w-full p-4 bg-slate-800 border border-slate-700 text-white rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow shadow-sm"
            autoComplete="current-password"
          />
        </div>
        
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center space-x-2">
            <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-rose-400 text-xs font-bold">Credenciais inválidas.</p>
          </div>
        )}

        <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] transform">
          Autenticar
        </button>
      </form>
      
      <div className="mt-8 pt-8 border-t border-slate-800 flex justify-center">
         <span className="text-[10px] font-medium text-slate-600 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 uppercase tracking-tight">Dica: admin / tododia</span>
      </div>
    </div>
  );
};

export default AdminLogin;
