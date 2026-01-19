
import { Employee, DaySchedule, ScheduleAssignment, Holiday } from '../types';
import { isSpecialDay, formatDate } from '../utils/dateUtils';

/**
 * Lógica de Priorização:
 * 1. Identifica se o dia é especial (Domingo/Feriado).
 * 2. Se for especial, ordena funcionários:
 *    a. Quem nunca trabalhou em dia especial (lastSpecialDayWorked === null) vai pro topo.
 *    b. Quem tem o 'lastSpecialDayWorked' mais antigo.
 *    c. Quem tem o maior 'consecutiveSpecialDaysOff'.
 * 3. Evita (se possível) escalar quem trabalhou no ÚLTIMO dia especial registrado.
 * 4. Garante que um funcionário não esteja em dois ambientes no mesmo dia.
 */

interface InternalAssignment {
  employeeId: string;
  environment: string;
}

export const generateSchedule = (
  startDate: Date,
  days: number,
  employees: Employee[],
  currentSchedules: DaySchedule[],
  requirements: Record<string, number>, // Changed from Environment interface to string key
  holidays: Holiday[] // Added holidays parameter to correctly identify special days
): { newSchedules: DaySchedule[]; updatedEmployees: Employee[] } => {
  
  let workingEmployees = [...employees];
  const newSchedules: DaySchedule[] = [];
  
  // Encontrar a última data especial trabalhada globalmente para evitar back-to-back
  const allPastSpecialDays = [...currentSchedules]
    .filter(s => s.isSunday || s.isHoliday)
    .sort((a, b) => b.date.localeCompare(a.date));
  
  const lastSpecialDate = allPastSpecialDays.length > 0 ? allPastSpecialDays[0].date : null;
  const employeesWhoWorkedLastSpecial = lastSpecialDate 
    ? allPastSpecialDays[0].assignments.flatMap(a => a.employeeIds)
    : [];

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = formatDate(currentDate);
    const dayInfo = isSpecialDay(currentDate, holidays);

    let dailyAssignments: InternalAssignment[] = [];
    let pool = [...workingEmployees];

    if (dayInfo.special) {
      // ORDENAÇÃO DE PRIORIDADE PARA DIAS ESPECIAIS
      pool.sort((a, b) => {
        // Prioridade 1: Quem nunca trabalhou (null ou undefined vem primeiro)
        const aLast = a.lastSpecialDayWorked;
        const bLast = b.lastSpecialDayWorked;

        if (!aLast && bLast) return -1;
        if (aLast && !bLast) return 1;
        
        // Prioridade 2: Data mais antiga
        if (aLast && bLast) {
          if (aLast < bLast) return -1;
          if (aLast > bLast) return 1;
        }

        // Prioridade 3: Mais domingos/feriados de folga acumulados
        return b.consecutiveSpecialDaysOff - a.consecutiveSpecialDaysOff;
      });

      // Tenta evitar quem trabalhou no último dia especial (filtra se houver gente suficiente)
      const reqA = requirements['Ambiente A'] || 0;
      const reqB = requirements['Ambiente B'] || 0;
      const nonBackToBackPool = pool.filter(e => !employeesWhoWorkedLastSpecial.includes(e.id));
      const finalPool = nonBackToBackPool.length >= (reqA + reqB)
        ? nonBackToBackPool
        : pool;

      // Escalar Ambiente A
      const envA_Staff = finalPool.slice(0, reqA);
      envA_Staff.forEach(e => {
        dailyAssignments.push({ employeeId: e.id, environment: 'Ambiente A' });
      });

      // Escalar Ambiente B (evitando duplicatas já em A)
      const envB_Staff = finalPool
        .filter(e => !envA_Staff.find(a => a.id === e.id))
        .slice(0, reqB);
      
      envB_Staff.forEach(e => {
        dailyAssignments.push({ employeeId: e.id, environment: 'Ambiente B' });
      });

      // Atualizar métricas dos funcionários após escala do dia especial
      workingEmployees = workingEmployees.map(emp => {
        const workedToday = dailyAssignments.some(a => a.employeeId === emp.id);
        if (workedToday) {
          return {
            ...emp,
            lastSpecialDayWorked: dateStr,
            consecutiveSpecialDaysOff: 0,
            totalSpecialDaysWorked: emp.totalSpecialDaysWorked + 1
          };
        } else {
          return {
            ...emp,
            consecutiveSpecialDaysOff: emp.consecutiveSpecialDaysOff + 1
          };
        }
      });
    } else {
      // Escala de dia comum
      const reqA = requirements['Ambiente A'] || 0;
      const reqB = requirements['Ambiente B'] || 0;
      
      const envA_Staff = pool.slice(0, reqA);
      envA_Staff.forEach(e => dailyAssignments.push({ employeeId: e.id, environment: 'Ambiente A' }));
      
      const envB_Staff = pool
        .filter(e => !envA_Staff.find(a => a.id === e.id))
        .slice(0, reqB);
      envB_Staff.forEach(e => dailyAssignments.push({ employeeId: e.id, environment: 'Ambiente B' }));
      
      // Rotaciona o pool para o dia seguinte não ser igual
      const totalSelected = envA_Staff.length + envB_Staff.length;
      if (totalSelected > 0) {
        workingEmployees = [...workingEmployees.slice(totalSelected), ...workingEmployees.slice(0, totalSelected)];
      }
    }

    // Convert internal assignments to ScheduleAssignment[]
    const assignments: ScheduleAssignment[] = [];
    const envs = Array.from(new Set(dailyAssignments.map(a => a.environment)));
    envs.forEach(envId => {
      assignments.push({
        environmentId: envId,
        employeeIds: dailyAssignments.filter(a => a.environment === envId).map(a => a.employeeId)
      });
    });

    newSchedules.push({
      date: dateStr,
      isSunday: dayInfo.type === 'Sunday',
      isHoliday: dayInfo.type === 'Holiday',
      holidayName: dayInfo.name,
      assignments: assignments
    });
  }

  return { newSchedules, updatedEmployees: workingEmployees };
};
