import PropTypes from 'prop-types';
import styles from './BeeCard.module.css';

export const BeeCard = ({ child, onClick, isSelected = false, todayHoney = 0 }) => {
  return (
    <button
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      onClick={() => onClick?.(child)}
    >
      <div className={styles.avatarWrapper}>
        <span className={styles.avatar}>{child.avatar}</span>
      </div>
      <h3 className={styles.name}>{child.name}</h3>
      <div className={styles.honeyBadge}>
        <span className={styles.honeyIcon}>🍯</span>
        <span className={styles.honeyCount}>{todayHoney}</span>
      </div>
    </button>
  );
};

BeeCard.propTypes = {
  child: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired,
  }).isRequired,
  onClick: PropTypes.func,
  isSelected: PropTypes.bool,
  todayHoney: PropTypes.number,
};
