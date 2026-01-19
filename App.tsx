
import React, { useState, useEffect } from 'react';
import { Category, Environment, Employee, Holiday, DaySchedule } from './types';
import PublicView from './components/PublicView';
import AdminView from './components/AdminView';
import AdminLogin from './components/AdminLogin';

const safeParse = (key: string, defaultValue: any) => {
  try {
    const item = localStorage.getItem(key);
    return item && item !== "undefined" ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error parsing ${key}:`, e);
    return defaultValue;
  }
};

const App: React.FC = () => {
  const [view, setView] = useState<'public' | 'admin'>('public');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>(() => safeParse('categories', []));
  const [environments, setEnvironments] = useState<Environment[]>(() => safeParse('environments', [
    { id: 'env-1', name: 'Ambiente A' },
    { id: 'env-2', name: 'Ambiente B' }
  ]));
  const [employees, setEmployees] = useState<Employee[]>(() => safeParse('employees', []));
  const [holidays, setHolidays] = useState<Holiday[]>(() => safeParse('holidays', []));
  const [schedules, setSchedules] = useState<DaySchedule[]>(() => safeParse('schedules', []));

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('environments', JSON.stringify(environments));
    localStorage.setItem('employees', JSON.stringify(employees));
    localStorage.setItem('holidays', JSON.stringify(holidays));
    localStorage.setItem('schedules', JSON.stringify(schedules));
  }, [categories, environments, employees, holidays, schedules]);

  const handleLogin = (user: string, pass: string) => {
    if (user === 'admin' && pass === 'tododia') {
      setIsLoggedIn(true);
      setView('admin');
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-indigo-500/30">
      <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40 px-4 py-3 flex justify-between items-center shadow-2xl">
        <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => setView('public')}>
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-black text-xl tracking-tighter uppercase">Escala<span className="text-indigo-500">Pro</span></span>
        </div>
        
        <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-2xl border border-slate-700/50">
          <button 
            onClick={() => setView('public')} 
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'public' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Escala Pública
          </button>
          <button 
            onClick={() => setView('admin')} 
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Administração
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
        {view === 'public' ? (
          <PublicView 
            employees={employees} 
            schedules={schedules} 
            environments={environments}
            holidays={holidays}
          />
        ) : (
          !isLoggedIn ? (
            <AdminLogin onLogin={handleLogin} />
          ) : (
            <AdminView 
              categories={categories} setCategories={setCategories}
              environments={environments} setEnvironments={setEnvironments}
              employees={employees} setEmployees={setEmployees}
              holidays={holidays} setHolidays={setHolidays}
              schedules={schedules} setSchedules={setSchedules}
            />
          )
        )}
      </main>
      
      <footer className="mt-20 border-t border-slate-900 py-10 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">EscalaPro Management System &bull; &copy; 2024</p>
      </footer>
    </div>
  );
};

export default App;
