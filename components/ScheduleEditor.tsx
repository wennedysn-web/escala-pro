
import React, { useState } from 'react';
import { Employee, Category, Environment, DaySchedule, Holiday } from '../types';
import { formatDateDisplay, isSunday, getLocalDateString } from '../utils/dateUtils';
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
  // Inicializa com a data local correta
  const [activeDate, setActiveDate] = useState(getLocalDateString());
  const [activeEnv, setActiveEnv] = useState(environments[0]?.id || '');
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);

  const holidayInfo = holidays.find(h => h.date === activeDate);
  const isSpecial = isSunday(activeDate) || !!holidayInfo;

  const currentDaySchedule = schedules.find(s => s.date === activeDate) || { date: activeDate, assignments: [] };
  const currentEnvAssigned = currentDaySchedule.assignments.find(a => a.environmentId === activeEnv)?.employeeIds || [];

  const toggleEmployee = async (empId: string) => {
    if (!isSpecial) return; // Bloqueia alterações se não for dia especial

    const isAlreadyAssigned = currentEnvAssigned.includes(empId);
    
    try {
      if (isAlreadyAssigned) {
        const { error } = await supabase.from('assignments')
          .delete()
          .match({ date: activeDate, environment_id: activeEnv, employee_id: empId });
        if (error) throw error;
      } else {
        const { error: schError } = await supabase.from('schedules').upsert({
          date: activeDate,
          is_sunday: isSunday(activeDate),
          is_holiday: !!holidayInfo,
          holiday_name: holidayInfo?.name || null
        });
        if (schError) throw schError;

        const { error: assignError } = await supabase.from('assignments').insert([{
          date: activeDate,
          environment_id: activeEnv,
          employee_id: empId
        }]);
        if (assignError) throw assignError;
      }
      await refreshData();
      setShowSuccess(false);
    } catch (err: any) {
      console.error("Erro na sincronização:", err);
      alert(err.message || "Erro ao sincronizar escala. Verifique suas permissões.");
    }
  };

  const handleConfirm = () => {
    if (!isSpecial) return;
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

  const assignedIds = currentDaySchedule.assignments.flatMap(a => a.employeeIds);

  const handleToggleCategoryFilter = (catId: string) => {
    setSelectedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleToggleEnvFilter = (envId: string) => {
    setSelectedEnvironments(prev => 
      prev.includes(envId) ? prev.filter(id => id !== envId) : [...prev, envId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedEnvironments([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[75vh]">
      <div className="lg:col-span-3 bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col overflow-hidden relative">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-6 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <h3 className="font-black text-2xl text-slate-100">{formatDateDisplay(activeDate)}</h3>
            <div className="flex space-x-2">
              {isSunday(activeDate) && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded">DOMINGO</span>}
              {holidayInfo && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-1 rounded uppercase">{holidayInfo.name}</span>}
              {!isSpecial && <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-1 rounded uppercase font-bold tracking-widest">Dia Comum</span>}
            </div>
          </div>
          <div className="flex space-x-3">
            <input type="date" value={activeDate} onChange={e => setActiveDate(e.target.value)} className="p-3 bg-slate-800 rounded-2xl text-sm text-white border border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
            <select value={activeEnv} onChange={e => setActiveEnv(e.target.value)} className="p-3 bg-slate-800 rounded-2xl text-sm font-bold text-white border border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
              {environments.map(env => <option key={env.id} value={env.id}>{env.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 relative">
          {!isSpecial && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-10 bg-slate-900/60 backdrop-blur-[2px] rounded-2xl text-center">
              <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl max-w-sm animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h4 className="text-slate-100 font-black text-lg mb-2">Data Não Permitida</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  A escala só pode ser gerenciada em <b>Domingos</b> ou <b>Feriados</b> cadastrados. Dias comuns não requerem escala especial.
                </p>
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 pb-20 ${!isSpecial ? 'opacity-30' : ''}`}>
            {categories.map(cat => (
              <div key={cat.id} className="p-6 bg-slate-800/40 rounded-3xl border border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest">{cat.name}</h4>
                  <span className="text-xs font-black bg-indigo-600 text-white w-7 h-7 flex items-center justify-center rounded-xl">{getCategoryCount(cat.id)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentEnvAssigned
                    .map(id => employees.find(e => e.id === id))
                    .filter(e => e?.categoryId === cat.id)
                    .map(e => e && (
                      <div key={e.id} className="px-3 py-1.5 bg-slate-800 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-xl flex items-center group animate-in fade-in zoom-in duration-200">
                        {e.name}
                        {isSpecial && (
                          <button onClick={() => toggleEmployee(e.id)} className="ml-2 text-rose-500 font-black hover:scale-125 transition">&times;</button>
                        )}
                      </div>
                    ))}
                  {getCategoryCount(cat.id) === 0 && <p className="text-[10px] text-slate-600 italic">Nenhum selecionado</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 flex justify-end items-center">
          <button 
            onClick={handleConfirm} 
            disabled={isConfirming || !isSpecial} 
            className={`px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
              !isSpecial 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
            }`}
          >
            {isConfirming ? "Sincronizando..." : showSuccess ? "Dia Sincronizado" : "Sincronizar com Banco"}
          </button>
        </div>
      </div>

      <div className="lg:col-span-1 bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
          <h3 className="text-slate-100 font-black text-xs uppercase tracking-widest">Disponíveis</h3>
          {(selectedCategories.length > 0 || selectedEnvironments.length > 0) && (
            <button onClick={clearFilters} className="text-[8px] font-black uppercase text-rose-400 hover:text-rose-300 transition">Limpar Filtros</button>
          )}
        </div>
        
        <div className={`space-y-4 mb-4 ${!isSpecial ? 'opacity-30 pointer-events-none' : ''}`}>
          {/* Filtro por Categorias */}
          <div>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Filtrar Categoria</p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleToggleCategoryFilter(cat.id)}
                  disabled={!isSpecial}
                  className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all border ${
                    selectedCategories.includes(cat.id)
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por Ambientes */}
          <div>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Filtrar Ambiente Base</p>
            <div className="flex flex-wrap gap-1.5">
              {environments.map(env => (
                <button
                  key={env.id}
                  onClick={() => handleToggleEnvFilter(env.id)}
                  disabled={!isSpecial}
                  className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all border ${
                    selectedEnvironments.includes(env.id)
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'
                  }`}
                >
                  {env.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`flex-grow overflow-y-auto space-y-2 pr-1 ${!isSpecial ? 'opacity-30 pointer-events-none' : ''}`}>
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
                  className={`w-full text-left p-3 rounded-2xl text-xs font-bold transition-all border ${
                    isUsedHere ? 'bg-indigo-600 border-indigo-400 text-white shadow-md' : 
                    isUsedElsewhere ? 'bg-slate-800/30 text-slate-600 border-transparent cursor-not-allowed' : 
                    'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate">{e.name}</span>
                    {isUsedElsewhere && <span className="text-[7px] bg-slate-700 px-1 py-0.5 rounded text-slate-400">OCUPADO</span>}
                  </div>
                </button>
              );
            })}
          
          {employees.filter(e => e.status === 'Ativo' && 
            (selectedCategories.length === 0 || selectedCategories.includes(e.categoryId)) &&
            (selectedEnvironments.length === 0 || selectedEnvironments.includes(e.environmentId))
          ).length === 0 && (
            <p className="text-[10px] text-slate-600 italic text-center py-4">Nenhum disponível para os filtros atuais</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleEditor;
