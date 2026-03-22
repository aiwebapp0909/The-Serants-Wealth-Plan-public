import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'

export default function Security() {
  const { userProfile, deviceId, passcodeSession, logout } = useAuth()
  const [logs, setLogs] = useState([])

  // Simulated Audit Logs (In production, these come from Firestore auditLogs collection)
  useEffect(() => {
    setLogs([
      { id: 1, action: 'LOGIN_SUCCESS', device: deviceId, time: '2 mins ago', status: 'secure' },
      { id: 2, action: 'HOUSEHOLD_SYNC', device: 'LAPTOP-S12', time: '1 hour ago', status: 'secure' },
      { id: 3, action: 'SENSITIVE_VIEW', device: deviceId, time: '1 hour ago', status: 'mfa_verified' },
    ])
  }, [deviceId])

  return (
    <div className="bg-background min-h-screen px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline font-bold text-on-surface text-3xl">Security</h1>
          <p className="text-gray-500 text-xs font-body mt-1">Fintech-grade protection active</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center border border-success/20">
          <span className="material-symbols-outlined text-success">verified_user</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* SESSION STATUS */}
        <div className="bg-surface border border-outline-variant rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">key</span>
                <p className="text-sm font-headline font-bold">Passcode Session</p>
             </div>
             <span className={`text-[10px] font-body font-bold px-2 py-0.5 rounded-full ${passcodeSession.verified ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
               {passcodeSession.verified ? 'ACTIVE' : 'EXPIRED'}
             </span>
          </div>
          {passcodeSession.verified ? (
            <p className="text-xs text-gray-500 font-body">Session expires automatically in 10 minutes or after 15 minutes of inactivity.</p>
          ) : (
            <p className="text-xs text-gray-500 font-body">Re-enter your household passcode to view sensitive financial data.</p>
          )}
        </div>

        {/* DEVICE BINDING */}
        <div className="bg-surface border border-outline-variant rounded-3xl p-5 shadow-sm">
           <h3 className="text-[10px] font-body font-bold text-gray-400 uppercase tracking-widest mb-4">Trusted Devices</h3>
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400">smartphone</span>
                    <div>
                       <p className="text-xs font-headline font-bold text-on-surface">{deviceId}</p>
                       <p className="text-[9px] font-body text-success font-bold uppercase">Current Device</p>
                    </div>
                 </div>
                 <span className="material-symbols-outlined text-success text-sm">check_circle</span>
              </div>
              <div className="flex items-center justify-between opacity-50">
                 <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400">laptop</span>
                    <div>
                       <p className="text-xs font-headline font-bold text-on-surface">LAPTOP-S12</p>
                       <p className="text-[9px] font-body text-gray-500 uppercase">Last seen: 1 hour ago</p>
                    </div>
                 </div>
                 <button className="text-[9px] font-body font-bold text-error uppercase">Revoke</button>
              </div>
           </div>
        </div>

        {/* AUDIT LOGS */}
        <div>
          <h3 className="text-[10px] font-body font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Security Activity</h3>
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="bg-surface-container border border-outline-variant/50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.status === 'secure' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                    <span className="material-symbols-outlined text-base">{log.status === 'secure' ? 'terminal' : 'shield'}</span>
                  </div>
                  <div>
                    <p className="text-xs font-headline font-bold text-on-surface">{log.action}</p>
                    <p className="text-[9px] font-body text-gray-500 uppercase tracking-tight">{log.device} • {log.time}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
              </div>
            ))}
          </div>
        </div>

        <button 
           onClick={logout}
           className="w-full py-4 text-error font-headline font-bold text-sm bg-error/5 border border-error/10 rounded-2xl mt-4"
        >
          FORCE LOGOUT ALL SESSIONS
        </button>
      </div>
    </div>
  )
}
