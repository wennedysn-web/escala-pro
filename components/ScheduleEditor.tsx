
import React, { useState, useMemo } from 'react';
import { Employee, Category, Environment, DaySchedule, Holiday } from '../types';
import { formatDateDisplay, isSunday, formatWeekString } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';

interface Props {
  employees: Employee[];
  categories: Category[];
  environments: Environment[];
  schedules: DaySchedule[];
  setSchedules: (s: DaySchedule[]) => void;
  holidays: Holiday[];
  refreshData: () => Promise<void>;
}

const ScheduleEditor: React.FC<Props> = ({ employees, categories, environments, schedules, setSchedules, holidays, refreshData }) => {
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeEnv, setActiveEnv] = useState(environments[0]?.id || '');
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentDaySchedule = schedules.find(s => s.date === activeDate) || { date: activeDate, assignments: [] };
  const currentEnvAssigned = currentDaySchedule.assignments.find(a => a.environmentId === activeEnv)?.employeeIds || [];

  const toggleEmployee = async (empId: string) => {
    const isAlreadyAssigned = currentEnvAssigned.includes(empId);
    
    try {
      if (isAlreadyAssigned) {
        await supabase.from('assignments')
          .delete()
          .match({ date: activeDate, environment_id: activeEnv, employee_id: empId });
      } else {
        // Garantir que a data existe na tabela schedules
        await supabase.from('schedules').upsert({
          date: activeDate,
          is_sunday: isSunday(activeDate)
        });

        await supabase.from('assignments').insert([{
          date: activeDate,
          environment_id: activeEnv,
          employee_id: empId
        }]);
      }
      await refreshData();
      setShowSuccess(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao sincronizar escala.");
    }
  };

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 600);
  };

  const getCategoryCount = (catId: string) => {
    return currentEnvAssigned.filter(id => {
      const emp = employees.find(e => e.id === id);
      return emp?.categoryId === catId;
    }).length;
  };

  const holidayInfo = holidays.find(h => h.date === activeDate);
  const assignedIds = currentDaySchedule.assignments.flatMap(a => a.employeeIds);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[75vh]">
      <div className="lg:col-span-3 bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col overflow-hidden relative">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-6 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <h3 className="font-black text-2xl text-slate-100">{formatDateDisplay(activeDate)}</h3>
            <div className="flex space-x-2">
              {isSunday(activeDate) && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded">DOMINGO</span>}
              {holidayInfo && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-1 rounded uppercase">{holidayInfo.name}</span>}
            </div>
          </div>
          <div className="flex space-x-3">
            <input type="date" value={activeDate} onChange={e => setActiveDate(e.target.value)} className="p-3 bg-slate-800 rounded-2xl text-sm text-white" />
            <select value={activeEnv} onChange={e => setActiveEnv(e.target.value)} className="p-3 bg-slate-800 rounded-2xl text-sm font-bold text-white">
              {environments.map(env => <option key={env.id} value={env.id}>{env.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-20">
            {categories.map(cat => (
              <div key={cat.id} className="p-6 bg-slate-800/40 rounded-3xl border border-slate-800">
                <div className="flex justify-between items-center mb-5">
                  <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest">{cat.name}</h4>
                  <span className="text-xs font-black bg-indigo-600 text-white w-7 h-7 flex items-center justify-center rounded-xl">{getCategoryCount(cat.id)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentEnvAssigned
                    .map(id => employees.find(e => e.id === id))
                    .filter(e => e?.categoryId === cat.id)
                    .map(e => e && (
                      <div key={e.id} className="px-3 py-1.5 bg-slate-800 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-xl flex items-center group">
                        {e.name}
                        <button onClick={() => toggleEmployee(e.id)} className="ml-2 text-rose-500 font-black">&times;</button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 bg-slate-900/90 backdrop-blur-sm border-t border-slate-800 flex justify-end items-center">
          <button onClick={handleConfirm} disabled={isConfirming} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all">
            {isConfirming ? "Sincronizando..." : showSuccess ? "Salvo no Supabase" : "Salvar Dia Atual"}
          </button>
        </div>
      </div>

      <div className="lg:col-span-1 bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col overflow-hidden">
        <h3 className="text-slate-100 font-black text-xs uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">Selecione para Escalar</h3>
        <div className="flex-grow overflow-y-auto space-y-2">
          {employees
            .filter(e => e.status === 'Ativo')
            .map(e => {
              const isUsedHere = currentEnvAssigned.includes(e.id);
              const isUsedElsewhere = assignedIds.includes(e.id) && !isUsedHere;
              
              return (
                <button 
                  key={e.id}
                  onClick={() => !isUsedElsewhere && toggleEmployee(e.id)}
                  className={`w-full text-left p-3 rounded-2xl text-xs font-bold transition-all border ${
                    isUsedHere ? 'bg-indigo-600 border-indigo-400 text-white' : 
                    isUsedElsewhere ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed grayscale' : 
                    'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate">{e.name}</span>
                    {isUsedElsewhere && <span className="text-[8px] opacity-60">OCUPADO</span>}
                  </div>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default ScheduleEditor;
