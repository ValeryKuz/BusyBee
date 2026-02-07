import { Navigate } from 'react-router-dom';
import { useHive } from '../../hooks/useHive';
import { BeeMascot } from '../BeeMascot';
import styles from './AuthGuard.module.css';

export const AuthGuard = ({ children }) => {
  const { user, authLoading } = useHive();

  if (authLoading) {
    return (
      <div className={styles.loading}>
        <BeeMascot size="large" animate />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};
