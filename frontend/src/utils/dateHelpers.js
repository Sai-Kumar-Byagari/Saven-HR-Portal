import { format } from 'date-fns';

export function formatIndianDate(date) {
  if (!date) return '—';
  return format(new Date(date), 'dd/MM/yyyy');
}

export function formatIndianDateTime(date) {
  if (!date) return '—';
  return format(new Date(date), 'dd/MM/yyyy HH:mm');
}

export function formatIndianCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getFinancialYear(date = new Date()) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  if (month >= 4) return `${year}-${String(year + 1).slice(-2)}`;
  return `${year - 1}-${String(year).slice(-2)}`;
}

export function getMonthName(month) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[month - 1] || month;
}
