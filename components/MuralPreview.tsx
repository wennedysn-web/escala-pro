
import React, { useState } from 'react';
import { Employee, DaySchedule, Environment, Holiday, Category } from '../types';
import { getMonthDays, isSunday } from '../utils/dateUtils';

interface Props {
  employees: Employee[];
  schedules: DaySchedule[];
  environments: Environment[];
  holidays: Holiday[];
  categories: Category[];
}

const MuralPreview: React.FC<Props> = ({ employees, schedules, environments, holidays, categories }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>(environments[0]?.id || '');

  const allDays = getMonthDays(selectedYear, selectedMonth);
  // FILTRO: Apenas domingos ou feriados
  const days = allDays.filter(date => {
    const isSun = isSunday(date);
    const holiday = holidays.find(h => h.date === date);
    return isSun || !!holiday;
  });

  const monthLabel = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][selectedMonth];

  const handlePrint = () => {
    window.print();
  };

  const selectedEnv = environments.find(e => e.id === selectedEnvironmentId);

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
      {/* Controles Web */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:hidden">
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Mês/Ano</label>
            <div className="flex gap-2">
              <select 
                className="p-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl font-bold outline-none text-sm"
                value={selectedMonth}
                onChange={e => setSelectedMonth(parseInt(e.target.value))}
              >
                {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              <select 
                className="p-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl font-bold outline-none text-sm"
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Ambiente do Mural</label>
            <select 
              className="p-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl font-bold outline-none text-sm min-w-[220px]"
              value={selectedEnvironmentId}
              onChange={e => setSelectedEnvironmentId(e.target.value)}
            >
              {environments.map(env => (
                <option key={env.id} value={env.id}>{env.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <button 
          onClick={handlePrint}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest flex items-center shadow-lg transition-transform active:scale-95 self-end"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir Mural (Letras Grandes)
        </button>
      </div>

      {/* Área de Impressão para Mural */}
      <div className="print-area bg-white text-black p-0 sm:p-12 shadow-2xl rounded-sm print:shadow-none print:p-0">
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 1cm;
            }
            body {
              background: white !important;
              color: black !important;
            }
            .print-area {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            header, footer, nav, button, select {
              display: none !important;
            }
          }
          .mural-table {
            width: 100%;
            border-collapse: collapse;
          }
          .mural-table th, .mural-table td {
            border: 2px solid #000;
            padding: 12px 16px;
            text-align: left;
          }
          .mural-table th {
            background-color: #eee;
            font-size: 16px;
            font-weight: 900;
            text-transform: uppercase;
          }
          .mural-row-special {
            background-color: #f5f5f5;
          }
          .mural-date-cell {
            width: 180px;
          }
          .mural-content-cell {
            font-size: 18px;
            font-weight: 800;
          }
          .mural-category-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 4px;
            display: block;
          }
        `}</style>

        <div className="mb-10 text-center border-b-4 border-black pb-6">
          <h1 className="text-4xl font-black uppercase tracking-tight">Escala de Serviço</h1>
          <h2 className="text-2xl font-black text-indigo-700 uppercase mt-2">{selectedEnv?.name}</h2>
          <p className="text-lg font-bold text-slate-800 mt-1 uppercase tracking-widest">{monthLabel} / {selectedYear} - (Domingos e Feriados)</p>
        </div>

        <table className="mural-table">
          <thead>
            <tr>
              <th className="mural-date-cell">Data</th>
              <th className="mural-content-cell">Escalados</th>
            </tr>
          </thead>
          <tbody>
            {days.map(date => {
              const daySched = schedules.find(s => s.date === date);
              const holiday = holidays.find(h => h.date === date);
              const isSun = isSunday(date);
              const dayOfWeek = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' });
              const dayNum = date.split('-')[2];

              const assignment = daySched?.assignments.find(a => a.environmentId === selectedEnvironmentId);
              const employeeIds = assignment?.employeeIds || [];
              const envEmployees = employeeIds
                .map(id => employees.find(e => e.id === id))
                .filter(Boolean) as Employee[];

              return (
                <tr key={date} className="mural-row-special">
                  <td className="mural-date-cell">
                    <div className="flex flex-col">
                      <span className="text-2xl font-black">{dayNum}/{selectedMonth + 1}</span>
                      <span className="text-sm font-bold uppercase">{dayOfWeek}</span>
                      {holiday && <span className="text-xs font-black text-rose-600 uppercase border-t border-black/10 mt-1 pt-1">{holiday.name}</span>}
                      {isSun && !holiday && <span className="text-xs font-black text-slate-500 uppercase border-t border-black/10 mt-1 pt-1">Domingo</span>}
                    </div>
                  </td>
                  <td className="mural-content-cell">
                    <div className="flex flex-col gap-6">
                      {categories.map(cat => {
                        const catEmployees = envEmployees.filter(emp => emp.categoryId === cat.id);
                        if (catEmployees.length === 0) return null;
                        return (
                          <div key={cat.id}>
                            <span className="mural-category-label">{cat.name}</span>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                              {catEmployees.map(e => (
                                <span key={e.id} className="text-2xl font-black block">{e.name}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {envEmployees.length === 0 && (
                        <span className="text-slate-400 italic text-xl">Sem Escala Definida</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {days.length === 0 && (
          <div className="py-20 text-center text-slate-400 text-2xl font-black uppercase">Nenhuma escala para domingos/feriados publicada.</div>
        )}

        <div className="mt-20 flex justify-between items-end">
          <div className="w-1/3 border-t-4 border-black pt-4 text-center">
            <span className="text-sm font-black uppercase">Visto Direção</span>
          </div>
          <div className="text-right">
             <p className="text-xs font-black uppercase">Documento Oficial de Escala</p>
             <p className="text-xs font-bold">Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MuralPreview;
