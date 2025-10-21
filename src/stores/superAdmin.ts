import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { deleteUser } from 'firebase/auth'
import { db } from '@/firebase'
import type { UserRole, Relationship, UserConnection } from '@/types/relationships'

interface AdminUser {
  uid: string
  email: string
  role: UserRole
  name?: string
  phone?: string
  profileComplete?: boolean
  createdAt: Date
  updatedAt?: Date
}

export const useSuperAdminStore = defineStore('superAdmin', () => {
  // State
  const users = ref<AdminUser[]>([])
  const relationships = ref<Relationship[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const usersByRole = computed(() => {
    const grouped: Record<UserRole, AdminUser[]> = {
      patient: [],
      caregiver: [],
      professional: [],
      superadmin: []
    }

    users.value.forEach(user => {
      if (grouped[user.role]) {
        grouped[user.role].push(user)
      }
    })

    return grouped
  })

  const totalUsers = computed(() => users.value.length)
  const totalRelationships = computed(() => relationships.value.length)

  // Actions
  const fetchAllUsers = async () => {
    loading.value = true
    error.value = null

    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)

      users.value = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as AdminUser[]
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching users:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchAllRelationships = async () => {
    loading.value = true
    error.value = null

    try {
      const relationshipsRef = collection(db, 'relationships')
      const q = query(relationshipsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)

      relationships.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        acceptedAt: doc.data().acceptedAt?.toDate()
      })) as Relationship[]
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching relationships:', err)
    } finally {
      loading.value = false
    }
  }

  const deleteUserAccount = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    loading.value = true
    error.value = null

    try {
      // Delete user document from Firestore
      await deleteDoc(doc(db, 'users', userId))

      // Note: Firebase Auth user deletion requires admin SDK or the user to be signed in
      // For now, we'll just delete the Firestore document
      // In a production app, you'd use Firebase Admin SDK

      // Remove from local state
      users.value = users.value.filter(user => user.uid !== userId)

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting user:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const deleteRelationship = async (relationshipId: string): Promise<{ success: boolean; error?: string }> => {
    loading.value = true
    error.value = null

    try {
      await deleteDoc(doc(db, 'relationships', relationshipId))

      // Remove from local state
      relationships.value = relationships.value.filter(rel => rel.id !== relationshipId)

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting relationship:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const initialize = async () => {
    await Promise.all([fetchAllUsers(), fetchAllRelationships()])
  }

  return {
    // State
    users,
    relationships,
    loading,
    error,

    // Computed
    usersByRole,
    totalUsers,
    totalRelationships,

    // Actions
    fetchAllUsers,
    fetchAllRelationships,
    deleteUserAccount,
    deleteRelationship,
    initialize
  }
})