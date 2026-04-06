import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { id: 'profile', label: 'Profile', icon: 'person' },
  { id: 'categories', label: 'Categories', icon: 'label' },
  { id: 'tools', label: 'Tools', icon: 'build' },
  { id: 'preferences', label: 'Preferences', icon: 'tune' },
  { id: 'security', label: 'Security', icon: 'shield' },
]

const TRANSACTION_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍕', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' },
  { name: 'Groceries', icon: '🛒', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
  { name: 'Transportation', icon: '🚗', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  { name: 'Shopping', icon: '🛍️', color: 'bg-pink-500/10 text-pink-500 border-pink-500/30' },
  { name: 'Health & Fitness', icon: '💪', color: 'bg-red-500/10 text-red-500 border-red-500/30' },
  { name: 'Entertainment', icon: '🎮', color: 'bg-violet-500/10 text-violet-500 border-violet-500/30' },
  { name: 'Income', icon: '💰', color: 'bg-success/10 text-success border-success/30' },
  { name: 'Bills & Utilities', icon: '⚡', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
  { name: 'Subscriptions', icon: '📺', color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' },
  { name: 'Housing', icon: '🏠', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  { name: 'Insurance', icon: '🛡️', color: 'bg-sky-500/10 text-sky-500 border-sky-500/30' },
  { name: 'Travel', icon: '✈️', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30' },
  { name: 'Cash', icon: '💵', color: 'bg-lime-500/10 text-lime-500 border-lime-500/30' },
  { name: 'Other', icon: '📋', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
]

const TOOLS = [
  {
    name: 'Mortgage Calculator',
    description: 'Calculate monthly payments, total interest, and amortization for any mortgage.',
    icon: 'home',
    color: 'from-amber-600 to-amber-400',
    status: 'Coming Soon',
  },
  {
    name: 'Investment Calculator',
    description: 'Project compound growth on your investments with detailed projections over time.',
    icon: 'show_chart',
    color: 'from-emerald-600 to-emerald-400',
    status: 'Coming Soon',
  },
  {
    name: 'Tax Estimator',
    description: 'Estimate federal and state tax liability based on your income and deductions.',
    icon: 'receipt_long',
    color: 'from-blue-600 to-blue-400',
    status: 'Coming Soon',
  },
  {
    name: 'Debt Payoff Planner',
    description: 'Compare snowball vs avalanche strategies to become debt-free faster.',
    icon: 'credit_card_off',
    color: 'from-red-600 to-red-400',
    status: 'Coming Soon',
  },
]

function ProfileTab() {
  const { user, logout } = useAuth()
  const [firstName, setFirstName] = useState(user?.displayName?.split(' ')[0] || '')
  const [lastName, setLastName] = useState(user?.displayName?.split(' ').slice(1).join(' ') || '')

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="bg-surface-container border border-outline-variant rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary/30 to-amber-500/30 flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-primary text-3xl">person</span>
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-background text-xs">photo_camera</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 font-body">Click the camera icon to change your photo</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1.5">First Name</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name"
              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm font-body text-on-surface outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1.5">Last Name</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name"
              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm font-body text-on-surface outline-none focus:border-primary" />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email</label>
          <input value={user?.email || ''} disabled
            className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm font-body text-gray-500 outline-none opacity-60" />
        </div>
        <button className="bg-primary text-background px-6 py-2.5 rounded-xl text-sm font-body font-bold hover:bg-primary/90 transition-colors">
          Save Profile
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-error/5 border border-error/20 rounded-2xl p-6">
        <h3 className="font-headline font-bold text-error text-sm mb-2">Danger Zone</h3>
        <p className="text-xs text-gray-500 font-body mb-4">Logging out will end your session. Your data is safe and will be here when you come back.</p>
        <button onClick={logout} className="bg-error/10 border border-error/20 text-error px-6 py-2.5 rounded-xl text-sm font-body font-bold hover:bg-error/20 transition-colors">
          Log Out
        </button>
      </div>
    </div>
  )
}

function CategoriesTab() {
  return (
    <div className="bg-surface-container border border-outline-variant rounded-2xl p-6">
      <h3 className="font-headline font-bold text-on-surface text-lg mb-1">Transaction Categories</h3>
      <p className="text-xs text-gray-500 font-body mb-4">These categories auto-tag your transactions</p>
      <div className="flex flex-wrap gap-2">
        {TRANSACTION_CATEGORIES.map(cat => (
          <span key={cat.name} className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${cat.color}`}>
            <span>{cat.icon}</span>
            {cat.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function ToolsTab() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-headline font-bold text-on-surface text-lg mb-1">Financial Tools</h3>
        <p className="text-xs text-gray-500 font-body mb-4">Powerful calculators to plan your financial future</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TOOLS.map((tool, i) => (
          <motion.div
            key={tool.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-surface-container border border-outline-variant rounded-2xl p-5 hover:border-primary/30 transition-all group cursor-pointer"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${tool.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                <span className="material-symbols-outlined text-white text-lg">{tool.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-headline font-bold text-on-surface text-sm">{tool.name}</h4>
                <p className="text-[10px] font-body text-gray-500 mt-0.5">{tool.description}</p>
              </div>
            </div>
            <span className="inline-block text-[9px] font-body font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
              {tool.status}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function PreferencesTab() {
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(false)

  return (
    <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-5">
      <h3 className="font-headline font-bold text-on-surface text-lg mb-2">Preferences</h3>

      {[
        { label: 'Dark Mode', desc: 'Use dark theme throughout the app', value: darkMode, set: setDarkMode },
        { label: 'Push Notifications', desc: 'Get budget alerts and goal reminders', value: notifications, set: setNotifications },
        { label: 'Weekly Email Report', desc: 'Receive a weekly financial summary', value: weeklyReport, set: setWeeklyReport },
      ].map(pref => (
        <div key={pref.label} className="flex items-center justify-between py-2 border-b border-outline-variant/30 last:border-0">
          <div>
            <p className="text-sm font-body text-on-surface font-medium">{pref.label}</p>
            <p className="text-[10px] text-gray-500 font-body">{pref.desc}</p>
          </div>
          <button
            onClick={() => pref.set(!pref.value)}
            className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${pref.value ? 'bg-primary' : 'bg-gray-600'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 shadow ${pref.value ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
          </button>
        </div>
      ))}
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-5">
      <h3 className="font-headline font-bold text-on-surface text-lg mb-2">Security</h3>
      <div className="space-y-4">
        {[
          { label: 'Authentication', value: 'Google SSO', icon: 'verified_user', color: 'text-success' },
          { label: 'Encryption', value: 'AES-256 / TLS 1.3', icon: 'lock', color: 'text-primary' },
          { label: 'Data Storage', value: 'Firebase Firestore (encrypted)', icon: 'database', color: 'text-secondary' },
          { label: 'Bank Connection', value: 'Plaid (bank-level security)', icon: 'account_balance', color: 'text-amber-500' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3 py-2 border-b border-outline-variant/30 last:border-0">
            <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-body text-on-surface font-medium">{item.label}</p>
              <p className="text-[10px] text-gray-500 font-body">{item.value}</p>
            </div>
            <span className="material-symbols-outlined text-success text-sm">check_circle</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileTab />
      case 'categories': return <CategoriesTab />
      case 'tools': return <ToolsTab />
      case 'preferences': return <PreferencesTab />
      case 'security': return <SecurityTab />
      default: return <ProfileTab />
    }
  }

  return (
    <div className="bg-background min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-outline-variant">
        <div className="px-4 py-4">
          <h1 className="font-headline font-bold text-on-surface text-2xl">Settings</h1>
          <p className="text-gray-500 text-xs font-body mt-0.5">Manage your profile, categories, and preferences</p>
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col lg:flex-row gap-4">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-surface border border-outline-variant rounded-2xl p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-body font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                    ? 'bg-primary text-background'
                    : 'text-gray-400 hover:text-on-surface hover:bg-surface-container'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Help & Logout (desktop sidebar) */}
          <div className="hidden lg:block mt-4 bg-surface border border-outline-variant rounded-2xl p-2 space-y-1">
            <button className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-body text-gray-400 hover:text-on-surface hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined text-lg">help</span>
              Help
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
