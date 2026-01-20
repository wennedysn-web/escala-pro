
import { Holiday } from '../types';

/**
 * Retorna a data atual no formato YYYY-MM-DD considerando o fuso horário local.
 * Evita o erro comum onde isoSring() retorna o dia seguinte/anterior devido ao UTC.
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
};

export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const formatWeekString = (date: Date): string => {
  const week = getWeekNumber(date);
  const year = date.getFullYear();
  return `Semana ${String(week).padStart(2, '0')} de ${year}`;
};

export const formatDateDisplay = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
};

export const isSunday = (dateStr: string): boolean => {
  return new Date(dateStr + 'T00:00:00').getDay() === 0;
};

export const getMonthDays = (year: number, month: number): string[] => {
  const date = new Date(year, month, 1);
  const days: string[] = [];
  while (date.getMonth() === month) {
    days.push(getLocalDateString(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const formatDate = (date: Date): string => {
  return getLocalDateString(date);
};

export const isSpecialDay = (date: Date, holidays: Holiday[] = []): { special: boolean; type: 'Sunday' | 'Holiday' | 'Workday'; name?: string } => {
  const dateStr = getLocalDateString(date);
  const holiday = holidays.find(h => h.date === dateStr);
  if (holiday) return { special: true, type: 'Holiday', name: holiday.name };
  if (date.getDay() === 0) return { special: true, type: 'Sunday' };
  return { special: false, type: 'Workday' };
};
