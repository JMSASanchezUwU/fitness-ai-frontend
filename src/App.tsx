import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ConfirmProvider } from './components/ui/ConfirmDialog';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DashboardPage } from './pages/DashboardPage';
import { WorkoutsPage } from './pages/WorkoutsPage';
import { SchedulePage } from './pages/SchedulePage';
import { SettingsPage } from './pages/SettingsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/layout/Layout';

function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <Router>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<DashboardPage />} />
                <Route path="workouts" element={<WorkoutsPage />} />
                <Route path="schedule" element={<SchedulePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Router>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(12px)',
              color: '#e2e8f0',
              border: '1px solid rgba(51, 65, 85, 0.5)',
              borderRadius: '16px',
              padding: '14px 18px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            },
            success: {
              iconTheme: { primary: '#22d3ee', secondary: '#0f172a' },
              duration: 3000,
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#0f172a' },
              duration: 4000,
            },
          }}
        />
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default App;

