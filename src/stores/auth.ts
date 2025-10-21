import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'

type UserRole = 'patient' | 'caregiver' | 'professional' | 'superadmin' | null

interface UserData {
  uid: string
  email: string
  role: UserRole
  name?: string
  phone?: string
  profileComplete?: boolean
  createdAt: Date
  updatedAt?: Date
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const userData = ref<UserData | null>(null)
  const loading = ref(true)
  const userDataLoading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => userData.value?.role || null)

  // Fetch user data from Firestore
  const fetchUserData = async (uid: string) => {
    userDataLoading.value = true
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
    } finally {
      userDataLoading.value = false
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
      // Initialize relationships store when user is authenticated
      if (userData.value?.role) {
        const { useRelationshipsStore } = await import('./relationships')
        const relationshipsStore = useRelationshipsStore()
        await relationshipsStore.initialize()

        // Initialize care tasks store for caregivers
        if (userData.value.role === 'caregiver') {
          const { useCareTasksStore } = await import('./careTasks')
          const careTasksStore = useCareTasksStore()
          await careTasksStore.initialize()
        }
      }
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
      // Initialize relationships store after login
      if (userData.value?.role) {
        const { useRelationshipsStore } = await import('./relationships')
        const relationshipsStore = useRelationshipsStore()
        await relationshipsStore.initialize()

        // Initialize care tasks store for caregivers
        if (userData.value.role === 'caregiver') {
          const { useCareTasksStore } = await import('./careTasks')
          const careTasksStore = useCareTasksStore()
          await careTasksStore.initialize()
        }
      }
      return { success: true }
    } catch (error: any) {
      console.error('Login failed for:', email, 'Error:', error.message)
      return { success: false, error: error.message }
    }
  }

  const register = async (email: string, password: string, role: UserRole) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user

      // Create user data in Firestore
      const initialData: UserData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || email,
        role,
        createdAt: new Date()
      }
      await setDoc(doc(db, 'users', userCredential.user.uid), initialData)
      userData.value = initialData

      // Initialize relationships store after registration
      const { useRelationshipsStore } = await import('./relationships')
      const relationshipsStore = useRelationshipsStore()
      await relationshipsStore.initialize()

      // Initialize care tasks store for caregivers
      if (userData.value.role === 'caregiver') {
        const { useCareTasksStore } = await import('./careTasks')
        const careTasksStore = useCareTasksStore()
        await careTasksStore.initialize()
      }

      return { success: true }
    } catch (error: any) {
      console.error('Registration failed for:', email, 'Error:', error.message)
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
    userDataLoading,
    isAuthenticated,
    userRole,
    login,
    logout,
    register,
    updateUserRole
  }
})