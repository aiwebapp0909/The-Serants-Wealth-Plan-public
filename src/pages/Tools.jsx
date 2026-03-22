import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'

function fmt(n) {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function InputField({ label, value, onChange, type = 'number', prefix, suffix, step }) {
  return (
    <div>
      <label className="text-[9px] font-body text-gray-500 uppercase tracking-wider block mb-1">{label}</label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-gray-500 text-sm">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          step={step}
          className={`w-full bg-surface-container border border-outline-variant rounded-xl py-2.5 text-sm font-body text-on-surface outline-none focus:border-primary transition-colors ${prefix ? 'pl-7' : 'pl-4'} ${suffix ? 'pr-7' : 'pr-4'}`}
        />
        {suffix && <span className="absolute right-3 text-gray-500 text-sm">{suffix}</span>}
      </div>
    </div>
  )
}

function ResultRow({ label, value, color = 'text-on-surface', bold = false }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-outline-variant/40 last:border-0">
      <span className="text-xs font-body text-gray-400">{label}</span>
      <span className={`text-sm font-body ${bold ? 'font-bold' : 'font-medium'} ${color}`}>{value}</span>
    </div>
  )
}

// Federal tax brackets 2024
const federalBrackets = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
]

function calcFederal(income) {
  let tax = 0
  for (const b of federalBrackets) {
    if (income > b.min) {
      tax += (Math.min(income, b.max) - b.min) * b.rate
    }
  }
  return tax
}

function TaxEstimator() {
  const [income, setIncome] = useState(80000)
  const [incomeType, setIncomeType] = useState('W2')
  const [state, setState] = useState(5)
  const [filingStatus, setFilingStatus] = useState('single')

  const results = useMemo(() => {
    const inc = Number(income) || 0
    const standardDeduction = filingStatus === 'married' ? 29200 : 14600
    const taxableIncome = Math.max(0, inc - standardDeduction)

    const federal = calcFederal(taxableIncome)
    const stateT = inc * (Number(state) / 100)
    const selfEmp = incomeType === '1099' ? inc * 0.1413 : 0
    const total = federal + stateT + selfEmp
    const net = inc - total
    const effectiveRate = inc > 0 ? (total / inc) * 100 : 0

    return { federal, state: stateT, selfEmp, total, net, effectiveRate, taxableIncome }
  }, [income, incomeType, state, filingStatus])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-outline-variant rounded-2xl p-5 mb-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
        <h2 className="font-headline font-bold text-on-surface text-base">Tax Estimator</h2>
        <span className="text-[9px] font-body text-gray-500 bg-surface-container px-2 py-0.5 rounded-full ml-auto">2024</span>
      </div>

      <div className="space-y-3 mb-5">
        <InputField label="Annual Gross Income" value={income} onChange={setIncome} prefix="$" />

        <div>
          <label className="text-[9px] font-body text-gray-500 uppercase tracking-wider block mb-1">Income Type</label>
          <div className="grid grid-cols-2 gap-2">
            {['W2', '1099'].map(t => (
              <button
                key={t}
                onClick={() => setIncomeType(t)}
                className={`py-2.5 rounded-xl text-sm font-body font-medium transition-colors ${incomeType === t ? 'bg-primary text-background' : 'bg-surface-container text-gray-400 hover:text-on-surface'}`}
              >
                {t} {t === '1099' && '(Self-Employed)'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[9px] font-body text-gray-500 uppercase tracking-wider block mb-1">Filing Status</label>
          <div className="grid grid-cols-2 gap-2">
            {[['single', 'Single'], ['married', 'Married Filing Jointly']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilingStatus(v)}
                className={`py-2.5 rounded-xl text-xs font-body font-medium transition-colors ${filingStatus === v ? 'bg-primary text-background' : 'bg-surface-container text-gray-400 hover:text-on-surface'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <InputField label="State Tax Rate" value={state} onChange={setState} suffix="%" step="0.1" />
      </div>

      <div className="bg-surface-container rounded-xl p-3">
        <ResultRow label="Taxable Income" value={fmt(results.taxableIncome)} />
        <ResultRow label="Federal Tax" value={fmt(results.federal)} color="text-error" />
        <ResultRow label="State Tax" value={fmt(results.state)} color="text-error" />
        {incomeType === '1099' && (
          <ResultRow label="Self-Employment Tax" value={fmt(results.selfEmp)} color="text-error" />
        )}
        <ResultRow label="Total Tax Owed" value={fmt(results.total)} color="text-error" bold />
        <ResultRow label="Effective Rate" value={`${results.effectiveRate.toFixed(1)}%`} color="text-amber-400" />
        <ResultRow label="Take-Home Pay" value={fmt(results.net)} color="text-success" bold />
      </div>
    </motion.div>
  )
}

function MortgageCalculator() {
  const [homePrice, setHomePrice] = useState(350000)
  const [downPct, setDownPct] = useState(20)
  const [rate, setRate] = useState(7.0)
  const [years, setYears] = useState(30)

  const results = useMemo(() => {
    const p = Number(homePrice) * (1 - Number(downPct) / 100)
    const r = Number(rate) / 100 / 12
    const n = Number(years) * 12
    if (!p || !r || !n) return null
    const monthly = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    const total = monthly * n
    const interest = total - p
    const downAmount = Number(homePrice) * (Number(downPct) / 100)
    return { monthly, total, interest, loanAmount: p, downAmount }
  }, [homePrice, downPct, rate, years])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-surface border border-outline-variant rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary text-xl">home</span>
        <h2 className="font-headline font-bold text-on-surface text-base">Mortgage Calculator</h2>
      </div>

      <div className="space-y-3 mb-5">
        <InputField label="Home Price" value={homePrice} onChange={setHomePrice} prefix="$" />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Down Payment %" value={downPct} onChange={setDownPct} suffix="%" step="1" />
          <InputField label="Interest Rate %" value={rate} onChange={setRate} suffix="%" step="0.1" />
        </div>
        <div>
          <label className="text-[9px] font-body text-gray-500 uppercase tracking-wider block mb-1">Loan Term</label>
          <div className="grid grid-cols-3 gap-2">
            {[10, 15, 30].map(y => (
              <button
                key={y}
                onClick={() => setYears(y)}
                className={`py-2.5 rounded-xl text-sm font-body font-medium transition-colors ${years === y ? 'bg-primary text-background' : 'bg-surface-container text-gray-400 hover:text-on-surface'}`}
              >
                {y}yr
              </button>
            ))}
          </div>
        </div>
      </div>

      {results && (
        <div className="bg-surface-container rounded-xl p-3">
          <ResultRow label="Down Payment" value={fmt(results.downAmount)} />
          <ResultRow label="Loan Amount" value={fmt(results.loanAmount)} />
          <ResultRow label="Monthly Payment" value={fmt(results.monthly)} color="text-primary" bold />
          <ResultRow label="Total Paid" value={fmt(results.total)} />
          <ResultRow label="Total Interest" value={fmt(results.interest)} color="text-error" />
          <ResultRow
            label="Interest / Price Ratio"
            value={`${((results.interest / results.loanAmount) * 100).toFixed(0)}%`}
            color="text-amber-400"
          />
        </div>
      )}
    </motion.div>
  )
}

export default function Tools() {
  const { saveNetWorthSnapshot, netWorthData, updateNetWorthField, totalAssets, totalLiabilities, netWorth } = useApp()
  const [showNetWorth, setShowNetWorth] = useState(false)

  const assetFields = [
    { key: 'cash', label: 'Cash & Bank Accounts', icon: 'account_balance' },
    { key: 'investments', label: 'Investments', icon: 'show_chart' },
    { key: 'realEstate', label: 'Real Estate', icon: 'home' },
    { key: 'vehicles', label: 'Vehicles', icon: 'directions_car' },
    { key: 'other', label: 'Other Assets', icon: 'category' },
  ]

  const liabilityFields = [
    { key: 'creditCards', label: 'Credit Cards', icon: 'credit_card' },
    { key: 'loans', label: 'Personal Loans', icon: 'payments' },
    { key: 'mortgage', label: 'Mortgage Balance', icon: 'home_work' },
    { key: 'otherDebt', label: 'Other Debt', icon: 'money_off' },
  ]

  return (
    <div className="bg-background min-h-screen px-4 pt-5 pb-4">
      <div className="mb-5">
        <h1 className="font-headline font-bold text-on-surface text-2xl">Financial Tools</h1>
        <p className="text-gray-500 text-xs font-body mt-1">Calculators to power your wealth plan</p>
      </div>

      {/* Net Worth Tracker */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-outline-variant rounded-2xl p-5 mb-4"
      >
        <button
          onClick={() => setShowNetWorth(!showNetWorth)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
            <h2 className="font-headline font-bold text-on-surface text-base">Net Worth Tracker</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-headline font-bold text-sm ${netWorth >= 0 ? 'text-success' : 'text-error'}`}>
              {netWorth >= 0 ? '' : '-'}${Math.abs(netWorth).toLocaleString()}
            </span>
            <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '16px' }}>
              {showNetWorth ? 'expand_less' : 'expand_more'}
            </span>
          </div>
        </button>

        {showNetWorth && (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-[9px] font-body font-bold uppercase tracking-widest text-success mb-2">Assets</p>
              <div className="space-y-2">
                {assetFields.map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '13px' }}>{icon}</span>
                    </div>
                    <span className="text-xs font-body text-gray-400 flex-1">{label}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-600">$</span>
                      <input
                        type="number"
                        value={netWorthData.assets[key] || 0}
                        onChange={e => updateNetWorthField('assets', key, e.target.value)}
                        className="bg-surface-container border border-outline-variant rounded-lg px-2 py-1 text-xs font-body text-on-surface outline-none focus:border-success w-24 text-right"
                        min="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-outline-variant/40">
                <span className="text-xs font-body text-gray-500">Total Assets</span>
                <span className="text-sm font-headline font-bold text-success">${totalAssets.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-body font-bold uppercase tracking-widest text-error mb-2">Liabilities</p>
              <div className="space-y-2">
                {liabilityFields.map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '13px' }}>{icon}</span>
                    </div>
                    <span className="text-xs font-body text-gray-400 flex-1">{label}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-error">$</span>
                      <input
                        type="number"
                        value={netWorthData.liabilities[key] || 0}
                        onChange={e => updateNetWorthField('liabilities', key, e.target.value)}
                        className="bg-surface-container border border-outline-variant rounded-lg px-2 py-1 text-xs font-body text-on-surface outline-none focus:border-error w-24 text-right"
                        min="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-outline-variant/40">
                <span className="text-xs font-body text-gray-500">Total Liabilities</span>
                <span className="text-sm font-headline font-bold text-error">-${totalLiabilities.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-surface-container rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-body text-gray-500 uppercase tracking-wider">Net Worth</p>
                <p className={`font-headline font-bold text-xl ${netWorth >= 0 ? 'text-on-surface' : 'text-error'}`}>
                  {netWorth >= 0 ? '' : '-'}${Math.abs(netWorth).toLocaleString()}
                </p>
              </div>
              <button
                onClick={saveNetWorthSnapshot}
                className="flex items-center gap-1.5 bg-primary text-background rounded-xl px-3 py-2 text-xs font-body font-bold hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>save</span>
                Save Snapshot
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <TaxEstimator />
      <MortgageCalculator />
    </div>
  )
}
