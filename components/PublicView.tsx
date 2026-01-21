
import React, { useState } from 'react';
import { Employee, DaySchedule, Environment, Holiday, Category } from '../types';
import { getMonthDays, formatDateDisplay, isSunday, formatWeekString } from '../utils/dateUtils';

interface Props {
  employees: Employee[];
  schedules: DaySchedule[];
  environments: Environment[];
  holidays: Holiday[];
  categories: Category[];
}

const PublicView: React.FC<Props> = ({ employees, schedules, environments, holidays, categories }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const days = getMonthDays(selectedYear, selectedMonth);
  
  const sortedEnvironments = [...environments].sort((a,b) => b.name.localeCompare(a.name));
  const sortedCategories = [...categories].sort((a,b) => b.name.localeCompare(a.name));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-100">Cronograma Mensal</h2>
          <p className="text-slate-400">Escala oficial de trabalho por ambiente (Z-A)</p>
        </div>
        <div className="flex space-x-2">
          <select 
            className="p-2.5 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl font-bold shadow-lg outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value))}
          >
            {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
              <option key={m} value={i} className="bg-slate-900">{m}</option>
            ))}
          </select>
          <select 
            className="p-2.5 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl font-bold shadow-lg outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {days.map(date => {
          const daySched = schedules.find(s => s.date === date);
          const holiday = holidays.find(h => h.date === date);
          const special = isSunday(date) || !!holiday;
          const weekStr = formatWeekString(new Date(date + 'T00:00:00'));

          if (!daySched || daySched.assignments.every(a => a.employeeIds.length === 0)) {
            return null;
          }

          return (
            <div key={date} className={`bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex flex-col md:flex-row hover:border-slate-700 transition-colors ${special ? 'ring-2 ring-amber-500/20' : ''}`}>
              <div className={`md:w-48 p-6 flex flex-col justify-center items-center text-center ${special ? 'bg-amber-500/10' : 'bg-slate-800/50 border-r border-slate-800'}`}>
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">{new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}</span>
                <span className={`text-3xl font-black mt-1 ${special ? 'text-amber-400' : 'text-slate-100'}`}>{date.split('-')[2]}</span>
                <span className="text-xs font-bold text-slate-400 mt-1">{weekStr.split(' ')[1]} {weekStr.split(' ')[2]}</span>
                {holiday && <span className="mt-3 px-2 py-1 bg-rose-500/20 text-rose-400 text-[9px] font-black rounded uppercase border border-rose-500/30">{holiday.name}</span>}
              </div>
              
              <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 p-6 gap-8">
                {sortedEnvironments.map(env => {
                  const assignment = daySched.assignments.find(a => a.environmentId === env.id);
                  if (!assignment || assignment.employeeIds.length === 0) return null;
                  
                  // Group employees in this environment by category
                  const envEmployees = assignment.employeeIds
                    .map(id => employees.find(e => e.id === id))
                    .filter(Boolean) as Employee[];

                  const categoriesInEnv = sortedCategories.filter(cat => 
                    envEmployees.some(emp => emp.categoryId === cat.id)
                  );

                  return (
                    <div key={env.id} className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase text-indigo-400 tracking-[0.1em] flex items-center">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
                        {env.name}
                      </h4>
                      
                      <div className="space-y-3 pl-3 border-l border-slate-800">
                        {categoriesInEnv.map(cat => {
                          const catEmployees = envEmployees.filter(emp => emp.categoryId === cat.id).sort((a,b) => b.name.localeCompare(a.name));
                          return (
                            <div key={cat.id} className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{cat.name}</span>
                                <span className="text-[9px] font-black bg-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded-md border border-slate-700/50">
                                  {catEmployees.length}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {catEmployees.map(e => (
                                  <span key={e.id} className="px-2.5 py-1 bg-slate-800/50 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700/50 shadow-sm hover:bg-slate-800 transition cursor-default">
                                    {e.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {schedules.filter(s => s.date.startsWith(`${selectedYear}-${String(selectedMonth+1).padStart(2,'0')}`)).length === 0 && (
          <div className="bg-slate-900 p-20 rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 space-y-6">
             <div className="p-5 bg-slate-800 rounded-full">
               <svg className="w-16 h-16 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <div className="text-center space-y-2">
               <p className="font-bold text-xl text-slate-300">Nenhuma escala publicada</p>
               <p className="text-sm max-w-xs text-slate-500">O cronograma para este período ainda não foi definido pela administração.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicView;
