
import React, { useState } from 'react';
import { Category, Environment, Employee, Holiday, DaySchedule } from '../types';
import ScheduleEditor from './ScheduleEditor';

interface Props {
  categories: Category[]; setCategories: any;
  environments: Environment[]; setEnvironments: any;
  employees: Employee[]; setEmployees: any;
  holidays: Holiday[]; setHolidays: any;
  schedules: DaySchedule[]; setSchedules: any;
}

const AdminView: React.FC<Props> = (props) => {
  const [tab, setTab] = useState<'general' | 'employees' | 'schedule'>('general');

  return (
    <div className="space-y-8">
      <div className="flex space-x-6 border-b border-slate-800 pb-1">
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
                }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl text-lg font-bold shadow-lg shadow-indigo-500/20 transition">+</button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 md:col-span-2">
            <h3 className="font-bold mb-6 text-slate-100">Feriados Cadastrados</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {props.holidays.map(h => (
                <div key={h.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex justify-between items-center shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{h.date}</span>
                    <span className="text-xs font-bold text-slate-100">{h.name}</span>
                  </div>
                  <button onClick={() => props.setHolidays(props.holidays.filter(x => x.id !== h.id))} className="text-slate-500 hover:text-rose-400 p-1 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-8 p-4 bg-slate-800/50 rounded-2xl border border-slate-800">
              <input type="date" id="hDate" className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              <input type="text" id="hName" placeholder="Nome do feriado" className="flex-grow p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              <button onClick={() => {
                const d = (document.getElementById('hDate') as HTMLInputElement).value;
                const n = (document.getElementById('hName') as HTMLInputElement).value;
                if(d && n) props.setHolidays([...props.holidays, { id: Date.now().toString(), date: d, name: n }]);
              }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition">Adicionar Feriado</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'employees' && (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl text-slate-100 tracking-tight">Gestão de Equipe</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">{props.employees.length} cadastrados</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400">
                  <th className="py-4 px-4 font-black text-[10px] uppercase tracking-wider">Nome</th>
                  <th className="py-4 px-4 font-black text-[10px] uppercase tracking-wider">Categoria</th>
                  <th className="py-4 px-4 font-black text-[10px] uppercase tracking-wider">Ambiente Base</th>
                  <th className="py-4 px-4 font-black text-[10px] uppercase tracking-wider">Status</th>
                  <th className="py-4 px-4 font-black text-[10px] uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {props.employees.map(e => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-bold text-slate-100">{e.name}</td>
                    <td className="py-4 px-4 text-slate-400">{props.categories.find(c => c.id === e.categoryId)?.name || '-'}</td>
                    <td className="py-4 px-4 text-slate-400">{props.environments.find(env => env.id === e.environmentId)?.name || '-'}</td>
                    <td className="py-4 px-4">
                      <select 
                        value={e.status} 
                        onChange={(ev) => {
                          const newStatus = ev.target.value as any;
                          props.setEmployees(props.employees.map(x => x.id === e.id ? {...x, status: newStatus} : x));
                        }}
                        className={`text-[10px] font-bold uppercase rounded px-2.5 py-1.5 outline-none border transition-colors cursor-pointer bg-transparent ${e.status === 'Ativo' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : e.status === 'Férias' ? 'border-amber-500/30 text-amber-400 bg-amber-500/5' : 'border-rose-500/30 text-rose-400 bg-rose-500/5'}`}
                      >
                        <option value="Ativo" className="bg-slate-900">Ativo</option>
                        <option value="Férias" className="bg-slate-900">Férias</option>
                        <option value="Atestado" className="bg-slate-900">Atestado</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button onClick={() => props.setEmployees(props.employees.filter(x => x.id !== e.id))} className="text-rose-500 hover:text-rose-300 transition-colors font-bold text-xs">Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-800/30 p-6 rounded-2xl border border-slate-800/50 shadow-inner">
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Nome Colaborador</label>
               <input id="empName" placeholder="Ex: João Silva" className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Categoria</label>
               <select id="empCat" className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                 <option value="" className="bg-slate-900">Selecionar...</option>
                 {props.categories.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Ambiente</label>
               <select id="empEnv" className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                 <option value="" className="bg-slate-900">Selecionar...</option>
                 {props.environments.map(en => <option key={en.id} value={en.id} className="bg-slate-900">{en.name}</option>)}
               </select>
            </div>
            <div className="flex items-end">
               <button onClick={() => {
                 const name = (document.getElementById('empName') as HTMLInputElement).value;
                 const cat = (document.getElementById('empCat') as HTMLSelectElement).value;
                 const env = (document.getElementById('empEnv') as HTMLSelectElement).value;
                 if(name && cat && env) {
                   props.setEmployees([...props.employees, { 
                     id: Date.now().toString(), 
                     name, 
                     categoryId: cat, 
                     environmentId: env, 
                     status: 'Ativo',
                     consecutiveSpecialDaysOff: 0,
                     totalSpecialDaysWorked: 0
                   }]);
                   (document.getElementById('empName') as HTMLInputElement).value = '';
                 }
               }} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-500/20 transition-all active:scale-95">Cadastrar</button>
            </div>
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
