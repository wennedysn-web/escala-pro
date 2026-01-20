
import React from 'react';
import { Employee, Environment, Category, Holiday } from '../types';

interface Props {
  employees: Employee[];
  environments: Environment[];
  categories: Category[];
  holidays: Holiday[];
}

const ReportsOverview: React.FC<Props> = ({ employees, environments, categories, holidays }) => {
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

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
      {/* Controles Web */}
      <div className="flex justify-between items-center mb-8 print:hidden">
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

      {/* Área de Impressão */}
      <div className="print-area bg-white text-black p-0 sm:p-10 shadow-2xl rounded-sm print:shadow-none print:p-0">
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 1.5cm;
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
            font-size: 11px;
            margin-top: 20px;
          }
          .report-table th, .report-table td {
            border: 1px solid #000;
            padding: 8px 10px;
            text-align: left;
          }
          .report-table th {
            background-color: #f3f4f6;
            font-weight: 900;
            text-transform: uppercase;
          }
          .stat-card {
            border: 1.5px solid #000;
            padding: 8px;
            text-align: center;
          }
          .stat-value {
            font-size: 18px;
            font-weight: 900;
            display: block;
            line-height: 1;
            margin-bottom: 2px;
          }
          .stat-label {
            font-size: 9px;
            text-transform: uppercase;
            font-weight: 700;
            color: #000;
          }
          .status-badge {
            font-size: 9px;
            font-weight: 900;
            padding: 4px 8px;
            border: 1px solid #000;
            text-transform: uppercase;
            display: inline-block;
            border-radius: 4px;
          }
          .status-badge span {
            color: white !important;
          }
        `}</style>

        {/* Cabeçalho do Relatório */}
        <div className="text-center border-b-4 border-black pb-4 mb-6">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Resumo Administrativo do Sistema</h1>
          <p className="text-xs font-bold mt-1 uppercase">EscalaPro v2.0 &bull; Relatório emitido em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>

        {/* Grade de Estatísticas Compacta */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="stat-card">
            <span className="stat-value">{environments.length}</span>
            <span className="stat-label">Ambientes</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{employees.length}</span>
            <span className="stat-label">Colaboradores</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{categories.length}</span>
            <span className="stat-label">Categorias</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{holidays.length}</span>
            <span className="stat-label">Feriados</span>
          </div>
        </div>

        {/* Distribuição de Status Compacta integrada à área superior */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="stat-card" style={{ borderColor: '#10b981' }}>
            <span className="stat-value" style={{ color: '#047857' }}>{activeCount}</span>
            <span className="stat-label">Ativos</span>
          </div>
          <div className="stat-card" style={{ borderColor: '#f59e0b' }}>
            <span className="stat-value" style={{ color: '#b45309' }}>{vacationCount}</span>
            <span className="stat-label">Férias</span>
          </div>
          <div className="stat-card" style={{ borderColor: '#ef4444' }}>
            <span className="stat-value" style={{ color: '#b91c1c' }}>{leaveCount}</span>
            <span className="stat-label">Atestado</span>
          </div>
        </div>

        {/* Tabela de Colaboradores */}
        <div className="mb-10">
          <h3 className="text-lg font-black uppercase border-b-2 border-black mb-2">Lista de Colaboradores</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '200px' }}>Nome Completo</th>
                <th>Categoria</th>
                <th>Ambiente Base</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Dom. Trab. (Ano)</th>
                <th style={{ textAlign: 'center' }}>Fer. Trab. (Ano)</th>
              </tr>
            </thead>
            <tbody>
              {employees.sort((a,b) => a.name.localeCompare(b.name)).map(emp => {
                const statusStyle = getStatusStyle(emp.status);
                return (
                  <tr key={emp.id}>
                    <td className="font-bold">{emp.name}</td>
                    <td>{categories.find(c => c.id === emp.categoryId)?.name || '---'}</td>
                    <td>{environments.find(e => e.id === emp.environmentId)?.name || '---'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="status-badge" style={{ backgroundColor: statusStyle.backgroundColor, borderColor: 'black' }}>
                        <span style={{ color: 'white' }}>{emp.status}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }} className="font-black">{emp.sundaysWorkedCurrentYear}</td>
                    <td style={{ textAlign: 'center' }} className="font-black">{emp.holidaysWorkedCurrentYear}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Seção de Feriados */}
        <div className="mb-10 page-break-before">
          <h3 className="text-lg font-black uppercase border-b-2 border-black mb-2">Feriados Cadastrados</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '150px' }}>Data</th>
                <th>Nome do Feriado</th>
                <th>Dia da Semana</th>
              </tr>
            </thead>
            <tbody>
              {holidays.sort((a,b) => a.date.localeCompare(b.date)).map(h => {
                const dateObj = new Date(h.date + 'T00:00:00');
                const weekDay = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
                return (
                  <tr key={h.id}>
                    <td className="font-bold">{dateObj.toLocaleDateString('pt-BR')}</td>
                    <td className="uppercase">{h.name}</td>
                    <td className="uppercase">{weekDay}</td>
                  </tr>
                );
              })}
              {holidays.length === 0 && (
                <tr><td colSpan={3} className="text-center italic py-4">Nenhum feriado cadastrado no sistema.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé de Auditoria */}
        <div className="mt-20 flex justify-between items-end border-t border-black pt-4">
          <div>
            <p className="text-[10px] font-black uppercase">Documento para Uso Interno</p>
            <p className="text-[9px]">EscalaPro Intelligence Systems &bull; Auditoria de Dados</p>
          </div>
          <div className="text-right">
            <div className="w-48 border-b border-black mb-1"></div>
            <p className="text-[10px] font-black uppercase">Assinatura Responsável</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsOverview;
