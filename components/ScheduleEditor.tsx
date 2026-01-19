
import React, { useState, useMemo } from 'react';
import { Employee, Category, Environment, DaySchedule, Holiday } from '../types';
import { formatDateDisplay, isSunday, formatWeekString } from '../utils/dateUtils';

interface Props {
  employees: Employee[];
  categories: Category[];
  environments: Environment[];
  schedules: DaySchedule[];
  setSchedules: (s: DaySchedule[]) => void;
  holidays: Holiday[];
}

const ScheduleEditor: React.FC<Props> = ({ employees, categories, environments, schedules, setSchedules, holidays }) => {
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeEnv, setActiveEnv] = useState(environments[0]?.id || '');

  const currentDaySchedule = schedules.find(s => s.date === activeDate) || { date: activeDate, assignments: [] };
  
  const assignedIds = useMemo(() => {
    return currentDaySchedule.assignments.flatMap(a => a.employeeIds);
  }, [currentDaySchedule]);

  const currentEnvAssigned = currentDaySchedule.assignments.find(a => a.environmentId === activeEnv)?.employeeIds || [];

  const toggleEmployee = (empId: string) => {
    const isAlreadyAssignedInThisEnv = currentEnvAssigned.includes(empId);
    const isAssignedInOtherEnv = assignedIds.includes(empId) && !isAlreadyAssignedInThisEnv;

    if (isAssignedInOtherEnv) {
      alert("Este funcionário já está escalado em outro ambiente para este dia!");
      return;
    }

    let newAssignments = [...currentDaySchedule.assignments];
    const envIdx = newAssignments.findIndex(a => a.environmentId === activeEnv);

    if (envIdx === -1) {
      newAssignments.push({ environmentId: activeEnv, employeeIds: [empId] });
    } else {
      const ids = [...newAssignments[envIdx].employeeIds];
      if (isAlreadyAssignedInThisEnv) {
        newAssignments[envIdx].employeeIds = ids.filter(id => id !== empId);
      } else {
        newAssignments[envIdx].employeeIds = [...ids, empId];
      }
    }

    const newDay = { ...currentDaySchedule, assignments: newAssignments };
    const filteredSchedules = schedules.filter(s => s.date !== activeDate);
    setSchedules([...filteredSchedules, newDay]);
  };

  const getCategoryCount = (catId: string) => {
    return currentEnvAssigned.filter(id => {
      const emp = employees.find(e => e.id === id);
      return emp?.categoryId === catId;
    }).length;
  };

  const holidayInfo = holidays.find(h => h.date === activeDate);
  const weekInfo = formatWeekString(new Date(activeDate + 'T00:00:00'));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[75vh]">
      <div className="lg:col-span-3 bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <h3 className="font-black text-2xl flex items-center space-x-3 text-slate-100 tracking-tight">
              <span>{formatDateDisplay(activeDate)}</span>
              <div className="flex space-x-1.5">
                {isSunday(activeDate) && <span className="text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full uppercase">Domingo</span>}
                {holidayInfo && <span className="text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-full uppercase">Feriado</span>}
              </div>
            </h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{weekInfo}</p>
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <input type="date" value={activeDate} onChange={e => setActiveDate(e.target.value)} className="flex-grow sm:flex-grow-0 p-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-2xl text-sm shadow-inner focus:ring-2 focus:ring-indigo-500 outline-none" />
            <select value={activeEnv} onChange={e => setActiveEnv(e.target.value)} className="flex-grow sm:flex-grow-0 p-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-2xl text-sm font-bold shadow-inner focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
              {environments.map(env => <option key={env.id} value={env.id} className="bg-slate-900">{env.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4">
            {categories.map(cat => (
              <div key={cat.id} className="p-6 bg-slate-800/40 rounded-3xl border border-slate-800/80 shadow-sm hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-center mb-5">
                  <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest">{cat.name}</h4>
                  <span className="text-xs font-black bg-indigo-600 text-white w-7 h-7 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-600/20">
                    {getCategoryCount(cat.id)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentEnvAssigned
                    .map(id => employees.find(e => e.id === id))
                    .filter(e => e?.categoryId === cat.id)
                    .map(e => e && (
                      <div key={e.id} className="px-3 py-1.5 bg-slate-800 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-xl flex items-center group shadow-sm">
                        {e.name}
                        <button onClick={() => toggleEmployee(e.id)} className="ml-2 text-rose-500 hover:text-rose-400 font-black p-0.5 rounded-md hover:bg-rose-500/10 transition-colors">&times;</button>
                      </div>
                    ))}
                  {getCategoryCount(cat.id) === 0 && <span className="text-[10px] text-slate-600 italic font-medium">Equipe não definida</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
        <h3 className="text-slate-100 font-black text-xs uppercase tracking-widest mb-6 flex items-center border-b border-slate-800 pb-4">
          <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          Colaboradores
        </h3>
        <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {employees
            .filter(e => e.status === 'Ativo')
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(e => {
              const isUsedHere = currentEnvAssigned.includes(e.id);
              const isUsedElsewhere = assignedIds.includes(e.id) && !isUsedHere;
              
              return (
                <button 
                  key={e.id}
                  onClick={() => toggleEmployee(e.id)}
                  className={`w-full text-left p-3.5 rounded-2xl text-xs font-bold transition-all transform hover:scale-[1.02] active:scale-95 group relative border ${
                    isUsedHere ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30' : 
                    isUsedElsewhere ? 'bg-slate-800/50 border-rose-900/40 text-rose-500/50 cursor-not-allowed grayscale' : 
                    'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-100 hover:border-slate-500 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate pr-2">{e.name}</span>
                    <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg ${isUsedHere ? 'bg-indigo-400' : 'bg-slate-700 group-hover:bg-slate-600'}`}>
                      {categories.find(c => c.id === e.categoryId)?.name || 'N/A'}
                    </span>
                  </div>
                  {isUsedElsewhere && <span className="absolute inset-0 bg-slate-950/40 flex items-center justify-center rounded-2xl text-[9px] font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">EM OUTRO AMBIENTE</span>}
                </button>
              );
            })}
          
          {employees.filter(e => e.status !== 'Ativo').length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-800 space-y-2">
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-3 ml-1">Licença / Inativo</p>
              {employees.filter(e => e.status !== 'Ativo').map(e => (
                <div key={e.id} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl flex justify-between items-center opacity-40">
                  <span className="text-[11px] font-bold text-slate-500">{e.name}</span>
                  <span className="text-[9px] font-black uppercase text-rose-600/60">{e.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleEditor;
