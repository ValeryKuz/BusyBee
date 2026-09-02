import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHive } from '../../hooks/useHive';
import { usePendingAction } from '../../hooks/usePendingAction';
import { useLongPress } from '../../hooks/useLongPress';
import { BeeMascot } from '../../components/BeeMascot';
import { getLocalDate } from '../../utils/dateUtils';
import {
  KIDS_ACTIVITY_MODES,
  KIDS_ACTIVITIES_MORNING,
  KIDS_ACTIVITIES_GENERAL,
  KIDS_ACTIVITIES_EVENING,
  KIDS_ACTIVITIES_FOOD,
  ENTRY_TYPES,
} from '../../utils/constants';
import styles from './Kids.module.css';

const getActivitiesForMode = (mode) => {
  switch (mode) {
    case 'morning': return KIDS_ACTIVITIES_MORNING;
    case 'evening': return KIDS_ACTIVITIES_EVENING;
    case 'food': return KIDS_ACTIVITIES_FOOD;
    default: return KIDS_ACTIVITIES_GENERAL;
  }
};

export const Kids = () => {
  const navigate = useNavigate();
  const { children, entries, addEntry, loading } = useHive();
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [pendingActivity, runActivity] = usePendingAction();

  const completedActivities = useMemo(() => {
    if (!selectedChild || !selectedMode) return new Set();
    const today = getLocalDate();
    return new Set(
      entries
        .filter((e) => e.childId === selectedChild.id && e.date === today && e.note === selectedMode)
        .map((e) => e.icon)
    );
  }, [entries, selectedChild, selectedMode]);

  const handleActivityTap = (activity) => {
    if (!selectedChild || completedActivities.has(activity.emoji)) return;

    runActivity(activity.emoji, async () => {
      const isFood = selectedMode === 'food';
      const type = isFood ? ENTRY_TYPES.FOOD : ENTRY_TYPES.GOOD;
      await addEntry(selectedChild.id, type, activity.emoji, null, selectedMode, isFood ? 0 : undefined);
      setFeedback(activity);
      setTimeout(() => setFeedback(null), 2000);
    });
  };

  const handleBack = () => {
    if (selectedMode) {
      setSelectedMode(null);
    } else {
      setSelectedChild(null);
    }
    setFeedback(null);
  };

  const exitToDashboard = useLongPress(() => navigate('/'), { duration: 2000 });

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
        <button
          className={`${styles.backButtonTop} ${exitToDashboard.pressing ? styles.backButtonTopHolding : ''}`}
          {...exitToDashboard.handlers}
          title="Hold for 2 seconds to leave Kids mode"
        >
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
          <p className={styles.subtitle}>{selectedMode === 'food' ? 'What did you eat?' : 'What did you do?'}</p>
        </div>

        <div className={styles.activitiesGrid}>
          {activities.map((activity) => {
            const isCompleted = completedActivities.has(activity.emoji);
            const isPending = pendingActivity === activity.emoji;
            return (
              <button
                key={activity.emoji}
                className={`${styles.activityButton} ${isCompleted ? styles.activityButtonDone : ''}`}
                onClick={() => handleActivityTap(activity)}
                disabled={isCompleted || isPending}
              >
                <span className={styles.activityIcon}>{activity.emoji}</span>
                <span className={styles.activityLabel}>{activity.label}</span>
                {isCompleted && <span className={styles.activityCheck}>✓</span>}
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className={styles.feedback}>
            <div className={styles.feedbackContent}>
              <span className={styles.feedbackIcon}>{feedback.emoji}</span>
              <span className={styles.feedbackText}>{selectedMode === 'food' ? 'Logged! 🍽️' : 'Great job! +5 🍯'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
