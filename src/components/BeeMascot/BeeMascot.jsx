import PropTypes from 'prop-types';
import styles from './BeeMascot.module.css';

export const BeeMascot = ({ size = 'medium', message, animate = true }) => {
  return (
    <div className={styles.container}>
      <div className={`${styles.bee} ${styles[size]} ${animate ? styles.animated : ''}`}>
        🐝
      </div>
      {message && (
        <div className={styles.speechBubble}>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
};

BeeMascot.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  message: PropTypes.string,
  animate: PropTypes.bool,
};
