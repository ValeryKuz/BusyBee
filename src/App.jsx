import { Routes, Route } from 'react-router-dom';
import { HiveProvider } from './context/HiveContext';
import { LockScreen } from './components/LockScreen';
import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { Calendar } from './pages/Calendar';
import { Kids } from './pages/Kids';

function App() {
  return (
    <LockScreen>
      <HiveProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/kids" element={<Kids />} />
        </Routes>
      </HiveProvider>
    </LockScreen>
  );
}

export default App;
