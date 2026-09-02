import { useHive } from '../../hooks/useHive';
import { Toast } from '../ui';

// Renders any action-failure error as a dismissible toast on every page.
// The initial-load failure is handled separately as a full-page state
// (see Dashboard.jsx) since there's nothing to show without data yet.
export const GlobalErrorToast = () => {
  const { error, clearError, loadFailed } = useHive();

  if (loadFailed) return null;

  return <Toast message={error} onDismiss={clearError} />;
};
