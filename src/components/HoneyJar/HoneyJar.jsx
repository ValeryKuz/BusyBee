import PropTypes from 'prop-types';
import styles from './HoneyJar.module.css';

export const HoneyJar = ({ honey = 0, maxHoney = 100 }) => {
  const fillPercent = Math.min(Math.max((honey / maxHoney) * 100, 0), 100);

  const getLevel = () => {
    if (fillPercent >= 80) return 'amazing';
    if (fillPercent >= 50) return 'great';
    if (fillPercent >= 25) return 'good';
    return 'start';
  };

  return (
    <div className={styles.container}>
      <div className={styles.jar}>
        <div className={styles.jarBody}>
          <div
            className={`${styles.honey} ${styles[getLevel()]}`}
            style={{ '--fill-percent': `${fillPercent}%` }}
          >
            <div className={styles.honeyWave}></div>
          </div>
          <div className={styles.shine}></div>
        </div>
        <div className={styles.lid}></div>
      </div>
      <div className={styles.stats}>
        <span className={styles.count}>{honey}</span>
        <span className={styles.label}>honey points</span>
      </div>
      <div className={styles.message}>
        {fillPercent >= 80 && '🌟 Amazing job!'}
        {fillPercent >= 50 && fillPercent < 80 && '⭐ Keep it up!'}
        {fillPercent >= 25 && fillPercent < 50 && '💪 Good progress!'}
        {fillPercent < 25 && '🐝 Let\'s collect honey!'}
      </div>
    </div>
  );
};

HoneyJar.propTypes = {
  honey: PropTypes.number,
  maxHoney: PropTypes.number,
};
