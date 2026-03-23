import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { projectToGoal } from '../lib/projection'

function fmt(n) {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
}

export default function WealthProjection({ totalInvesting, netWorth, totalSavings }) {
  const monthlyInvestment = totalInvesting + totalSavings
  const [sliderValue, setSliderValue] = useState(monthlyInvestment || 2500)
  const [age] = useState(30) // Could be pulled from user profile

  const projection = useMemo(() => {
    return projectToGoal(sliderValue, age, 65, netWorth || 0)
  }, [sliderValue, age, netWorth])

  const percentFilled = Math.min(projection.percentToGoal, 100)

  return (
    <div className="bg-surface border border-outline-variant rounded-2xl p-5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 opacity-5 p-5">
        <span className="material-symbols-outlined text-6xl font-bold">trending_up</span>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between mb-5">
        <div>
          <p className="text-[8px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1">
            $20M Wealth Goal
          </p>
          <div className="flex items-end gap-2 mb-2">
            <h2 className="font-headline font-bold text-on-surface text-4xl">
              {fmt(projection.projectedValue)}
            </h2>
            <p className="text-gray-500 text-sm font-body mb-1">/ {fmt(projection.goal)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-body font-bold px-2 py-1 rounded-full ${
                projection.onTrack
                  ? 'bg-success/10 text-success'
                  : 'bg-amber-500/10 text-amber-500'
              }`}
            >
              {projection.onTrack ? '✅ ON TRACK' : '⚠️ OFF TRACK'}
            </span>
            <span className="text-[10px] font-body text-gray-500">
              {projection.percentToGoal}% complete
            </span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[8px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1">
            Time to Goal
          </p>
          <p className="font-headline font-bold text-on-surface text-2xl">
            {projection.years}
          </p>
          <p className="text-[9px] font-body text-gray-500">years</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5 bg-surface-container-high rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentFilled}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className={`h-full rounded-full ${
            projection.onTrack
              ? 'bg-gradient-to-r from-primary to-success'
              : 'bg-gradient-to-r from-amber-500 to-primary'
          }`}
        />
      </div>

      {/* Monthly investment slider */}
      <div className="mb-5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[9px] font-body font-bold text-gray-500 uppercase tracking-widest">
            Monthly Investment
          </label>
          <span className="font-headline font-bold text-primary text-sm">
            {fmt(sliderValue)}
          </span>
        </div>
        <input
          type="range"
          min="500"
          max="20000"
          step="100"
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
        />
        <div className="flex items-center justify-between text-[9px] font-body text-gray-500">
          <span>$500</span>
          <span>$20k</span>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-2 border-t border-outline-variant/50 pt-4">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-primary mt-0.5 text-lg flex-shrink-0">
            {projection.onTrack ? 'check_circle' : 'info'}
          </span>
          <div>
            <p className="text-[10px] font-body font-bold text-on-surface uppercase tracking-tight">
              {projection.message}
            </p>
            <p className="text-[9px] font-body text-gray-500 mt-1">
              At {fmt(sliderValue)}/month for {projection.years} years,
              <br />
              with 10% annual returns.
            </p>
          </div>
        </div>

        {!projection.onTrack && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-3">
            <p className="text-[10px] font-body text-on-surface mb-1">
              💡 <span className="font-bold">To stay on track:</span>
            </p>
            <p className="text-[9px] font-body text-gray-500">
              Invest {fmt(projection.requiredMonthly)}/month
              ({fmt(projection.requiredMonthly - sliderValue)} more)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
