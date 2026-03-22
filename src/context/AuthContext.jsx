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

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    let snapshotResolved = false
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        const profileTimeout = setTimeout(() => {
          if (!snapshotResolved) {
             console.warn('Firestore profile fetch timed out. Proceeding...')
             setLoading(false)
          }
        }, 3000)

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
        } catch (e) {
          console.error('Error fetching user profile:', e)
        } finally {
           snapshotResolved = true
           clearTimeout(profileTimeout)
           setLoading(false)
        }
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const createHousehold = async (passcode) => {
    if (!user) return
    const householdId = `H-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    const salt = bcrypt.genSaltSync(10)
    const passcodeHash = bcrypt.hashSync(passcode, salt)
    
    const householdRef = doc(db, 'households', householdId)
    await setDoc(householdRef, {
      id: householdId,
      passcodeHash,
      members: [user.uid],
      createdAt: new Date().toISOString(),
      name: `${user.displayName}'s House`
    })

    const userRef = doc(db, 'users', user.uid)
    await updateDoc(userRef, { householdId })
    setUserProfile(prev => ({ ...prev, householdId }))
    return householdId
  }

  const joinHousehold = async (householdId, passcode) => {
    if (!user) return
    const householdRef = doc(db, 'households', householdId)
    const householdSnap = await getDoc(householdRef)
    
    if (!householdSnap.exists()) throw new Error('Household not found.')
    
    const { passcodeHash, members } = householdSnap.data()
    const isValid = bcrypt.compareSync(passcode, passcodeHash)
    
    if (!isValid) throw new Error('Invalid passcode.')
    
    if (!members.includes(user.uid)) {
      await updateDoc(householdRef, { members: [...members, user.uid] })
    }

    const userRef = doc(db, 'users', user.uid)
    await updateDoc(userRef, { householdId })
    setUserProfile(prev => ({ ...prev, householdId }))
  }

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Login failed', error)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout failed', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, loginWithGoogle, logout, createHousehold, joinHousehold }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx && auth) throw new Error('useAuth must be used within AuthProvider')
  return ctx || { user: null, loading: false }
}
