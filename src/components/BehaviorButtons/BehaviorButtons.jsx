import { useState } from 'react';
import PropTypes from 'prop-types';
import { useHive } from '../../hooks/useHive';
import { BEHAVIOR_ICONS, ENTRY_TYPES } from '../../utils/constants';
import styles from './BehaviorButtons.module.css';

export const BehaviorButtons = ({ childId }) => {
  const { addEntry } = useHive();
  const [activeTab, setActiveTab] = useState('good');
  const [lastAdded, setLastAdded] = useState(null);

  const handleIconClick = (item, type) => {
    addEntry(childId, type, item.emoji);
    setLastAdded({ ...item, type: activeTab });
    setTimeout(() => setLastAdded(null), 1500);
  };

  const getItems = () => {
    if (activeTab === 'good') return BEHAVIOR_ICONS.good;
    if (activeTab === 'bad') return BEHAVIOR_ICONS.bad;
    return BEHAVIOR_ICONS.activity;
  };

  const getEntryType = () => {
    if (activeTab === 'good') return ENTRY_TYPES.GOOD;
    if (activeTab === 'bad') return ENTRY_TYPES.BAD;
    return ENTRY_TYPES.ACTIVITY;
  };

  const getFeedbackText = (item) => {
    if (item.type === 'good') return `${item.label} +5 🍯`;
    if (item.type === 'bad') return `${item.label} -2 🍯`;
    return `${item.label} logged!`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'good' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('good')}
        >
          <span className={styles.tabIcon}>⭐</span>
          <span className={styles.tabLabel}>Good!</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'bad' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('bad')}
        >
          <span className={styles.tabIcon}>💭</span>
          <span className={styles.tabLabel}>Needs Work</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'activity' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <span className={styles.tabIcon}>🎯</span>
          <span className={styles.tabLabel}>Activity</span>
        </button>
      </div>

      <div className={styles.iconsGrid}>
        {getItems().map((item) => (
          <button
            key={item.emoji}
            className={`${styles.iconButton} ${lastAdded?.emoji === item.emoji ? styles.iconAdded : ''}`}
            onClick={() => handleIconClick(item, getEntryType())}
          >
            <span className={styles.icon}>{item.emoji}</span>
            <span className={styles.label}>{item.label}</span>
          </button>
        ))}
      </div>

      {lastAdded && (
        <div className={`${styles.feedback} ${styles[lastAdded.type] || styles.activity}`}>
          <span className={styles.feedbackIcon}>{lastAdded.emoji}</span>
          <span className={styles.feedbackText}>{getFeedbackText(lastAdded)}</span>
        </div>
      )}
    </div>
  );
};

BehaviorButtons.propTypes = {
  childId: PropTypes.string.isRequired,
};
