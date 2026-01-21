
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
  const [reportStyle, setReportStyle] = useState<'official' | 'signature'>('official');

  const allDays = getMonthDays(selectedYear, selectedMonth);
  const days = allDays.filter(date => {
    const isSun = isSunday(date);
    const holiday = holidays.find(h => h.date === date);
    return isSun || !!holiday;
  });

  const monthLabel = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][selectedMonth];

  const handlePrint = () => {
    window.print();
  };

  const sortedEnvs = [...environments].sort((a,b) => b.name.localeCompare(a.name));
  const filteredEnvironments = selectedEnvironmentId === 'all' 
    ? sortedEnvs 
    : sortedEnvs.filter(e => e.id === selectedEnvironmentId);

  const selectedEnvName = selectedEnvironmentId === 'all' 
    ? 'Todos os Ambientes' 
    : environments.find(e => e.id === selectedEnvironmentId)?.name || '';

  const sortedCats = [...categories].sort((a,b) => b.name.localeCompare(a.name));

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
      {/* Controles Web */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 print:hidden">
        <div className="flex flex-wrap gap-4 items-end">
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
              <option value="all">Todos os Ambientes (Z-A)</option>
              {sortedEnvs.map(env => (
                <option key={env.id} value={env.id}>{env.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Estilo do Documento</label>
            <select 
              className="p-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl font-bold outline-none text-sm min-w-[180px]"
              value={reportStyle}
              onChange={e => setReportStyle(e.target.value as any)}
            >
              <option value="official">Impressão Oficial</option>
              <option value="signature">Folha de Assinatura</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest flex items-center shadow-lg transition-transform active:scale-95"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir A4
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
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
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
          .category-header {
            background-color: #e2e8f0 !important;
            border-bottom: 1px solid #94a3b8;
            padding: 2px 4px;
            margin-bottom: 4px;
            display: block;
          }
          .signature-line {
            border-bottom: 1px solid #999;
            display: inline-block;
            width: 100%;
            height: 14px;
            margin-top: 4px;
          }
        `}</style>

        <div className="mb-6 text-center border-b-2 border-black pb-4">
          <h1 className="text-xl font-black uppercase tracking-tighter">
            {reportStyle === 'official' ? 'Escala de Trabalho (D/F)' : 'Folha de Assinatura de Escala'}
          </h1>
          <div className="flex justify-center gap-4 mt-1">
            <p className="text-[10px] font-bold text-black uppercase tracking-widest">Mês: {monthLabel} / {selectedYear}</p>
            <p className="text-[10px] font-black text-black uppercase tracking-widest">Ambiente: {selectedEnvName}</p>
          </div>
        </div>

        {reportStyle === 'official' ? (
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
                            {sortedCats.map(cat => {
                              const catEmployees = envEmployees.filter(emp => emp.categoryId === cat.id).sort((a,b) => b.name.localeCompare(a.name));
                              if (catEmployees.length === 0) return null;
                              return (
                                <div key={cat.id} className="mb-2 last:mb-0">
                                  <span className="category-header text-[7px] font-black uppercase leading-none">{cat.name}</span>
                                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 px-1">
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
        ) : (
          <div className="space-y-6">
            {days.map(date => {
              const daySched = schedules.find(s => s.date === date);
              const holiday = holidays.find(h => h.date === date);
              const isSun = isSunday(date);
              const dayOfWeek = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' });
              const dayNum = date.split('-')[2];
              
              const dayAssignments = daySched?.assignments || [];
              const relevantAssignments = selectedEnvironmentId === 'all' 
                ? dayAssignments 
                : dayAssignments.filter(a => a.environmentId === selectedEnvironmentId);

              if (relevantAssignments.every(a => a.employeeIds.length === 0)) return null;

              return (
                <div key={date} className="border border-black p-4 mb-4 page-break-inside-avoid">
                  <div className="bg-slate-100 p-2 mb-3 flex justify-between items-center border-b border-black">
                    <span className="font-black text-xs uppercase">{dayNum}/{selectedMonth + 1} - {dayOfWeek}</span>
                    {holiday && <span className="font-black text-[10px] uppercase bg-slate-200 px-2 rounded">{holiday.name}</span>}
                  </div>
                  
                  <table className="print-table">
                    <thead>
                      <tr>
                        <th style={{ width: '150px' }}>Ambiente</th>
                        <th style={{ width: '200px' }}>Colaborador (Z-A)</th>
                        <th>Assinatura</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relevantAssignments.sort((a,b) => {
                        const envA = environments.find(e => e.id === a.environmentId)?.name || '';
                        const envB = environments.find(e => e.id === b.environmentId)?.name || '';
                        return envB.localeCompare(envA);
                      }).map(a => {
                        const env = environments.find(e => e.id === a.environmentId);
                        const assignedEmployees = a.employeeIds
                          .map(id => employees.find(e => e.id === id))
                          .filter(Boolean) as Employee[];
                        
                        return assignedEmployees.sort((e1, e2) => e2.name.localeCompare(e1.name)).map((emp, idx) => (
                          <tr key={`${emp.id}-${idx}`}>
                            {idx === 0 && (
                              <td rowSpan={assignedEmployees.length} className="font-black align-middle bg-slate-50">
                                {env?.name}
                              </td>
                            )}
                            <td className="font-bold">{emp.name}</td>
                            <td><div className="signature-line"></div></td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

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
