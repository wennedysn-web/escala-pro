
import { Employee, DaySchedule, ScheduleAssignment, Holiday } from '../types';
import { isSpecialDay, formatDate } from '../utils/dateUtils';

interface InternalAssignment {
  employeeId: string;
  environmentId: string;
}

/**
 * Lógica de Automação com Memória de Curto Prazo
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

  // Determinamos o ano alvo para contadores anuais baseados no range de geração
  const systemYear = new Date().getFullYear();
  const generationYear = startDate.getFullYear();
  const activeYearStr = Math.max(systemYear, generationYear).toString();

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
    const schYearStr = dateStr.split('-')[0];
    const isTargetYear = schYearStr === activeYearStr;

    let dailyAssignments: InternalAssignment[] = [];
    let pool = [...workingEmployees].filter(e => e.status === 'Ativo');

    if (dayInfo.special) {
      const isSun = dayInfo.type === 'Sunday';
      const lastDate = isSun ? lastSundayInSystem : lastHolidayInSystem;

      let candidates = pool.filter(e => {
        const lastWorked = isSun ? e.lastSundayWorked : e.lastHolidayWorked;
        return lastWorked !== dateStr; // Evita escala dupla no mesmo dia se chamado repetidamente
      });

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
          return {
            ...emp,
            lastSundayWorked: workedToday ? dateStr : emp.lastSundayWorked,
            consecutiveSundaysOff: workedToday ? 0 : emp.consecutiveSundaysOff + 1,
            totalSundaysWorked: workedToday ? emp.totalSundaysWorked + 1 : emp.totalSundaysWorked,
            sundaysWorkedCurrentYear: (workedToday && isTargetYear) ? emp.sundaysWorkedCurrentYear + 1 : emp.sundaysWorkedCurrentYear
          };
        } else {
          return {
            ...emp,
            lastHolidayWorked: workedToday ? dateStr : emp.lastHolidayWorked,
            consecutiveHolidaysOff: workedToday ? 0 : emp.consecutiveHolidaysOff + 1,
            totalHolidaysWorked: workedToday ? emp.totalHolidaysWorked + 1 : emp.totalHolidaysWorked,
            holidaysWorkedCurrentYear: (workedToday && isTargetYear) ? emp.holidaysWorkedCurrentYear + 1 : emp.holidaysWorkedCurrentYear
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
