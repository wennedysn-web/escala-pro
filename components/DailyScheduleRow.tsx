
import React from 'react';
import { DaySchedule, Employee, Environment } from '../types';

interface Props {
  schedule: DaySchedule;
  employees: Employee[];
  environments: Environment[];
}

const DailyScheduleRow: React.FC<Props> = ({ schedule, employees, environments }) => {
  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Removido';

  const isSpecial = schedule.isSunday || schedule.isHoliday;
  const scheduleDate = new Date(schedule.date + 'T00:00:00');

  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-5 border-b border-slate-800/50 items-center hover:bg-slate-800/20 transition-colors ${isSpecial ? 'bg-indigo-500/5' : 'bg-transparent'}`}>
      <div className="md:col-span-3">
        <div className="flex items-center space-x-4">
          <div className="text-center min-w-[3.5rem] p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner">
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-tighter">
              {scheduleDate.toLocaleDateString('pt-BR', { weekday: 'short' })}
            </p>
            <p className={`text-xl font-black ${isSpecial ? 'text-indigo-400' : 'text-slate-200'}`}>
              {scheduleDate.getDate()}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {scheduleDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {schedule.isHoliday && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {schedule.holidayName}
                </span>
              )}
              {schedule.isSunday && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Domingo
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-8 flex flex-wrap gap-4">
        {environments.map(env => {
          const assigned = schedule.assignments.find(a => a.environmentId === env.id)?.employeeIds || [];
          return (
            <div key={env.id} className="min-w-[150px] flex-grow p-3 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-inner">
              <p className="text-[9px] uppercase text-indigo-500 font-black tracking-widest mb-2 flex items-center">
                <span className="w-1 h-1 bg-indigo-500 rounded-full mr-2"></span>
                {env.name}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {assigned.map(id => (
                  <span key={id} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-700">
                    {getEmployeeName(id)}
                  </span>
                ))}
                {assigned.length === 0 && <span className="text-[10px] text-slate-600 italic">Folga</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="md:col-span-1 flex justify-end">
        <div className="text-slate-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DailyScheduleRow;
