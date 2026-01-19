
import React, { useState } from 'react';
import { Category, Environment, Employee, Holiday, DaySchedule } from '../types';
import ScheduleEditor from './ScheduleEditor';
import { generateSchedule } from '../services/schedulerEngine';

interface Props {
  categories: Category[]; setCategories: any;
  environments: Environment[]; setEnvironments: any;
  employees: Employee[]; setEmployees: any;
  holidays: Holiday[]; setHolidays: any;
  schedules: DaySchedule[]; setSchedules: any;
}

// Fix: Completed the component and added default export to resolve "no default export" error in App.tsx
const AdminView: React.FC<Props> = (props) => {
  const [tab, setTab] = useState<'general' | 'employees' | 'schedule'>('general');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

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
    // Simulates "Publishing" logic - in this app it's stored in localStorage,
    // so this is mostly a UX confirmation step.
    setTimeout(() => {
      setIsPublishing(false);
      alert("Escala publicada com sucesso para visualização pública!");
    }, 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
          <p className="text-slate-400 text-sm mb-6">Lista completa de colaboradores e seus status atuais.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {props.employees.map(emp => (
              <div key={emp.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-100">{emp.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">{props.categories.find(c => c.id === emp.categoryId)?.name || 'Sem Categoria'}</p>
                </div>
                <div className={`px-2 py-1 rounded text-[8px] font-black uppercase ${emp.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {emp.status}
                </div>
              </div>
            ))}
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
    </div>
  );
};

export default AdminView;
