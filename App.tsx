
import React, { useState, useEffect } from 'react';
import { Category, Environment, Employee, Holiday, DaySchedule, ScheduleAssignment } from './types';
import AdminView from './components/AdminView';
import AdminLogin from './components/AdminLogin';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
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
      
      const fetchTable = async (table: string, query: any) => {
        try {
          const { data, error } = await query;
          if (error) {
            console.error(`Erro na tabela "${table}":`, error);
            return { data: [], error: error.message };
          }
          return { data: data || [], error: null };
        } catch (e) {
          console.error(`Erro inesperado na tabela "${table}":`, e);
          return { data: [], error: "Falha de rede ou conexão." };
        }
      };

      // Removido o filtro .eq('user_id', userId) para permitir dados compartilhados
      const catsRes = await fetchTable('categories', supabase.from('categories').select('*').order('name', { ascending: true }));
      const envsRes = await fetchTable('environments', supabase.from('environments').select('*').order('name', { ascending: false }));
      const empsRes = await fetchTable('employees', supabase.from('employees').select('*').order('name', { ascending: true }));
      const holsRes = await fetchTable('holidays', supabase.from('holidays').select('*').order('date'));
      const schsRes = await fetchTable('schedules', supabase.from('schedules').select('*'));
      const assignsRes = await fetchTable('assignments', supabase.from('assignments').select('*'));

      if (catsRes.error || envsRes.error || empsRes.error) {
        setDbError("Algumas informações não puderam ser carregadas totalmente.");
      }

      setCategories(catsRes.data);
      setEnvironments(envsRes.data);
      
      setEmployees(empsRes.data.map((e: any) => ({
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
      
      setHolidays(holsRes.data);
      
      if (schsRes.data.length > 0) {
        const safeAssignments = assignsRes.data || [];
        const builtSchedules: DaySchedule[] = schsRes.data.map((s: any) => {
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
      setDbError("Erro de comunicação com o banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData();
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setLoading(true);
        fetchData();
      }
      else {
        setCategories([]);
        setEnvironments([]);
        setEmployees([]);
        setHolidays([]);
        setSchedules([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold animate-pulse text-xs uppercase tracking-widest">Carregando EscalaPro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-indigo-500/30">
      <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40 px-4 py-3 flex justify-between items-center shadow-2xl">
        <div className="flex items-center space-x-3 group cursor-default">
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-black text-xl tracking-tighter uppercase">Escala<span className="text-indigo-500">Pro</span></span>
        </div>
        
        <div className="flex items-center space-x-4">
          {session && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Acesso Compartilhado</p>
                <p className="text-[10px] font-bold text-slate-300 truncate max-w-[150px]">{session.user.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                title="Sair"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {dbError && (
          <div className="mb-8 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-4">
             <div className="p-2 bg-amber-500 rounded-lg text-white">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <div>
               <h4 className="text-sm font-black uppercase text-amber-500 tracking-widest">Aviso de Sincronização</h4>
               <p className="text-xs text-amber-300 font-medium mt-1">{dbError}</p>
             </div>
          </div>
        )}

        {!session ? (
          <AdminLogin />
        ) : (
          <AdminView 
            userId={session.user.id}
            categories={categories} setCategories={setCategories}
            environments={environments} setEnvironments={setEnvironments}
            employees={employees} setEmployees={setEmployees}
            holidays={holidays} setHolidays={setHolidays}
            schedules={schedules} setSchedules={setSchedules}
            refreshData={() => fetchData()}
          />
        )}
      </main>
      
      <footer className="mt-20 border-t border-slate-900 py-10 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">ESCALAPRO V0.1.7 - BANCO DE DADOS COMPARTILHADO</p>
      </footer>
    </div>
  );
};

export default App;
