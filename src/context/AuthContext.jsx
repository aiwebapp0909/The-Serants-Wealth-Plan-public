import { createContext, useContext, useEffect, useState } from 'react'
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

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
        // Create a failsafe to not block the app forever if Firestore is slow
        const profileTimeout = setTimeout(() => {
          if (!snapshotResolved) {
             console.warn('Firestore profile fetch timed out. Proceeding with basic user info.')
             setLoading(false)
          }
        }, 2000)

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
              groupId: null,
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
    <AuthContext.Provider value={{ user, userProfile, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx && auth) throw new Error('useAuth must be used within AuthProvider')
  return ctx || { user: null, loading: false } // Fallback for local-only mode
}
