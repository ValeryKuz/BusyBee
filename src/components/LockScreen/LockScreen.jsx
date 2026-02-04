import { useState, useEffect } from 'react';
import { BeeMascot } from '../BeeMascot';
import styles from './LockScreen.module.css';

const SESSION_KEY = 'busybee_session';
const ENV_PASSWORD = import.meta.env.VITE_APP_PASSWORD;

export const LockScreen = ({ children }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ENV_PASSWORD) {
      setIsLocked(false);
      return;
    }
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session === 'unlocked') {
      setIsLocked(false);
    }
  }, []);

  const handleUnlock = (e) => {
    e.preventDefault();
    setError('');

    if (password === ENV_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'unlocked');
      setIsLocked(false);
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsLocked(true);
    setPassword('');
  };

  if (!ENV_PASSWORD) {
    return children;
  }

  if (!isLocked) {
    return (
      <>
        {children}
        <button className={styles.lockButton} onClick={handleLock} title="Lock app">
          🔒
        </button>
      </>
    );
  }

  return (
    <div className={styles.lockScreen}>
      <div className={styles.lockCard}>
        <BeeMascot size="large" animate />
        <h1 className={styles.title}>BusyBee</h1>
        <p className={styles.subtitle}>Enter password to continue</p>

        <form onSubmit={handleUnlock} className={styles.form}>
          <input
            type="password"
            className={styles.input}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.unlockButton}>
            🔓 Unlock
          </button>
        </form>
      </div>
    </div>
  );
};
