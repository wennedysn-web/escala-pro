
import { Employee, DaySchedule, ScheduleAssignment, Holiday } from '../types';
import { isSpecialDay, formatDate } from '../utils/dateUtils';

interface InternalAssignment {
  employeeId: string;
  environmentId: string;
}

/**
 * Lógica de Automação com Memória de Curto Prazo:
 * - Filtra quem trabalhou no dia especial imediatamente anterior do mesmo tipo.
 * - Prioriza quem tem maior contador de folgas (99 = nunca trabalhou).
 */
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

  let lastSundayInSystem = currentSchedules
    .filter(s => s.isSunday)
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.date;

  let lastHolidayInSystem = currentSchedules
    .filter(s => s.isHoliday)
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.date;

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = formatDate(currentDate);
    const dayInfo = isSpecialDay(currentDate, holidays);

    let dailyAssignments: InternalAssignment[] = [];
    let pool = [...workingEmployees].filter(e => e.status === 'Ativo');

    if (dayInfo.special) {
      const isSun = dayInfo.type === 'Sunday';
      const lastDate = isSun ? lastSundayInSystem : lastHolidayInSystem;

      let candidates = pool.filter(e => {
        const lastWorked = isSun ? e.lastSundayWorked : e.lastHolidayWorked;
        return lastWorked !== lastDate;
      });

      if (candidates.length < Object.values(requirements).reduce((a, b) => a + b, 0)) {
        candidates = pool;
      }

      candidates.sort((a, b) => {
        if (isSun) {
          if (b.consecutiveSundaysOff !== a.consecutiveSundaysOff) {
            return b.consecutiveSundaysOff - a.consecutiveSundaysOff;
          }
          return (a.lastSundayWorked || '') > (b.lastSundayWorked || '') ? 1 : -1;
        } else {
          if (b.consecutiveHolidaysOff !== a.consecutiveHolidaysOff) {
            return b.consecutiveHolidaysOff - a.consecutiveHolidaysOff;
          }
          return (a.lastHolidayWorked || '') > (b.lastHolidayWorked || '') ? 1 : -1;
        }
      });

      let currentIndex = 0;
      Object.entries(requirements).forEach(([envId, count]) => {
        const staff = candidates.slice(currentIndex, currentIndex + count);
        staff.forEach(e => {
          dailyAssignments.push({ employeeId: e.id, environmentId: envId });
        });
        currentIndex += count;
      });

      workingEmployees = workingEmployees.map(emp => {
        const workedToday = dailyAssignments.some(a => a.employeeId === emp.id);
        if (isSun) {
          const hasWorkedBefore = !!emp.lastSundayWorked;
          return {
            ...emp,
            lastSundayWorked: workedToday ? dateStr : emp.lastSundayWorked,
            consecutiveSundaysOff: workedToday ? 0 : (hasWorkedBefore ? emp.consecutiveSundaysOff + 1 : 99),
            totalSundaysWorked: workedToday ? emp.totalSundaysWorked + 1 : emp.totalSundaysWorked
          };
        } else {
          const hasWorkedBeforeHol = !!emp.lastHolidayWorked;
          return {
            ...emp,
            lastHolidayWorked: workedToday ? dateStr : emp.lastHolidayWorked,
            consecutiveHolidaysOff: workedToday ? 0 : (hasWorkedBeforeHol ? emp.consecutiveHolidaysOff + 1 : 99),
            totalHolidaysWorked: workedToday ? emp.totalHolidaysWorked + 1 : emp.totalHolidaysWorked
          };
        }
      });

      if (isSun) lastSundayInSystem = dateStr;
      else lastHolidayInSystem = dateStr;

    } else {
      let currentIndex = 0;
      Object.entries(requirements).forEach(([envId, count]) => {
        const staff = pool.slice(currentIndex, currentIndex + count);
        staff.forEach(e => {
          dailyAssignments.push({ employeeId: e.id, environmentId: envId });
        });
        currentIndex += count;
      });
      const shiftSize = dailyAssignments.length;
      if (shiftSize > 0) {
        workingEmployees = [...workingEmployees.slice(shiftSize), ...workingEmployees.slice(0, shiftSize)];
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
