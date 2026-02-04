import { format, parseISO, differenceInDays, startOfDay, isToday, isSameDay } from 'date-fns';

export const getLocalDate = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const getISOTimestamp = () => {
  return new Date().toISOString();
};

export const formatDisplayDate = (dateString) => {
  const date = parseISO(dateString);
  return format(date, 'MMM d, yyyy');
};

export const formatShortDate = (dateString) => {
  const date = parseISO(dateString);
  return format(date, 'MMM d');
};

export const getDaysUntil = (dateString) => {
  const targetDate = startOfDay(parseISO(dateString));
  const today = startOfDay(new Date());
  return differenceInDays(targetDate, today);
};

export const getSleepsUntil = (dateString) => {
  const days = getDaysUntil(dateString);
  if (days < 0) return null;
  if (days === 0) return 'Today!';
  if (days === 1) return '1 sleep';
  return `${days} sleeps`;
};

export const isDateToday = (dateString) => {
  return isToday(parseISO(dateString));
};

export const isSameDate = (date1, date2) => {
  return isSameDay(parseISO(date1), parseISO(date2));
};

export const getMonthDays = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const days = [];
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(format(new Date(year, month, i), 'yyyy-MM-dd'));
  }
  return days;
};

export const getMonthName = (month) => {
  return format(new Date(2024, month, 1), 'MMMM');
};
