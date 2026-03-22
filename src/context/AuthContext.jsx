import { createContext, useContext, useEffect, useState } from 'react'
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)

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
            setUserProfile(docSnap.data())
          } else {
            const newProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              householdId: null,
              createdAt: new Date().toISOString()
            }
            await setDoc(docRef, newProfile)
            setUserProfile(newProfile)
          }
        } catch (e) { console.error('Profile fetch failed', e) }
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // 2. HOUSEHOLD ACTIONS (Google Login Only Core)
  const createHousehold = async (name, passcode) => {
    if (!user) return
    const householdId = `H-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    const salt = bcrypt.genSaltSync(10)
    const passcodeHash = bcrypt.hashSync(passcode, salt)
    
    // Create Household Doc
    await setDoc(doc(db, 'households', householdId), {
      id: householdId,
      name: name || `${user.displayName}'s Family`,
      passcodeHash,
      members: [user.uid],
      createdAt: new Date().toISOString()
    })

    // Attach User to Household
    await updateDoc(doc(db, 'users', user.uid), { householdId })
    setUserProfile(prev => ({ ...prev, householdId }))
    return householdId
  }

  const joinHousehold = async (householdId, passcode) => {
    if (!user) return
    const hRef = doc(db, 'households', householdId);
    const hSnap = await getDoc(hRef);
    if (!hSnap.exists()) throw new Error('Household ID not found.');

    const { passcodeHash, members } = hSnap.data();
    
    // Verify Passcode ONLY for joining
    const isValid = bcrypt.compareSync(passcode, passcodeHash);
    if (!isValid) throw new Error('Invalid household passcode.');

    // Add user to members list
    await updateDoc(hRef, { 
       members: [...new Set([...members, user.uid])]
    });

    // Attach User to Household
    await updateDoc(doc(db, 'users', user.uid), { householdId });
    setUserProfile(prev => ({ ...prev, householdId }));
  }

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
      createHousehold, joinHousehold
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx && auth) throw new Error('useAuth must be used within AuthProvider')
  return ctx || { user: null, loading: false }
}
