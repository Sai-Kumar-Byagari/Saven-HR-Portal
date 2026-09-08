/**
 * Returns the financial year string for a given date (Apr–Mar).
 * e.g., for 2024-07-01 → "2024-25", for 2024-02-01 → "2023-24"
 */
function getFinancialYear(date = new Date()) {
  const d = new Date(date);
  const month = d.getMonth() + 1; // 1-indexed
  const year = d.getFullYear();
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }
  return `${year - 1}-${String(year).slice(-2)}`;
}

/**
 * Returns financial year start and end dates.
 */
function getFYDates(fyString) {
  const [startYear] = fyString.split('-');
  const year = parseInt(startYear, 10);
  return {
    startDate: `${year}-04-01`,
    endDate: `${year + 1}-03-31`,
  };
}

/**
 * Calculates business days between two dates, excluding weekends.
 */
function countBusinessDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Format date to DD/MM/YYYY (Indian format).
 */
function formatIndianDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

module.exports = { getFinancialYear, getFYDates, countBusinessDays, formatIndianDate, getTodayString };
