
import { supabase } from '../lib/supabase';
import { Employee, Holiday } from '../types';

/**
 * Função de Auditoria: Reconstrói os contadores baseando-se no histórico real de assignments.
 * Regras cruciais:
 * 1. Apenas dias que possuem pelo menos uma atribuição (escala montada) são considerados para o cálculo de folgas.
 * 2. Se o colaborador trabalhou na última escala montada do tipo (D/F), o contador é obrigatoriamente 0.
 * 3. Se nunca trabalhou, o contador é 99 (Prioridade Máxima).
 * 4. O contador incrementa apenas quando uma escala montada ocorre e o colaborador não faz parte dela.
 * 5. Agora rastreia também os trabalhados no ANO ATUAL.
 */
export const recalculateAllEmployeeCounters = async (employees: Employee[], holidays: Holiday[]) => {
  const currentYear = new Date().getFullYear().toString();

  // 1. Buscar TODAS as atribuições (assignments) para identificar dias realmente escalados
  const { data: allAssignments, error: assError } = await supabase
    .from('assignments')
    .select('date, employee_id');

  if (assError || !allAssignments) {
    console.error("Erro ao buscar atribuições para recálculo");
    return;
  }

  // Identificar quais datas possuem pelo menos uma pessoa escalada no sistema
  const mountedDates = new Set(allAssignments.map(a => a.date));

  // 2. Buscar TODAS as escalas (schedules) ordenadas
  const { data: allSchedules, error: schError } = await supabase
    .from('schedules')
    .select('date, is_sunday, is_holiday')
    .order('date', { ascending: true });

  if (schError || !allSchedules) {
    console.error("Erro ao buscar histórico de escalas");
    return;
  }

  const updatedEmployees = employees.map(emp => {
    let lastSun: string | null = null;
    let sunOff = 99;
    let sunTotal = 0;
    let sunCurrentYear = 0;
    let hasWorkedSun = false;

    let lastHol: string | null = null;
    let holOff = 99;
    let holTotal = 0;
    let holCurrentYear = 0;
    let hasWorkedHol = false;

    // Filtra atribuições deste colaborador
    const empAssigns = new Set(
      allAssignments
        .filter(a => a.employee_id === emp.id)
        .map(a => a.date)
    );

    // Itera por todas as escalas cadastradas
    allSchedules.forEach(sch => {
      if (!mountedDates.has(sch.date)) return;

      const worked = empAssigns.has(sch.date);
      const isCurrentYear = sch.date.startsWith(currentYear);

      if (sch.is_sunday) {
        if (worked) {
          lastSun = sch.date;
          sunOff = 0;
          sunTotal++;
          if (isCurrentYear) sunCurrentYear++;
          hasWorkedSun = true;
        } else {
          if (hasWorkedSun) {
            sunOff++;
          } else {
            sunOff = 99;
          }
        }
      }

      if (sch.is_holiday) {
        if (worked) {
          lastHol = sch.date;
          holOff = 0;
          holTotal++;
          if (isCurrentYear) holCurrentYear++;
          hasWorkedHol = true;
        } else {
          if (hasWorkedHol) {
            holOff++;
          } else {
            holOff = 99;
          }
        }
      }
    });

    return {
      ...emp,
      lastSundayWorked: lastSun,
      consecutiveSundaysOff: sunOff,
      totalSundaysWorked: sunTotal,
      sundaysWorkedCurrentYear: sunCurrentYear,
      lastHolidayWorked: lastHol,
      consecutiveHolidaysOff: holOff,
      totalHolidaysWorked: holTotal,
      holidaysWorkedCurrentYear: holCurrentYear
    };
  });

  // 3. Persistência em lote no Supabase
  for (const emp of updatedEmployees) {
    await supabase.from('employees').update({
      last_sunday_worked: emp.lastSundayWorked,
      consecutive_sundays_off: emp.consecutiveSundaysOff,
      total_sundays_worked: emp.totalSundaysWorked,
      sundays_worked_current_year: emp.sundaysWorkedCurrentYear,
      last_holiday_worked: emp.lastHolidayWorked,
      consecutive_holidays_off: emp.consecutiveHolidaysOff,
      total_holidays_worked: emp.totalHolidaysWorked,
      holidays_worked_current_year: emp.holidaysWorkedCurrentYear
    }).eq('id', emp.id);
  }

  return updatedEmployees;
};
