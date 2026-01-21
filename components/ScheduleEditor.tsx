
import React, { useState, useEffect } from 'react';
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Estados para o Modal de Checklist
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const holidayInfo = holidays.find(h => h.date === activeDate);
  const isDaySunday = isSunday(activeDate);
  const isSpecial = isDaySunday || !!holidayInfo;

  const currentDaySchedule = schedules.find(s => s.date === activeDate) || { date: activeDate, assignments: [] };
  const assignments = currentDaySchedule.assignments || [];
  const currentEnvAssigned = assignments.find(a => a.environmentId === activeEnv)?.employeeIds || [];

  const sortedEnvs = [...environments].sort((a,b) => b.name.localeCompare(a.name));
  const sortedCats = [...categories].sort((a,b) => a.name.localeCompare(b.name));

  // Categorias que possuem funcionários escalados no ambiente/dia atual
  const activeCategories = sortedCats.filter(cat => 
    currentEnvAssigned.some(id => employees.find(e => e.id === id)?.categoryId === cat.id)
  );

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
        // Clear search when selecting/adding a collaborator
        setSearchTerm('');
      }
      await refreshData();
    } catch (err: any) {
      console.error("Erro na sincronização:", err);
    }
  };

  const handleDeleteDaySchedule = async () => {
    if (!confirm(`Tem certeza que deseja EXCLUIR TODA a escala do dia ${formatDateDisplay(activeDate)}? Isso resetará os contadores dos colaboradores envolvidos.`)) return;

    setIsDeleting(true);
    try {
      // 1. Remover todos os assignments deste dia
      await supabase.from('assignments').delete().eq('date', activeDate);
      
      // 2. Remover o registro do schedule
      await supabase.from('schedules').delete().eq('date', activeDate);

      // 3. Recalcular contadores para refletir a exclusão
      await recalculateAllEmployeeCounters(employees, holidays);
      
      await refreshData();
      alert("Escala do dia removida com sucesso. Contadores atualizados.");
    } catch (err) {
      console.error("Erro ao excluir escala:", err);
      alert("Erro ao excluir escala.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openConfirmation = () => {
    if (!isSpecial) return;
    if (currentEnvAssigned.length === 0) {
      alert("Selecione ao menos um colaborador para sincronizar.");
      return;
    }
    
    // Resetar checklist
    const initialChecklist: Record<string, boolean> = {
      date: false,
      environment: false
    };
    activeCategories.forEach(cat => {
      initialChecklist[`cat_${cat.id}`] = false;
    });
    
    setCheckedItems(initialChecklist);
    setIsChecklistOpen(true);
  };

  const handleFinalConfirm = async () => {
    setIsConfirming(true);
    setIsChecklistOpen(false);
    
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
    return count.toString();
  };

  const getPriorityClasses = (count: number | undefined | null) => {
    const val = count ?? 0;
    if (val === 0) return 'bg-red-500/10 border-red-500/50 text-red-500';
    if (val === 1) return 'bg-orange-500/10 border-orange-500/50 text-orange-500';
    if (val === 2) return 'bg-amber-400/10 border-amber-400/50 text-amber-400';
    if (val === 3) return 'bg-lime-400/10 border-lime-400/50 text-lime-400';
    if (val === 4) return 'bg-emerald-400/10 border-emerald-400/50 text-emerald-400';
    return 'bg-green-500/10 border-green-500/50 text-green-500';
  };

  const isChecklistComplete = () => {
    const requiredKeys = ['date', 'environment', ...activeCategories.map(cat => `cat_${cat.id}`)];
    return requiredKeys.every(key => checkedItems[key]);
  };

  const toggleCheckItem = (key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const currentEnvName = environments.find(e => e.id === activeEnv)?.name || '';
  const dayHasAnyAssignment = assignments.some(a => a.employeeIds.length > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
      {/* Modal de Checklist */}
      {isChecklistOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 p-8 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-100 uppercase tracking-tighter">Conferência de Escala</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Valide todos os itens antes de finalizar</p>
              </div>
              <button onClick={() => setIsChecklistOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {/* Item: Data */}
              <label className={`flex items-start p-4 rounded-2xl border transition-all cursor-pointer group ${checkedItems['date'] ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                <input type="checkbox" checked={checkedItems['date'] || false} onChange={() => toggleCheckItem('date')} className="mt-1 w-5 h-5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900" />
                <div className="ml-4">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-400">Data da Escala</span>
                  <span className="text-sm font-bold text-white">{formatDateDisplay(activeDate)}</span>
                </div>
              </label>

              {/* Item: Ambiente */}
              <label className={`flex items-start p-4 rounded-2xl border transition-all cursor-pointer group ${checkedItems['environment'] ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                <input type="checkbox" checked={checkedItems['environment'] || false} onChange={() => toggleCheckItem('environment')} className="mt-1 w-5 h-5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900" />
                <div className="ml-4">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-400">Ambiente Alvo</span>
                  <span className="text-sm font-bold text-white">{currentEnvName}</span>
                </div>
              </label>

              {/* Itens: Categorias */}
              <div className="pt-2 border-t border-slate-800 space-y-4">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-2">Colaboradores por Categoria</p>
                {activeCategories.map(cat => {
                  const catEmps = currentEnvAssigned
                    .map(id => employees.find(e => e.id === id))
                    .filter(e => e?.categoryId === cat.id);
                  
                  return (
                    <label key={cat.id} className={`flex items-start p-4 rounded-2xl border transition-all cursor-pointer group ${checkedItems[`cat_${cat.id}`] ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                      <input type="checkbox" checked={checkedItems[`cat_${cat.id}`] || false} onChange={() => toggleCheckItem(`cat_${cat.id}`)} className="mt-1 w-5 h-5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900" />
                      <div className="ml-4">
                        <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-400">{cat.name}</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {catEmps.map(e => (
                            <span key={e?.id} className="text-[10px] font-bold text-slate-300">{e?.name}</span>
                          ))}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button 
                onClick={() => setIsChecklistOpen(false)}
                className="flex-1 py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-slate-700 transition-colors text-xs uppercase tracking-widest"
              >
                Corrigir
              </button>
              <button 
                onClick={handleFinalConfirm}
                disabled={!isChecklistComplete()}
                className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isChecklistComplete() ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
              >
                Confirmar Escala
              </button>
            </div>
          </div>
        </div>
      )}

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
              {sortedEnvs.map(env => <option key={env.id} value={env.id}>{env.name}</option>)}
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
            {sortedCats.map(cat => (
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

        <div className="mt-auto pt-4 flex flex-col gap-3">
          <button 
            onClick={openConfirmation} 
            disabled={isConfirming || !isSpecial || currentEnvAssigned.length === 0} 
            className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isSpecial || currentEnvAssigned.length === 0 ? 'bg-slate-800 text-slate-600' : showSuccess ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white shadow-lg'}`}
          >
            {isConfirming ? "Sincronizando..." : showSuccess ? "Dia Sincronizado!" : "Sincronizar Dia"}
          </button>
          
          {dayHasAnyAssignment && (
            <button 
              onClick={handleDeleteDaySchedule}
              disabled={isDeleting}
              className="w-full py-3 border border-rose-500/30 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {isDeleting ? "Excluindo..." : "Excluir Escala do Dia"}
            </button>
          )}
        </div>
      </div>

      {/* Lado Direito: Colaboradores */}
      <div className="lg:col-span-8 bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col h-fit">
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
          <h3 className="text-slate-100 font-black text-lg uppercase tracking-widest">Colaboradores</h3>
          <div className="relative w-64">
             <input 
                type="text" 
                placeholder="Pesquisar por nome..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-[10px] font-black uppercase p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white pl-9 tracking-widest"
             />
             <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
          </div>
        </div>

        {/* Filtros Horizontais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-3 bg-slate-800/30 rounded-2xl border border-slate-800">
            <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Filtrar Categoria</p>
            <div className="flex flex-wrap gap-1.5">
              {sortedCats.map(cat => (
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
              {sortedEnvs.map(env => (
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
              .filter(e => searchTerm === '' || e.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .filter(e => selectedCategories.length === 0 || selectedCategories.includes(e.categoryId))
              .filter(e => selectedEnvironments.length === 0 || selectedEnvironments.includes(e.environmentId))
              .sort((a,b) => a.name.localeCompare(b.name)) // A-Z
              .map(e => {
                const isInactive = e.status !== 'Ativo';
                const isUsedHere = currentEnvAssigned.includes(e.id);
                const isUsedElsewhere = assignedIds.includes(e.id) && !isUsedHere;
                
                return (
                  <button 
                    key={e.id}
                    onClick={() => !isUsedElsewhere && !isInactive && isSpecial && toggleEmployee(e.id)}
                    disabled={isUsedElsewhere || isInactive || !isSpecial}
                    className={`text-left p-4 rounded-2xl transition-all border group relative ${
                      isUsedHere ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 
                      isUsedElsewhere ? 'bg-slate-800/30 border-slate-700/30 opacity-40 cursor-not-allowed grayscale' : 
                      isInactive ? 'bg-slate-900 border-slate-800 border-dashed opacity-40 cursor-not-allowed grayscale' :
                      'bg-slate-800 border-slate-700 hover:border-indigo-500 hover:bg-slate-800/80 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-black text-sm truncate pr-2">{e.name}</span>
                      {isInactive && (
                        <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-lg border flex-shrink-0 ${
                          e.status === 'Férias' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          {e.status}
                        </span>
                      )}
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
                    {isInactive && (
                      <div className="absolute inset-0 bg-slate-950/5 pointer-events-none rounded-2xl"></div>
                    )}
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
