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
import { BEHAVIOR_ICONS, ENTRY_TYPES, EVENT_ICONS, BIRTHDAY_ICONS } from '../../utils/constants';
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
    birthdays, 
    addBirthday, 
    deleteBirthday, 
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
  const [birthdayName, setBirthdayName] = useState('');

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
    const monthDay = format(date, 'MM-dd');
    return (birthdays || []).filter((b) => b.date === monthDay);
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

  const handleAddEntry = () => {
    if (!selectedDate || !selectedIcon) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    if (entryTab === 'event') {
      if (eventTitle.trim()) {
        addEvent(eventTitle.trim(), dateStr, selectedIcon, entryNote);
      }
    } else if (entryTab === 'birthday') {
      if (birthdayName.trim()) {
        const monthDay = format(selectedDate, 'MM-dd');
        addBirthday(birthdayName.trim(), monthDay, selectedIcon, entryNote);
      }
    } else if (entryTab === 'activity') {
      if (isFamilyActivity) {
        addFamilyActivity(selectedIcon, dateStr, entryNote);
      } else if (selectedChildIds.length > 0) {
        selectedChildIds.forEach((childId) => {
          addEntry(childId, ENTRY_TYPES.ACTIVITY, selectedIcon, dateStr, entryNote);
        });
      }
    } else {
      const type = entryTab === 'good' ? ENTRY_TYPES.GOOD : ENTRY_TYPES.BAD;
      selectedChildIds.forEach((childId) => {
        addEntry(childId, type, selectedIcon, dateStr, entryNote);
      });
    }
    
    resetModal();
  };

  const resetModal = () => {
    setShowAddEntry(false);
    setSelectedChildIds([]);
    setIsFamilyActivity(false);
    setEntryTab('activity');
    setSelectedIcon(null);
    setEntryNote('');
    setEventTitle('');
    setBirthdayName('');
  };

  const getIconsForTab = () => {
    if (entryTab === 'good') return BEHAVIOR_ICONS.good;
    if (entryTab === 'bad') return BEHAVIOR_ICONS.bad;
    if (entryTab === 'event') return EVENT_ICONS;
    if (entryTab === 'birthday') return BIRTHDAY_ICONS;
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
                {dayEvents.slice(0, 2).map((event) => (
                  <div key={event.id} className={styles.eventItem}>
                    <span className={styles.eventIcon}>{event.icon}</span>
                    <span className={styles.eventTitle}>{event.title}</span>
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
                  <div key={birthday.id} className={`${styles.activityItem} ${birthday.note ? styles.hasNote : ''}`}>
                    <div className={styles.activityMain}>
                      <span>{birthday.icon}</span>
                      <span>{birthday.name}</span>
                    </div>
                    {birthday.note && <p className={styles.activityNote}>{birthday.note}</p>}
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ${birthday.name}'s birthday?`)) {
                          deleteBirthday(birthday.id);
                        }
                      }}
                      className={styles.deleteActivityBtn}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dayEvents.length > 0 && (
            <div className={styles.detailsSection}>
              <p className={styles.detailsLabel}>🎉 Events</p>
              <div className={styles.detailsList}>
                {dayEvents.map((event) => (
                  <span key={event.id} className={styles.detailItem}>
                    {event.icon} {event.title}
                  </span>
                ))}
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
            <button
              className={`${styles.entryTab} ${entryTab === 'birthday' ? styles.entryTabActive : ''}`}
              onClick={() => { setEntryTab('birthday'); setSelectedIcon(null); setSelectedChildIds([]); setIsFamilyActivity(false); }}
            >
              <span>🎂</span>
              <span>Birthday</span>
            </button>
          </div>

          {entryTab === 'birthday' ? (
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

                <div className={styles.noteSection}>
                  <label className={styles.noteLabel}>Whose birthday?</label>
                  <input
                    type="text"
                    className={styles.noteInput}
                    placeholder="Name..."
                    value={birthdayName}
                    onChange={(e) => setBirthdayName(e.target.value)}
                  />
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

                <p className={styles.formHint}>🔄 Repeats every year on this date</p>

                <Button 
                  variant="primary" 
                  size="large" 
                  fullWidth 
                  onClick={handleAddEntry}
                  disabled={!birthdayName.trim()}
                >
                  Add Birthday
                </Button>
              </div>
            )
          ) : entryTab === 'event' ? (
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
                  disabled={!eventTitle.trim()}
                >
                  Add Event
                </Button>
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

              <Button variant="primary" size="large" fullWidth onClick={handleAddEntry}>
                Add Entry
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
