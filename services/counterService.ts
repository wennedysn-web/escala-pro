
import { supabase } from '../lib/supabase';
import { Employee, Holiday, Environment } from '../types';

/**
 * Função de Auditoria: Sincroniza metadados de feriados e reconstrói os contadores 
 * baseando-se no histórico real de assignments e no estado atual dos feriados.
 * 
 * CORREÇÃO: Um dia (Domingo/Feriado) só entra para o cálculo de contadores se 
 * TODOS os ambientes possuírem registros sincronizados para aquela data.
 */
export const recalculateAllEmployeeCounters = async (employees: Employee[], holidays: Holiday[]) => {
  // 1. Buscar ambientes para saber o total necessário para considerar um dia "completo"
  const { data: envsData } = await supabase.from('environments').select('id');
  const totalEnvCount = envsData?.length || 0;

  // 2. Sincronizar a tabela de 'schedules' com os 'holidays' atuais
  const { data: currentSchedules, error: schErr } = await supabase
    .from('schedules')
    .select('*');

  if (!schErr && currentSchedules) {
    const holidayMap = new Map(holidays.map(h => [h.date, h.name]));
    
    for (const sch of currentSchedules) {
      const holidayName = holidayMap.get(sch.date);
      const isSundayDate = new Date(sch.date + 'T00:00:00').getDay() === 0;
      const shouldBeHoliday = !!holidayName;

      if (sch.is_holiday !== shouldBeHoliday || sch.holiday_name !== (holidayName || null) || sch.is_sunday !== isSundayDate) {
        await supabase.from('schedules').update({
          is_holiday: shouldBeHoliday,
          holiday_name: holidayName || null,
          is_sunday: isSundayDate
        }).eq('date', sch.date);
      }
    }
  }

  // 3. Buscar TODAS as escalas atualizadas
  const { data: allSchedules, error: schError } = await supabase
    .from('schedules')
    .select('date, is_sunday, is_holiday')
    .order('date', { ascending: true });

  if (schError || !allSchedules || allSchedules.length === 0) {
    return;
  }

  // 4. Buscar TODAS as atribuições e mapear quais ambientes estão "finalizados" por data
  const { data: allAssignments, error: assError } = await supabase
    .from('assignments')
    .select('date, employee_id, environment_id');

  if (assError || !allAssignments) {
    return;
  }

  // Mapeia data -> Set de IDs de ambientes que possuem escala
  const envsByDate = new Map<string, Set<string>>();
  allAssignments.forEach(a => {
    if (!envsByDate.has(a.date)) envsByDate.set(a.date, new Set());
    envsByDate.get(a.date)?.add(a.environment_id);
  });

  const systemYear = new Date().getFullYear();
  const latestScheduleDate = allSchedules[allSchedules.length - 1].date;
  const latestScheduleYear = new Date(latestScheduleDate + 'T00:00:00').getFullYear();
  const activeYear = Math.max(systemYear, latestScheduleYear);
  const activeYearStr = activeYear.toString();

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
      // REGRA DE OURO: Só processa a data para o funcionário se TODOS os ambientes do sistema
      // tiverem ao menos um registro sincronizado nessa data.
      const envsFinalized = envsByDate.get(sch.date)?.size || 0;
      if (envsFinalized < totalEnvCount) return;

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
          if (hasWorkedSun) sunOff++;
          else sunOff = 99;
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
          if (hasWorkedHol) holOff++;
          else holOff = 99;
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
