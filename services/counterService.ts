
import { supabase } from '../lib/supabase';
import { Employee, Holiday } from '../types';

/**
 * Função de Auditoria: Reconstrói os contadores baseando-se no histórico real de assignments.
 */
export const recalculateAllEmployeeCounters = async (employees: Employee[], holidays: Holiday[]) => {
  // 1. Buscar TODAS as escalas (schedules) para identificar o "ano de interesse"
  const { data: allSchedules, error: schError } = await supabase
    .from('schedules')
    .select('date, is_sunday, is_holiday')
    .order('date', { ascending: true });

  if (schError || !allSchedules || allSchedules.length === 0) {
    console.error("Erro ao buscar histórico de escalas ou banco vazio");
    return;
  }

  // Determinamos o "Ano de Referência" como sendo o ano da escala mais recente no sistema
  // Isso resolve o problema de testes ou planejamentos feitos para anos futuros (ex: 2026 em 2025)
  const systemYear = new Date().getFullYear();
  const latestScheduleDate = allSchedules[allSchedules.length - 1].date;
  const latestScheduleYear = new Date(latestScheduleDate + 'T00:00:00').getFullYear();
  const activeYear = Math.max(systemYear, latestScheduleYear);
  const activeYearStr = activeYear.toString();

  // 2. Buscar TODAS as atribuições (assignments) para identificar dias realmente escalados
  const { data: allAssignments, error: assError } = await supabase
    .from('assignments')
    .select('date, employee_id');

  if (assError || !allAssignments) {
    console.error("Erro ao buscar atribuições para recálculo");
    return;
  }

  // Identificar quais datas possuem pelo menos uma pessoa escalada no sistema (escala montada)
  const mountedDates = new Set(allAssignments.map(a => a.date));

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
      // Regra de Auditoria: Só conta se a escala foi efetivamente montada (tem alguém escalado)
      if (!mountedDates.has(sch.date)) return;

      const worked = empAssigns.has(sch.date);
      const schYearStr = sch.date.split('-')[0];
      const isTargetYear = schYearStr === activeYearStr;

      if (sch.is_sunday) {
        if (worked) {
          lastSun = sch.date;
          sunOff = 0;
          sunTotal++;
          if (isTargetYear) sunCurrentYear++;
          hasWorkedSun = true;
        } else {
          // Só incrementa se ele já trabalhou no sistema alguma vez (evita inflar 99)
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
          if (isTargetYear) holCurrentYear++;
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
