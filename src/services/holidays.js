const HOLIDAYS_CACHE_KEY = 'busybee_holidays_cache';

export const fetchIsraeliHolidays = async (year) => {
  const cached = getCachedHolidays(year);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=x&i=on&maj=on&mod=on`
    );
    if (!response.ok) throw new Error('Failed to fetch holidays');
    
    const data = await response.json();
    const holidays = (data.items || []).map((h) => ({
      date: h.date,
      name: h.hebrew || h.title,
      englishName: h.title,
      memo: h.memo,
    }));

    cacheHolidays(year, holidays);
    return holidays;
  } catch (error) {
    console.error('Failed to fetch Israeli holidays:', error);
    return [];
  }
};

const getCachedHolidays = (year) => {
  try {
    const cache = JSON.parse(localStorage.getItem(HOLIDAYS_CACHE_KEY) || '{}');
    if (cache[year] && cache[year].expires > Date.now()) {
      return cache[year].data;
    }
  } catch {
    return null;
  }
  return null;
};

const cacheHolidays = (year, holidays) => {
  try {
    const cache = JSON.parse(localStorage.getItem(HOLIDAYS_CACHE_KEY) || '{}');
    cache[year] = {
      data: holidays,
      expires: Date.now() + 24 * 60 * 60 * 1000,
    };
    localStorage.setItem(HOLIDAYS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache errors
  }
};
