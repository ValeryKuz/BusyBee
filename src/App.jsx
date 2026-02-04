import { Routes, Route } from 'react-router-dom';
import { HiveProvider } from './context/HiveContext';
import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { Calendar } from './pages/Calendar';

function App() {
  return (
    <HiveProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/events" element={<Events />} />
        <Route path="/calendar" element={<Calendar />} />
      </Routes>
    </HiveProvider>
  );
}

export default App;
