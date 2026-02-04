import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHive } from '../../hooks/useHive';
import { BeeMascot } from '../../components/BeeMascot';
import { Button, Modal } from '../../components/ui';
import { EventCountdown } from '../../components/EventCountdown';
import { EVENT_ICONS } from '../../utils/constants';
import { getLocalDate } from '../../utils/dateUtils';
import styles from './Events.module.css';

export const Events = () => {
  const navigate = useNavigate();
  const { addEvent, deleteEvent, getUpcomingEvents, loading } = useHive();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventIcon, setNewEventIcon] = useState(EVENT_ICONS[0].emoji);
  const [newEventNote, setNewEventNote] = useState('');

  const upcomingEvents = getUpcomingEvents();
  const today = getLocalDate();

  const handleAddEvent = () => {
    if (newEventTitle.trim() && newEventDate) {
      addEvent(newEventTitle.trim(), newEventDate, newEventIcon, newEventNote.trim());
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventIcon(EVENT_ICONS[0].emoji);
      setNewEventNote('');
      setShowAddEvent(false);
    }
  };

  const handleDeleteEvent = (id) => {
    deleteEvent(id);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <BeeMascot size="large" animate />
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          ←
        </button>
        <h1 className={styles.title}>🎉 Exciting Events!</h1>
        <Button variant="accent" size="small" onClick={() => setShowAddEvent(true)}>
          + Add
        </Button>
      </header>

      <main className={styles.main}>
        {upcomingEvents.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🗓️</span>
            <p className={styles.emptyText}>No events planned yet!</p>
            <Button variant="primary" onClick={() => setShowAddEvent(true)}>
              Add something exciting! 🎈
            </Button>
          </div>
        ) : (
          <div className={styles.eventsList}>
            {upcomingEvents.map((event) => (
              <div key={event.id} className={styles.eventCard}>
                <EventCountdown event={event} />
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteEvent(event.id)}
                  aria-label="Delete event"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <section className={styles.visualSection}>
            <h2 className={styles.sectionTitle}>Coming Up Next!</h2>
            <div className={styles.visualTimeline}>
              {upcomingEvents.slice(0, 5).map((event, index) => (
                <div
                  key={event.id}
                  className={styles.timelineItem}
                  style={{ '--delay': `${index * 0.1}s` }}
                >
                  <div className={styles.timelineDot}></div>
                  <div className={styles.timelineCard}>
                    <span className={styles.timelineIcon}>{event.icon}</span>
                    <span className={styles.timelineTitle}>{event.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Modal isOpen={showAddEvent} onClose={() => setShowAddEvent(false)} title="Add Exciting Event">
        <div className={styles.addForm}>
          <div className={styles.formGroup}>
            <label className={styles.label}>What&apos;s happening?</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Birthday party, Beach trip..."
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>When?</label>
            <input
              type="date"
              className={styles.input}
              min={today}
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Pick a picture</label>
            <div className={styles.iconGrid}>
              {EVENT_ICONS.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  type="button"
                  className={`${styles.iconOption} ${newEventIcon === emoji ? styles.iconSelected : ''}`}
                  onClick={() => setNewEventIcon(emoji)}
                  title={label}
                >
                  <span className={styles.iconEmoji}>{emoji}</span>
                  <span className={styles.iconLabel}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Note (optional)</label>
            <textarea
              className={styles.textarea}
              placeholder="Any details about this event..."
              value={newEventNote}
              onChange={(e) => setNewEventNote(e.target.value)}
              rows={2}
            />
          </div>

          <Button variant="primary" size="large" fullWidth onClick={handleAddEvent}>
            Add Event 🎉
          </Button>
        </div>
      </Modal>
    </div>
  );
};
