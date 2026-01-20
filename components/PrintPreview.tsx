
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

const PrintPreview: React.FC<Props> = ({ employees, schedules, environments, holidays, categories }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('all');

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

  const filteredEnvironments = selectedEnvironmentId === 'all' 
    ? environments 
    : environments.filter(e => e.id === selectedEnvironmentId);

  const selectedEnvName = selectedEnvironmentId === 'all' 
    ? 'Todos os Ambientes' 
    : environments.find(e => e.id === selectedEnvironmentId)?.name || '';

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
      {/* Controles Web */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:hidden">
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Período</label>
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
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Ambiente</label>
            <select 
              className="p-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl font-bold outline-none text-sm min-w-[180px]"
              value={selectedEnvironmentId}
              onChange={e => setSelectedEnvironmentId(e.target.value)}
            >
              <option value="all">Todos os Ambientes</option>
              {environments.map(env => (
                <option key={env.id} value={env.id}>{env.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <button 
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest flex items-center shadow-lg transition-transform active:scale-95 self-end"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir Folha A4
        </button>
      </div>

      {/* Área de Impressão */}
      <div className="print-area bg-white text-black p-0 sm:p-10 shadow-2xl rounded-sm print:shadow-none print:p-0">
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
          .print-area * {
            color: black !important;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          .print-table th, .print-table td {
            border: 1px solid #000;
            padding: 4px 6px;
            text-align: left;
          }
          .print-table th {
            background-color: #f1f5f9;
            font-weight: 800;
            text-transform: uppercase;
          }
          .row-special {
            background-color: #f8fafc;
          }
        `}</style>

        <div className="mb-6 text-center border-b-2 border-black pb-4">
          <h1 className="text-xl font-black uppercase tracking-tighter">Escala de Trabalho (D/F)</h1>
          <div className="flex justify-center gap-4 mt-1">
            <p className="text-[10px] font-bold text-black uppercase tracking-widest">Mês: {monthLabel} / {selectedYear}</p>
            <p className="text-[10px] font-black text-black uppercase tracking-widest">Ambiente: {selectedEnvName}</p>
          </div>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>Data / Dia</th>
              {filteredEnvironments.map(env => (
                <th key={env.id}>{env.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map(date => {
              const daySched = schedules.find(s => s.date === date);
              const holiday = holidays.find(h => h.date === date);
              const isSun = isSunday(date);
              const isSpecial = isSun || !!holiday;
              const dayOfWeek = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' });
              const dayNum = date.split('-')[2];

              return (
                <tr key={date} className={isSpecial ? 'row-special' : ''}>
                  <td className="font-bold">
                    <div className="flex flex-col">
                      <span className="font-black">{dayNum}/{selectedMonth + 1} - {dayOfWeek.split('-')[0].substring(0, 3)}.</span>
                      {holiday && <span className="text-[7px] leading-tight uppercase font-black">{holiday.name}</span>}
                    </div>
                  </td>
                  {filteredEnvironments.map(env => {
                    const assignments = daySched?.assignments || [];
                    const assignment = assignments.find(a => a.environmentId === env.id);
                    const employeeIds = assignment?.employeeIds || [];
                    const envEmployees = employeeIds
                      .map(id => employees.find(e => e.id === id))
                      .filter(Boolean) as Employee[];

                    return (
                      <td key={env.id} className="align-top">
                        <div className="flex flex-col gap-1">
                          {categories.map(cat => {
                            const catEmployees = envEmployees.filter(emp => emp.categoryId === cat.id);
                            if (catEmployees.length === 0) return null;
                            return (
                              <div key={cat.id} className="mb-1 last:mb-0">
                                <span className="text-[7px] font-black uppercase block leading-none mb-0.5">{cat.name}</span>
                                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                                  {catEmployees.map(e => (
                                    <span key={e.id} className="font-bold text-[9px]">{e.name}</span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                          {(!envEmployees || envEmployees.length === 0) && (
                            <span className="italic text-[9px]">---</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {days.length === 0 && (
          <div className="py-20 text-center text-black italic">Nenhum dia especial encontrado para este mês.</div>
        )}

        <div className="mt-10 grid grid-cols-2 gap-10 px-6">
          <div className="border-t border-black pt-2 text-center text-[9px] uppercase font-bold">Responsável pela Escala</div>
          <div className="border-t border-black pt-2 text-center text-[9px] uppercase font-bold">Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    </div>
  );
};

export default PrintPreview;
