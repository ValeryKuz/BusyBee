import PropTypes from 'prop-types';
import { differenceInDays, parseISO, format } from 'date-fns';
import styles from './EventCountdown.module.css';

export const EventCountdown = ({ event }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = parseISO(event.date);
  const daysLeft = differenceInDays(eventDate, today);

  const getExcitementLevel = () => {
    if (daysLeft <= 1) return 'imminent';
    if (daysLeft <= 3) return 'soon';
    if (daysLeft <= 7) return 'close';
    return 'normal';
  };

  const renderMoons = () => {
    if (daysLeft === 0) {
      return <span className={styles.todayText}>🎉 Today! 🎉</span>;
    }
    
    if (daysLeft <= 10) {
      return (
        <div className={styles.moonsRow}>
          {Array.from({ length: daysLeft }).map((_, i) => (
            <span key={i} className={styles.moon} style={{ animationDelay: `${i * 0.1}s` }}>
              🌙
            </span>
          ))}
        </div>
      );
    }
    
    return (
      <div className={styles.moonsRow}>
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className={styles.moon} style={{ animationDelay: `${i * 0.1}s` }}>
            🌙
          </span>
        ))}
        <span className={styles.moreMoons}>+{daysLeft - 7}</span>
      </div>
    );
  };

  const getSleepsText = () => {
    if (daysLeft === 0) return '';
    if (daysLeft === 1) return '1 sleep';
    if (daysLeft <= 10) return `${daysLeft} sleeps`;
    return 'Many sleeps';
  };

  return (
    <div className={`${styles.card} ${styles[getExcitementLevel()]}`}>
      <div className={styles.iconWrapper}>
        <span className={styles.icon}>{event.icon}</span>
      </div>
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{event.title}</h3>
          <span className={styles.date}>{format(eventDate, 'MMM d, yyyy')}</span>
        </div>
        {event.note && <p className={styles.note}>{event.note}</p>}
        <div className={styles.countdown}>
          {renderMoons()}
          {daysLeft > 0 && <span className={styles.sleepsText}>{getSleepsText()}</span>}
        </div>
      </div>
    </div>
  );
};

EventCountdown.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    note: PropTypes.string,
  }).isRequired,
};
