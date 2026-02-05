import { createContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import * as db from '../services/database';
import { fetchIsraeliHolidays } from '../services/holidays';
import { getLocalDate } from '../utils/dateUtils';
import {
  HONEY_VALUES,
  SILLY_ANIMALS,
  KIDS_JOKES,
  FUN_FACTS,
  DAILY_COLORS,
  DAILY_CHALLENGES,
  MAGIC_WORDS,
} from '../utils/constants';

export const HiveContext = createContext(null);

const mapEntryFromDb = (entry) => ({
  id: entry.id,
  childId: entry.child_id,
  date: entry.entry_date,
  type: entry.type,
  icon: entry.icon,
  note: entry.note,
  honey: entry.honey,
  createdAt: entry.created_at,
});

const mapEventFromDb = (event) => ({
  id: event.id,
  title: event.title,
  date: event.event_date,
  icon: event.icon,
  note: event.note,
  createdAt: event.created_at,
});

const mapBirthdayFromDb = (birthday) => ({
  id: birthday.id,
  name: birthday.name,
  date: birthday.month_day,
  icon: birthday.icon,
  note: birthday.note,
  createdAt: birthday.created_at,
});

export const HiveProvider = ({ children: childrenProp }) => {
  const [children, setChildren] = useState([]);
  const [entries, setEntries] = useState([]);
  const [events, setEvents] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [holidays, setHolidays] = useState({});
  const [settings, setSettings] = useState({ dailyFunCategory: 'animal', showHolidays: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [childrenData, entriesData, eventsData, birthdaysData, dailyFunCategory, showHolidays] = await Promise.all([
          db.fetchChildren(),
          db.fetchEntries(),
          db.fetchEvents(),
          db.fetchBirthdays(),
          db.getSetting('dailyFunCategory'),
          db.getSetting('showHolidays'),
        ]);

        setChildren(childrenData);
        setEntries(entriesData.map(mapEntryFromDb));
        setEvents(eventsData.map(mapEventFromDb));
        setBirthdays(birthdaysData.map(mapBirthdayFromDb));
        setSettings({ 
          dailyFunCategory: dailyFunCategory || 'animal',
          showHolidays: showHolidays === 'true',
        });
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const addChild = useCallback(async (name, avatar) => {
    try {
      const newChild = await db.addChild(name, avatar);
      setChildren((prev) => [...prev, newChild]);
    } catch (err) {
      console.error('Failed to add child:', err);
      setError(err.message);
    }
  }, []);

  const updateChild = useCallback(async (id, updates) => {
    try {
      const updated = await db.updateChild(id, updates);
      setChildren((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      console.error('Failed to update child:', err);
      setError(err.message);
    }
  }, []);

  const deleteChild = useCallback(async (id) => {
    try {
      await db.deleteChild(id);
      setChildren((prev) => prev.filter((c) => c.id !== id));
      setEntries((prev) => prev.filter((e) => e.childId !== id));
    } catch (err) {
      console.error('Failed to delete child:', err);
      setError(err.message);
    }
  }, []);

  const addEntry = useCallback(async (childId, type, icon, date = null, note = '') => {
    try {
      const entryDate = date || getLocalDate();
      const honeyValue = type === 'good' ? HONEY_VALUES.GOOD_DEFAULT : type === 'bad' ? HONEY_VALUES.BAD_DEFAULT : 0;
      const newEntry = await db.addEntry(childId, type, icon, entryDate, note, honeyValue);
      setEntries((prev) => [mapEntryFromDb(newEntry), ...prev]);
    } catch (err) {
      console.error('Failed to add entry:', err);
      setError(err.message);
    }
  }, []);

  const addFamilyActivity = useCallback(async (icon, date = null, note = '') => {
    try {
      const activityDate = date || getLocalDate();
      const newEntry = await db.addEntry(null, 'family_activity', icon, activityDate, note, 0);
      setEntries((prev) => [mapEntryFromDb(newEntry), ...prev]);
    } catch (err) {
      console.error('Failed to add family activity:', err);
      setError(err.message);
    }
  }, []);

  const updateEntry = useCallback(async (id, updates) => {
    try {
      const updated = await db.updateEntry(id, updates);
      setEntries((prev) => prev.map((e) => (e.id === id ? mapEntryFromDb(updated) : e)));
    } catch (err) {
      console.error('Failed to update entry:', err);
      setError(err.message);
    }
  }, []);

  const deleteEntry = useCallback(async (id) => {
    try {
      await db.deleteEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Failed to delete entry:', err);
      setError(err.message);
    }
  }, []);

  const addEvent = useCallback(async (title, date, icon, note = '') => {
    try {
      const newEvent = await db.addEvent(title, date, icon, note);
      setEvents((prev) => [...prev, mapEventFromDb(newEvent)].sort((a, b) => a.date.localeCompare(b.date)));
    } catch (err) {
      console.error('Failed to add event:', err);
      setError(err.message);
    }
  }, []);

  const updateEvent = useCallback(async (id, updates) => {
    try {
      const updated = await db.updateEvent(id, updates);
      setEvents((prev) => prev.map((e) => (e.id === id ? mapEventFromDb(updated) : e)));
    } catch (err) {
      console.error('Failed to update event:', err);
      setError(err.message);
    }
  }, []);

  const deleteEvent = useCallback(async (id) => {
    try {
      await db.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Failed to delete event:', err);
      setError(err.message);
    }
  }, []);

  const addBirthday = useCallback(async (name, date, icon = '🎂', note = '') => {
    try {
      const newBirthday = await db.addBirthday(name, date, icon, note);
      setBirthdays((prev) => [...prev, mapBirthdayFromDb(newBirthday)]);
    } catch (err) {
      console.error('Failed to add birthday:', err);
      setError(err.message);
    }
  }, []);

  const updateBirthday = useCallback(async (id, updates) => {
    try {
      const updated = await db.updateBirthday(id, updates);
      setBirthdays((prev) => prev.map((b) => (b.id === id ? mapBirthdayFromDb(updated) : b)));
    } catch (err) {
      console.error('Failed to update birthday:', err);
      setError(err.message);
    }
  }, []);

  const deleteBirthday = useCallback(async (id) => {
    try {
      await db.deleteBirthday(id);
      setBirthdays((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Failed to delete birthday:', err);
      setError(err.message);
    }
  }, []);

  const getChildEntries = useCallback(
    (childId) => entries.filter((e) => e.childId === childId),
    [entries]
  );

  const getEntriesForDate = useCallback(
    (date) => entries.filter((e) => e.date === date),
    [entries]
  );

  const getChildTodayHoney = useCallback(
    (childId) => {
      const today = getLocalDate();
      return entries
        .filter((e) => e.childId === childId && e.date === today)
        .reduce((sum, e) => sum + e.honey, 0);
    },
    [entries]
  );

  const getChildTotalHoney = useCallback(
    (childId) => entries.filter((e) => e.childId === childId).reduce((sum, e) => sum + e.honey, 0),
    [entries]
  );

  const getChildMonthlyHoney = useCallback(
    (childId, yearMonth) => {
      return entries
        .filter((e) => e.childId === childId && e.date.startsWith(yearMonth))
        .reduce((sum, e) => sum + e.honey, 0);
    },
    [entries]
  );

  const getUpcomingEvents = useCallback(() => {
    const today = getLocalDate();
    return events
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events]);

  const getBirthdaysForDate = useCallback(
    (date) => {
      const monthDay = date.slice(5);
      return birthdays.filter((b) => b.date === monthDay);
    },
    [birthdays]
  );

  const getUpcomingBirthdays = useCallback(() => {
    const today = getLocalDate();
    const currentYear = today.slice(0, 4);

    return birthdays
      .map((b) => {
        const thisYearDate = `${currentYear}-${b.date}`;
        const nextYearDate = `${parseInt(currentYear) + 1}-${b.date}`;
        const displayDate = thisYearDate >= today ? thisYearDate : nextYearDate;
        return { ...b, displayDate };
      })
      .sort((a, b) => a.displayDate.localeCompare(b.displayDate))
      .slice(0, 5);
  }, [birthdays]);

  const setDailyFunCategory = useCallback(async (category) => {
    try {
      await db.setSetting('dailyFunCategory', category);
      setSettings((prev) => ({ ...prev, dailyFunCategory: category }));
    } catch (err) {
      console.error('Failed to set daily fun category:', err);
      setError(err.message);
    }
  }, []);

  const getDailyFunContent = useCallback(() => {
    const category = settings.dailyFunCategory || 'animal';
    const today = getLocalDate();
    const seed = today.split('-').join('').slice(0, 8);
    const numericSeed = parseInt(seed, 10);

    const contentMap = {
      animal: SILLY_ANIMALS,
      joke: KIDS_JOKES,
      fact: FUN_FACTS,
      color: DAILY_COLORS,
      challenge: DAILY_CHALLENGES,
      word: MAGIC_WORDS,
    };

    const contentArray = contentMap[category] || SILLY_ANIMALS;
    const index = numericSeed % contentArray.length;
    return { category, content: contentArray[index] };
  }, [settings.dailyFunCategory]);

  const setShowHolidays = useCallback(async (show) => {
    try {
      await db.setSetting('showHolidays', show ? 'true' : 'false');
      setSettings((prev) => ({ ...prev, showHolidays: show }));
    } catch (err) {
      console.error('Failed to set show holidays:', err);
      setError(err.message);
    }
  }, []);

  const loadHolidaysForYear = useCallback(async (year) => {
    if (holidays[year]) return holidays[year];
    
    const yearHolidays = await fetchIsraeliHolidays(year);
    setHolidays((prev) => ({ ...prev, [year]: yearHolidays }));
    return yearHolidays;
  }, [holidays]);

  const getHolidaysForDate = useCallback(
    (date) => {
      const year = date.slice(0, 4);
      const yearHolidays = holidays[year] || [];
      return yearHolidays.filter((h) => h.date === date);
    },
    [holidays]
  );

  const value = {
    children,
    entries,
    events,
    birthdays,
    holidays,
    settings,
    loading,
    error,
    addChild,
    updateChild,
    deleteChild,
    addEntry,
    addFamilyActivity,
    updateEntry,
    deleteEntry,
    addEvent,
    updateEvent,
    deleteEvent,
    addBirthday,
    updateBirthday,
    deleteBirthday,
    getChildEntries,
    getEntriesForDate,
    getChildTodayHoney,
    getChildTotalHoney,
    getChildMonthlyHoney,
    getUpcomingEvents,
    getBirthdaysForDate,
    getUpcomingBirthdays,
    setDailyFunCategory,
    getDailyFunContent,
    setShowHolidays,
    loadHolidaysForYear,
    getHolidaysForDate,
  };

  return <HiveContext.Provider value={value}>{childrenProp}</HiveContext.Provider>;
};

HiveProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
