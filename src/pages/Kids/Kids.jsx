import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHive } from '../../hooks/useHive';
import { BeeMascot } from '../../components/BeeMascot';
import {
  KIDS_ACTIVITY_MODES,
  KIDS_ACTIVITIES_MORNING,
  KIDS_ACTIVITIES_GENERAL,
  KIDS_ACTIVITIES_EVENING,
  ENTRY_TYPES,
} from '../../utils/constants';
import styles from './Kids.module.css';

const getActivitiesForMode = (mode) => {
  switch (mode) {
    case 'morning': return KIDS_ACTIVITIES_MORNING;
    case 'evening': return KIDS_ACTIVITIES_EVENING;
    default: return KIDS_ACTIVITIES_GENERAL;
  }
};

export const Kids = () => {
  const navigate = useNavigate();
  const { children, addEntry, loading } = useHive();
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleActivityTap = async (activity) => {
    if (!selectedChild) return;
    
    await addEntry(selectedChild.id, ENTRY_TYPES.GOOD, activity.emoji);
    setFeedback(activity);
    
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleBack = () => {
    if (selectedMode) {
      setSelectedMode(null);
    } else {
      setSelectedChild(null);
    }
    setFeedback(null);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <BeeMascot size="large" animate />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <BeeMascot size="large" animate />
          <h1>No Little Bees Yet!</h1>
          <p>Ask a parent to add you first.</p>
        </div>
      </div>
    );
  }

  if (!selectedChild) {
    return (
      <div className={styles.page}>
        <button className={styles.backButtonTop} onClick={() => navigate('/')}>
          ←
        </button>
        <div className={styles.selectScreen}>
          <div className={styles.selectHeader}>            
            <BeeMascot size="medium" animate />
            <h1 className={styles.title}>Who are you?</h1>
          </div>
          <div className={styles.avatarGrid}>
            {children.map((child) => (
              <button
                key={child.id}
                className={styles.avatarButton}
                onClick={() => setSelectedChild(child)}
              >
                <span className={styles.avatar}>{child.avatar}</span>
                <span className={styles.name}>{child.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedMode) {
    return (
      <div className={styles.page}>
        <div className={styles.modeScreen}>
          <button className={styles.backButton} onClick={handleBack}>
            ← Back
          </button>
          
          <div className={styles.modeHeader}>
            <span className={styles.selectedAvatar}>{selectedChild.avatar}</span>
            <h1 className={styles.greeting}>Hi, {selectedChild.name}!</h1>
            <p className={styles.subtitle}>When is it?</p>
          </div>

          <div className={styles.modeGrid}>
            {KIDS_ACTIVITY_MODES.map((mode) => (
              <button
                key={mode.id}
                className={`${styles.modeButton} ${styles[`mode_${mode.id}`]}`}
                onClick={() => setSelectedMode(mode.id)}
              >
                <span className={styles.modeIcon}>{mode.emoji}</span>
                <span className={styles.modeLabel}>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activities = getActivitiesForMode(selectedMode);

  return (
    <div className={styles.page}>
      <div className={styles.activityScreen}>
        <button className={styles.backButton} onClick={handleBack}>
          ← Back
        </button>
        
        <div className={styles.header}>
          <span className={styles.selectedAvatar}>{selectedChild.avatar}</span>
          <h1 className={styles.greeting}>Hi, {selectedChild.name}!</h1>
          <p className={styles.subtitle}>What did you do?</p>
        </div>

        <div className={styles.activitiesGrid}>
          {activities.map((activity) => (
            <button
              key={activity.emoji}
              className={styles.activityButton}
              onClick={() => handleActivityTap(activity)}
            >
              <span className={styles.activityIcon}>{activity.emoji}</span>
              <span className={styles.activityLabel}>{activity.label}</span>
            </button>
          ))}
        </div>

        {feedback && (
          <div className={styles.feedback}>
            <div className={styles.feedbackContent}>
              <span className={styles.feedbackIcon}>{feedback.emoji}</span>
              <span className={styles.feedbackText}>Great job! +5 🍯</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
