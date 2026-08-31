import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { useHive } from '../../hooks/useHive';
import { BeeMascot } from '../../components/BeeMascot';
import { Button, Modal } from '../../components/ui';
import { BEHAVIOR_ICONS, ENTRY_TYPES, EVENT_ICONS, STICKERS } from '../../utils/constants';
import { lookupLegoSetImage } from '../../services/lego';
import styles from './Calendar.module.css';

const MAX_EVENT_LANES = 3;

const addDaysToDateStr = (dateStr, amount) => {
  const [year, month, dayOfMonth] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().split('T')[0];
};

const formatWeekRangeLabel = (weekStart) => {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = isSameMonth(weekStart, weekEnd);
  const startLabel = format(weekStart, sameMonth ? 'MMM d' : 'MMM d, yyyy');
  const endLabel = format(weekEnd, 'MMM d, yyyy');
  return `${startLabel} – ${endLabel}`;
};

export const Calendar = () => {
  const navigate = useNavigate();
  const { 
    children, 
    entries, 
    events, 
    addEntry, 
    addFamilyActivity, 
    deleteEntry, 
    addEvent,
    deleteEvent,
    getRelatedEvents,
    updateEventRange,
    deleteEventRange,
    getChildBirthdaysForDate,
    getChildMonthlyHoney, 
    settings,
    setShowHolidays,
    loadHolidaysForYear,
    getHolidaysForDate,
    loading 
  } = useHive();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [selectedChildIds, setSelectedChildIds] = useState([]);
  const [isFamilyActivity, setIsFamilyActivity] = useState(false);
  const [entryTab, setEntryTab] = useState('activity');
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [entryNote, setEntryNote] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [dayOffEndDate, setDayOffEndDate] = useState('');
  const [eventParticipants, setEventParticipants] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editEventDate, setEditEventDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [legoSetId, setLegoSetId] = useState('');
  const [legoStatus, setLegoStatus] = useState('idle');
  const [legoError, setLegoError] = useState('');
  const [legoResult, setLegoResult] = useState(null);

  const today = new Date();

  useEffect(() => {
    if (settings.showHolidays) {
      const year = format(currentMonth, 'yyyy');
      loadHolidaysForYear(year);
    }
  }, [currentMonth, settings.showHolidays, loadHolidaysForYear]);

  const getEventsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter((e) => e.date === dateStr);
  };

  // Groups same-title/icon/note events into contiguous date runs so multi-day
  // events (e.g. vacations) render as a single spanning bar instead of one
  // repeated entry per day.
  const eventRuns = useMemo(() => {
    const groups = new Map();
    events.forEach((event) => {
      const key = `${event.title}|||${event.icon}|||${event.note || ''}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(event);
    });

    const runs = [];
    groups.forEach((groupEvents) => {
      const sorted = [...groupEvents].sort((a, b) => a.date.localeCompare(b.date));
      let runStart = 0;
      for (let i = 1; i <= sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        const isContiguous = curr && addDaysToDateStr(prev.date, 1) === curr.date;
        if (!isContiguous) {
          const runEvents = sorted.slice(runStart, i);
          runs.push({
            id: runEvents[0].id,
            title: runEvents[0].title,
            icon: runEvents[0].icon,
            note: runEvents[0].note,
            startDate: runEvents[0].date,
            endDate: runEvents[runEvents.length - 1].date,
            representative: runEvents[0],
          });
          runStart = i;
        }
      }
    });
    return runs;
  }, [events]);

  const getDayBirthdays = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return getChildBirthdaysForDate(dateStr);
  };

  const getEntriesForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.filter((e) => e.date === dateStr);
  };

  const getDailyHoneyByChild = (date) => {
    const dayEntries = getEntriesForDate(date);
    const honeyMap = {};
    children.forEach((child) => {
      const childEntries = dayEntries.filter((e) => e.childId === child.id);
      const totalHoney = childEntries.reduce((sum, e) => sum + (e.honey || 0), 0);
      if (totalHoney !== 0) {
        honeyMap[child.id] = { name: child.name, avatar: child.avatar, honey: totalHoney };
      }
    });
    return honeyMap;
  };

  const handleSelectIcon = (icon) => {
    setSelectedIcon(icon);
  };

  const clearLegoState = () => {
    setLegoSetId('');
    setLegoStatus('idle');
    setLegoError('');
    setLegoResult(null);
  };

  const clearIconSelection = () => {
    setSelectedIcon(null);
    setSelectedSticker(null);
    clearLegoState();
  };

  const handleLegoLookup = async () => {
    setLegoStatus('loading');
    setLegoError('');
    try {
      const result = await lookupLegoSetImage(legoSetId);
      setLegoResult(result);
      setLegoStatus('success');
    } catch (err) {
      setLegoResult(null);
      setLegoError(err.message);
      setLegoStatus('error');
    }
  };

  const handleAddEntry = async () => {
    if (!selectedDate || !selectedIcon || saving) return;
    setSaving(true);
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      if (entryTab === 'event') {
        const participantsPrefix = getParticipantsDisplay();
        const fullNote = participantsPrefix ? `${participantsPrefix}${entryNote ? ' | ' + entryNote : ''}` : entryNote;
        
        if (selectedIcon === '🏡' || selectedIcon === '✈️') {
          const defaultTitle = selectedIcon === '🏡' ? 'Day Off' : 'Trip';
          const title = eventTitle.trim() || defaultTitle;
          const endDate = dayOffEndDate ? new Date(dayOffEndDate) : selectedDate;
          let current = new Date(selectedDate);
          while (current <= endDate) {
            const currentDateStr = format(current, 'yyyy-MM-dd');
            await addEvent(title, currentDateStr, selectedIcon, fullNote);
            current = addDays(current, 1);
          }
        } else if (eventTitle.trim()) {
          await addEvent(eventTitle.trim(), dateStr, selectedIcon, fullNote);
        }
      } else if (entryTab === 'activity') {
        if (isFamilyActivity) {
          await addFamilyActivity(selectedIcon, dateStr, entryNote);
        } else if (selectedChildIds.length > 0) {
          for (const childId of selectedChildIds) {
            await addEntry(childId, ENTRY_TYPES.ACTIVITY, selectedIcon, dateStr, entryNote);
          }
        }
      } else if (entryTab === 'gift') {
        const imageUrl = legoResult?.imageUrl || null;
        const finalNote = legoResult
          ? [`LEGO ${legoResult.setId}`, entryNote.trim()].filter(Boolean).join(' | ')
          : entryNote;
        for (const childId of selectedChildIds) {
          await addEntry(childId, ENTRY_TYPES.GIFT, selectedIcon, dateStr, finalNote, imageUrl);
        }
      } else {
        const type = entryTab === 'good' ? ENTRY_TYPES.GOOD : ENTRY_TYPES.BAD;
        const sticker = entryTab === 'good' ? selectedSticker : null;
        for (const childId of selectedChildIds) {
          await addEntry(childId, type, selectedIcon, dateStr, entryNote, null, sticker);
        }
      }

      resetModal();
    } finally {
      setSaving(false);
    }
  };

  const resetModal = () => {
    setShowAddEntry(false);
    setSelectedChildIds([]);
    setIsFamilyActivity(false);
    setEntryTab('activity');
    setSelectedIcon(null);
    setSelectedSticker(null);
    setEntryNote('');
    setEventTitle('');
    setDayOffEndDate('');
    setEventParticipants([]);
    clearLegoState();
  };

  const toggleEventParticipant = (participant) => {
    setEventParticipants((prev) => 
      prev.includes(participant) 
        ? prev.filter((p) => p !== participant)
        : [...prev, participant]
    );
  };

  const getParticipantsDisplay = () => {
    if (eventParticipants.length === 0) return '';
    return eventParticipants.map((p) => {
      if (p === 'mom') return '👩';
      if (p === 'dad') return '👨';
      if (p === 'family') return '👨‍👩‍👧‍👦';
      const child = children.find((c) => c.id === p);
      return child?.avatar || '';
    }).join(' ');
  };

  const extractParticipantsFromNote = (note) => {
    if (!note) return { participants: '', cleanNote: '' };
    const match = note.match(/^([👩👨👨‍👩‍👧‍👦🧒👦👧🐻🦁🐯🐰🐱🐶🦊🐼🐨🐸🐵🦄🐲🦋🐝🐞🌸🌻🌺💫⭐🌈🎀👑💎🚀⚽🎨🎵🎮📚\s]+)(?:\s*\|\s*)?(.*)$/);
    if (match) {
      return { participants: match[1].trim(), cleanNote: match[2] || '' };
    }
    return { participants: '', cleanNote: note };
  };


  const getIconsForTab = () => {
    if (entryTab === 'good') return BEHAVIOR_ICONS.good;
    if (entryTab === 'bad') return BEHAVIOR_ICONS.bad;
    if (entryTab === 'gift') return BEHAVIOR_ICONS.gift;
    if (entryTab === 'event') return EVENT_ICONS;
    return BEHAVIOR_ICONS.activity;
  };

  const selectedIconIsLego = entryTab === 'gift' && getIconsForTab().find((i) => i.emoji === selectedIcon)?.isLego;

  const openEventFromBar = (run) => {
    setEditingEvent(run.representative);
    setEditEventDate(run.representative.date);
  };

  // Computes which event runs are visible in this week, clipped to the
  // week's date range, and assigns each a stacking lane so overlapping
  // ranges don't collide (classic month-view "spanning bar" layout).
  const getWeekEventBars = (weekDays) => {
    const weekStartStr = format(weekDays[0], 'yyyy-MM-dd');
    const weekEndStr = format(weekDays[6], 'yyyy-MM-dd');

    const weekRuns = eventRuns
      .filter((run) => run.endDate >= weekStartStr && run.startDate <= weekEndStr)
      .map((run) => {
        const visibleStart = run.startDate < weekStartStr ? weekStartStr : run.startDate;
        const visibleEnd = run.endDate > weekEndStr ? weekEndStr : run.endDate;
        const colStart = weekDays.findIndex((d) => format(d, 'yyyy-MM-dd') === visibleStart);
        const colEnd = weekDays.findIndex((d) => format(d, 'yyyy-MM-dd') === visibleEnd);
        return { ...run, colStart, colSpan: colEnd - colStart + 1 };
      })
      .sort((a, b) => a.colStart - b.colStart || b.colSpan - a.colSpan);

    const laneEnds = [];
    weekRuns.forEach((run) => {
      let lane = laneEnds.findIndex((endCol) => endCol < run.colStart);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(run.colStart + run.colSpan - 1);
      } else {
        laneEnds[lane] = run.colStart + run.colSpan - 1;
      }
      run.lane = lane;
    });

    const visibleBars = weekRuns.filter((run) => run.lane < MAX_EVENT_LANES);
    const overflowByCol = {};
    weekRuns
      .filter((run) => run.lane >= MAX_EVENT_LANES)
      .forEach((run) => {
        for (let c = run.colStart; c < run.colStart + run.colSpan; c++) {
          overflowByCol[c] = (overflowByCol[c] || 0) + 1;
        }
      });

    const laneCount = Math.min(
      weekRuns.length ? Math.max(...weekRuns.map((r) => r.lane)) + 1 : 0,
      MAX_EVENT_LANES
    );

    return { visibleBars, overflowByCol, laneCount };
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = viewMode === 'week' ? startOfWeek(currentMonth) : startOfWeek(monthStart);
    const endDate = viewMode === 'week' ? addDays(startDate, 6) : endOfWeek(monthEnd);

    const rows = [];
    let day = startDate;

    while (day <= endDate) {
      const weekDays = Array.from({ length: 7 }, (_, i) => addDays(day, i));
      const { visibleBars, overflowByCol, laneCount } = getWeekEventBars(weekDays);
      const barsAreaHeight = laneCount > 0 ? laneCount * 20 : 0;

      const days = weekDays.map((cloneDay, colIndex) => {
        const dayBirthdays = getDayBirthdays(cloneDay);
        const dayEntries = getEntriesForDate(cloneDay);
        const dayActivities = dayEntries.filter((e) => e.type === 'activity' || e.type === 'family_activity');
        const dayGifts = dayEntries.filter((e) => e.type === 'gift');
        const dayStickers = dayEntries.filter((e) => e.sticker);
        const dailyHoney = getDailyHoneyByChild(cloneDay);
        const dayHolidays = settings.showHolidays ? getHolidaysForDate(format(cloneDay, 'yyyy-MM-dd')) : [];
        const isCurrentMonth = viewMode === 'week' || isSameMonth(cloneDay, monthStart);
        const isToday = isSameDay(cloneDay, today);
        const isSelected = selectedDate && isSameDay(cloneDay, selectedDate);
        const isHoliday = dayHolidays.length > 0;
        const dayOverflow = overflowByCol[colIndex] || 0;

        return (
          <div
            key={cloneDay.toString()}
            onClick={() => isCurrentMonth && setSelectedDate(cloneDay)}
            className={`${styles.cell} ${!isCurrentMonth ? styles.disabled : ''} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''} ${isHoliday ? styles.holiday : ''}`}
          >
            <div className={styles.dayNumberRow}>
              <span className={`${styles.dayNumber} ${isToday ? styles.todayNumber : ''}`}>
                {format(cloneDay, 'd')}
              </span>
            </div>

            {barsAreaHeight > 0 && (
              <div className={styles.eventBarsSpacer} style={{ height: barsAreaHeight }} />
            )}

            {dayHolidays.length > 0 && (
              <div className={styles.holidayPreview}>
                <span className={styles.holidayFlag}>🇮🇱</span>
                <span className={styles.holidayName}>{dayHolidays[0].name}</span>
              </div>
            )}

            {dayBirthdays.length > 0 && (
              <div className={styles.birthdayIcons}>
                {dayBirthdays.slice(0, 2).map((b) => (
                  <div key={b.id} className={styles.birthdayItem} title={`${b.name}'s birthday`}>
                    <span className={styles.birthdayIcon}>{b.icon}</span>
                    <span className={styles.birthdayName}>{b.name}</span>
                  </div>
                ))}
              </div>
            )}

            {dayActivities.length > 0 && (
              <div className={styles.activityIcons}>
                {dayActivities.length <= 3 ? (
                  dayActivities.map((a) => (
                    <span key={a.id} className={styles.activityIcon}>{a.icon}</span>
                  ))
                ) : (
                  <>
                    {dayActivities.slice(0, 2).map((a) => (
                      <span key={a.id} className={styles.activityIcon}>{a.icon}</span>
                    ))}
                    <span className={styles.activityCount}>+{dayActivities.length - 2}</span>
                  </>
                )}
              </div>
            )}

            {dayGifts.length > 0 && (
              <div className={styles.giftIcons}>
                {dayGifts.slice(0, 2).map((gift) => (
                  gift.imageUrl ? (
                    <img
                      key={gift.id}
                      src={gift.imageUrl}
                      alt=""
                      title={gift.note || 'Gift'}
                      className={styles.giftThumb}
                    />
                  ) : (
                    <span key={gift.id} className={styles.activityIcon} title={gift.note || 'Gift'}>{gift.icon}</span>
                  )
                ))}
                {dayGifts.length > 2 && <span className={styles.activityCount}>+{dayGifts.length - 2}</span>}
              </div>
            )}

            {dayStickers.length > 0 && (
              <div className={styles.dayStickerIcons}>
                {dayStickers.slice(0, 2).map((entry) => {
                  const sticker = STICKERS.find((s) => s.id === entry.sticker);
                  return sticker ? (
                    <img
                      key={entry.id}
                      src={sticker.src}
                      alt={sticker.label}
                      title={sticker.label}
                      className={styles.dayStickerThumb}
                    />
                  ) : null;
                })}
                {dayStickers.length > 2 && <span className={styles.activityCount}>+{dayStickers.length - 2}</span>}
              </div>
            )}

            {Object.keys(dailyHoney).length > 0 && (
              <div className={styles.honeyIndicators}>
                {Object.values(dailyHoney).slice(0, 3).map((data, idx) => (
                  <span
                    key={idx}
                    className={`${styles.honeyDot} ${data.honey > 0 ? styles.positive : styles.negative}`}
                    title={`${data.name}: ${data.honey > 0 ? '+' : ''}${data.honey}`}
                  >
                    {data.avatar}
                  </span>
                ))}
              </div>
            )}

            {dayOverflow > 0 && (
              <span className={styles.eventOverflow}>+{dayOverflow} more</span>
            )}
          </div>
        );
      });

      rows.push(
        <div key={weekDays[0].toString()} className={styles.row}>
          {days}
          {visibleBars.length > 0 && (
            <div className={styles.eventBarsLayer}>
              {visibleBars.map((run) => {
                const { participants } = extractParticipantsFromNote(run.note);
                return (
                  <button
                    key={`${run.id}-${weekDays[0].toString()}`}
                    type="button"
                    className={styles.eventBar}
                    style={{ gridColumn: `${run.colStart + 1} / span ${run.colSpan}`, gridRow: run.lane + 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEventFromBar(run);
                    }}
                    title={run.startDate !== run.endDate
                      ? `${run.title} (${format(new Date(run.startDate + 'T00:00:00'), 'MMM d')} - ${format(new Date(run.endDate + 'T00:00:00'), 'MMM d')})`
                      : run.title}
                  >
                    <span className={styles.eventBarIcon}>{run.icon}</span>
                    {participants && <span className={styles.eventBarParticipants}>{participants}</span>}
                    <span className={styles.eventBarTitle}>{run.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );

      day = addDays(day, 7);
    }
    return rows;
  };

  const renderDateDetailsModal = () => {
    if (!selectedDate) return null;

    const dayEvents = getEventsForDate(selectedDate);
    const dayBirthdays = getDayBirthdays(selectedDate);
    const dayEntries = getEntriesForDate(selectedDate);
    const dailyHoney = getDailyHoneyByChild(selectedDate);
    const dayHolidays = settings.showHolidays ? getHolidaysForDate(format(selectedDate, 'yyyy-MM-dd')) : [];

    return (
      <Modal 
        isOpen={!!selectedDate} 
        onClose={() => setSelectedDate(null)} 
        title={format(selectedDate, 'EEEE, MMMM d')}
      >
        <div className={styles.dateDetailsContent}>
          {dayHolidays.length > 0 && (
            <div className={styles.detailsSection}>
              <p className={styles.detailsLabel}>🇮🇱 Israeli Holidays</p>
              <div className={styles.detailsList}>
                {dayHolidays.map((holiday, idx) => (
                  <span key={idx} className={styles.holidayItem}>
                    {holiday.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {dayBirthdays.length > 0 && (
            <div className={styles.detailsSection}>
              <p className={styles.detailsLabel}>🎂 Birthdays</p>
              <div className={styles.detailsList}>
                {dayBirthdays.map((birthday) => (
                  <div key={birthday.id} className={styles.activityItem}>
                    <div className={styles.activityMain}>
                      <span>{birthday.avatar}</span>
                      <span>{birthday.icon}</span>
                      <span>{birthday.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dayEvents.length > 0 && (
            <div className={styles.detailsSection}>
              <p className={styles.detailsLabel}>🎉 Events</p>
              <div className={styles.detailsList}>
                {dayEvents.map((event) => {
                  const { participants, cleanNote } = extractParticipantsFromNote(event.note);
                  return (
                  <div key={event.id} className={`${styles.activityItem} ${(participants || cleanNote) ? styles.hasNote : ''}`}>
                    <div className={styles.activityMain}>
                      <span>{event.icon}</span>
                      {participants && <span className={styles.eventParticipantsModal}>{participants}</span>}
                      <span>{event.title}</span>
                    </div>
                    {cleanNote && <p className={styles.activityNote}>{cleanNote}</p>}
                    <div className={styles.eventActions}>
                      <button
                        onClick={() => {
                          setEditingEvent(event);
                          setEditEventDate(event.date);
                        }}
                        className={styles.editEventBtn}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${event.title}" event?`)) {
                            deleteEvent(event.id);
                          }
                        }}
                        className={styles.deleteEventBtn}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {Object.keys(dailyHoney).length > 0 && (
            <div className={styles.detailsSection}>
              <p className={styles.detailsLabel}>🍯 Honey Earned</p>
              <div className={styles.detailsList}>
                {Object.values(dailyHoney).map((data, idx) => (
                  <span 
                    key={idx} 
                    className={`${styles.detailItem} ${data.honey > 0 ? styles.honeyPositive : styles.honeyNegative}`}
                  >
                    {data.avatar} {data.name}: {data.honey > 0 ? '+' : ''}{data.honey}
                  </span>
                ))}
              </div>
            </div>
          )}

          {dayEntries.length > 0 && (
            <div className={styles.detailsSection}>
              <p className={styles.detailsLabel}>📝 Activities</p>
              <div className={styles.detailsList}>
                {dayEntries.map((entry) => {
                  const child = children.find((c) => c.id === entry.childId);
                  const isFamilyEntry = entry.type === 'family_activity';
                  const isActivity = entry.type === 'activity' || isFamilyEntry;
                  return (
                    <div key={entry.id} className={`${styles.activityItem} ${entry.note ? styles.hasNote : ''}`}>
                      <div className={styles.activityMain}>
                        <span>{isFamilyEntry ? '👨‍👩‍👧‍👦' : child?.avatar}</span>
                        {entry.imageUrl ? (
                          <img src={entry.imageUrl} alt="" className={styles.entryImage} />
                        ) : (
                          <span>{entry.icon}</span>
                        )}
                        {entry.sticker && (() => {
                          const sticker = STICKERS.find((s) => s.id === entry.sticker);
                          return sticker ? (
                            <img src={sticker.src} alt={sticker.label} title={sticker.label} className={styles.entryStickerImage} />
                          ) : null;
                        })()}
                        {!isActivity && entry.type !== 'gift' && (
                          <span className={entry.honey > 0 ? styles.honeyPositive : styles.honeyNegative}>
                            {entry.honey > 0 ? '+' : ''}{entry.honey}
                          </span>
                        )}
                      </div>
                      {entry.note && <p className={styles.activityNote}>{entry.note}</p>}
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this entry?')) {
                            deleteEntry(entry.id);
                          }
                        }}
                        className={styles.deleteActivityBtn}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {dayEvents.length === 0 && dayEntries.length === 0 && (
            <p className={styles.emptyDay}>No activities on this day</p>
          )}

          {children.length > 0 ? (
            <div className={styles.addActivityButtonWrapper}>
              <Button variant="accent" size="medium" fullWidth onClick={() => setShowAddEntry(true)}>
                + Add Entry
              </Button>
            </div>
          ) : (
            <p className={styles.emptyDay}>Add a Little Bee first to log activities</p>
          )}
        </div>
      </Modal>
    );
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <BeeMascot size="large" animate />
          <p>Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          ←
        </button>
        <div className={styles.monthNav}>
          <button
            className={styles.navButton}
            onClick={() => setCurrentMonth(viewMode === 'week' ? addDays(currentMonth, -7) : subMonths(currentMonth, 1))}
          >
            ‹
          </button>
          <h2 className={styles.monthTitle}>
            {viewMode === 'week'
              ? formatWeekRangeLabel(startOfWeek(currentMonth))
              : format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            className={styles.navButton}
            onClick={() => setCurrentMonth(viewMode === 'week' ? addDays(currentMonth, 7) : addMonths(currentMonth, 1))}
          >
            ›
          </button>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.viewModeToggle}>
            <button
              type="button"
              className={`${styles.viewModeButton} ${viewMode === 'month' ? styles.viewModeButtonActive : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              type="button"
              className={`${styles.viewModeButton} ${viewMode === 'week' ? styles.viewModeButtonActive : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
          </div>
          <button
            className={`${styles.holidayToggle} ${settings.showHolidays ? styles.holidayToggleActive : ''}`}
            onClick={() => setShowHolidays(!settings.showHolidays)}
            title="Show Israeli Holidays"
          >
            🇮🇱
          </button>
        </div>
      </div>

      <div className={`${styles.calendar} ${viewMode === 'week' ? styles.calendarWeekView : ''}`}>
        <div className={styles.weekHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className={styles.weekDay}>{day}</div>
          ))}
        </div>
        {renderCells()}
      </div>

      {children.length > 0 && (
        <div className={styles.monthlyStats}>
          <h3 className={styles.monthlyStatsTitle}>Monthly Totals</h3>
          <div className={styles.monthlyStatsGrid}>
            {children.map((child) => {
              const yearMonth = format(currentMonth, 'yyyy-MM');
              const monthlyHoney = getChildMonthlyHoney(child.id, yearMonth);
              return (
                <div key={child.id} className={styles.monthlyStatCard}>
                  <span className={styles.monthlyStatAvatar}>{child.avatar}</span>
                  <span className={styles.monthlyStatName}>{child.name}</span>
                  <span className={`${styles.monthlyStatHoney} ${monthlyHoney >= 0 ? styles.positive : styles.negative}`}>
                    {monthlyHoney > 0 ? '+' : ''}{monthlyHoney} 🍯
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {renderDateDetailsModal()}

      <Modal isOpen={showAddEntry} onClose={resetModal} title="Add Entry">
        <div className={styles.addActivityForm}>
          <div className={styles.entryTabs}>
            <button
              className={`${styles.entryTab} ${entryTab === 'activity' ? styles.entryTabActive : ''}`}
              onClick={() => { setEntryTab('activity'); clearIconSelection(); }}
            >
              <span>🎯</span>
              <span>Activity</span>
            </button>
            <button
              className={`${styles.entryTab} ${entryTab === 'good' ? styles.entryTabActive : ''}`}
              onClick={() => { setEntryTab('good'); clearIconSelection(); }}
            >
              <span>⭐</span>
              <span>Good</span>
            </button>
            <button
              className={`${styles.entryTab} ${entryTab === 'bad' ? styles.entryTabActive : ''}`}
              onClick={() => { setEntryTab('bad'); clearIconSelection(); }}
            >
              <span>💭</span>
              <span>Needs Work</span>
            </button>
            <button
              className={`${styles.entryTab} ${entryTab === 'gift' ? styles.entryTabActive : ''}`}
              onClick={() => { setEntryTab('gift'); clearIconSelection(); }}
            >
              <span>🎁</span>
              <span>Gift</span>
            </button>
            <button
              className={`${styles.entryTab} ${entryTab === 'event' ? styles.entryTabActive : ''}`}
              onClick={() => { setEntryTab('event'); setSelectedIcon(null); setSelectedChildIds([]); setIsFamilyActivity(false); }}
            >
              <span>🎉</span>
              <span>Event</span>
            </button>
          </div>

          {entryTab === 'event' ? (
            !selectedIcon ? (
              <div className={styles.addActivityForm}>
                <p className={styles.formHint}>Pick an icon</p>
                <div className={styles.iconGrid}>
                  {getIconsForTab().map((item) => (
                    <button
                      key={item.emoji}
                      className={`${styles.iconOption} ${selectedIcon === item.emoji ? styles.iconSelected : ''}`}
                      onClick={() => handleSelectIcon(item.emoji)}
                    >
                      <span className={styles.iconEmoji}>{item.emoji}</span>
                      <span className={styles.iconLabel}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.addActivityForm}>
                <div className={styles.selectedChildren}>
                  <span className={styles.selectedIconBadge}>{selectedIcon}</span>
                  <button
                    className={styles.changeChildBtn}
                    onClick={() => setSelectedIcon(null)}
                  >
                    Change
                  </button>
                </div>

                {(selectedIcon === '🏡' || selectedIcon === '✈️') ? (
                  <>
                    <div className={styles.noteSection}>
                      <label className={styles.noteLabel}>Title</label>
                      <input
                        type="text"
                        className={styles.noteInput}
                        placeholder={selectedIcon === '🏡' ? 'Day Off' : 'Trip'}
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                      />
                    </div>

                    <div className={styles.dayOffDateRow}>
                      <div className={styles.dayOffDateGroup}>
                        <label className={styles.noteLabel}>From</label>
                        <input
                          type="date"
                          className={styles.noteInput}
                          value={format(selectedDate, 'yyyy-MM-dd')}
                          disabled
                        />
                      </div>
                      <div className={styles.dayOffDateGroup}>
                        <label className={styles.noteLabel}>To (optional)</label>
                        <input
                          type="date"
                          className={styles.noteInput}
                          value={dayOffEndDate}
                          min={format(selectedDate, 'yyyy-MM-dd')}
                          onChange={(e) => setDayOffEndDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className={styles.noteSection}>
                      <label className={styles.noteLabel}>Who? (optional)</label>
                      <div className={styles.participantsPicker}>
                        <button
                          type="button"
                          className={`${styles.participantBtn} ${eventParticipants.includes('family') ? styles.participantSelected : ''}`}
                          onClick={() => toggleEventParticipant('family')}
                        >
                          👨‍👩‍👧‍👦
                        </button>
                        <button
                          type="button"
                          className={`${styles.participantBtn} ${eventParticipants.includes('mom') ? styles.participantSelected : ''}`}
                          onClick={() => toggleEventParticipant('mom')}
                        >
                          👩
                        </button>
                        <button
                          type="button"
                          className={`${styles.participantBtn} ${eventParticipants.includes('dad') ? styles.participantSelected : ''}`}
                          onClick={() => toggleEventParticipant('dad')}
                        >
                          👨
                        </button>
                        {children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            className={`${styles.participantBtn} ${eventParticipants.includes(child.id) ? styles.participantSelected : ''}`}
                            onClick={() => toggleEventParticipant(child.id)}
                          >
                            {child.avatar}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.noteSection}>
                      <label className={styles.noteLabel}>Note (optional)</label>
                      <textarea
                        className={styles.noteInput}
                        placeholder={selectedIcon === '🏡' ? 'Reason for day off...' : 'Trip details...'}
                        value={entryNote}
                        onChange={(e) => setEntryNote(e.target.value)}
                        rows={2}
                      />
                    </div>

                    <Button 
                      variant="primary" 
                      size="large" 
                      fullWidth 
                      onClick={handleAddEntry}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : (selectedIcon === '🏡' ? 'Add Day Off' : 'Add Trip')}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className={styles.noteSection}>
                      <label className={styles.noteLabel}>Event name</label>
                      <input
                        type="text"
                        className={styles.noteInput}
                        placeholder="Vacation, Birthday, Trip..."
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                      />
                    </div>

                    <div className={styles.noteSection}>
                      <label className={styles.noteLabel}>Who? (optional)</label>
                      <div className={styles.participantsPicker}>
                        <button
                          type="button"
                          className={`${styles.participantBtn} ${eventParticipants.includes('family') ? styles.participantSelected : ''}`}
                          onClick={() => toggleEventParticipant('family')}
                        >
                          👨‍👩‍👧‍👦
                        </button>
                        <button
                          type="button"
                          className={`${styles.participantBtn} ${eventParticipants.includes('mom') ? styles.participantSelected : ''}`}
                          onClick={() => toggleEventParticipant('mom')}
                        >
                          👩
                        </button>
                        <button
                          type="button"
                          className={`${styles.participantBtn} ${eventParticipants.includes('dad') ? styles.participantSelected : ''}`}
                          onClick={() => toggleEventParticipant('dad')}
                        >
                          👨
                        </button>
                        {children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            className={`${styles.participantBtn} ${eventParticipants.includes(child.id) ? styles.participantSelected : ''}`}
                            onClick={() => toggleEventParticipant(child.id)}
                          >
                            {child.avatar}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.noteSection}>
                      <label className={styles.noteLabel}>Note (optional)</label>
                      <textarea
                        className={styles.noteInput}
                        placeholder="Any details..."
                        value={entryNote}
                        onChange={(e) => setEntryNote(e.target.value)}
                        rows={2}
                      />
                    </div>

                    <Button 
                      variant="primary" 
                      size="large" 
                      fullWidth 
                      onClick={handleAddEntry}
                      disabled={!eventTitle.trim() || saving}
                    >
                      {saving ? 'Saving...' : 'Add Event'}
                    </Button>
                  </>
                )}
              </div>
            )
          ) : selectedChildIds.length === 0 && !isFamilyActivity ? (
            <div className={styles.childPicker}>
              <p className={styles.formHint}>Who?</p>
              <div className={styles.multiSelectPicker}>
                {entryTab === 'activity' && children.length > 1 && (
                  <button
                    className={styles.familyOption}
                    onClick={() => setIsFamilyActivity(true)}
                  >
                    <span>👨‍👩‍👧‍👦</span>
                    <span>Family</span>
                  </button>
                )}
                {children.map((child) => (
                  <button
                    key={child.id}
                    className={styles.multiSelectOption}
                    onClick={() => setSelectedChildIds([child.id])}
                  >
                    <span>{child.avatar}</span>
                    <span>{child.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : !selectedIcon ? (
            <div className={styles.addActivityForm}>
              <div className={styles.selectedChildren}>
                <span className={styles.selectedChildBadge}>
                  {isFamilyActivity ? '👨‍👩‍👧‍👦 Family' : children.find((c) => c.id === selectedChildIds[0])?.avatar}
                </span>
                <button
                  className={styles.changeChildBtn}
                  onClick={() => {
                    setSelectedChildIds([]);
                    setIsFamilyActivity(false);
                  }}
                >
                  Change
                </button>
              </div>

              {entryTab === 'good' && (
                <p className={styles.honeyHint}>+5 🍯 per action</p>
              )}
              {entryTab === 'bad' && (
                <p className={styles.honeyHint} style={{ color: 'var(--color-coral)' }}>-2 🍯 per action</p>
              )}

              <div className={styles.iconGrid}>
                {getIconsForTab().map((item) => (
                  <button
                    key={item.emoji}
                    className={`${styles.iconOption} ${selectedIcon === item.emoji ? styles.iconSelected : ''}`}
                    onClick={() => handleSelectIcon(item.emoji)}
                  >
                    <span className={styles.iconEmoji}>{item.emoji}</span>
                    <span className={styles.iconLabel}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.addActivityForm}>
              <div className={styles.selectedChildren}>
                <span className={styles.selectedChildBadge}>
                  {isFamilyActivity ? '👨‍👩‍👧‍👦' : children.find((c) => c.id === selectedChildIds[0])?.avatar}
                </span>
                <span className={styles.selectedIconBadge}>{selectedIcon}</span>
                <button
                  className={styles.changeChildBtn}
                  onClick={clearIconSelection}
                >
                  Change
                </button>
              </div>

              {selectedIconIsLego ? (
                <>
                  <div className={styles.noteSection}>
                    <label className={styles.noteLabel}>Lego set ID</label>
                    <div className={styles.legoLookupRow}>
                      <input
                        type="text"
                        className={styles.noteInput}
                        style={{ minHeight: 'auto' }}
                        placeholder="e.g. 75192"
                        value={legoSetId}
                        onChange={(e) => setLegoSetId(e.target.value)}
                      />
                      <Button
                        variant="secondary"
                        size="medium"
                        onClick={handleLegoLookup}
                        disabled={legoStatus === 'loading' || !legoSetId.trim()}
                      >
                        {legoStatus === 'loading' ? 'Looking up...' : 'Look up'}
                      </Button>
                    </div>
                    {legoStatus === 'error' && <p className={styles.legoError}>{legoError}</p>}
                    {legoResult && (
                      <div className={styles.legoPreview}>
                        <img
                          src={legoResult.imageUrl}
                          alt={`Lego set ${legoResult.setId}`}
                          className={styles.legoPreviewImage}
                        />
                        <div className={styles.legoPreviewInfo}>
                          <p className={styles.legoPreviewName}>Set {legoResult.setId}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.noteSection}>
                    <label className={styles.noteLabel}>Add a note (optional)</label>
                    <textarea
                      className={styles.noteInput}
                      placeholder="Who gave it, where it's from..."
                      value={entryNote}
                      onChange={(e) => setEntryNote(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="large"
                    fullWidth
                    onClick={handleAddEntry}
                    disabled={saving || !legoResult}
                  >
                    {saving ? 'Saving...' : 'Add Lego Gift'}
                  </Button>
                </>
              ) : (
                <>
                  {entryTab === 'good' && (
                    <div className={styles.noteSection}>
                      <label className={styles.noteLabel}>Fun sticker (optional)</label>
                      <div className={styles.stickerPicker}>
                        {STICKERS.map((sticker) => (
                          <button
                            key={sticker.id}
                            type="button"
                            className={`${styles.stickerOption} ${selectedSticker === sticker.id ? styles.stickerSelected : ''}`}
                            onClick={() => setSelectedSticker(selectedSticker === sticker.id ? null : sticker.id)}
                            title={sticker.label}
                          >
                            <img src={sticker.src} alt={sticker.label} className={styles.stickerImg} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={styles.noteSection}>
                    <label className={styles.noteLabel}>Add a note (optional)</label>
                    <textarea
                      className={styles.noteInput}
                      placeholder="What happened? Any details..."
                      value={entryNote}
                      onChange={(e) => setEntryNote(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button variant="primary" size="large" fullWidth onClick={handleAddEntry} disabled={saving}>
                    {saving ? 'Saving...' : 'Add Entry'}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal 
        isOpen={!!editingEvent} 
        onClose={() => setEditingEvent(null)} 
        title="Edit Event Date"
      >
        {editingEvent && (() => {
          const relatedEvents = getRelatedEvents(editingEvent);
          const isMultiDay = relatedEvents.length > 1;
          const startDate = relatedEvents[0]?.date;
          const endDate = relatedEvents[relatedEvents.length - 1]?.date;
          
          return (
            <div className={styles.addActivityForm}>
              <div className={styles.selectedChildren}>
                <span className={styles.selectedIconBadge}>{editingEvent.icon}</span>
                <span>{editingEvent.title}</span>
              </div>
              
              {isMultiDay && (
                <p className={styles.eventRangeInfo}>
                  Current: {format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d, yyyy')} ({relatedEvents.length} days)
                </p>
              )}
              
              <div className={styles.noteSection}>
                <label className={styles.noteLabel}>{isMultiDay ? 'New start date' : 'New date'}</label>
                <input
                  type="date"
                  className={styles.noteInput}
                  value={editEventDate}
                  onChange={(e) => setEditEventDate(e.target.value)}
                  style={{ minHeight: 'auto' }}
                />
              </div>

              {isMultiDay && editEventDate && editEventDate !== startDate && (
                <p className={styles.eventRangeInfo}>
                  New: {format(new Date(editEventDate), 'MMM d')} - {format(addDays(new Date(editEventDate), relatedEvents.length - 1), 'MMM d, yyyy')}
                </p>
              )}

              <Button 
                variant="primary" 
                size="large" 
                fullWidth 
                disabled={saving}
                onClick={async () => {
                  const currentStart = relatedEvents[0]?.date;
                  if (editEventDate && editEventDate !== currentStart) {
                    setSaving(true);
                    try {
                      await updateEventRange(editingEvent, editEventDate);
                      setSelectedDate(new Date(editEventDate));
                      setEditingEvent(null);
                    } finally {
                      setSaving(false);
                    }
                  } else {
                    setEditingEvent(null);
                  }
                }}
              >
                {saving ? 'Saving...' : (isMultiDay ? `Move ${relatedEvents.length} Days` : 'Update Date')}
              </Button>

              <Button 
                variant="secondary" 
                size="medium" 
                fullWidth 
                disabled={saving}
                onClick={async () => {
                  const confirmMsg = isMultiDay 
                    ? `Delete all ${relatedEvents.length} days of "${editingEvent.title}"?`
                    : `Delete "${editingEvent.title}"?`;
                  if (window.confirm(confirmMsg)) {
                    setSaving(true);
                    try {
                      if (isMultiDay) {
                        await deleteEventRange(editingEvent);
                      } else {
                        await deleteEvent(editingEvent.id);
                      }
                      setEditingEvent(null);
                      setSelectedDate(null);
                    } finally {
                      setSaving(false);
                    }
                  }
                }}
                style={{ marginTop: 'var(--spacing-sm)', color: '#FF7A7A' }}
              >
                {saving ? 'Deleting...' : (isMultiDay ? `Delete All ${relatedEvents.length} Days` : 'Delete Event')}
              </Button>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
