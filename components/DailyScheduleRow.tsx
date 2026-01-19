
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
    <div className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b border-slate-100 items-center ${isSpecial ? 'bg-indigo-50/40' : 'bg-white'}`}>
      <div className="md:col-span-3">
        <div className="flex items-center space-x-3">
          <div className="text-center min-w-[3rem]">
            <p className="text-[10px] uppercase font-bold text-slate-400">
              {new Date(schedule.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}
            </p>
            <p className="text-lg font-bold text-slate-700">
              {new Date(schedule.date + 'T00:00:00').getDate()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">
              {new Date(schedule.date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
            {schedule.isHoliday && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-700 mt-1">
                Feriado: {schedule.holidayName}
              </span>
            )}
            {schedule.isSunday && !schedule.isHoliday && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 mt-1">
                Domingo
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="md:col-span-4">
        <div className="p-2 rounded bg-white/50 border border-slate-200">
          <p className="text-[10px] uppercase text-indigo-500 font-bold mb-1">Ambiente A</p>
          <div className="flex flex-wrap gap-1">
            {envA.map(id => (
              <span key={id} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium border border-indigo-100">
                {getEmployeeName(id)}
              </span>
            ))}
            {envA.length === 0 && <span className="text-xs text-slate-400 italic">Vazio</span>}
          </div>
        </div>
      </div>

      <div className="md:col-span-4">
        <div className="p-2 rounded bg-white/50 border border-slate-200">
          <p className="text-[10px] uppercase text-teal-600 font-bold mb-1">Ambiente B</p>
          <div className="flex flex-wrap gap-1">
            {envB.map(id => (
              <span key={id} className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs font-medium border border-teal-100">
                {getEmployeeName(id)}
              </span>
            ))}
            {envB.length === 0 && <span className="text-xs text-slate-400 italic">Vazio</span>}
          </div>
        </div>
      </div>

      <div className="md:col-span-1 flex justify-end">
        <button className="text-slate-300 hover:text-indigo-500 transition p-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DailyScheduleRow;
