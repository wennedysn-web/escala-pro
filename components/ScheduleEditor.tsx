
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[75vh]">
      {/* Coluna de Atribuições (Categorias) - Agora à esquerda e em lista única */}
      <div className="lg:col-span-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col overflow-hidden relative">
        <div className="flex flex-col mb-6 gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <h3 className="font-black text-xl text-slate-100">{formatDateDisplay(activeDate)}</h3>
            <div className="flex flex-wrap gap-2">
              {isSunday(activeDate) && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded">DOMINGO</span>}
              {holidayInfo && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-1 rounded uppercase">{holidayInfo.name}</span>}
              {!isSpecial && <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-1 rounded uppercase font-bold tracking-widest">Dia Comum</span>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <input type="date" value={activeDate} onChange={e => setActiveDate(e.target.value)} className="w-full p-2.5 bg-slate-800 rounded-xl text-xs text-white border border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
            <select value={activeEnv} onChange={e => setActiveEnv(e.target.value)} className="w-full p-2.5 bg-slate-800 rounded-xl text-xs font-bold text-white border border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
              {environments.map(env => <option key={env.id} value={env.id}>{env.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 relative">
          {!isSpecial && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px] rounded-2xl text-center">
              <div className="bg-slate-800 p-4 rounded-3xl border border-slate-700 shadow-2xl max-w-sm">
                <h4 className="text-slate-100 font-black text-sm mb-1">Restrito</h4>
                <p className="text-slate-400 text-[10px]">Apenas Domingos/Feriados.</p>
              </div>
            </div>
          )}

          <div className={`flex flex-col gap-4 pb-20 ${!isSpecial ? 'opacity-30' : ''}`}>
            {categories.map(cat => (
              <div key={cat.id} className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-black text-slate-400 text-[9px] uppercase tracking-widest">{cat.name}</h4>
                  <span className="text-[10px] font-black bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-lg">{getCategoryCount(cat.id)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentEnvAssigned
                    .map(id => employees.find(e => e.id === id))
                    .filter(e => e?.categoryId === cat.id)
                    .map(e => e && (
                      <div key={e.id} className="px-2 py-1 bg-slate-800 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded-lg flex items-center animate-in fade-in zoom-in duration-200">
                        <span className="truncate max-w-[80px]">{e.name}</span>
                        {isSpecial && (
                          <button onClick={() => toggleEmployee(e.id)} className="ml-1.5 text-rose-500 font-black hover:scale-125 transition">&times;</button>
                        )}
                      </div>
                    ))}
                  {getCategoryCount(cat.id) === 0 && <p className="text-[9px] text-slate-600 italic">Nenhum</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 flex justify-center">
          <button 
            onClick={handleConfirm} 
            disabled={isConfirming || !isSpecial} 
            className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
              !isSpecial 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isConfirming ? "..." : "Sincronizar Dia"}
          </button>
        </div>
      </div>

      {/* Coluna de Colaboradores Disponíveis - Agora à direita e expandida */}
      <div className="lg:col-span-8 bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
          <div>
            <h3 className="text-slate-100 font-black text-lg uppercase tracking-widest">Colaboradores Disponíveis</h3>
            <p className="text-slate-500 text-xs mt-1">Selecione para adicionar ao ambiente "{environments.find(e => e.id === activeEnv)?.name}"</p>
          </div>
          {(selectedCategories.length > 0 || selectedEnvironments.length > 0) && (
            <button onClick={clearFilters} className="px-4 py-2 bg-rose-500/10 text-[10px] font-black uppercase text-rose-400 hover:bg-rose-500/20 rounded-xl transition">Limpar Filtros</button>
          )}
        </div>
        
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 ${!isSpecial ? 'opacity-30 pointer-events-none' : ''}`}>
          {/* Filtro por Categorias */}
          <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center">
              <span className="w-1 h-3 bg-indigo-500 rounded-full mr-2"></span>
              Filtrar por Categoria
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleToggleCategoryFilter(cat.id)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${
                    selectedCategories.includes(cat.id)
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por Ambientes */}
          <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center">
              <span className="w-1 h-3 bg-emerald-500 rounded-full mr-2"></span>
              Filtrar por Ambiente Base
            </p>
            <div className="flex flex-wrap gap-2">
              {environments.map(env => (
                <button
                  key={env.id}
                  onClick={() => handleToggleEnvFilter(env.id)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${
                    selectedEnvironments.includes(env.id)
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {env.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`flex-grow overflow-y-auto ${!isSpecial ? 'opacity-30 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pr-2">
            {employees
              .filter(e => e.status === 'Ativo')
              .filter(e => selectedCategories.length === 0 || selectedCategories.includes(e.categoryId))
              .filter(e => selectedEnvironments.length === 0 || selectedEnvironments.includes(e.environmentId))
              .map(e => {
                const isUsedHere = currentEnvAssigned.includes(e.id);
                const isUsedElsewhere = assignedIds.includes(e.id) && !isUsedHere;
                const empEnv = environments.find(env => env.id === e.environmentId)?.name;
                const empCat = categories.find(cat => cat.id === e.categoryId)?.name;
                
                return (
                  <button 
                    key={e.id}
                    onClick={() => !isUsedElsewhere && isSpecial && toggleEmployee(e.id)}
                    disabled={isUsedElsewhere || !isSpecial}
                    className={`group text-left p-4 rounded-2xl transition-all border ${
                      isUsedHere ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl scale-[1.02]' : 
                      isUsedElsewhere ? 'bg-slate-800/30 text-slate-600 border-transparent cursor-not-allowed' : 
                      'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500/50 hover:bg-slate-800/80 shadow-md'
                    }`}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-black text-sm truncate pr-2">{e.name}</span>
                        {isUsedElsewhere && <span className="text-[7px] bg-slate-900/50 px-1.5 py-0.5 rounded-full text-rose-400 border border-rose-500/20 font-black">OCUPADO</span>}
                        {isUsedHere && (
                          <div className="bg-white/20 p-1 rounded-full">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center text-[9px] font-bold opacity-60">
                          <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          {empEnv}
                        </div>
                        <div className="flex items-center text-[9px] font-bold opacity-60">
                          <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 11h.01M7 15h.01M11 7h.01M11 11h.01M11 15h.01M15 7h.01M15 11h.01M15 15h.01M19 7h.01M19 11h.01M19 15h.01M7 19h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {empCat}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
          
          {employees.filter(e => e.status === 'Ativo' && 
            (selectedCategories.length === 0 || selectedCategories.includes(e.categoryId)) &&
            (selectedEnvironments.length === 0 || selectedEnvironments.includes(e.environmentId))
          ).length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto opacity-20">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Nenhum colaborador encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleEditor;
