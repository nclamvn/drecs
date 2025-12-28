// ═══════════════════════════════════════════════════════════════
//                    DRECS - Command Dashboard App
// ═══════════════════════════════════════════════════════════════

import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Overview } from '@/pages/Overview';
import { MapView } from '@/pages/MapView';
import { RescueListPage } from '@/pages/RescueListPage';
import { TeamsPage } from '@/pages/TeamsPage';
import { DronesPage } from '@/pages/DronesPage';
import { SettingsPage } from '@/pages/SettingsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Overview />} />
        <Route path="map" element={<MapView />} />
        <Route path="rescue" element={<RescueListPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="drones" element={<DronesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
