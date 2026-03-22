import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Onboarding() {
  const { createHousehold, joinHousehold, userProfile } = useAuth()
  const navigate = useNavigate()
  
  const [step, setStep] = useState(1) // 1: Choose Action, 2: Create (Name+Pass), 3: Join (ID+Pass)
  const [houseName, setHouseName] = useState('')
  const [passcode, setPasscode] = useState('')
  const [householdId, setHouseholdId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successId, setSuccessId] = useState('')

  useEffect(() => {
    if (userProfile?.householdId) navigate('/')
  }, [userProfile, navigate])

  const handleCreate = async () => {
    if (!houseName || passcode.length < 4) return setError('Household Name and 4+ digit passcode required.')
    setLoading(true)
    setError('')
    try {
      const id = await createHousehold(houseName, passcode)
      setSuccessId(id)
      setStep(4) // Final Step: Show ID
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const handleJoin = async () => {
    if (!householdId || passcode.length < 4) return setError('Household ID and passcode required.')
    setLoading(true)
    setError('')
    try {
      await joinHousehold(householdId, passcode)
      navigate('/')
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const cardStyle = "bg-[#16161D] border border-outline-variant/50 rounded-3xl p-8 shadow-2xl space-y-8"

  return (
    <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center p-6 text-center">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm space-y-12">
            <div className="space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-xl shadow-amber-500/20">
                <span className="material-symbols-outlined text-background text-3xl font-bold">handshake</span>
              </div>
              <h1 className="font-headline font-bold text-on-surface text-3xl">Setup Household</h1>
              <p className="text-gray-400 text-sm font-body px-4 italic leading-relaxed">
                Choose a way to establish your shared wealth plan.
              </p>
            </div>
            <div className="space-y-4">
              <button 
                onClick={() => setStep(2)} 
                className="w-full py-5 bg-surface-container border border-outline-variant text-on-surface rounded-2xl font-bold hover:border-primary transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-primary text-2xl">house</span>
                CREATE HOUSEHOLD
              </button>
              <button 
                onClick={() => setStep(3)} 
                className="w-full py-5 bg-surface-container border border-outline-variant text-on-surface rounded-2xl font-bold hover:border-primary transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-gray-400 text-2xl">group_add</span>
                JOIN HOUSEHOLD
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={`w-full max-w-sm ${cardStyle}`}>
            <div className="space-y-2">
               <h2 className="font-headline font-bold text-on-surface text-xl uppercase tracking-tighter">Option A: Create</h2>
               <p className="text-xs text-secondary font-body font-bold">New Family Vault</p>
            </div>
            {error && <p className="text-[10px] font-body font-bold text-error uppercase">{error}</p>}
            <div className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest ml-1">Household Name</label>
                <input 
                  placeholder="e.g. Serants Family"
                  value={houseName}
                  onChange={e => setHouseName(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest ml-1">Daily Passcode (4-6 digits)</label>
                <input 
                  type="password"
                  placeholder="••••••"
                  maxLength={6}
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-2xl py-4 px-5 text-sm font-bold tracking-[1em] outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-3 pt-6">
                <button onClick={() => setStep(1)} className="flex-1 py-4 text-gray-400 font-bold uppercase text-xs">Back</button>
                <button onClick={handleCreate} disabled={loading} className="flex-2 py-4 px-8 bg-primary text-background rounded-2xl font-bold uppercase text-sm">Create</button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={`w-full max-w-sm ${cardStyle}`}>
            <div className="space-y-2">
               <h2 className="font-headline font-bold text-on-surface text-xl uppercase tracking-tighter">Option B: Join</h2>
               <p className="text-xs text-primary font-body font-bold">Sync with Partner</p>
            </div>
            {error && <p className="text-[10px] font-body font-bold text-error uppercase">{error}</p>}
            <div className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest ml-1">Household ID</label>
                <input 
                   placeholder="H-XXXXXX"
                   value={householdId}
                   onChange={e => setHouseholdId(e.target.value.toUpperCase())}
                   className="w-full bg-surface-container border border-outline-variant rounded-2xl py-4 px-5 text-sm font-bold tracking-widest outline-none focus:border-primary uppercase"
                />
              </div>
              <div>
                <label className="text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest ml-1">Passcode</label>
                <input 
                   type="password"
                   placeholder="••••••"
                   maxLength={6}
                   value={passcode}
                   onChange={e => setPasscode(e.target.value)}
                   className="w-full bg-surface-container border border-outline-variant rounded-2xl py-4 px-5 text-sm font-bold tracking-[1em] outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-3 pt-6">
                <button onClick={() => setStep(1)} className="flex-1 py-4 text-gray-400 font-bold uppercase text-xs">Back</button>
                <button onClick={handleJoin} disabled={loading} className="flex-2 py-4 px-8 bg-primary text-background rounded-2xl font-bold uppercase text-sm">Begin Sync</button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`w-full max-w-sm ${cardStyle}`}>
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-6">
               <span className="material-symbols-outlined text-success text-3xl font-bold">check_circle</span>
            </div>
            <h2 className="font-headline font-bold text-on-surface text-2xl uppercase tracking-tight">Household Established</h2>
            <p className="text-xs text-gray-500 font-body px-2 leading-relaxed">Share this ID and your secret passcode with your partner to start syncing.</p>
            
            <div className="bg-surface-container p-6 rounded-3xl border-2 border-primary/20 text-center select-all">
               <p className="text-[9px] font-body text-gray-400 uppercase tracking-widest mb-1">Share this ID</p>
               <p className="font-headline font-bold text-primary text-4xl tracking-widest">{successId}</p>
            </div>

            <button onClick={() => navigate('/')} className="w-full py-5 bg-primary text-background rounded-2xl font-bold uppercase mt-8">Enter Dashboard</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
