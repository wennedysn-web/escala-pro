
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
  environmentId: string;
}

export const generateSchedule = (
  startDate: Date,
  days: number,
  employees: Employee[],
  currentSchedules: DaySchedule[],
  requirements: Record<string, number>, // Key is environmentId, value is count
  holidays: Holiday[]
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
    let pool = [...workingEmployees].filter(e => e.status === 'Ativo');

    if (dayInfo.special) {
      // ORDENAÇÃO DE PRIORIDADE PARA DIAS ESPECIAIS
      pool.sort((a, b) => {
        const aLast = a.lastSpecialDayWorked;
        const bLast = b.lastSpecialDayWorked;

        if (!aLast && bLast) return -1;
        if (aLast && !bLast) return 1;
        
        if (aLast && bLast) {
          if (aLast < bLast) return -1;
          if (aLast > bLast) return 1;
        }

        return b.consecutiveSpecialDaysOff - a.consecutiveSpecialDaysOff;
      });

      // Tenta evitar quem trabalhou no último dia especial
      const totalRequired = Object.values(requirements).reduce((a, b) => a + b, 0);
      const nonBackToBackPool = pool.filter(e => !employeesWhoWorkedLastSpecial.includes(e.id));
      const finalPool = nonBackToBackPool.length >= totalRequired ? nonBackToBackPool : pool;

      let currentIndex = 0;
      Object.entries(requirements).forEach(([envId, count]) => {
        const staff = finalPool.slice(currentIndex, currentIndex + count);
        staff.forEach(e => {
          dailyAssignments.push({ employeeId: e.id, environmentId: envId });
        });
        currentIndex += count;
      });

      // Atualizar métricas dos funcionários
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
      // Escala de dia comum - Rotação simples
      let currentIndex = 0;
      Object.entries(requirements).forEach(([envId, count]) => {
        const staff = pool.slice(currentIndex, currentIndex + count);
        staff.forEach(e => {
          dailyAssignments.push({ employeeId: e.id, environmentId: envId });
        });
        currentIndex += count;
      });
      
      // Rotaciona o pool base para o dia seguinte
      const totalSelected = dailyAssignments.length;
      if (totalSelected > 0) {
        workingEmployees = [...workingEmployees.slice(totalSelected), ...workingEmployees.slice(0, totalSelected)];
      }
    }

    // Converter para o formato DaySchedule
    const assignments: ScheduleAssignment[] = Object.keys(requirements).map(envId => ({
      environmentId: envId,
      employeeIds: dailyAssignments.filter(a => a.environmentId === envId).map(a => a.employeeId)
    }));

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
