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
        {/* Logo & Headline */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16 relative">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-xl shadow-amber-500/20 mb-8 relative">
             <span className="material-symbols-outlined text-background text-5xl font-bold">trending_up</span>
             <div className="absolute -top-3 -right-3">
                <span className="material-symbols-outlined text-amber-500 text-3xl animate-pulse">star</span>
             </div>
          </div>
          <h1 className="font-headline font-bold text-on-surface text-4xl mb-3 tracking-tight leading-tight">
            SERANT WEALTH <span className="text-amber-500">PLAN</span>
          </h1>
          <p className="text-gray-400 text-sm font-body px-8 font-medium italic">
            Your personal financial operating system. Build your path to $20M net worth.
          </p>
        </motion.div>

        <div className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-2xl space-y-6">
          <p className="text-on-surface font-body text-sm font-medium">
            Connected to your account.
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
              Secure authentication • Encrypted data • Real-time tracking
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
