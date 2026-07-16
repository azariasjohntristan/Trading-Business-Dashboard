import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import Analytics from '@/pages/Analytics';
import Trades from '@/pages/Trades';
import ImportPage from '@/pages/Import';
import Accounts from '@/pages/Accounts';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/trades" element={<Trades />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
