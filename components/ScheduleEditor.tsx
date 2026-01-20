
import React, { useState } from 'react';
import { Employee, Category, Environment, DaySchedule, Holiday } from '../types';
import { formatDateDisplay, isSunday, getLocalDateString } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';
import { recalculateAllEmployeeCounters } from '../services/counterService';

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
  const [activeDate, setActiveDate] = useState(getLocalDateString());
  const [activeEnv, setActiveEnv] = useState(environments[0]?.id || '');
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);

  const holidayInfo = holidays.find(h => h.date === activeDate);
  const isDaySunday = isSunday(activeDate);
  const isSpecial = isDaySunday || !!holidayInfo;

  const currentDaySchedule = schedules.find(s => s.date === activeDate) || { date: activeDate, assignments: [] };
  const assignments = currentDaySchedule.assignments || [];
  const currentEnvAssigned = assignments.find(a => a.environmentId === activeEnv)?.employeeIds || [];

  const toggleEmployee = async (empId: string) => {
    if (!isSpecial) return;

    const isAlreadyAssigned = currentEnvAssigned.includes(empId);
    
    try {
      if (isAlreadyAssigned) {
        await supabase.from('assignments')
          .delete()
          .match({ date: activeDate, environment_id: activeEnv, employee_id: empId });
      } else {
        await supabase.from('schedules').upsert({
          date: activeDate,
          is_sunday: isDaySunday,
          is_holiday: !!holidayInfo,
          holiday_name: holidayInfo?.name || null
        });

        await supabase.from('assignments').insert([{
          date: activeDate,
          environment_id: activeEnv,
          employee_id: empId
        }]);
      }
      await refreshData();
    } catch (err: any) {
      console.error("Erro na sincronização:", err);
    }
  };

  const handleConfirm = async () => {
    if (!isSpecial) return;
    setIsConfirming(true);
    
    try {
      await recalculateAllEmployeeCounters(employees, holidays);
      await refreshData();
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error("Erro ao efetivar escala:", err);
    } finally {
      setIsConfirming(false);
    }
  };

  const getCategoryCount = (catId: string) => {
    return currentEnvAssigned.filter(id => {
      const emp = employees.find(e => e.id === id);
      return emp?.categoryId === catId;
    }).length;
  };

  const assignedIds = assignments.flatMap(a => a.employeeIds || []);

  const formatCounter = (count: number | undefined | null) => {
    if (count === undefined || count === null) return '0';
    return count > 10 ? '>10' : count.toString();
  };

  // Lógica de cores por prioridade (Imagem do Usuário)
  const getPriorityClasses = (count: number | undefined | null) => {
    const val = count ?? 0;
    if (val === 0) return 'bg-red-500/10 border-red-500/50 text-red-500';
    if (val === 1) return 'bg-orange-500/10 border-orange-500/50 text-orange-500';
    if (val === 2) return 'bg-amber-400/10 border-amber-400/50 text-amber-400';
    if (val === 3) return 'bg-lime-400/10 border-lime-400/50 text-lime-400';
    if (val === 4) return 'bg-emerald-400/10 border-emerald-400/50 text-emerald-400';
    return 'bg-green-500/10 border-green-500/50 text-green-500';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Lado Esquerdo: Categorias de Escala */}
      <div className="lg:col-span-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col h-fit">
        <div className="flex flex-col mb-6 gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <h3 className="font-black text-xl text-slate-100">{formatDateDisplay(activeDate)}</h3>
            <div className="flex flex-wrap gap-2">
              {isDaySunday && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded">DOMINGO</span>}
              {holidayInfo && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-1 rounded uppercase">{holidayInfo.name}</span>}
              {!isSpecial && <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-1 rounded uppercase font-bold tracking-widest">Dia Comum</span>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <input type="date" value={activeDate} onChange={e => setActiveDate(e.target.value)} className="w-full p-2.5 bg-slate-800 rounded-xl text-xs text-white border border-slate-700 outline-none" />
            <select value={activeEnv} onChange={e => setActiveEnv(e.target.value)} className="w-full p-2.5 bg-slate-800 rounded-xl text-xs font-bold text-white border border-slate-700 outline-none">
              {environments.map(env => <option key={env.id} value={env.id}>{env.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-8">
          {!isSpecial && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-4">
              <p className="text-[10px] text-amber-400 font-bold text-center">Edição apenas em Domingos ou Feriados.</p>
            </div>
          )}

          <div className={`space-y-4 ${!isSpecial ? 'opacity-30 pointer-events-none' : ''}`}>
            {categories.map(cat => (
              <div key={cat.id} className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-black text-slate-400 text-[9px] uppercase tracking-widest">{cat.name}</h4>
                  <span className="text-[10px] font-black bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-lg">{getCategoryCount(cat.id)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentEnvAssigned
                    .map(id => employees.find(e => e.id === id))
                    .filter(e => e?.categoryId === cat.id)
                    .map(e => e && (
                      <div key={e.id} className="px-2 py-1 bg-slate-800 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded-lg flex items-center">
                        <span className="truncate max-w-[80px]">{e.name}</span>
                        <button onClick={() => toggleEmployee(e.id)} className="ml-1.5 text-rose-500 font-black hover:scale-125 transition">&times;</button>
                      </div>
                    ))}
                  {getCategoryCount(cat.id) === 0 && <p className="text-[9px] text-slate-600 italic">Nenhum selecionado</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-4 flex justify-center">
          <button 
            onClick={handleConfirm} 
            disabled={isConfirming || !isSpecial} 
            className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isSpecial ? 'bg-slate-800 text-slate-600' : showSuccess ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white shadow-lg'}`}
          >
            {isConfirming ? "Sincronizando..." : showSuccess ? "Dia Sincronizado!" : "Sincronizar Dia"}
          </button>
        </div>
      </div>

      {/* Lado Direito: Colaboradores Disponíveis */}
      <div className="lg:col-span-8 bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col h-fit">
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
          <h3 className="text-slate-100 font-black text-lg uppercase tracking-widest">Colaboradores Disponíveis</h3>
        </div>

        {/* Filtros Horizontais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-3 bg-slate-800/30 rounded-2xl border border-slate-800">
            <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Filtrar Categoria</p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategories(prev => prev.includes(cat.id) ? prev.filter(i => i !== cat.id) : [...prev, cat.id])}
                  className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${selectedCategories.includes(cat.id) ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 bg-slate-800/30 rounded-2xl border border-slate-800">
            <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Filtrar Ambiente Base</p>
            <div className="flex flex-wrap gap-1.5">
              {environments.map(env => (
                <button
                  key={env.id}
                  onClick={() => setSelectedEnvironments(prev => prev.includes(env.id) ? prev.filter(i => i !== env.id) : [...prev, env.id])}
                  className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${selectedEnvironments.includes(env.id) ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                >
                  {env.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`${!isSpecial ? 'opacity-20 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {employees
              .filter(e => e.status === 'Ativo')
              .filter(e => selectedCategories.length === 0 || selectedCategories.includes(e.categoryId))
              .filter(e => selectedEnvironments.length === 0 || selectedEnvironments.includes(e.environmentId))
              .map(e => {
                const isUsedHere = currentEnvAssigned.includes(e.id);
                const isUsedElsewhere = assignedIds.includes(e.id) && !isUsedHere;
                
                return (
                  <button 
                    key={e.id}
                    onClick={() => !isUsedElsewhere && isSpecial && toggleEmployee(e.id)}
                    disabled={isUsedElsewhere || !isSpecial}
                    className={`text-left p-4 rounded-2xl transition-all border group ${
                      isUsedHere ? 'bg-indigo-600 border-indigo-400 text-white' : 
                      isUsedElsewhere ? 'bg-slate-800/30 border-transparent opacity-50 cursor-not-allowed' : 
                      'bg-slate-800 border-slate-700 hover:border-indigo-500 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-black text-sm truncate pr-2">{e.name}</span>
                    </div>
                    <div className="flex gap-2">
                      {isDaySunday && (
                        <div className={`flex items-center px-1.5 py-0.5 rounded-lg border text-[9px] font-black ${getPriorityClasses(e.consecutiveSundaysOff)}`}>
                          <span className="opacity-50 mr-1">D:</span> {formatCounter(e.consecutiveSundaysOff)}
                        </div>
                      )}
                      {!!holidayInfo && (
                        <div className={`flex items-center px-1.5 py-0.5 rounded-lg border text-[9px] font-black ${getPriorityClasses(e.consecutiveHolidaysOff)}`}>
                          <span className="opacity-50 mr-1">F:</span> {formatCounter(e.consecutiveHolidaysOff)}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleEditor;
