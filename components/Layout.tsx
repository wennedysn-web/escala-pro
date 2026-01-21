
import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      <header className="bg-slate-900 border-b border-slate-800 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-600/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter">EscalaPro <span className="text-indigo-500 text-xs font-medium ml-1">v2.0</span></h1>
          </div>
          <nav className="hidden md:flex space-x-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <a href="#" className="hover:text-indigo-400 transition-colors">Dashboard</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Equipe</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Configurações</a>
          </nav>
        </div>
      </header>
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>
      <footer className="bg-slate-950 border-t border-slate-900 py-10 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">ESCALAPRO - DESENV: WENNEDYS NUNES</p>
      </footer>
    </div>
  );
};

export default Layout;
