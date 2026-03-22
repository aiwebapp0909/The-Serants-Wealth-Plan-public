import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import bcrypt from 'bcryptjs'

const AuthContext = createContext(null)

// --- UTILS ---
const DEVICE_ID_KEY = 'swp_device_binding_id';
const PASSCODE_ATTEMPTS_KEY = 'swp_lockout_attempts';
const PASSCODE_LOCKOUT_KEY = 'swp_lockout_until';

const getDeviceId = () => {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'DEV-' + Math.random().toString(36).substring(2, 12).toUpperCase();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  
  // SECURITY STATE
  const [passcodeSession, setPasscodeSession] = useState({ verified: false, expiresAt: 0 })
  const [isMfaVerified, setIsMfaVerified] = useState(false)
  const [lockoutTimer, setLockoutTimer] = useState(0)

  // 1. IDENTITY & PROFILE SYNC
  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Device Binding Verification
            if (data.trustedDevices && !data.trustedDevices.includes(getDeviceId())) {
               console.warn('New Device Detected');
               // Here we could trigger a "New Device" alert log
            }
            setUserProfile(data)
          } else {
            const newProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              householdId: null,
              trustedDevices: [getDeviceId()],
              createdAt: new Date().toISOString()
            }
            await setDoc(docRef, newProfile)
            setUserProfile(newProfile)
          }
        } catch (e) { console.error('Profile fetch failed', e) }
      } else {
        setUserProfile(null)
        setPasscodeSession({ verified: false, expiresAt: 0 })
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // 2. PASSCODE BRUTE FORCE & SESSION MANAGEMENT
  const checkLockout = () => {
    const until = parseInt(localStorage.getItem(PASSCODE_LOCKOUT_KEY) || '0');
    if (Date.now() < until) {
      setLockoutTimer(Math.ceil((until - Date.now()) / 1000 / 60));
      return true;
    }
    return false;
  };

  const verifyPasscode = useCallback(async (passcode) => {
    if (checkLockout()) throw new Error(`Too many attempts. Locked for ${lockoutTimer} minutes.`);
    if (!userProfile?.householdId) throw new Error('No household linked.');

    try {
      const hRef = doc(db, 'households', userProfile.householdId);
      const hSnap = await getDoc(hRef);
      if (!hSnap.exists()) throw new Error('Household data lost.');

      const { passcodeHash } = hSnap.data();
      const isValid = bcrypt.compareSync(passcode, passcodeHash);

      if (isValid) {
        localStorage.removeItem(PASSCODE_ATTEMPTS_KEY);
        setPasscodeSession({
          verified: true,
          expiresAt: Date.now() + 10 * 60 * 1000 // 10 Min Session Expiry
        });
        return true;
      } else {
        const attempts = parseInt(localStorage.getItem(PASSCODE_ATTEMPTS_KEY) || '0') + 1;
        localStorage.setItem(PASSCODE_ATTEMPTS_KEY, attempts.toString());
        
        if (attempts >= 5) {
          const lockoutUntil = Date.now() + 15 * 60 * 1000;
          localStorage.setItem(PASSCODE_LOCKOUT_KEY, lockoutUntil.toString());
          throw new Error('Brute force detected. Account locked for 15 minutes.');
        }
        throw new Error(`Invalid passcode. ${5 - attempts} attempts remaining.`);
      }
    } catch (e) {
      throw e;
    }
  }, [userProfile, lockoutTimer]);

  // 3. FINTECH ACTIONS
  const createHousehold = async (passcode) => {
    if (!user) return
    const householdId = `H-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    const salt = bcrypt.genSaltSync(12) // Upgraded to 12 rounds
    const passcodeHash = bcrypt.hashSync(passcode, salt)
    
    await setDoc(doc(db, 'households', householdId), {
      id: householdId,
      passcodeHash,
      members: [user.uid],
      auditLogs: [{ action: 'HOUSEHOLD_CREATED', userId: user.uid, timestamp: Date.now(), device: getDeviceId() }],
      createdAt: Date.now()
    })

    await updateDoc(doc(db, 'users', user.uid), { 
      householdId,
      trustedDevices: [getDeviceId()] 
    })
    setUserProfile(prev => ({ ...prev, householdId }))
  }

  const joinHousehold = async (householdId, passcode) => {
    if (!user) return
    const hRef = doc(db, 'households', householdId);
    const hSnap = await getDoc(hRef);
    if (!hSnap.exists()) throw new Error('ID not found.');

    const { passcodeHash, members } = hSnap.data();
    if (!bcrypt.compareSync(passcode, passcodeHash)) throw new Error('Invalid Code.');

    await updateDoc(hRef, { 
       members: [...new Set([...members, user.uid])],
       auditLogs: [{ action: 'MEMBER_JOINED', userId: user.uid, timestamp: Date.now(), device: getDeviceId() }]
    });

    await updateDoc(doc(db, 'users', user.uid), { householdId });
    setUserProfile(prev => ({ ...prev, householdId }));
  }

  // Session Auto-Expiry Check
  useEffect(() => {
    const interval = setInterval(() => {
      if (passcodeSession.verified && Date.now() > passcodeSession.expiresAt) {
        setPasscodeSession({ verified: false, expiresAt: 0 });
        console.warn('Security Session Expired');
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [passcodeSession]);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    try { await signInWithPopup(auth, provider) } catch (error) { console.error('Login failed', error) }
  }

  const logout = async () => {
    try { await signOut(auth) } catch (error) { console.error('Logout failed', error) }
  }

  return (
    <AuthContext.Provider value={{ 
      user, userProfile, loading, 
      loginWithGoogle, logout, 
      createHousehold, joinHousehold, 
      verifyPasscode, passcodeSession,
      isMfaVerified, setIsMfaVerified,
      deviceId: getDeviceId()
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx && auth) throw new Error('useAuth missing provider')
  return ctx || { user: null, loading: false }
}
