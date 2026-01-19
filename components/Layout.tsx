
import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-white p-1.5 rounded-lg">
              <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">EscalaPro <span className="text-indigo-200 font-light text-sm ml-1">v1.0</span></h1>
          </div>
          <nav className="hidden md:flex space-x-6 text-sm font-medium">
            <a href="#" className="hover:text-indigo-200 transition">Dashboard</a>
            <a href="#" className="hover:text-indigo-200 transition">Funcionários</a>
            <a href="#" className="hover:text-indigo-200 transition">Configurações</a>
          </nav>
        </div>
      </header>
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>
      <footer className="bg-white border-t py-6 text-center text-slate-400 text-sm">
        &copy; 2024 EscalaPro Intelligence Systems. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default Layout;
