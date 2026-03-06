import { useState, useEffect } from 'react';
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
import { BEHAVIOR_ICONS, ENTRY_TYPES, EVENT_ICONS } from '../../utils/constants';
import styles from './Calendar.module.css';

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
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [selectedChildIds, setSelectedChildIds] = useState([]);
  const [isFamilyActivity, setIsFamilyActivity] = useState(false);
  const [entryTab, setEntryTab] = useState('activity');
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [entryNote, setEntryNote] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [dayOffEndDate, setDayOffEndDate] = useState('');
  const [eventParticipants, setEventParticipants] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editEventDate, setEditEventDate] = useState('');
  const [saving, setSaving] = useState(false);

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
      } else {
        const type = entryTab === 'good' ? ENTRY_TYPES.GOOD : ENTRY_TYPES.BAD;
        for (const childId of selectedChildIds) {
          await addEntry(childId, type, selectedIcon, dateStr, entryNote);
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
    setEntryNote('');
    setEventTitle('');
    setDayOffEndDate('');
    setEventParticipants([]);
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
    if (entryTab === 'event') return EVENT_ICONS;
    return BEHAVIOR_ICONS.activity;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayEvents = getEventsForDate(day);
        const dayBirthdays = getDayBirthdays(day);
        const dayEntries = getEntriesForDate(day);
        const dayActivities = dayEntries.filter((e) => e.type === 'activity' || e.type === 'family_activity');
        const dailyHoney = getDailyHoneyByChild(day);
        const dayHolidays = settings.showHolidays ? getHolidaysForDate(format(day, 'yyyy-MM-dd')) : [];
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, today);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isHoliday = dayHolidays.length > 0;

        days.push(
          <div
            key={day.toString()}
            onClick={() => isCurrentMonth && setSelectedDate(cloneDay)}
            className={`${styles.cell} ${!isCurrentMonth ? styles.disabled : ''} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''} ${isHoliday ? styles.holiday : ''}`}
          >
            <span className={`${styles.dayNumber} ${isToday ? styles.todayNumber : ''}`}>
              {format(day, 'd')}
            </span>

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

            {dayEvents.length > 0 && (
              <div className={styles.dayEvents}>
                {dayEvents.slice(0, 2).map((event) => {
                  const { participants } = extractParticipantsFromNote(event.note);
                  return (
                    <div key={event.id} className={styles.eventItem}>
                      <div className={styles.eventIconWrapper}>
                        {participants && <span className={styles.eventParticipants}>{participants}</span>}
                        <span className={styles.eventIcon}>{event.icon}</span>
                      </div>
                      <span className={styles.eventTitle}>{event.title}</span>
                    </div>
                  );
                })}
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
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className={styles.row}>
          {days}
        </div>
      );
      days = [];
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
                        <span>{entry.icon}</span>
                        {!isActivity && (
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
          <button className={styles.navButton} onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            ‹
          </button>
          <h2 className={styles.monthTitle}>
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button className={styles.navButton} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            ›
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

      <div className={styles.calendar}>
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
              onClick={() => { setEntryTab('activity'); setSelectedIcon(null); }}
            >
              <span>🎯</span>
              <span>Activity</span>
            </button>
            <button
              className={`${styles.entryTab} ${entryTab === 'good' ? styles.entryTabActive : ''}`}
              onClick={() => { setEntryTab('good'); setSelectedIcon(null); }}
            >
              <span>⭐</span>
              <span>Good</span>
            </button>
            <button
              className={`${styles.entryTab} ${entryTab === 'bad' ? styles.entryTabActive : ''}`}
              onClick={() => { setEntryTab('bad'); setSelectedIcon(null); }}
            >
              <span>💭</span>
              <span>Needs Work</span>
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
                  onClick={() => setSelectedIcon(null)}
                >
                  Change
                </button>
              </div>

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
