
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

  const days = getMonthDays(selectedYear, selectedMonth);
  const monthLabel = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][selectedMonth];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
      {/* Controles Web */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:hidden">
        <div className="flex gap-2">
          <select 
            className="p-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl font-bold outline-none"
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value))}
          >
            {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select 
            className="p-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl font-bold outline-none"
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        
        <button 
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest flex items-center shadow-lg transition-transform active:scale-95"
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
          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          .print-table th, .print-table td {
            border: 1px solid #ccc;
            padding: 6px 8px;
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

        <div className="mb-6 text-center border-b-2 border-slate-900 pb-4">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Escala Oficial de Trabalho</h1>
          <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">{monthLabel} de {selectedYear}</p>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Data / Dia</th>
              {environments.map(env => (
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
                      <span className={isSpecial ? 'text-indigo-600' : ''}>{dayNum}/{selectedMonth + 1} - {dayOfWeek.split('-')[0]}</span>
                      {holiday && <span className="text-[8px] uppercase text-rose-500">{holiday.name}</span>}
                      {isSun && !holiday && <span className="text-[8px] uppercase text-amber-600">Domingo</span>}
                    </div>
                  </td>
                  {environments.map(env => {
                    const assignment = daySched?.assignments.find(a => a.environmentId === env.id);
                    const envEmployees = assignment?.employeeIds
                      .map(id => employees.find(e => e.id === id))
                      .filter(Boolean) as Employee[];

                    return (
                      <td key={env.id} className="align-top">
                        <div className="flex flex-col gap-1">
                          {categories.map(cat => {
                            const catEmployees = envEmployees.filter(emp => emp.categoryId === cat.id);
                            if (catEmployees.length === 0) return null;
                            return (
                              <div key={cat.id} className="mb-1">
                                <span className="text-[8px] font-black uppercase text-slate-400 block mb-0.5">{cat.name}</span>
                                <div className="flex flex-wrap gap-1">
                                  {catEmployees.map(e => (
                                    <span key={e.id} className="font-semibold text-xs">{e.name}</span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                          {(!envEmployees || envEmployees.length === 0) && (
                            <span className="text-slate-300 italic text-[10px]">Sem escala</span>
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

        <div className="mt-12 grid grid-cols-2 gap-20 px-10">
          <div className="border-t border-black pt-2 text-center text-[10px] uppercase font-bold">Assinatura Responsável</div>
          <div className="border-t border-black pt-2 text-center text-[10px] uppercase font-bold">Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
        </div>
      </div>
    </div>
  );
};

export default PrintPreview;
