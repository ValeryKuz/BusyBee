import { Routes, Route } from 'react-router-dom';
import { HiveProvider } from './context/HiveContext';
import { AuthGuard } from './components/AuthGuard';
import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { Calendar } from './pages/Calendar';
import { Kids } from './pages/Kids';
import { Auth } from './pages/Auth';
import { GlobalErrorToast } from './components/GlobalErrorToast';

function App() {
  return (
    <HiveProvider>
      <GlobalErrorToast />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
        <Route
          path="/events"
          element={
            <AuthGuard>
              <Events />
            </AuthGuard>
          }
        />
        <Route
          path="/calendar"
          element={
            <AuthGuard>
              <Calendar />
            </AuthGuard>
          }
        />
        <Route
          path="/kids"
          element={
            <AuthGuard>
              <Kids />
            </AuthGuard>
          }
        />
      </Routes>
    </HiveProvider>
  );
}

export default App;
