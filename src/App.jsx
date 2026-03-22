import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Budget from './pages/Budget'
import Analytics from './pages/Analytics'
import Goals from './pages/Goals'
import Invest from './pages/Invest'
import Security from './pages/Security'
import Transactions from './pages/Transactions'
import Login from './pages/Login'
import { useEffect, useRef } from 'react'

function AppContent() {
  const { user, loading, logout } = useAuth()
  const timerRef = useRef(null)

  // 🛡️ ZERO-TRUST INACTIVITY PROTECTION (15 MIN)
  useEffect(() => {
    if (!user) return;
    
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        console.warn('Inactivity Timeout. Forced Logout for Security.');
        logout();
      }, 15 * 60 * 1000); // 15 Min Lockout
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [user, logout]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="font-body text-gray-500 font-medium tracking-tight">Syncing fintech environment...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    )
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/invest" element={<Invest />} />
          <Route path="/security" element={<Security />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  )
}
