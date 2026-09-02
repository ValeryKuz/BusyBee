import { useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './Toast.module.css';

export const Toast = ({ message, onDismiss, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, onDismiss, duration]);

  if (!message) return null;

  return (
    <div className={styles.toast} role="alert">
      <span className={styles.icon}>⚠️</span>
      <span className={styles.message}>{message}</span>
      <button className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string,
  onDismiss: PropTypes.func.isRequired,
  duration: PropTypes.number,
};
