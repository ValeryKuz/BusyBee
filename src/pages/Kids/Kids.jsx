import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHive } from '../../hooks/useHive';
import { BeeMascot } from '../../components/BeeMascot';
import { KIDS_ACTIVITIES, ENTRY_TYPES } from '../../utils/constants';
import styles from './Kids.module.css';

export const Kids = () => {
  const navigate = useNavigate();
  const { children, addEntry, loading } = useHive();
  const [selectedChild, setSelectedChild] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleActivityTap = async (activity) => {
    if (!selectedChild) return;
    
    await addEntry(selectedChild.id, ENTRY_TYPES.GOOD, activity.emoji);
    setFeedback(activity);
    
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleBack = () => {
    setSelectedChild(null);
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
          <BeeMascot size="medium" animate />
          <h1 className={styles.title}>Who are you?</h1>
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
          {KIDS_ACTIVITIES.map((activity) => (
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
