
import { supabase } from '../lib/supabase';
import { Employee, Holiday } from '../types';
import { isSunday } from '../utils/dateUtils';

/**
 * Função Vital: Varre o histórico de escalas e reconstrói os contadores dos funcionários.
 * Isso garante que o sistema identifique quem trabalhou por último e quem está há mais tempo parado.
 */
export const recalculateAllEmployeeCounters = async (employees: Employee[], holidays: Holiday[]) => {
  // 1. Buscar TODAS as atribuições passadas ordenadas por data
  const { data: assignments, error } = await supabase
    .from('assignments')
    .select('date, employee_id')
    .order('date', { ascending: true });

  if (error || !assignments) return;

  const updatedEmployees = employees.map(emp => {
    // Resetar contadores para o cálculo limpo
    let lastSun: string | null = null;
    let sunOff = 99; // Começa como 99 (nunca trabalhou)
    let sunTotal = 0;
    
    let lastHol: string | null = null;
    let holOff = 99;
    let holTotal = 0;

    // Filtrar apenas atribuições deste funcionário
    const empAssigns = assignments.filter(a => a.employee_id === emp.id);
    // Fix: Explicitly cast to string to avoid 'unknown' type issues in the Set and subsequent lookups
    const workedDates = new Set(empAssigns.map(a => a.date as string));

    // Pegar todas as datas únicas de escalas já criadas no sistema
    // Fix: Explicitly cast to string to ensure allScaleDates is string[] and dateStr is string
    const allScaleDates = [...new Set(assignments.map(a => a.date as string))].sort();

    allScaleDates.forEach(dateStr => {
      const isSun = new Date(dateStr + 'T00:00:00').getDay() === 0;
      const isHol = holidays.some(h => h.date === dateStr);
      const worked = workedDates.has(dateStr);

      if (isSun) {
        if (worked) {
          lastSun = dateStr;
          sunOff = 0;
          sunTotal++;
        } else {
          // Só incrementa se ele estiver ativo na data (simplificação: incrementa sempre que houver escala e ele não estiver nela)
          sunOff++;
        }
      }

      if (isHol) {
        if (worked) {
          lastHol = dateStr;
          holOff = 0;
          holTotal++;
        } else {
          holOff++;
        }
      }
    });

    return {
      ...emp,
      lastSundayWorked: lastSun,
      consecutiveSundaysOff: sunOff,
      totalSundaysWorked: sunTotal,
      lastHolidayWorked: lastHol,
      consecutiveHolidaysOff: holOff,
      totalHolidaysWorked: holTotal
    };
  });

  // Salvar no banco
  for (const emp of updatedEmployees) {
    await supabase.from('employees').update({
      last_sunday_worked: emp.lastSundayWorked,
      consecutive_sundays_off: emp.consecutiveSundaysOff,
      total_sundays_worked: emp.totalSundaysWorked,
      last_holiday_worked: emp.lastHolidayWorked,
      consecutive_holidays_off: emp.consecutiveHolidaysOff,
      total_holidays_worked: emp.totalHolidaysWorked
    }).eq('id', emp.id);
  }

  return updatedEmployees;
};
