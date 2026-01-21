
import React, { useState } from 'react';
import { Employee, Environment, Category, Holiday } from '../types';
import { formatDateDisplay } from '../utils/dateUtils';

interface Props {
  employees: Employee[];
  environments: Environment[];
  categories: Category[];
  holidays: Holiday[];
}

const ReportsOverview: React.FC<Props> = ({ employees, environments, categories, holidays }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEnv, setFilterEnv] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'A-Z' | 'Z-A'>('A-Z');

  const handlePrint = () => {
    window.print();
  };

  const activeCount = employees.filter(e => e.status === 'Ativo').length;
  const vacationCount = employees.filter(e => e.status === 'Férias').length;
  const leaveCount = employees.filter(e => e.status === 'Atestado').length;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Ativo': return { backgroundColor: '#10b981', color: 'white' }; // emerald-500
      case 'Férias': return { backgroundColor: '#f59e0b', color: 'white' }; // amber-500
      case 'Atestado': return { backgroundColor: '#ef4444', color: 'white' }; // rose-500
      default: return {};
    }
  };

  const filteredEmployees = employees
    .filter(e => filterStatus === 'all' || e.status === filterStatus)
    .filter(e => filterEnv === 'all' || e.environmentId === filterEnv)
    .sort((a, b) => {
      if (sortOrder === 'A-Z') return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
      {/* Controles Web */}
      <div className="flex flex-col space-y-6 mb-8 print:hidden">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Relatório de Auditoria</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Conferência administrativa completa do sistema</p>
          </div>
          <button 
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest flex items-center shadow-lg transition-transform active:scale-95"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Auditoria
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-800">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Filtrar Ambiente</label>
            <select value={filterEnv} onChange={e => setFilterEnv(e.target.value)} className="bg-slate-900 border border-slate-700 text-xs font-bold p-2.5 rounded-xl outline-none text-white">
              <option value="all">Todos os Ambientes</option>
              {environments.map(env => <option key={env.id} value={env.id}>{env.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Filtrar Situação</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-900 border border-slate-700 text-xs font-bold p-2.5 rounded-xl outline-none text-white">
              <option value="all">Todas as Situações</option>
              <option value="Ativo">Ativo</option>
              <option value="Férias">Férias</option>
              <option value="Atestado">Atestado / Afastado</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Ordenar por Nome</label>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)} className="bg-slate-900 border border-slate-700 text-xs font-bold p-2.5 rounded-xl outline-none text-white">
              <option value="A-Z">Nome (A-Z)</option>
              <option value="Z-A">Nome (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Área de Impressão */}
      <div className="print-area bg-white text-black p-0 sm:p-10 shadow-2xl rounded-sm print:shadow-none print:p-0 overflow-x-auto">
        <style>{`
          @media print {
            @page {
              size: A4 landscape;
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
            color: black;
          }
          .report-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5px;
            margin-top: 15px;
          }
          .report-table th, .report-table td {
            border: 1px solid #000;
            padding: 5px 6px;
            text-align: left;
          }
          .report-table th {
            background-color: #f3f4f6;
            font-weight: 900;
            text-transform: uppercase;
          }
          .stat-card {
            border: 1px solid #000;
            padding: 4px 6px;
            text-align: center;
            flex: 1;
            min-width: 0;
          }
          .stat-value {
            font-size: 13px;
            font-weight: 900;
            display: block;
            line-height: 1;
            margin-bottom: 1px;
          }
          .stat-label {
            font-size: 7px;
            text-transform: uppercase;
            font-weight: 700;
            color: #000;
          }
          .status-badge {
            font-size: 7px;
            font-weight: 900;
            padding: 1px 4px;
            border: 1px solid #000;
            text-transform: uppercase;
            display: inline-block;
            border-radius: 2px;
          }
          .status-badge span {
            color: white !important;
          }
          .check-box {
            width: 11px;
            height: 11px;
            border: 1px solid #000;
            display: inline-block;
          }
          .stats-row {
            display: flex;
            gap: 2px;
            margin-bottom: 8px;
          }
        `}</style>

        {/* Cabeçalho do Relatório */}
        <div className="text-center border-b-2 border-black pb-2 mb-3">
          <h1 className="text-lg font-black uppercase tracking-tighter text-black">Resumo Administrativo do Sistema</h1>
          <p className="text-[8px] font-bold mt-0.5 uppercase text-black">EscalaPro V2.0 &bull; Relatório emitido em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>

        {/* Linha única de Quadros Estatísticos */}
        <div className="stats-row">
          <div className="stat-card"><span className="stat-value">{environments.length}</span><span className="stat-label">Ambientes</span></div>
          <div className="stat-card"><span className="stat-value">{employees.length}</span><span className="stat-label">Colaboradores</span></div>
          <div className="stat-card"><span className="stat-value">{categories.length}</span><span className="stat-label">Categorias</span></div>
          <div className="stat-card"><span className="stat-value">{holidays.length}</span><span className="stat-label">Feriados</span></div>
          <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#10b981' }}><span className="stat-value" style={{ color: '#047857' }}>{activeCount}</span><span className="stat-label">Ativos</span></div>
          <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#f59e0b' }}><span className="stat-value" style={{ color: '#b45309' }}>{vacationCount}</span><span className="stat-label">Férias</span></div>
          <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#ef4444' }}><span className="stat-value" style={{ color: '#b91c1c' }}>{leaveCount}</span><span className="stat-label">Atestado</span></div>
        </div>

        {/* Tabela de Colaboradores */}
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase border-b border-black mb-1">Lista de Colaboradores</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '22px', textAlign: 'center' }}>[]</th>
                <th style={{ width: '22px', textAlign: 'center' }}>[]</th>
                <th style={{ width: '130px' }}>Nome Completo</th>
                <th style={{ width: '100px' }}>Categoria</th>
                <th>Ambiente Base</th>
                <th style={{ width: '60px', textAlign: 'center' }}>Status</th>
                <th style={{ width: '65px', textAlign: 'center' }}>Ult. Dom.</th>
                <th style={{ width: '65px', textAlign: 'center' }}>Ult. Fer.</th>
                <th style={{ width: '45px', textAlign: 'center' }}>Dom.(Ano)</th>
                <th style={{ width: '45px', textAlign: 'center' }}>Fer.(Ano)</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => {
                const statusStyle = getStatusStyle(emp.status);
                return (
                  <tr key={emp.id}>
                    <td style={{ textAlign: 'center' }}><div className="check-box"></div></td>
                    <td style={{ textAlign: 'center' }}><div className="check-box"></div></td>
                    <td className="font-bold">{emp.name}</td>
                    <td>{categories.find(c => c.id === emp.categoryId)?.name || '---'}</td>
                    <td>{environments.find(e => e.id === emp.environmentId)?.name || '---'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="status-badge" style={{ backgroundColor: statusStyle.backgroundColor }}>
                        <span>{emp.status}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }} className="font-medium">
                      {emp.lastSundayWorked ? formatDateDisplay(emp.lastSundayWorked) : '---'}
                    </td>
                    <td style={{ textAlign: 'center' }} className="font-medium">
                      {emp.lastHolidayWorked ? formatDateDisplay(emp.lastHolidayWorked) : '---'}
                    </td>
                    <td style={{ textAlign: 'center' }} className="font-black">{emp.sundaysWorkedCurrentYear}</td>
                    <td style={{ textAlign: 'center' }} className="font-black">{emp.holidaysWorkedCurrentYear}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rodapé de Auditoria */}
        <div className="mt-8 flex justify-between items-end border-t border-black pt-2">
          <div>
            <p className="text-[8px] font-black uppercase">Documento para Uso Interno</p>
            <p className="text-[7px]">EscalaPro Intelligence Systems &bull; Auditoria de Dados</p>
          </div>
          <div className="text-right">
            <div className="w-28 border-b border-black mb-1"></div>
            <p className="text-[8px] font-black uppercase">Assinatura Responsável</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsOverview;
