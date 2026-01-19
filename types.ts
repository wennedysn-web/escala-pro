
export type EmployeeStatus = 'Ativo' | 'Férias' | 'Atestado';

export interface Category {
  id: string;
  name: string;
}

export interface Environment {
  id: string;
  name: string;
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  categoryId: string;
  environmentId: string;
  status: EmployeeStatus;
  role?: string;
  lastSpecialDayWorked?: string | null;
  consecutiveSpecialDaysOff: number;
  totalSpecialDaysWorked: number;
}

export interface ScheduleAssignment {
  environmentId: string;
  employeeIds: string[];
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  assignments: ScheduleAssignment[];
  isSunday?: boolean;
  isHoliday?: boolean;
  holidayName?: string;
}
