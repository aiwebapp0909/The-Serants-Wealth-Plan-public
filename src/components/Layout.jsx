import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'home' },
  { path: '/budget', label: 'Budget', icon: 'grid_view' },
  { path: '/analytics', label: 'Analytics', icon: 'trending_up' },
  { path: '/goals', label: 'Goals', icon: 'flag' },
  { path: '/invest', label: 'Invest', icon: 'show_chart' },
  { path: '/tools', label: 'Tools', icon: 'construction' },
]

export default function Layout({ children }) {
  const location = useLocation()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant z-50">
        <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-2">
          {navItems.map(({ path, label, icon }) => {
            const isActive = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path)
            return (
              <NavLink
                key={path}
                to={path}
                className="flex flex-col items-center gap-0.5 flex-1 py-2"
              >
                <div className={`relative flex flex-col items-center`}>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute -inset-x-3 -inset-y-1 bg-primary/15 rounded-xl"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span
                    className={`material-symbols-outlined text-xl relative z-10 ${isActive ? 'text-primary' : 'text-gray-500'}`}
                    style={{ fontSize: '20px' }}
                  >
                    {icon}
                  </span>
                  <span className={`text-[9px] font-body font-medium relative z-10 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                    {label.toUpperCase()}
                  </span>
                </div>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
