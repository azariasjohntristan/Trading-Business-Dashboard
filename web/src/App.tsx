import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import TradingCalendarPage from '@/pages/TradingCalendar';
import Analytics from '@/pages/Analytics';
import Trades from '@/pages/Trades';
import ImportPage from '@/pages/Import';
import Accounts from '@/pages/Accounts';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendar" element={<TradingCalendarPage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
