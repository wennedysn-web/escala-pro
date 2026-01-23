
import React, { useState } from 'react';
import { Category, Environment, Employee, Holiday, DaySchedule, EmployeeStatus } from '../types';
import ScheduleEditor from './ScheduleEditor';
import PrintPreview from './PrintPreview';
import MuralPreview from './MuralPreview';
import ReportsOverview from './ReportsOverview';
import { recalculateAllEmployeeCounters } from '../services/counterService';
import { supabase } from '../lib/supabase';

interface Props {
  userId: string;
  categories: Category[]; setCategories: any;
  environments: Environment[]; setEnvironments: any;
  employees: Employee[]; setEmployees: any;
  holidays: Holiday[]; setHolidays: any;
  schedules: DaySchedule[]; setSchedules: any;
  refreshData: () => Promise<void>;
}

const AdminView: React.FC<Props> = (props) => {
  const [tab, setTab] = useState<'general' | 'employees' | 'schedule' | 'print' | 'mural' | 'others'>('general');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [empSearch, setEmpSearch] = useState('');

  const [newEnvName, setNewEnvName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newHolDate, setNewHolDate] = useState('');
  const [newHolName, setNewHolName] = useState('');

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await recalculateAllEmployeeCounters(props.employees, props.holidays);
      await props.refreshData();
    } catch (err) {
      console.error(err);
      alert("Erro ao recalcular contadores.");
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleAddEnvironment = async () => {
    if (!newEnvName) return;

    // Limitation check: only 2 environments allowed
    if (props.environments.length >= 2) {
      alert("LIMITE DE AMBIENTE ATINGIDO, FAÇA UPGRADE NO BANCO DE DADOS DO SUPABASE");
      return;
    }

    const { error } = await supabase.from('environments').insert([{ 
      name: newEnvName, 
      user_id: props.userId 
    }]);
    if (error) alert("Erro ao adicionar ambiente");
    else { setNewEnvName(''); await props.refreshData(); }
  };

  const handleAddCategory = async () => {
    if (!newCatName) return;
    const { error } = await supabase.from('categories').insert([{ 
      name: newCatName, 
      user_id: props.userId 
    }]);
    if (error) alert("Erro ao adicionar categoria");
    else { setNewCatName(''); await props.refreshData(); }
  };

  const handleAddHoliday = async () => {
    if (!newHolDate || !newHolName) return;
    const { error } = await supabase.from('holidays').insert([{ 
      date: newHolDate, 
      name: newHolName, 
      user_id: props.userId 
    }]);
    if (error) alert("Erro ao adicionar feriado");
    else { setNewHolDate(''); setNewHolName(''); await props.refreshData(); }
  };

  const handleRemoveItem = async (table: string, id: string, name: string) => {
    if (!confirm(`TEM CERTEZA que deseja EXCLUIR permanentemente "${name}"?`)) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) alert("Erro ao remover item");
    else await props.refreshData();
  };

  const handleSaveEmployee = async (e: React.FormEvent | null, closeAfter: boolean = true) => {
    if (e) e.preventDefault();
    if (!editingEmployee?.name || !editingEmployee?.categoryId || !editingEmployee?.environmentId) {
      alert("Preencha todos os campos obrigatórios."); return;
    }
    
    // Limitation check: 55 employees limit
    if (!editingEmployee.id && props.employees.length >= 55) {
      alert("LIMITE DE COLABORADORES ATINGIDO, FAÇA UPGRADE NO BANCO DE DADOS DO SUPABASE");
      return;
    }

    const payload = {
      name: editingEmployee.name,
      category_id: editingEmployee.categoryId,
      environment_id: editingEmployee.environmentId,
      status: editingEmployee.status || 'Ativo',
      role: editingEmployee.role || '',
      user_id: props.userId
    };

    try {
      let res;
      if (editingEmployee.id) {
        res = await supabase.from('employees').update(payload).eq('id', editingEmployee.id);
      } else {
        res = await supabase.from('employees').insert([{
          ...payload,
          consecutive_sundays_off: 0,
          total_sundays_worked: 0,
          sundays_worked_current_year: 0,
          consecutive_holidays_off: 0,
          total_holidays_worked: 0,
          holidays_worked_current_year: 0
        }]);
      }

      if (res.error) throw res.error;
      await props.refreshData();
      if (closeAfter) {
        setShowEmployeeModal(false);
        setEditingEmployee(null);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar colaborador.");
    }
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Excluir o colaborador "${name}" permanentemente?`)) return;
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      await props.refreshData();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir colaborador.");
    }
  };

  const sortedEnvs = [...props.environments].sort((a,b) => b.name.localeCompare(a.name));
  const sortedCats = [...props.categories].sort((a,b) => a.name.localeCompare(b.name));
  const filteredEmployees = props.employees
    .filter(e => e.name.toLowerCase().includes(empSearch.toLowerCase()))
    .sort((a,b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      {isRecalculating && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl flex flex-col items-center space-y-6 max-w-sm text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tighter text-white">Recalculando Histórico</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">Sincronizando seus dados personalizados...</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-800">
        {[
          { id: 'general', label: 'Painel', icon: 'M4 6h16M4 12h16m-7 6h7' },
          { id: 'employees', label: 'Equipe', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          { id: 'schedule', label: 'Escalas', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { id: 'print', label: 'Relatórios A4', icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' },
          { id: 'mural', label: 'Mural', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z' },
          { id: 'others', label: 'Auditoria', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
        ].map((t) => (
          <button
            key={t.id}
            disabled={isRecalculating}
            onClick={() => setTab(t.id as any)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 bg-slate-900/50 border border-slate-800'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={t.icon} /></svg>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'general' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-6">
                <h3 className="text-xl font-black uppercase tracking-tighter">Sincronização</h3>
                <p className="text-slate-500 text-xs">Recalcula todos os contadores com base nas suas escalas salvas.</p>
                <button onClick={handleRecalculate} disabled={isRecalculating} className="w-full max-w-sm py-4 bg-slate-800 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-700 hover:bg-slate-700 transition-colors">
                  {isRecalculating ? "Recalculando..." : "Recalcular Histórico"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span> Ambientes
                </h4>
                <div className="flex-grow space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                  {sortedEnvs.map(env => (
                    <div key={env.id} className="flex justify-between items-center bg-slate-800/50 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-xs font-bold">{env.name}</span>
                      <button onClick={() => handleRemoveItem('environments', env.id, env.name)} className="text-rose-500 hover:text-rose-400 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input value={newEnvName} onChange={e => setNewEnvName(e.target.value)} placeholder="Novo ambiente..." className="flex-grow bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                    <button onClick={handleAddEnvironment} className="bg-indigo-600 px-3 py-2 rounded-xl text-white transition-all hover:scale-105 active:scale-95"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg></button>
                  </div>
                  {props.environments.length >= 2 && (
                    <div className="mt-4 p-3 border-2 border-dashed border-indigo-500/50 rounded-xl bg-indigo-500/5">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest text-center leading-tight">
                        LIMITE DE AMBIENTE ATINGIDO, FAÇA UPGRADE NO BANCO DE DADOS DO SUPABASE
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span> Categorias
                </h4>
                <div className="flex-grow space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                  {sortedCats.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center bg-slate-800/50 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-xs font-bold">{cat.name}</span>
                      <button onClick={() => handleRemoveItem('categories', cat.id, cat.name)} className="text-rose-500 hover:text-rose-400 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nova categoria..." className="flex-grow bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500" />
                  <button onClick={handleAddCategory} className="bg-emerald-600 px-3 py-2 rounded-xl text-white transition-all hover:scale-105 active:scale-95"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg></button>
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span> Feriados
                </h4>
                <div className="flex-grow space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                  {props.holidays.map(hol => (
                    <div key={hol.id} className="flex justify-between items-center bg-slate-800/50 p-2.5 rounded-xl border border-slate-700">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{hol.name}</span>
                        <span className="text-[8px] text-slate-500 font-black uppercase">{new Date(hol.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                      <button onClick={() => handleRemoveItem('holidays', hol.id, hol.name)} className="text-rose-500 hover:text-rose-400 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <input type="date" value={newHolDate} onChange={e => setNewHolDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs outline-none" />
                  <div className="flex gap-2">
                    <input value={newHolName} onChange={e => setNewHolName(e.target.value)} placeholder="Nome do feriado..." className="flex-grow bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-rose-500" />
                    <button onClick={handleAddHoliday} className="bg-rose-600 px-3 py-2 rounded-xl text-white transition-all hover:scale-105 active:scale-95"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'employees' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Colaboradores</h2>
              <div className="flex flex-grow w-full md:w-auto md:max-w-md items-center gap-4">
                 <div className="relative flex-grow">
                    <input 
                      type="text" 
                      placeholder="Pesquisar por nome..." 
                      value={empSearch}
                      onChange={e => setEmpSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs font-black uppercase tracking-widest p-3 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all pl-10"
                    />
                    <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
                 <button onClick={() => { setEditingEmployee({}); setShowEmployeeModal(true); }} className="whitespace-nowrap bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform">+ Adicionar</button>
              </div>
            </div>

            {props.employees.length >= 55 && (
              <div className="p-3 border-2 border-dashed border-rose-500/50 rounded-xl bg-rose-500/5">
                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest text-center leading-tight">
                  limite de colaboradores atingido, faça upgrade no banco de dados do supabase
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map(emp => (
                <div key={emp.id} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-indigo-600/10 text-indigo-400 rounded-2xl flex items-center justify-center font-black text-xl border border-indigo-500/20">{emp.name.charAt(0)}</div>
                    <div className="flex space-x-2">
                      <button onClick={() => { setEditingEmployee(emp); setShowEmployeeModal(true); }} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                      <button onClick={() => handleDeleteEmployee(emp.id, emp.name)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                  <h4 className="font-bold">{emp.name}</h4>
                  <div className="flex flex-wrap gap-2 items-center mt-1">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{props.categories.find(c => c.id === emp.categoryId)?.name}</p>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                      emp.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      emp.status === 'Férias' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                      'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    }`}>
                      {emp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'schedule' && (
          <ScheduleEditor 
            userId={props.userId}
            employees={props.employees} 
            categories={props.categories} 
            environments={props.environments} 
            schedules={props.schedules} 
            setSchedules={props.setSchedules}
            holidays={props.holidays}
            refreshData={props.refreshData}
          />
        )}
        {tab === 'print' && <PrintPreview employees={props.employees} schedules={props.schedules} environments={props.environments} holidays={props.holidays} categories={props.categories} />}
        {tab === 'mural' && <MuralPreview employees={props.employees} schedules={props.schedules} environments={props.environments} holidays={props.holidays} categories={props.categories} />}
        {tab === 'others' && <ReportsOverview employees={props.employees} environments={props.environments} categories={props.categories} holidays={props.holidays} />}
      </div>

      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 p-8 shadow-2xl">
            <h3 className="text-xl font-black uppercase mb-6">{editingEmployee?.id ? 'Editar Colaborador' : 'Novo Colaborador'}</h3>
            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <input required value={editingEmployee?.name || ''} placeholder="Nome Completo" onChange={e => setEditingEmployee({...editingEmployee!, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <select required value={editingEmployee?.categoryId || ''} onChange={e => setEditingEmployee({...editingEmployee!, categoryId: e.target.value})} className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none">
                  <option value="">Categoria</option>
                  {sortedCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select required value={editingEmployee?.environmentId || ''} onChange={e => setEditingEmployee({...editingEmployee!, environmentId: e.target.value})} className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none">
                  <option value="">Ambiente Base</option>
                  {sortedEnvs.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Situação / Status</label>
                <select 
                  required 
                  value={editingEmployee?.status || 'Ativo'} 
                  onChange={e => setEditingEmployee({...editingEmployee!, status: e.target.value as EmployeeStatus})} 
                  className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Férias">Férias</option>
                  <option value="Atestado">Atestado / Afastado</option>
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowEmployeeModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-black text-xs uppercase">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-indigo-600/20">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
