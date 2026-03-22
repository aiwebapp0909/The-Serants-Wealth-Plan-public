import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

function Slider({ label, value, min, max, step, unit, onChange }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-body text-gray-400">{label}</span>
        <span className="text-sm font-headline font-bold text-primary">
          {unit === '$' ? `$${value.toLocaleString()}` : `${value}${unit}`}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none bg-surface-container-high cursor-pointer"
          style={{
            background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${((value - min) / (max - min)) * 100}%, #2A2A35 ${((value - min) / (max - min)) * 100}%, #2A2A35 100%)`
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-body text-gray-600">{unit === '$' ? `$${min.toLocaleString()}` : `${min}${unit}`}</span>
        <span className="text-[9px] font-body text-gray-600">{unit === '$' ? `$${max.toLocaleString()}` : `${max}${unit}`}</span>
      </div>
    </div>
  )
}

export default function Invest() {
  const [monthly, setMonthly] = useState(2500)
  const [rate, setRate] = useState(8)
  const [years, setYears] = useState(30)

  const { data, finalValue, totalInvested, totalReturns, milestone } = useMemo(() => {
    const monthlyRate = rate / 100 / 12
    const months = years * 12
    const data = []

    let value = 0
    for (let y = 0; y <= years; y++) {
      const m = y * 12
      const fv = monthly * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) || 0
      data.push({
        year: y === 0 ? 'Now' : `${y}Y`,
        value: Math.round(fv),
        invested: monthly * m,
      })
    }

    const finalValue = data[data.length - 1]?.value || 0
    const totalInvested = monthly * months
    const totalReturns = finalValue - totalInvested

    // Find milestone year for $20M
    let milestone = null
    for (let y = 0; y <= 50; y++) {
      const m = y * 12
      const fv = monthly * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) || 0
      if (fv >= 20_000_000) {
        milestone = y
        break
      }
    }

    return { data, finalValue, totalInvested, totalReturns, milestone }
  }, [monthly, rate, years])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-surface border border-outline-variant rounded-xl p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-primary text-xs font-body">Value: {fmt(payload[0]?.value || 0)}</p>
        <p className="text-gray-400 text-xs font-body">Invested: {fmt(payload[1]?.value || 0)}</p>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen px-4 pt-5 pb-4">
      <div className="mb-5">
        <h1 className="font-headline font-bold text-on-surface text-2xl">Investment Projection</h1>
        <p className="text-gray-500 text-xs font-body mt-1">See your path to $20M and beyond</p>
      </div>

      {/* Sliders */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-outline-variant rounded-2xl p-5 mb-4"
      >
        <Slider label="Monthly Investment" value={monthly} min={500} max={10000} step={100} unit="$" onChange={setMonthly} />
        <Slider label="Annual Return Rate" value={rate} min={5} max={15} step={0.5} unit="%" onChange={setRate} />
        <Slider label="Time Period" value={years} min={1} max={40} step={1} unit=" years" onChange={setYears} />
      </motion.div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Final Value', value: fmt(finalValue), color: 'text-primary' },
          { label: 'Total Invested', value: fmt(totalInvested), color: 'text-on-surface' },
          { label: 'Total Returns', value: fmt(totalReturns), color: 'text-success' },
        ].map(({ label, value, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-outline-variant rounded-2xl p-3 text-center"
          >
            <p className={`font-headline font-bold text-base ${color} leading-tight`}>{value}</p>
            <p className="text-gray-500 text-[9px] font-body uppercase tracking-wider mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* $20M Milestone */}
      {milestone !== null && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 mb-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-amber-400 text-xl">emoji_events</span>
          </div>
          <div>
            <p className="font-headline font-bold text-amber-400 text-sm">$20M Milestone</p>
            <p className="text-gray-400 text-xs font-body mt-0.5">
              At this rate, you'll reach $20M in <span className="text-amber-400 font-bold">{milestone} years</span> 🎯
            </p>
          </div>
        </motion.div>
      )}

      {finalValue < 20_000_000 && milestone === null && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 mb-4"
        >
          <p className="text-secondary text-xs font-body">
            Increase your monthly investment or time horizon to reach the $20M goal. Try investing $5,000+/month at 10% for 40 years.
          </p>
        </motion.div>
      )}

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface border border-outline-variant rounded-2xl p-4"
      >
        <p className="text-[9px] font-body font-semibold tracking-widest text-gray-500 uppercase mb-4">Growth Projection</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5D5FEF" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#5D5FEF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333340" />
            <XAxis dataKey="year" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false}
              interval={Math.max(0, Math.floor(data.length / 8))} />
            <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(0)}M` : `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="value" name="Portfolio Value" stroke="#D4AF37" strokeWidth={2} fill="url(#valueGrad)" dot={false} />
            <Area type="monotone" dataKey="invested" name="Amount Invested" stroke="#5D5FEF" strokeWidth={1.5} fill="url(#investedGrad)" strokeDasharray="4 4" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 justify-center mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-1 rounded-sm bg-primary" />
            <span className="text-gray-500 text-[10px] font-body">Portfolio Value</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-0.5 rounded-sm bg-secondary border-t border-dashed border-secondary" />
            <span className="text-gray-500 text-[10px] font-body">Amount Invested</span>
          </div>
        </div>
      </motion.div>

      {/* AI Insight */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-surface border border-outline-variant rounded-2xl p-4 mt-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-secondary text-base">psychology</span>
          <p className="text-xs font-body font-semibold text-gray-400 uppercase tracking-wider">Wealth Insight</p>
        </div>
        <p className="text-gray-300 text-xs font-body leading-relaxed">
          Investing <span className="text-primary font-bold">${monthly.toLocaleString()}/month</span> at{' '}
          <span className="text-primary font-bold">{rate}%</span> return over{' '}
          <span className="text-primary font-bold">{years} years</span> will grow your portfolio to{' '}
          <span className="text-success font-bold">{fmt(finalValue)}</span>.{' '}
          Your investment grows <span className="text-success font-bold">{totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(0) : 0}%</span> beyond what you put in — that's the power of compound interest.
        </p>
      </motion.div>
    </div>
  )
}
