
import React, { useState } from 'react';
import { Category, Environment, Employee, Holiday, DaySchedule, EmployeeStatus } from '../types';
import ScheduleEditor from './ScheduleEditor';
import { generateSchedule } from '../services/schedulerEngine';
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
  const [tab, setTab] = useState<'general' | 'employees' | 'schedule'>('general');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);

  const handleAutoGenerate = async () => {
    if (!confirm("Isso irá gerar a escala para os próximos 30 dias e salvar no Supabase. Continuar?")) return;

    setIsGenerating(true);
    
    const requirements: Record<string, number> = {};
    props.environments.forEach(env => {
      requirements[env.id] = 2; 
    });

    const { newSchedules, updatedEmployees } = generateSchedule(
      new Date(), 
      31, 
      props.employees,
      props.schedules,
      requirements,
      props.holidays
    );

    try {
      for (const emp of updatedEmployees) {
        await supabase.from('employees').update({
          last_sunday_worked: emp.lastSundayWorked,
          consecutive_sundays_off: emp.consecutiveSundaysOff,
          total_sundays_worked: emp.totalSundaysWorked,
          last_holiday_worked: emp.lastHolidayWorked,
          consecutive_holidays_off: emp.consecutiveHolidaysOff,
          total_holidays_worked: emp.totalHolidaysWorked
        }).eq('id', emp.id);
      }

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
          const { error } = await supabase.from('assignments').insert(assignmentsToInsert);
          if (error) throw error;
        }
      }

      await props.refreshData();
      alert("Escala gerada e salva com sucesso!");
      setTab('schedule');
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar no banco de dados.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent | null, closeAfter: boolean = true) => {
    if (e) e.preventDefault();
    if (!editingEmployee?.name || !editingEmployee?.categoryId || !editingEmployee?.environmentId) {
      alert("Preencha todos os campos obrigatórios.");
      return;
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
          // Inicializa com 99 para garantir que quem nunca trabalhou seja priorizado e mostre ">10"
          consecutive_sundays_off: 99,
          total_sundays_worked: 0,
          consecutive_holidays_off: 99,
          total_holidays_worked: 0
        }]);
      }
      await props.refreshData();
      
      if (closeAfter) {
        setShowEmployeeModal(false);
        setEditingEmployee(null);
      } else {
        setEditingEmployee({
          ...editingEmployee,
          name: '',
          id: undefined 
        });
        const nameInput = document.getElementById('emp-name') as HTMLInputElement;
        if (nameInput) nameInput.focus();
      }
    } catch (err) {
      alert("Erro ao salvar funcionário.");
    }
  };

  const handleRemoveEmployee = async (id: string) => {
    if (confirm("Remover do banco de dados permanentemente?")) {
      await supabase.from('employees').delete().eq('id', id);
      await props.refreshData();
    }
  };

  const openEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setShowEmployeeModal(true);
  };

  const handleAddEnv = async () => {
    const el = document.getElementById('newEnv') as HTMLInputElement;
    if (el.value) {
      await supabase.from('environments').insert([{ name: el.value }]);
      await props.refreshData();
      el.value = '';
    }
  };

  const handleRemoveEnv = async (id: string) => {
    if(!confirm("Remover este ambiente?")) return;
    await supabase.from('environments').delete().eq('id', id);
    await props.refreshData();
  };

  const handleAddCat = async () => {
    const el = document.getElementById('newCat') as HTMLInputElement;
    if (el.value) {
      await supabase.from('categories').insert([{ name: el.value }]);
      await props.refreshData();
      el.value = '';
    }
  };

  const handleRemoveCat = async (id: string) => {
    if(!confirm("Remover esta categoria?")) return;
    await supabase.from('categories').delete().eq('id', id);
    await props.refreshData();
  };

  const handleAddHoliday = async () => {
    const dateEl = document.getElementById('hDate') as HTMLInputElement;
    const nameEl = document.getElementById('hName') as HTMLInputElement;
    const d = dateEl.value;
    const n = nameEl.value;
    if (d && n) {
      await supabase.from('holidays').insert([{ date: d, name: n }]);
      await props.refreshData();
      dateEl.value = '';
      nameEl.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-slate-800">
        <div className="flex space-x-6 pb-1">
          <button onClick={() => setTab('general')} className={`pb-3 text-sm font-bold transition-all relative ${tab === 'general' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
            Config. Gerais
            {tab === 'general' && <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-indigo-400"></span>}
          </button>
          <button onClick={() => setTab('employees')} className={`pb-3 text-sm font-bold transition-all relative ${tab === 'employees' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
            Equipe
            {tab === 'employees' && <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-indigo-400"></span>}
          </button>
          <button onClick={() => setTab('schedule')} className={`pb-3 text-sm font-bold transition-all relative ${tab === 'schedule' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
            Gerenciar Escala
            {tab === 'schedule' && <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-indigo-400"></span>}
          </button>
        </div>

        {tab === 'schedule' && (
          <div className="flex items-center space-x-2 pb-2">
            <button onClick={handleAutoGenerate} disabled={isGenerating} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">
              {isGenerating ? "Processando..." : "Gerar Escala Mensal"}
            </button>
          </div>
        )}
        
        {tab === 'employees' && (
          <div className="pb-2">
            <button onClick={() => { setEditingEmployee({ status: 'Ativo' }); setShowEmployeeModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center space-x-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              <span>Novo Colaborador</span>
            </button>
          </div>
        )}
      </div>

      {tab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="font-bold mb-4 text-slate-100 flex items-center">
               <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-2"></span>
               Ambientes
            </h3>
            <div className="space-y-2">
              {props.environments.map(e => (
                <div key={e.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700/50 group">
                  <span className="text-sm font-semibold">{e.name}</span>
                  <button onClick={() => handleRemoveEnv(e.id)} className="text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition">Remover</button>
                </div>
              ))}
              <div className="flex space-x-2 pt-4">
                <input id="newEnv" placeholder="Novo ambiente..." className="flex-grow p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500" />
                <button onClick={handleAddEnv} className="bg-indigo-600 px-4 rounded-xl text-white font-bold hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20">+</button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="font-bold mb-4 text-slate-100 flex items-center">
               <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-2"></span>
               Categorias
            </h3>
            <div className="space-y-2">
              {props.categories.map(c => (
                <div key={c.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700/50 group">
                  <span className="text-sm font-semibold">{c.name}</span>
                  <button onClick={() => handleRemoveCat(c.id)} className="text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition">Remover</button>
                </div>
              ))}
              <div className="flex space-x-2 pt-4">
                <input id="newCat" placeholder="Nova categoria..." className="flex-grow p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500" />
                <button onClick={handleAddCat} className="bg-emerald-600 px-4 rounded-xl text-white font-bold hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20">+</button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 md:col-span-2 shadow-xl">
            <h3 className="font-bold mb-6 text-slate-100">Feriados Nacionais e Locais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {props.holidays.map(h => (
                <div key={h.id} className="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-slate-700/50">
                  <div className="text-[10px]">
                    <p className="text-slate-500 font-bold uppercase tracking-widest">{new Date(h.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                    <p className="font-bold text-slate-200 text-sm">{h.name}</p>
                  </div>
                  <button onClick={async () => { await supabase.from('holidays').delete().eq('id', h.id); await props.refreshData(); }} className="text-rose-500 hover:scale-110 transition">&times;</button>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input type="date" id="hDate" className="bg-slate-800 p-3 rounded-xl text-sm text-white border border-slate-700 outline-none" />
              <input type="text" id="hName" placeholder="Nome do feriado (Ex: Natal)" className="flex-grow bg-slate-800 p-3 rounded-xl text-sm text-white border border-slate-700 outline-none" />
              <button onClick={handleAddHoliday} className="bg-indigo-600 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'employees' && (
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-800">
                  <th className="py-4">Nome</th>
                  <th className="py-4">Categoria</th>
                  <th className="py-4">Ambiente Base</th>
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
                    <td className="py-4">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${emp.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : emp.status === 'Férias' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditEmployee(emp)} className="text-indigo-400 text-xs font-bold mr-4 hover:text-indigo-300">Editar</button>
                      <button onClick={() => handleRemoveEmployee(emp.id)} className="text-rose-400 text-xs font-bold hover:text-rose-300">Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'schedule' && (
        <ScheduleEditor 
          employees={props.employees}
          categories={props.categories}
          environments={props.environments}
          schedules={props.schedules}
          setSchedules={props.setSchedules}
          holidays={props.holidays}
          refreshData={props.refreshData}
        />
      )}

      {showEmployeeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 p-8 shadow-2xl">
            <h3 className="text-xl font-black mb-6 text-slate-100">{editingEmployee?.id ? 'Editar' : 'Novo'} Colaborador</h3>
            <form onSubmit={(e) => handleSaveEmployee(e, true)} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                <input id="emp-name" required value={editingEmployee?.name || ''} onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})} placeholder="Ex: Maria Oliveira" className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Categoria</label>
                  <select required value={editingEmployee?.categoryId || ''} onChange={e => setEditingEmployee({...editingEmployee, categoryId: e.target.value})} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Selecionar...</option>
                    {props.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Ambiente Base</label>
                  <select required value={editingEmployee?.environmentId || ''} onChange={e => setEditingEmployee({...editingEmployee, environmentId: e.target.value})} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Selecionar...</option>
                    {props.environments.map(en => <option key={en.id} value={en.id}>{en.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Status do Colaborador</label>
                <select 
                  required 
                  value={editingEmployee?.status || 'Ativo'} 
                  onChange={e => setEditingEmployee({...editingEmployee, status: e.target.value as EmployeeStatus})} 
                  className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Férias">Férias</option>
                  <option value="Atestado">Atestado</option>
                </select>
              </div>

              <div className="pt-6 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                <button type="button" onClick={() => setShowEmployeeModal(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-slate-700 transition">Cancelar</button>
                {!editingEmployee?.id && (
                  <button type="button" onClick={(e) => handleSaveEmployee(e, false)} className="flex-1 py-4 bg-slate-700 border border-slate-600 text-slate-100 font-bold rounded-2xl hover:bg-slate-600 transition">Salvar e Novo</button>
                )}
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
