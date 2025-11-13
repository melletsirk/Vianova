import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
  writeBatch,
  onSnapshot
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth'
import { useRelationshipsStore } from './relationships'
import type { Message } from '@/types/relationships'

export const useMessagesStore = defineStore('messages', () => {
  const authStore = useAuthStore()
  const relationshipsStore = useRelationshipsStore()

  // State
  const messages = ref<Message[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const unsubscribeMessages = ref<(() => void) | null>(null)

  // Computed
  const recentMessages = computed(() => {
    return messages.value
      .filter(msg => !msg.read)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  })

  const unreadCount = computed(() => {
    return messages.value.filter(msg => !msg.read).length
  })

  const messagesByProfessional = computed(() => {
    const grouped: Record<string, Message[]> = {}
    messages.value.forEach(msg => {
      if (!grouped[msg.professionalId]) {
        grouped[msg.professionalId] = []
      }
      grouped[msg.professionalId].push(msg)
    })

    // Sort each group by date
    Object.keys(grouped).forEach(profId => {
      grouped[profId].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    })

    return grouped
  })

  // Get connected professional IDs for current patient
  const getConnectedProfessionalIds = (): string[] => {
    if (authStore.userData?.role !== 'patient') return []

    return relationshipsStore.myProfessionals
      .map(professional => professional.userId)
  }

  /**
   * Send a message from professional to patient
   */
  const sendMessage = async (
    patientId: string,
    message: Omit<Message, 'id' | 'patientId' | 'professionalId' | 'professionalName' | 'read' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!authStore.user?.uid || authStore.userData?.role !== 'professional') {
      return { success: false, error: 'Solo profesionales pueden enviar mensajes' }
    }

    loading.value = true
    error.value = null

    try {
      // Check if professional is connected to patient
      const isConnected = relationshipsStore.myPatients.some(
        patient => patient.userId === patientId
      )

      if (!isConnected) {
        return { success: false, error: 'No tienes conexión activa con este paciente' }
      }

      const messageData: Omit<Message, 'id'> = {
        ...message,
        patientId,
        professionalId: authStore.user.uid,
        professionalName: authStore.userData?.name || 'Profesional',
        read: false,
        createdAt: new Date()
      }

      const docRef = await addDoc(collection(db, 'messages'), {
        ...messageData,
        createdAt: Timestamp.fromDate(messageData.createdAt)
      })

      // Add to local state
      messages.value.unshift({ id: docRef.id, ...messageData })

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error sending message:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Load messages for current user (patient or professional)
   */
  const loadMessages = async (): Promise<{ success: boolean; error?: string }> => {
    if (!authStore.user?.uid) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    loading.value = true
    error.value = null

    try {
      let q

      if (authStore.userData?.role === 'patient') {
        // For patients, load messages from connected professionals only
        const connectedProfIds = getConnectedProfessionalIds()
        if (connectedProfIds.length === 0) {
          messages.value = []
          return { success: true }
        }

        q = query(
          collection(db, 'messages'),
          where('patientId', '==', authStore.user.uid),
          where('professionalId', 'in', connectedProfIds),
          orderBy('createdAt', 'desc')
        )
      } else if (authStore.userData?.role === 'professional') {
        // For professionals, load messages they've sent
        q = query(
          collection(db, 'messages'),
          where('professionalId', '==', authStore.user.uid),
          orderBy('createdAt', 'desc')
        )
      } else {
        return { success: false, error: 'Rol no soportado para mensajes' }
      }

      const snapshot = await getDocs(q)

      messages.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        readAt: doc.data().readAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Message[]

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error loading messages:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark message as read
   */
  const markAsRead = async (messageId: string): Promise<{ success: boolean; error?: string }> => {
    if (!authStore.user?.uid) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    try {
      const now = new Date()
      await updateDoc(doc(db, 'messages', messageId), {
        read: true,
        readAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      })

      // Update local state
      const messageIndex = messages.value.findIndex(msg => msg.id === messageId)
      if (messageIndex >= 0) {
        messages.value[messageIndex].read = true
        messages.value[messageIndex].readAt = now
        messages.value[messageIndex].updatedAt = now
      }

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error marking message as read:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Mark all messages as read
   */
  const markAllAsRead = async (): Promise<{ success: boolean; error?: string }> => {
    if (!authStore.user?.uid) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    try {
      const unreadMessages = messages.value.filter(msg => !msg.read)
      if (unreadMessages.length === 0) {
        return { success: true }
      }

      const batch = writeBatch(db)
      const now = new Date()

      unreadMessages.forEach(msg => {
        const messageRef = doc(db, 'messages', msg.id)
        batch.update(messageRef, {
          read: true,
          readAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now)
        })
      })

      await batch.commit()

      // Update local state
      messages.value.forEach(msg => {
        if (!msg.read) {
          msg.read = true
          msg.readAt = now
          msg.updatedAt = now
        }
      })

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error marking all messages as read:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Load messages with real-time updates
   */
  const loadMessagesRealtime = (): (() => void) | null => {
    if (!authStore.user?.uid) return null

    // Clean up existing listener
    if (unsubscribeMessages.value) {
      unsubscribeMessages.value()
    }

    let q

    if (authStore.userData?.role === 'patient') {
      // For patients, load messages from connected professionals only
      const connectedProfIds = getConnectedProfessionalIds()
      if (connectedProfIds.length === 0) {
        // If no connected professionals yet, set up a listener that will be updated when relationships load
        // For now, return null and we'll set up the listener later when relationships are available
        messages.value = []
        return null
      }

      q = query(
        collection(db, 'messages'),
        where('patientId', '==', authStore.user.uid),
        where('professionalId', 'in', connectedProfIds),
        orderBy('createdAt', 'desc')
      )
    } else if (authStore.userData?.role === 'professional') {
      // For professionals, load messages they've sent
      q = query(
        collection(db, 'messages'),
        where('professionalId', '==', authStore.user.uid),
        orderBy('createdAt', 'desc')
      )
    } else {
      return null
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      messages.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        readAt: doc.data().readAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Message[]
    }, (err) => {
      error.value = err.message
      console.error('Error in messages realtime listener:', err)
    })

    // Store unsubscribe function
    unsubscribeMessages.value = unsubscribe

    return unsubscribe
  }

  /**
   * Setup reactive messages listener that updates when relationships change
   */
  const setupReactiveMessagesListener = () => {
    if (!authStore.user?.uid || authStore.userData?.role !== 'patient') return

    // Only setup listener if we don't already have one
    if (unsubscribeMessages.value) {
      return // Listener already exists
    }

    // Watch for changes in relationships and update the messages listener
    // This is a computed-like reactive effect that will re-run when myProfessionals changes
    const updateListener = () => {
      const connectedProfIds = getConnectedProfessionalIds()
      if (connectedProfIds.length > 0) {
        // Only set up listener if we have connected professionals and no listener exists
        if (!unsubscribeMessages.value) {
          loadMessagesRealtime()
        }
      }
    }

    // Initial setup
    updateListener()

    // Return a function to manually trigger updates (can be called when relationships change)
    return updateListener
  }

  /**
   * Initialize store for current user
   */
  const initializeForCurrentUser = async () => {
    if (!authStore.user?.uid) return

    // First load existing messages
    await loadMessages()

    // For professionals, setup real-time listener immediately
    // For patients, the reactive watcher will handle it when relationships are loaded
    if (authStore.userData?.role === 'professional') {
      const unsubscribe = loadMessagesRealtime()
      if (unsubscribe) {
        // Store unsubscribe function for cleanup if needed
        // For now, we'll let the component handle cleanup
      }
    }
  }

  /**
   * Initialize reactive messages listener for patients (called when relationships are loaded)
   */
  const initializeReactiveMessagesForPatient = () => {
    if (!authStore.user?.uid || authStore.userData?.role !== 'patient') return

    // Setup reactive listener that will update when relationships change
    setupReactiveMessagesListener()
  }

  /**
   * Cleanup real-time listeners
   */
  const cleanupListeners = () => {
    if (unsubscribeMessages.value) {
      unsubscribeMessages.value()
      unsubscribeMessages.value = null
    }
  }

  /**
   * Clear all data
   */
  const clearData = () => {
    cleanupListeners()
    messages.value = []
    error.value = null
  }

  return {
    // State
    messages,
    loading,
    error,

    // Computed
    recentMessages,
    unreadCount,
    messagesByProfessional,

    // Actions
    sendMessage,
    loadMessages,
    markAsRead,
    markAllAsRead,
    initializeForCurrentUser,
    initializeReactiveMessagesForPatient,
    cleanupListeners,
    clearData
  }
})