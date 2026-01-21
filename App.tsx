
import React, { useState, useEffect } from 'react';
import { Category, Environment, Employee, Holiday, DaySchedule, ScheduleAssignment } from './types';
import PublicView from './components/PublicView';
import AdminView from './components/AdminView';
import AdminLogin from './components/AdminLogin';
import { supabase } from './lib/supabase';
import { getLocalDateString } from './utils/dateUtils';

const App: React.FC = () => {
  const [view, setView] = useState<'public' | 'admin'>('public');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);

  const fetchData = async () => {
    try {
      setDbError(null);
      
      // Fetch data individually to handle missing tables gracefully
      const fetchTable = async (table: string, query: any = supabase.from(table).select('*')) => {
        try {
          const { data, error } = await query;
          if (error) {
            console.warn(`Aviso: Falha ao carregar tabela "${table}":`, error.message);
            return { data: null, error };
          }
          return { data, error: null };
        } catch (e) {
          console.error(`Erro crítico na tabela "${table}":`, e);
          return { data: null, error: e };
        }
      };

      const [cats, envs, emps, hols, schs, assigns] = await Promise.all([
        fetchTable('categories', supabase.from('categories').select('*').order('name', { ascending: true })),
        fetchTable('environments', supabase.from('environments').select('*').order('name', { ascending: false })),
        fetchTable('employees', supabase.from('employees').select('*').order('name', { ascending: true })),
        fetchTable('holidays', supabase.from('holidays').select('*').order('date')),
        fetchTable('schedules', supabase.from('schedules').select('*')),
        fetchTable('assignments', supabase.from('assignments').select('*'))
      ]);

      // Critical tables - if these fail, we show an error
      if (cats.error || envs.error || emps.error) {
        const criticalError = cats.error?.message || envs.error?.message || emps.error?.message;
        setDbError(`Erro em tabelas essenciais: ${criticalError}. Verifique se as tabelas existem no seu Supabase.`);
      }

      if (cats.data) setCategories(cats.data);
      if (envs.data) setEnvironments(envs.data);
      
      if (emps.data) {
        setEmployees(emps.data.map((e: any) => ({
          ...e,
          id: e.id,
          name: e.name || 'Sem Nome',
          categoryId: e.category_id,
          environmentId: e.environment_id,
          status: e.status || 'Ativo',
          role: e.role,
          lastSundayWorked: e.last_sunday_worked,
          consecutiveSundaysOff: e.consecutive_sundays_off ?? 0,
          totalSundaysWorked: e.total_sundays_worked ?? 0,
          sundaysWorkedCurrentYear: e.sundays_worked_current_year ?? 0,
          lastHolidayWorked: e.last_holiday_worked,
          consecutiveHolidaysOff: e.consecutive_holidays_off ?? 0,
          totalHolidaysWorked: e.total_holidays_worked ?? 0,
          holidaysWorkedCurrentYear: e.holidays_worked_current_year ?? 0
        })));
      }
      
      if (hols.data) setHolidays(hols.data);
      
      // Process schedules even if assignments fail (treat as empty)
      if (schs.data) {
        const safeAssignments = assigns.data || [];
        const builtSchedules: DaySchedule[] = schs.data.map((s: any) => {
          const dayAssigns = safeAssignments.filter((a: any) => a.date === s.date);
          const envGrouped: Record<string, string[]> = {};
          
          dayAssigns.forEach((a: any) => {
            if (!envGrouped[a.environment_id]) envGrouped[a.environment_id] = [];
            envGrouped[a.environment_id].push(a.employee_id);
          });

          const assignments: ScheduleAssignment[] = Object.keys(envGrouped).map(envId => ({
            environmentId: envId,
            employeeIds: envGrouped[envId]
          }));

          return {
            date: s.date,
            isSunday: s.is_sunday,
            isHoliday: s.is_holiday,
            holidayName: s.holiday_name,
            assignments
          };
        });
        setSchedules(builtSchedules);
      } else {
        setSchedules([]);
      }

    } catch (error: any) {
      console.error("Erro crítico ao carregar dados:", error);
      setDbError(error.message || "Falha ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('public');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold animate-pulse text-xs uppercase tracking-widest">Sincronizando Dados...</p>
        </div>
      </div>
    );
  }

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
        
        <div className="flex items-center space-x-4">
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-2xl border border-slate-700/50">
            <button 
              onClick={() => setView('public')} 
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'public' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Público
            </button>
            <button 
              onClick={() => setView('admin')} 
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Admin
            </button>
          </div>
          
          {session && view === 'admin' && (
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
              title="Sair"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </nav>

      {dbError && (
        <div className="max-w-7xl mx-auto px-4 pt-8">
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div className="text-left">
                <p className="text-rose-400 font-bold text-sm">Problema detectado no banco de dados.</p>
                <p className="text-rose-500/70 text-xs font-medium">{dbError}</p>
              </div>
            </div>
            <button 
              onClick={() => fetchData()}
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {view === 'public' ? (
          <PublicView 
            employees={employees} 
            schedules={schedules} 
            environments={environments}
            holidays={holidays}
            categories={categories}
          />
        ) : (
          !session ? (
            <AdminLogin />
          ) : (
            <AdminView 
              categories={categories} setCategories={setCategories}
              environments={environments} setEnvironments={setEnvironments}
              employees={employees} setEmployees={setEmployees}
              holidays={holidays} setHolidays={setHolidays}
              schedules={schedules} setSchedules={setSchedules}
              refreshData={fetchData}
            />
          )
        )}
      </main>
      
      <footer className="mt-20 border-t border-slate-900 py-10 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">ESCALAPRO - DESENV: WENNEDYS NUNES</p>
      </footer>
    </div>
  );
};

export default App;
