
import { supabase } from '../lib/supabase';
import { Employee, Holiday } from '../types';

/**
 * Função de Auditoria: Sincroniza metadados de feriados e reconstrói os contadores 
 * baseando-se no histórico real de assignments e no estado atual dos feriados.
 */
export const recalculateAllEmployeeCounters = async (employees: Employee[], holidays: Holiday[]) => {
  // 1. Sincronizar a tabela de 'schedules' com os 'holidays' atuais
  // Isso limpa feriados excluídos ou atualiza novos feriados que foram inseridos manualmente
  const { data: currentSchedules, error: schErr } = await supabase
    .from('schedules')
    .select('*');

  if (!schErr && currentSchedules) {
    const holidayMap = new Map(holidays.map(h => [h.date, h.name]));
    
    for (const sch of currentSchedules) {
      const holidayName = holidayMap.get(sch.date);
      const isSundayDate = new Date(sch.date + 'T00:00:00').getDay() === 0;
      const shouldBeHoliday = !!holidayName;

      // Se o estado no banco está diferente do estado real (feriados deletados ou novos)
      if (sch.is_holiday !== shouldBeHoliday || sch.holiday_name !== (holidayName || null) || sch.is_sunday !== isSundayDate) {
        await supabase.from('schedules').update({
          is_holiday: shouldBeHoliday,
          holiday_name: holidayName || null,
          is_sunday: isSundayDate
        }).eq('date', sch.date);
      }
    }
  }

  // 2. Buscar TODAS as escalas atualizadas para o recálculo de contadores
  const { data: allSchedules, error: schError } = await supabase
    .from('schedules')
    .select('date, is_sunday, is_holiday')
    .order('date', { ascending: true });

  if (schError || !allSchedules || allSchedules.length === 0) {
    console.error("Erro ao buscar histórico de escalas ou banco vazio");
    return;
  }

  // Determinamos o "Ano de Referência"
  const systemYear = new Date().getFullYear();
  const latestScheduleDate = allSchedules[allSchedules.length - 1].date;
  const latestScheduleYear = new Date(latestScheduleDate + 'T00:00:00').getFullYear();
  const activeYear = Math.max(systemYear, latestScheduleYear);
  const activeYearStr = activeYear.toString();

  // 3. Buscar TODAS as atribuições (assignments)
  const { data: allAssignments, error: assError } = await supabase
    .from('assignments')
    .select('date, employee_id');

  if (assError || !allAssignments) {
    console.error("Erro ao buscar atribuições para recálculo");
    return;
  }

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

    const empAssigns = new Set(
      allAssignments
        .filter(a => a.employee_id === emp.id)
        .map(a => a.date)
    );

    allSchedules.forEach(sch => {
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

  // 4. Persistência em lote
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
