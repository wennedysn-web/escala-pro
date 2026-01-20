
import React, { useState } from 'react';
import { Category, Environment, Employee, Holiday, DaySchedule, EmployeeStatus } from '../types';
import ScheduleEditor from './ScheduleEditor';
import PrintPreview from './PrintPreview';
import MuralPreview from './MuralPreview';
import ReportsOverview from './ReportsOverview';
import { generateSchedule } from '../services/schedulerEngine';
import { recalculateAllEmployeeCounters } from '../services/counterService';
import { supabase } from '../lib/supabase';

interface Props {
  categories: Category[]; setCategories: any;
  environments: Environment[]; setEnvironments: any;
  employees: Employee[]; setEmployees: any;
  holidays: Holiday[]; setHolidays: any;
  schedules: DaySchedule[]; setSchedules: any;
  refreshData: () => Promise<void>;
}

const AdminView: React.FC<Props> = (props) => {
  const [tab, setTab] = useState<'general' | 'employees' | 'schedule' | 'print' | 'mural' | 'others'>('general');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    await recalculateAllEmployeeCounters(props.employees, props.holidays);
    await props.refreshData();
    setIsRecalculating(false);
  };

  const handleAutoGenerate = async () => {
    if (!confirm("Gerar escala inteligente para os próximos 31 dias?")) return;

    setIsGenerating(true);
    const requirements: Record<string, number> = {};
    props.environments.forEach(env => { requirements[env.id] = 2; });

    const { newSchedules } = generateSchedule(
      new Date(), 31, props.employees, props.schedules, requirements, props.holidays
    );

    try {
      for (const sch of newSchedules) {
        await supabase.from('schedules').upsert({
          date: sch.date,
          is_sunday: sch.isSunday,
          is_holiday: sch.isHoliday,
          holiday_name: sch.holidayName
        });
        await supabase.from('assignments').delete().eq('date', sch.date);
        const assignmentsToInsert = sch.assignments.flatMap(a => 
          a.employeeIds.map(empId => ({
            date: sch.date,
            environment_id: a.environmentId,
            employee_id: empId
          }))
        );
        if (assignmentsToInsert.length > 0) {
          await supabase.from('assignments').insert(assignmentsToInsert);
        }
      }

      await recalculateAllEmployeeCounters(props.employees, props.holidays);
      
      await props.refreshData();
      alert("Escala gerada e contadores atualizados!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar escala.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent | null, closeAfter: boolean = true) => {
    if (e) e.preventDefault();
    if (!editingEmployee?.name || !editingEmployee?.categoryId || !editingEmployee?.environmentId) {
      alert("Preencha todos os campos."); return;
    }
    const payload = {
      name: editingEmployee.name,
      category_id: editingEmployee.categoryId,
      environment_id: editingEmployee.environmentId,
      status: editingEmployee.status || 'Ativo',
      role: editingEmployee.role || ''
    };
    try {
      if (editingEmployee.id) {
        await supabase.from('employees').update(payload).eq('id', editingEmployee.id);
      } else {
        await supabase.from('employees').insert([{
          ...payload,
          consecutive_sundays_off: 99,
          total_sundays_worked: 0,
          sundays_worked_current_year: 0,
          consecutive_holidays_off: 99,
          total_holidays_worked: 0,
          holidays_worked_current_year: 0
        }]);
      }
      await props.refreshData();
      if (closeAfter) { setShowEmployeeModal(false); setEditingEmployee(null); }
    } catch (err) { alert("Erro ao salvar."); }
  };

  const getStatusBadgeClass = (status: EmployeeStatus) => {
    switch (status) {
      case 'Ativo': return 'bg-emerald-500/10 text-emerald-400';
      case 'Férias': return 'bg-amber-500/10 text-amber-400';
      case 'Atestado': return 'bg-rose-500/10 text-rose-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-slate-800 print:hidden">
        <div className="flex space-x-6 pb-1 overflow-x-auto">
          {[
            { id: 'general', label: 'Config. Gerais' },
            { id: 'employees', label: 'Equipe' },
            { id: 'schedule', label: 'Gerenciar Escala' },
            { id: 'print', label: 'Relatório' },
            { id: 'mural', label: 'Mural (A4)' },
            { id: 'others', label: 'Outros Relatórios' }
          ].map((t) => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id as any)} 
              className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${tab === t.id ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t.label}
              {tab === t.id && <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-indigo-400"></span>}
            </button>
          ))}
        </div>

        <div className="flex gap-2 pb-2">
          {tab === 'schedule' && (
            <>
              <button onClick={handleRecalculate} disabled={isRecalculating} className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700">
                {isRecalculating ? "Auditoria..." : "Recalcular Histórico"}
              </button>
              <button onClick={handleAutoGenerate} disabled={isGenerating} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">
                {isGenerating ? "Gerando..." : "Gerar Escala Mensal"}
              </button>
            </>
          )}
          {tab === 'employees' && (
            <button onClick={() => { setEditingEmployee({ status: 'Ativo' }); setShowEmployeeModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">
              Novo Colaborador
            </button>
          )}
        </div>
      </div>

      {tab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="font-bold mb-4 text-slate-100 flex items-center">
               <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-2"></span> Ambientes
            </h3>
            <div className="space-y-2">
              {props.environments.map(e => (
                <div key={e.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700/50 group">
                  <span className="text-sm font-semibold">{e.name}</span>
                  <button onClick={async () => { if(confirm("Remover?")) { await supabase.from('environments').delete().eq('id', e.id); props.refreshData(); } }} className="text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition">Remover</button>
                </div>
              ))}
              <div className="flex space-x-2 pt-4">
                <input id="newEnv" placeholder="Novo ambiente..." className="flex-grow p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500" />
                <button onClick={async () => { const el = document.getElementById('newEnv') as HTMLInputElement; if(el.value){ await supabase.from('environments').insert([{name: el.value}]); props.refreshData(); el.value=''; } }} className="bg-indigo-600 px-4 rounded-xl text-white font-bold hover:bg-indigo-500 transition">+</button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="font-bold mb-4 text-slate-100 flex items-center">
               <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-2"></span> Categorias
            </h3>
            <div className="space-y-2">
              {props.categories.map(c => (
                <div key={c.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700/50 group">
                  <span className="text-sm font-semibold">{c.name}</span>
                  <button onClick={async () => { if(confirm("Remover?")) { await supabase.from('categories').delete().eq('id', c.id); props.refreshData(); } }} className="text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition">Remover</button>
                </div>
              ))}
              <div className="flex space-x-2 pt-4">
                <input id="newCat" placeholder="Nova categoria..." className="flex-grow p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500" />
                <button onClick={async () => { const el = document.getElementById('newCat') as HTMLInputElement; if(el.value){ await supabase.from('categories').insert([{name: el.value}]); props.refreshData(); el.value=''; } }} className="bg-emerald-600 px-4 rounded-xl text-white font-bold hover:bg-emerald-500 transition">+</button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 md:col-span-2 shadow-xl">
            <h3 className="font-bold mb-6 text-slate-100">Feriados</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {props.holidays.map(h => (
                <div key={h.id} className="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-slate-700/50">
                  <div className="text-[10px]">
                    <p className="text-slate-500 font-bold uppercase tracking-widest">{new Date(h.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                    <p className="font-bold text-slate-200 text-sm">{h.name}</p>
                  </div>
                  <button onClick={async () => { await supabase.from('holidays').delete().eq('id', h.id); props.refreshData(); }} className="text-rose-500 hover:scale-110 transition">&times;</button>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input type="date" id="hDate" className="bg-slate-800 p-3 rounded-xl text-sm text-white border border-slate-700" />
              <input type="text" id="hName" placeholder="Nome do feriado" className="flex-grow bg-slate-800 p-3 rounded-xl text-sm text-white border border-slate-700" />
              <button onClick={async () => { const d = (document.getElementById('hDate') as HTMLInputElement).value; const n = (document.getElementById('hName') as HTMLInputElement).value; if(d && n){ await supabase.from('holidays').insert([{date:d, name:n}]); props.refreshData(); } }} className="bg-indigo-600 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'employees' && (
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-800">
                <th className="py-4">Nome</th>
                <th className="py-4">Categoria</th>
                <th className="py-4">Ambiente</th>
                <th className="py-4">Folgas (D/F)</th>
                <th className="py-4">Trabalhados (Ano)</th>
                <th className="py-4">Status</th>
                <th className="py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {props.employees.map(emp => (
                <tr key={emp.id} className="group hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 font-bold text-slate-100">{emp.name}</td>
                  <td className="py-4 text-xs text-slate-400">{props.categories.find(c => c.id === emp.categoryId)?.name || '-'}</td>
                  <td className="py-4 text-xs text-slate-400">{props.environments.find(e => e.id === emp.environmentId)?.name || '-'}</td>
                  <td className="py-4 text-xs font-black text-indigo-400">{emp.consecutiveSundaysOff}/{emp.consecutiveHolidaysOff}</td>
                  <td className="py-4 text-xs font-black text-emerald-400">D: {emp.sundaysWorkedCurrentYear} / F: {emp.holidaysWorkedCurrentYear}</td>
                  <td className="py-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${getStatusBadgeClass(emp.status)}`}>{emp.status}</span>
                  </td>
                  <td className="py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingEmployee(emp); setShowEmployeeModal(true); }} className="text-indigo-400 text-xs font-bold mr-4">Editar</button>
                    <button onClick={async () => { if(confirm("Remover?")) { await supabase.from('employees').delete().eq('id', emp.id); props.refreshData(); } }} className="text-rose-400 text-xs font-bold">Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'schedule' && (
        <ScheduleEditor 
          employees={props.employees} categories={props.categories} environments={props.environments}
          schedules={props.schedules} setSchedules={props.setSchedules} holidays={props.holidays} refreshData={props.refreshData}
        />
      )}

      {tab === 'print' && (
        <PrintPreview 
          employees={props.employees}
          schedules={props.schedules}
          environments={props.environments}
          holidays={props.holidays}
          categories={props.categories}
        />
      )}

      {tab === 'mural' && (
        <MuralPreview 
          employees={props.employees}
          schedules={props.schedules}
          environments={props.environments}
          holidays={props.holidays}
          categories={props.categories}
        />
      )}

      {tab === 'others' && (
        <ReportsOverview
          employees={props.employees}
          environments={props.environments}
          categories={props.categories}
          holidays={props.holidays}
        />
      )}

      {showEmployeeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 p-8 shadow-2xl">
            <h3 className="text-xl font-black mb-6 text-slate-100">{editingEmployee?.id ? 'Editar' : 'Novo'} Colaborador</h3>
            <form onSubmit={(e) => handleSaveEmployee(e, true)} className="space-y-4">
              <input required value={editingEmployee?.name || ''} onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})} placeholder="Nome Completo" className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <select required value={editingEmployee?.categoryId || ''} onChange={e => setEditingEmployee({...editingEmployee, categoryId: e.target.value})} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none">
                  <option value="">Categoria...</option>
                  {props.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select required value={editingEmployee?.environmentId || ''} onChange={e => setEditingEmployee({...editingEmployee, environmentId: e.target.value})} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none">
                  <option value="">Ambiente...</option>
                  {props.environments.map(en => <option key={en.id} value={en.id}>{en.name}</option>)}
                </select>
              </div>
              <select required value={editingEmployee?.status || 'Ativo'} onChange={e => setEditingEmployee({...editingEmployee, status: e.target.value as EmployeeStatus})} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none">
                <option value="Ativo">Ativo</option>
                <option value="Férias">Férias</option>
                <option value="Atestado">Atestado</option>
              </select>
              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setShowEmployeeModal(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black text-sm uppercase rounded-2xl">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
