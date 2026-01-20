
import React from 'react';
import { Employee } from '../types';

interface Props {
  employee: Employee;
}

const EmployeeCard: React.FC<Props> = ({ employee }) => {
  return (
    <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-5 hover:border-slate-700 transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-colors"></div>
      
      <div className="flex items-center space-x-4 mb-6 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-black text-xl uppercase group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all shadow-inner">
          {employee.name.charAt(0)}
        </div>
        <div>
          <h3 className="font-bold text-slate-100 leading-tight tracking-tight">{employee.name}</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-0.5">{employee.role || 'Colaborador'}</p>
        </div>
      </div>
      
      <div className="space-y-4 relative z-10">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">Último Especial:</span>
          {/* Fix: Changed lastSpecialDayWorked to lastSundayWorked to match Employee type */}
          <span className={`font-black uppercase tracking-tighter ${employee.lastSundayWorked ? 'text-slate-300' : 'text-amber-500 italic'}`}>
            {employee.lastSundayWorked ? new Date(employee.lastSundayWorked + 'T00:00:00').toLocaleDateString('pt-BR') : 'Inédito'}
          </span>
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">Folgas acumuladas:</span>
          <div className="flex items-center space-x-1.5">
            {/* Fix: Changed consecutiveSpecialDaysOff to consecutiveSundaysOff to match Employee type */}
            <span className="font-black text-indigo-400 text-base leading-none">{employee.consecutiveSundaysOff}</span>
            <span className="text-[10px] font-black uppercase text-slate-600 tracking-tighter">unidades</span>
          </div>
        </div>

        <div className="space-y-2">
           <div className="flex justify-between items-end">
             <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Comprometimento</span>
             {/* Fix: Changed totalSpecialDaysWorked to totalSundaysWorked to match Employee type */}
             <span className="text-[10px] font-black text-indigo-500">{employee.totalSundaysWorked} participações</span>
           </div>
           <div className="w-full bg-slate-800 rounded-full h-1.5 shadow-inner">
            <div 
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(99,102,241,0.4)]" 
              /* Fix: Changed totalSpecialDaysWorked to totalSundaysWorked to match Employee type */
              style={{ width: `${Math.min(employee.totalSundaysWorked * 5, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCard;
