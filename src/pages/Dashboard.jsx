import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const wealthData = [
  { month: 'Jan', value: 42000 },
  { month: 'Feb', value: 45500 },
  { month: 'Mar', value: 43200 },
  { month: 'Apr', value: 51000 },
  { month: 'May', value: 58700 },
  { month: 'Jun', value: 62400 },
  { month: 'Jul', value: 71000 },
  { month: 'Aug', value: 69500 },
  { month: 'Sep', value: 78200 },
  { month: 'Oct', value: 82000 },
  { month: 'Nov', value: 89300 },
  { month: 'Dec', value: 95800 },
]

const stats = [
  { label: 'Total Wealth', value: '$95,800', change: '+14.2%', icon: 'account_balance' },
  { label: 'Monthly Income', value: '$8,400', change: '+5.1%', icon: 'trending_up' },
  { label: 'Investments', value: '$62,300', change: '+22.7%', icon: 'show_chart' },
  { label: 'Savings Rate', value: '34%', change: '+3.2%', icon: 'savings' },
]

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface">
            The Serants Wealth Plan
          </h1>
          <p className="text-gray-400 mt-1 font-body">Your path to financial sovereignty</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">person</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface rounded-2xl p-5 border border-outline-variant"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-body">{stat.label}</span>
              <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg">{stat.icon}</span>
              </div>
            </div>
            <div className="text-2xl font-headline font-bold text-on-surface">{stat.value}</div>
            <div className="text-success text-sm mt-1 font-body">{stat.change} this year</div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-surface rounded-3xl p-6 border border-outline-variant mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">Wealth Growth</h2>
            <p className="text-gray-400 text-sm font-body mt-1">12-month trajectory</p>
          </div>
          <span className="bg-surface-container text-primary text-xs font-body px-3 py-1 rounded-full">
            2024
          </span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={wealthData}>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333340" />
            <XAxis dataKey="month" stroke="#666" tick={{ fill: '#999', fontSize: 12 }} />
            <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#15151C', border: '1px solid #333340', borderRadius: 12 }}
              labelStyle={{ color: '#fff' }}
              formatter={v => [`$${v.toLocaleString()}`, 'Net Worth']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#D4AF37"
              strokeWidth={2}
              fill="url(#goldGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Plan Milestones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-surface rounded-3xl p-6 border border-outline-variant"
      >
        <h2 className="font-headline text-xl font-bold text-on-surface mb-5">Wealth Milestones</h2>
        <div className="space-y-4">
          {[
            { label: 'Emergency Fund (6 months)', progress: 100, done: true },
            { label: 'Debt Freedom', progress: 78, done: false },
            { label: '$100K Net Worth', progress: 95, done: false },
            { label: 'Investment Portfolio Goal', progress: 62, done: false },
          ].map((m) => (
            <div key={m.label}>
              <div className="flex justify-between text-sm font-body mb-1">
                <span className={m.done ? 'text-success' : 'text-gray-300'}>{m.label}</span>
                <span className="text-gray-400">{m.progress}%</span>
              </div>
              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${m.progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
                  className={`h-full rounded-full ${m.done ? 'bg-success' : 'bg-primary'}`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
