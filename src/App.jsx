import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Budget from './pages/Budget'
import Analytics from './pages/Analytics'
import Goals from './pages/Goals'
import Invest from './pages/Invest'
import Tools from './pages/Tools'

export default function App() {
  return (
    <AppProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/invest" element={<Invest />} />
            <Route path="/tools" element={<Tools />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  )
}
