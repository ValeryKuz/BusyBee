import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { useHive } from '../../hooks/useHive';
import { BeeMascot } from '../../components/BeeMascot';
import { Button, Modal } from '../../components/ui';
import { EventCountdown } from '../../components/EventCountdown';
import { EVENT_ICONS } from '../../utils/constants';
import { getLocalDate } from '../../utils/dateUtils';
import styles from './Events.module.css';

export const Events = () => {
  const navigate = useNavigate();
  const { addEvent, deleteEvent, getRelatedEvents, updateEventRange, deleteEventRange, getUpcomingEvents, loading } = useHive();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventIcon, setNewEventIcon] = useState(EVENT_ICONS[0].emoji);
  const [newEventNote, setNewEventNote] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const [editEventDate, setEditEventDate] = useState('');
  const [saving, setSaving] = useState(false);

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

  const handleDeleteEvent = (event) => {
    setEventToDelete(event);
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      deleteEvent(eventToDelete.id);
      setEventToDelete(null);
    }
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
                <div className={styles.eventActions}>
                  <button
                    className={styles.editButton}
                    onClick={() => {
                      setEditingEvent(event);
                      setEditEventDate(event.date);
                    }}
                    aria-label="Edit event"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteEvent(event)}
                    aria-label="Delete event"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
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

      <Modal isOpen={!!eventToDelete} onClose={() => setEventToDelete(null)} title="Delete Event?">
        <div className={styles.deleteConfirm}>
          <span className={styles.deleteIcon}>{eventToDelete?.icon}</span>
          <p className={styles.deleteText}>
            Are you sure you want to delete <strong>{eventToDelete?.title}</strong>?
          </p>
          <div className={styles.deleteButtons}>
            <Button variant="ghost" size="medium" onClick={() => setEventToDelete(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="medium" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
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
            <div className={styles.addForm}>
              <div className={styles.editEventHeader}>
                <span className={styles.editEventIcon}>{editingEvent.icon}</span>
                <span className={styles.editEventTitle}>{editingEvent.title}</span>
              </div>
              
              {isMultiDay && (
                <p className={styles.eventRangeInfo}>
                  Current: {format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d, yyyy')} ({relatedEvents.length} days)
                </p>
              )}
              
              <div className={styles.formGroup}>
                <label className={styles.label}>{isMultiDay ? 'New start date' : 'New date'}</label>
                <input
                  type="date"
                  className={styles.input}
                  value={editEventDate}
                  onChange={(e) => setEditEventDate(e.target.value)}
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
