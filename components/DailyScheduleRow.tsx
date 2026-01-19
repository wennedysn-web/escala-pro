
import React from 'react';
import { DaySchedule, Employee } from '../types';

interface Props {
  schedule: DaySchedule;
  employees: Employee[];
}

const DailyScheduleRow: React.FC<Props> = ({ schedule, employees }) => {
  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';

  const envA = schedule.assignments.find(a => a.environmentId === 'Ambiente A')?.employeeIds || [];
  const envB = schedule.assignments.find(a => a.environmentId === 'Ambiente B')?.employeeIds || [];

  const isSpecial = schedule.isSunday || schedule.isHoliday;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-5 border-b border-slate-800/50 items-center hover:bg-slate-800/20 transition-colors ${isSpecial ? 'bg-indigo-500/5' : 'bg-transparent'}`}>
      <div className="md:col-span-3">
        <div className="flex items-center space-x-4">
          <div className="text-center min-w-[3.5rem] p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner">
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-tighter">
              {new Date(schedule.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}
            </p>
            <p className={`text-xl font-black ${isSpecial ? 'text-indigo-400' : 'text-slate-200'}`}>
              {new Date(schedule.date + 'T00:00:00').getDate()}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {new Date(schedule.date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
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

      <div className="md:col-span-4">
        <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-inner">
          <p className="text-[9px] uppercase text-indigo-500 font-black tracking-widest mb-2 flex items-center">
            <span className="w-1 h-1 bg-indigo-500 rounded-full mr-2"></span>
            Ambiente A
          </p>
          <div className="flex flex-wrap gap-1.5">
            {envA.map(id => (
              <span key={id} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold border border-slate-700">
                {getEmployeeName(id)}
              </span>
            ))}
            {envA.length === 0 && <span className="text-[10px] text-slate-600 italic">Sem equipe</span>}
          </div>
        </div>
      </div>

      <div className="md:col-span-4">
        <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-inner">
          <p className="text-[9px] uppercase text-emerald-500 font-black tracking-widest mb-2 flex items-center">
            <span className="w-1 h-1 bg-emerald-500 rounded-full mr-2"></span>
            Ambiente B
          </p>
          <div className="flex flex-wrap gap-1.5">
            {envB.map(id => (
              <span key={id} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold border border-slate-700">
                {getEmployeeName(id)}
              </span>
            ))}
            {envB.length === 0 && <span className="text-[10px] text-slate-600 italic">Sem equipe</span>}
          </div>
        </div>
      </div>

      <div className="md:col-span-1 flex justify-end">
        <button className="text-slate-600 hover:text-indigo-400 transition-colors p-2 hover:bg-slate-800 rounded-xl">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DailyScheduleRow;
