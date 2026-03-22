import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

export default function Login() {
  const { loginWithGoogle, loading } = useAuth()

  return (
    <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/20">
          <span className="material-symbols-outlined text-primary text-4xl">payments</span>
        </div>
        
        <h1 className="font-headline font-bold text-on-surface text-3xl mb-2">WealthSync</h1>
        <p className="text-gray-500 font-body text-sm mb-12">
          Serants Wealth Plan (SWP) — A Couples Wealth Operating System
        </p>

        <div className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-2xl space-y-6">
          <p className="text-on-surface font-body text-sm font-medium">
            Join the journey to $20M net worth.
          </p>

          <button
            onClick={loginWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-2xl py-4 transition-all group"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" />
            <span className="text-on-surface font-body font-bold text-sm">Sign in with Google</span>
          </button>

          <div className="pt-4 border-t border-outline-variant/40">
            <p className="text-[10px] text-gray-600 font-body uppercase tracking-widest leading-relaxed">
              Secure couple syncing • Encrypted data • Real-time tracking
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
