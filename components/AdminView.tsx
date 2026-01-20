
import React, { useState } from 'react';
import { Category, Environment, Employee, Holiday, DaySchedule, EmployeeStatus } from '../types';
import ScheduleEditor from './ScheduleEditor';
import { generateSchedule } from '../services/schedulerEngine';

interface Props {
  categories: Category[]; setCategories: any;
  environments: Environment[]; setEnvironments: any;
  employees: Employee[]; setEmployees: any;
  holidays: Holiday[]; setHolidays: any;
  schedules: DaySchedule[]; setSchedules: any;
}

const AdminView: React.FC<Props> = (props) => {
  const [tab, setTab] = useState<'general' | 'employees' | 'schedule'>('general');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Estados para o Modal de Colaborador (Add/Edit)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);

  const handleAutoGenerate = () => {
    if (!confirm("Isso irá gerar a escala para os próximos 30 dias com base nas regras de priorização. Escalas existentes serão mantidas ou sobrescritas conforme a lógica. Deseja continuar?")) return;

    setIsGenerating(true);
    
    const requirements: Record<string, number> = {};
    props.environments.forEach(env => {
      requirements[env.name] = 2; 
    });

    setTimeout(() => {
      const { newSchedules, updatedEmployees } = generateSchedule(
        new Date(), 
        31, 
        props.employees,
        props.schedules,
        requirements,
        props.holidays
      );

      const existingDates = newSchedules.map(s => s.date);
      const filteredOld = props.schedules.filter(s => !existingDates.includes(s.date));
      
      props.setSchedules([...filteredOld, ...newSchedules]);
      props.setEmployees(updatedEmployees);
      setIsGenerating(false);
      alert("Escala gerada com sucesso!");
      setTab('schedule');
    }, 1000);
  };

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      alert("Escala publicada com sucesso para visualização pública!");
    }, 800);
  };

  // Funções de CRUD de Colaborador
  const openAddEmployee = () => {
    setEditingEmployee({
      status: 'Ativo',
      consecutiveSpecialDaysOff: 0,
      totalSpecialDaysWorked: 0
    });
    setShowEmployeeModal(true);
  };

  const openEditEmployee = (emp: Employee) => {
    setEditingEmployee({ ...emp });
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee?.name || !editingEmployee?.categoryId || !editingEmployee?.environmentId) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    if (editingEmployee.id) {
      // Update
      props.setEmployees(props.employees.map((emp: Employee) => 
        emp.id === editingEmployee.id ? { ...emp, ...editingEmployee } : emp
      ));
    } else {
      // Create
      const newEmployee: Employee = {
        id: Date.now().toString(),
        name: editingEmployee.name!,
        categoryId: editingEmployee.categoryId!,
        environmentId: editingEmployee.environmentId!,
        status: (editingEmployee.status as EmployeeStatus) || 'Ativo',
        consecutiveSpecialDaysOff: 0,
        totalSpecialDaysWorked: 0,
        role: editingEmployee.role || ''
      };
      props.setEmployees([...props.employees, newEmployee]);
    }
    setShowEmployeeModal(false);
    setEditingEmployee(null);
  };

  const handleRemoveEmployee = (id: string) => {
    if (confirm("Tem certeza que deseja remover este colaborador?")) {
      props.setEmployees(props.employees.filter((e: Employee) => e.id !== id));
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
            <button 
              onClick={handleAutoGenerate}
              disabled={isGenerating || props.employees.length === 0}
              className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-2"
            >
              {isGenerating ? "Processando..." : "Sugerir Escala Auto"}
            </button>
            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-indigo-600 border border-indigo-500/20 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center space-x-2"
            >
              {isPublishing ? "Publicando..." : "Confirmar e Publicar"}
            </button>
          </div>
        )}

        {tab === 'employees' && (
          <div className="pb-2">
            <button 
              onClick={openAddEmployee}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center space-x-2"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              <span>Novo Colaborador</span>
            </button>
          </div>
        )}
      </div>

      {tab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800">
            <h3 className="font-bold mb-4 text-slate-100 flex items-center">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-2"></span>
              Ambientes
            </h3>
            <div className="space-y-2">
              {props.environments.map(e => (
                <div key={e.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-sm font-semibold">{e.name}</span>
                  <button onClick={() => props.setEnvironments(props.environments.filter(x => x.id !== e.id))} className="text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2 py-1 rounded text-xs transition">Remover</button>
                </div>
              ))}
              <div className="flex space-x-2 pt-4">
                <input id="newEnv" placeholder="Novo ambiente..." className="flex-grow p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white" />
                <button onClick={() => {
                  const val = (document.getElementById('newEnv') as HTMLInputElement).value;
                  if(val) props.setEnvironments([...props.environments, { id: Date.now().toString(), name: val }]);
                  (document.getElementById('newEnv') as HTMLInputElement).value = '';
                }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl text-lg font-bold shadow-lg shadow-indigo-500/20 transition">+</button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800">
            <h3 className="font-bold mb-4 text-slate-100 flex items-center">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-2"></span>
              Categorias
            </h3>
            <div className="space-y-2">
              {props.categories.map(c => (
                <div key={c.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-sm font-semibold">{c.name}</span>
                  <button onClick={() => props.setCategories(props.categories.filter(x => x.id !== c.id))} className="text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2 py-1 rounded text-xs transition">Remover</button>
                </div>
              ))}
              <div className="flex space-x-2 pt-4">
                <input id="newCat" placeholder="Nova categoria..." className="flex-grow p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white" />
                <button onClick={() => {
                  const val = (document.getElementById('newCat') as HTMLInputElement).value;
                  if(val) props.setCategories([...props.categories, { id: Date.now().toString(), name: val }]);
                  (document.getElementById('newCat') as HTMLInputElement).value = '';
                }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-xl text-lg font-bold shadow-lg shadow-emerald-500/20 transition">+</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'employees' && (
        <div className="bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-800">
          <h3 className="font-bold mb-4 text-slate-100 flex items-center">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-2"></span>
            Equipe do Sistema
          </h3>
          <p className="text-slate-400 text-sm mb-6">Gerencie aqui todos os colaboradores, seus ambientes base e status de trabalho.</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="py-4 px-2">Nome</th>
                  <th className="py-4 px-2">Categoria</th>
                  <th className="py-4 px-2">Ambiente Base</th>
                  <th className="py-4 px-2">Status</th>
                  <th className="py-4 px-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {props.employees.map((emp: Employee) => (
                  <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="py-4 px-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-100">{emp.name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{emp.role || 'Colaborador'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-xs text-slate-400">
                      {props.categories.find(c => c.id === emp.categoryId)?.name || '-'}
                    </td>
                    <td className="py-4 px-2 text-xs text-slate-400">
                      {props.environments.find(e => e.id === emp.environmentId)?.name || '-'}
                    </td>
                    <td className="py-4 px-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                        emp.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 
                        emp.status === 'Férias' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditEmployee(emp)}
                          className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button 
                          onClick={() => handleRemoveEmployee(emp.id)}
                          className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                          title="Remover"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {props.employees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-600 italic">Nenhum colaborador cadastrado.</td>
                  </tr>
                )}
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
        />
      )}

      {/* Modal de Cadastro/Edição de Colaborador */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-xl font-black text-slate-100 tracking-tight">
                {editingEmployee?.id ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h3>
              <button onClick={() => setShowEmployeeModal(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveEmployee} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 ml-1">Nome Completo *</label>
                <input 
                  autoFocus
                  required
                  value={editingEmployee?.name || ''}
                  onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})}
                  className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                  placeholder="Ex: João da Silva"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 ml-1">Categoria *</label>
                  <select 
                    required
                    value={editingEmployee?.categoryId || ''}
                    onChange={e => setEditingEmployee({...editingEmployee, categoryId: e.target.value})}
                    className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">Selecionar...</option>
                    {props.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 ml-1">Ambiente Base *</label>
                  <select 
                    required
                    value={editingEmployee?.environmentId || ''}
                    onChange={e => setEditingEmployee({...editingEmployee, environmentId: e.target.value})}
                    className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">Selecionar...</option>
                    {props.environments.map(en => <option key={en.id} value={en.id}>{en.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 ml-1">Cargo / Função</label>
                  <input 
                    value={editingEmployee?.role || ''}
                    onChange={e => setEditingEmployee({...editingEmployee, role: e.target.value})}
                    className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                    placeholder="Ex: Atendente Jr"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 ml-1">Status Atual</label>
                  <select 
                    value={editingEmployee?.status || 'Ativo'}
                    onChange={e => setEditingEmployee({...editingEmployee, status: e.target.value as EmployeeStatus})}
                    className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Férias">Férias</option>
                    <option value="Atestado">Atestado</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowEmployeeModal(false)}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                  {editingEmployee?.id ? 'Salvar Alterações' : 'Criar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
