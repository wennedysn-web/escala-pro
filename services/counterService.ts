
import { supabase } from '../lib/supabase';
import { Employee, Holiday, Environment } from '../types';

/**
 * Função de Auditoria: Sincroniza metadados de feriados e reconstrói os contadores 
 * baseando-se no histórico real de assignments e no estado atual dos feriados.
 * 
 * MELHORIA: Um dia (Domingo/Feriado) é considerado para o cálculo se existir 
 * na tabela de schedules, independente de quantos ambientes foram preenchidos.
 */
export const recalculateAllEmployeeCounters = async (employees: Employee[], holidays: Holiday[]) => {
  // 1. Sincronizar a tabela de 'schedules' com os 'holidays' atuais para garantir integridade
  const { data: currentSchedules, error: schErr } = await supabase
    .from('schedules')
    .select('*');

  if (!schErr && currentSchedules) {
    const holidayMap = new Map(holidays.map(h => [h.date, h.name]));
    
    for (const sch of currentSchedules) {
      const holidayName = holidayMap.get(sch.date);
      const isSundayDate = new Date(sch.date + 'T00:00:00').getDay() === 0;
      const shouldBeHoliday = !!holidayName;

      // Se houver discrepância entre o cache do schedule e os feriados atuais, atualiza
      if (sch.is_holiday !== shouldBeHoliday || sch.holiday_name !== (holidayName || null) || sch.is_sunday !== isSundayDate) {
        await supabase.from('schedules').update({
          is_holiday: shouldBeHoliday,
          holiday_name: holidayName || null,
          is_sunday: isSundayDate
        }).eq('date', sch.date);
      }
    }
  }

  // 2. Buscar TODAS as escalas oficiais (dias que o sistema registrou como escala)
  const { data: allSchedules, error: schError } = await supabase
    .from('schedules')
    .select('date, is_sunday, is_holiday')
    .order('date', { ascending: true });

  if (schError || !allSchedules || allSchedules.length === 0) {
    return;
  }

  // 3. Buscar TODAS as atribuições reais
  const { data: allAssignments, error: assError } = await supabase
    .from('assignments')
    .select('date, employee_id');

  if (assError || !allAssignments) {
    return;
  }

  // Agrupar atribuições por funcionário para busca rápida
  const assignmentsByEmployee = new Map<string, Set<string>>();
  allAssignments.forEach(a => {
    if (!assignmentsByEmployee.has(a.employee_id)) {
      assignmentsByEmployee.set(a.employee_id, new Set());
    }
    assignmentsByEmployee.get(a.employee_id)?.add(a.date);
  });

  const systemYear = new Date().getFullYear();
  // Consideramos o ano da última escala para contagem anual
  const latestScheduleDate = allSchedules[allSchedules.length - 1].date;
  const latestScheduleYear = new Date(latestScheduleDate + 'T00:00:00').getFullYear();
  const activeYearStr = Math.max(systemYear, latestScheduleYear).toString();

  const updatedEmployees = employees.map(emp => {
    let lastSun: string | null = null;
    // Iniciamos com um valor alto (1000) para garantir prioridade máxima a novos funcionários
    let sunOff = 1000; 
    let sunTotal = 0;
    let sunCurrentYear = 0;

    let lastHol: string | null = null;
    let holOff = 1000;
    let holTotal = 0;
    let holCurrentYear = 0;

    const empAssigns = assignmentsByEmployee.get(emp.id) || new Set<string>();

    allSchedules.forEach(sch => {
      const worked = empAssigns.has(sch.date);
      const schYearStr = sch.date.split('-')[0];
      const isTargetYear = schYearStr === activeYearStr;

      if (sch.is_sunday) {
        if (worked) {
          lastSun = sch.date;
          sunOff = 0;
          sunTotal++;
          if (isTargetYear) sunCurrentYear++;
        } else {
          // Incrementa folga consecutiva (mesmo se nunca trabalhou, ele está acumulando "prioridade")
          sunOff++;
        }
      }

      if (sch.is_holiday) {
        if (worked) {
          lastHol = sch.date;
          holOff = 0;
          holTotal++;
          if (isTargetYear) holCurrentYear++;
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
      sundaysWorkedCurrentYear: sunCurrentYear,
      lastHolidayWorked: lastHol,
      consecutiveHolidaysOff: holOff,
      totalHolidaysWorked: holTotal,
      holidaysWorkedCurrentYear: holCurrentYear
    };
  });

  // 4. Salvar atualizações em lote (sequencial para evitar race conditions no Supabase Free)
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
