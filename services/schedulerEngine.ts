
import { Employee, DaySchedule, ScheduleAssignment, Holiday } from '../types';
import { isSpecialDay, formatDate } from '../utils/dateUtils';

/**
 * Lógica de Priorização Atualizada:
 * 1. Identifica o tipo do dia (Domingo ou Feriado).
 * 2. Se for Domingo, prioriza quem tem mais 'consecutiveSundaysOff'.
 * 3. Se for Feriado, prioriza quem tem mais 'consecutiveHolidaysOff'.
 * 4. Reseta os contadores específicos apenas do tipo de dia trabalhado.
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
  requirements: Record<string, number>,
  holidays: Holiday[]
): { newSchedules: DaySchedule[]; updatedEmployees: Employee[] } => {
  
  let workingEmployees = [...employees];
  const newSchedules: DaySchedule[] = [];

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = formatDate(currentDate);
    const dayInfo = isSpecialDay(currentDate, holidays);

    let dailyAssignments: InternalAssignment[] = [];
    let pool = [...workingEmployees].filter(e => e.status === 'Ativo');

    if (dayInfo.special) {
      const isSun = dayInfo.type === 'Sunday';

      // ORDENAÇÃO DE PRIORIDADE ESPECÍFICA
      pool.sort((a, b) => {
        if (isSun) {
          // Prioridade para Domingo
          if (b.consecutiveSundaysOff !== a.consecutiveSundaysOff) {
            return b.consecutiveSundaysOff - a.consecutiveSundaysOff;
          }
          return (a.lastSundayWorked || '') > (b.lastSundayWorked || '') ? 1 : -1;
        } else {
          // Prioridade para Feriado
          if (b.consecutiveHolidaysOff !== a.consecutiveHolidaysOff) {
            return b.consecutiveHolidaysOff - a.consecutiveHolidaysOff;
          }
          return (a.lastHolidayWorked || '') > (b.lastHolidayWorked || '') ? 1 : -1;
        }
      });

      let currentIndex = 0;
      Object.entries(requirements).forEach(([envId, count]) => {
        const staff = pool.slice(currentIndex, currentIndex + count);
        staff.forEach(e => {
          dailyAssignments.push({ employeeId: e.id, environmentId: envId });
        });
        currentIndex += count;
      });

      // Atualizar métricas específicas
      workingEmployees = workingEmployees.map(emp => {
        const workedToday = dailyAssignments.some(a => a.employeeId === emp.id);
        
        if (isSun) {
          return {
            ...emp,
            lastSundayWorked: workedToday ? dateStr : emp.lastSundayWorked,
            consecutiveSundaysOff: workedToday ? 0 : emp.consecutiveSundaysOff + 1,
            totalSundaysWorked: workedToday ? emp.totalSundaysWorked + 1 : emp.totalSundaysWorked
          };
        } else {
          return {
            ...emp,
            lastHolidayWorked: workedToday ? dateStr : emp.lastHolidayWorked,
            consecutiveHolidaysOff: workedToday ? 0 : emp.consecutiveHolidaysOff + 1,
            totalHolidaysWorked: workedToday ? emp.totalHolidaysWorked + 1 : emp.totalHolidaysWorked
          };
        }
      });
    } else {
      // Dia comum
      let currentIndex = 0;
      Object.entries(requirements).forEach(([envId, count]) => {
        const staff = pool.slice(currentIndex, currentIndex + count);
        staff.forEach(e => {
          dailyAssignments.push({ employeeId: e.id, environmentId: envId });
        });
        currentIndex += count;
      });
      
      const totalSelected = dailyAssignments.length;
      if (totalSelected > 0) {
        workingEmployees = [...workingEmployees.slice(totalSelected), ...workingEmployees.slice(0, totalSelected)];
      }
    }

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
