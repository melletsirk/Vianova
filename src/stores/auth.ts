import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'

type UserRole = 'patient' | 'caregiver' | 'professional' | null

interface UserData {
  uid: string
  email: string
  role: UserRole
  createdAt: Date
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const userData = ref<UserData | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => userData.value?.role || null)

  // Fetch user data from Firestore
  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        userData.value = userDoc.data() as UserData
      } else {
        // Create initial user data if not exists
        const initialData: UserData = {
          uid,
          email: user.value?.email || '',
          role: null,
          createdAt: new Date()
        }
        await setDoc(doc(db, 'users', uid), initialData)
        userData.value = initialData
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  // Update user role in Firestore
  const updateUserRole = async (role: UserRole) => {
    if (!user.value) return
    try {
      await setDoc(doc(db, 'users', user.value.uid), {
        ...userData.value,
        role
      }, { merge: true })
      if (userData.value) {
        userData.value.role = role
      }
    } catch (error) {
      console.error('Error updating user role:', error)
    }
  }

  // Initialize auth state listener
  onAuthStateChanged(auth, async (firebaseUser) => {
    user.value = firebaseUser
    if (firebaseUser) {
      await fetchUserData(firebaseUser.uid)
    } else {
      userData.value = null
    }
    loading.value = false
  })

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      await fetchUserData(userCredential.user.uid)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      user.value = null
      userData.value = null
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  return {
    user,
    userData,
    loading,
    isAuthenticated,
    userRole,
    login,
    logout,
    updateUserRole
  }
})