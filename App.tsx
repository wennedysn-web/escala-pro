
import React, { useState, useEffect } from 'react';
import { Category, Environment, Employee, Holiday, DaySchedule } from './types';
import PublicView from './components/PublicView';
import AdminView from './components/AdminView';
import AdminLogin from './components/AdminLogin';

const App: React.FC = () => {
  const [view, setView] = useState<'public' | 'admin'>('public');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('categories') || '[]'));
  const [environments, setEnvironments] = useState<Environment[]>(() => JSON.parse(localStorage.getItem('environments') || '[]'));
  const [employees, setEmployees] = useState<Employee[]>(() => JSON.parse(localStorage.getItem('employees') || '[]'));
  const [holidays, setHolidays] = useState<Holiday[]>(() => JSON.parse(localStorage.getItem('holidays') || '[]'));
  const [schedules, setSchedules] = useState<DaySchedule[]>(() => JSON.parse(localStorage.getItem('schedules') || '[]'));

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
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-3 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-500 text-white p-1.5 rounded-lg shadow-indigo-500/20 shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <span className="font-bold text-lg tracking-tight">Escala<span className="text-indigo-400">Pro</span></span>
        </div>
        
        <div className="flex space-x-1 bg-slate-800 p-1 rounded-full">
          <button 
            onClick={() => setView('public')} 
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${view === 'public' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
          >
            Público
          </button>
          <button 
            onClick={() => setView('admin')} 
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${view === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
          >
            Admin
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
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
    </div>
  );
};

export default App;
