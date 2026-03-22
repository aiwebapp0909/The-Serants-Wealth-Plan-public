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
    if (userProfile?.householdId && !successId) navigate('/')
  }, [userProfile, navigate, successId])

  const handleCreate = async () => {
    if (!houseName) return setError('Please enter a Household Name.')
    if (passcode.length < 4) return setError('Passcode must be at least 4 digits.')
    
    setLoading(true)
    setError('')
    console.log('Attempting to create household:', houseName)
    
    try {
      const id = await createHousehold(houseName, passcode)
      if (id) {
        setSuccessId(id)
        setStep(4)
      } else {
        throw new Error('Failed to generate Household ID. Are you logged in?')
      }
    } catch (e) { 
      console.error('Creation error:', e)
      setError(e.message || 'An unexpected error occurred.') 
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!householdId) return setError('Please enter the Household ID.')
    if (passcode.length < 4) return setError('Please enter the passcode.')
    
    setLoading(true)
    setError('')
    try {
      await joinHousehold(householdId, passcode)
      navigate('/')
    } catch (e) { 
      setError(e.message) 
    } finally {
      setLoading(false)
    }
  }

  const cardStyle = "bg-[#16161D] border border-outline-variant/50 rounded-3xl p-8 shadow-2xl space-y-8"

  return (
    <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center p-6 text-center">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm space-y-12">
            <div className="space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-xl shadow-amber-500/20">
                <span className="material-symbols-outlined text-background text-3xl font-bold">handshake</span>
              </div>
              <h1 className="font-headline font-bold text-on-surface text-3xl uppercase tracking-tighter">Serant Wealth</h1>
              <p className="text-gray-400 text-sm font-body px-4 italic leading-relaxed">
                Step 1: Link your accounts to begin collective wealth building.
              </p>
            </div>
            <div className="space-y-4">
              <button 
                onClick={() => setStep(2)} 
                className="w-full py-5 bg-primary text-background rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-2xl">add_home</span>
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
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={`w-full max-w-sm ${cardStyle}`}>
            <div className="space-y-2 text-center">
               <h2 className="font-headline font-bold text-on-surface text-xl uppercase tracking-tighter">Option A: Create</h2>
               <p className="text-[10px] text-primary font-body font-bold uppercase tracking-widest">New Family Vault</p>
            </div>
            
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-error/10 border border-error/20 p-3 rounded-xl">
                 <p className="text-[11px] font-body font-bold text-error uppercase text-center">{error}</p>
              </motion.div>
            )}

            <div className="space-y-5 text-left">
              <div>
                <label className="text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Household Name</label>
                <input 
                  placeholder="e.g. Serants Family"
                  value={houseName}
                  onChange={e => setHouseName(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Passcode (4-6 digits)</label>
                <input 
                  type="password"
                  placeholder="••••••"
                  maxLength={6}
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-2xl py-4 px-5 text-sm font-bold tracking-[1em] outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(1)} className="flex-1 py-4 text-gray-400 font-bold uppercase text-xs">Back</button>
                <button 
                   onClick={handleCreate} 
                   disabled={loading} 
                   className={`flex-2 py-4 px-8 rounded-2xl font-bold uppercase text-sm transition-all ${loading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-primary text-background shadow-lg shadow-primary/20'}`}
                >
                  {loading ? 'Processing...' : 'Create'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={`w-full max-w-sm ${cardStyle}`}>
            <div className="space-y-2 text-center">
               <h2 className="font-headline font-bold text-on-surface text-xl uppercase tracking-tighter">Option B: Join</h2>
               <p className="text-[10px] text-primary font-body font-bold uppercase tracking-widest">Link With Partner</p>
            </div>
            
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-error/10 border border-error/20 p-3 rounded-xl">
                 <p className="text-[11px] font-body font-bold text-error uppercase text-center">{error}</p>
              </motion.div>
            )}

            <div className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Household ID</label>
                <input 
                   placeholder="H-XXXXXX"
                   value={householdId}
                   onChange={e => setHouseholdId(e.target.value.toUpperCase())}
                   className="w-full bg-surface-container border border-outline-variant rounded-2xl py-4 px-5 text-sm font-bold tracking-widest outline-none focus:border-primary uppercase"
                />
              </div>
              <div>
                <label className="text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Passcode</label>
                <input 
                   type="password"
                   placeholder="••••••"
                   maxLength={6}
                   value={passcode}
                   onChange={e => setPasscode(e.target.value)}
                   className="w-full bg-surface-container border border-outline-variant rounded-2xl py-4 px-5 text-sm font-bold tracking-[1em] outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(1)} className="flex-1 py-4 text-gray-400 font-bold uppercase text-xs">Back</button>
                <button 
                  onClick={handleJoin} 
                  disabled={loading} 
                  className={`flex-2 py-4 px-8 rounded-2xl font-bold uppercase text-sm transition-all ${loading ? 'bg-gray-700 text-gray-400' : 'bg-primary text-background shadow-lg shadow-primary/20'}`}
                >
                  {loading ? 'Joining...' : 'Link'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`w-full max-w-sm ${cardStyle}`}>
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-6">
               <span className="material-symbols-outlined text-success text-3xl font-bold">verified</span>
            </div>
            <h2 className="font-headline font-bold text-on-surface text-2xl uppercase tracking-tighter">Household ID Ready</h2>
            <p className="text-xs text-gray-500 font-body px-4 leading-relaxed italic">Pass this ID and your passcode to your partner to begin syncing.</p>
            
            <div className="bg-surface-container p-6 rounded-3xl border-2 border-primary/20 text-center select-all group relative cursor-pointer active:scale-[0.99] transition-all">
               <p className="text-[9px] font-body text-gray-400 uppercase tracking-widest mb-1">Copy & Share</p>
               <p className="font-headline font-bold text-primary text-4xl tracking-widest">{successId}</p>
               <div className="absolute top-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-gray-600 text-[14px]">content_copy</span>
               </div>
            </div>

            <button 
              onClick={() => navigate('/')} 
              className="w-full py-5 bg-primary text-background rounded-2xl font-bold uppercase mt-8 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
            >
              Enter Roadmap
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
