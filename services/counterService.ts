
import { supabase } from '../lib/supabase';
import { Employee, Holiday } from '../types';

/**
 * Função de Auditoria: Reconstrói os contadores baseando-se no histórico real de assignments.
 * Garante que:
 * 1. Trabalhou no último domingo/feriado do sistema -> Contador = 0.
 * 2. Nunca trabalhou -> Contador = 99 (Prioridade Máxima).
 * 3. Folgou em domingos/feriados após o último trabalho -> Contador = N (número de folgas).
 */
export const recalculateAllEmployeeCounters = async (employees: Employee[], holidays: Holiday[]) => {
  // 1. Buscar TODAS as escalas (schedules) para saber quais dias foram "dias de escala"
  const { data: allSchedules, error: schError } = await supabase
    .from('schedules')
    .select('date, is_sunday, is_holiday')
    .order('date', { ascending: true });

  // 2. Buscar TODAS as atribuições (assignments)
  const { data: allAssignments, error: assError } = await supabase
    .from('assignments')
    .select('date, employee_id');

  if (schError || assError || !allSchedules || !allAssignments) {
    console.error("Erro ao buscar histórico para recálculo");
    return;
  }

  const updatedEmployees = employees.map(emp => {
    let lastSun: string | null = null;
    let sunOff = 99; // Valor inicial para quem nunca trabalhou
    let sunTotal = 0;
    let hasWorkedSun = false;

    let lastHol: string | null = null;
    let holOff = 99;
    let holTotal = 0;
    let hasWorkedHol = false;

    // Filtra atribuições específicas deste colaborador
    const empAssigns = new Set(
      allAssignments
        .filter(a => a.employee_id === emp.id)
        .map(a => a.date)
    );

    // Processa cada dia que o sistema considerou como escala (Domingo ou Feriado)
    allSchedules.forEach(sch => {
      const worked = empAssigns.has(sch.date);

      if (sch.is_sunday) {
        if (worked) {
          lastSun = sch.date;
          sunOff = 0;
          sunTotal++;
          hasWorkedSun = true;
        } else {
          // Se ele já trabalhou alguma vez, incrementamos a folga. 
          // Se nunca trabalhou, mantemos 99.
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
      lastHolidayWorked: lastHol,
      consecutiveHolidaysOff: holOff,
      totalHolidaysWorked: holTotal
    };
  });

  // 3. Persistência em lote no Supabase
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
