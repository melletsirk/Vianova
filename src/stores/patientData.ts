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
  deleteDoc,
  writeBatch,
  onSnapshot
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth'
import { useRelationshipsStore } from './relationships'
import type {
  DailyEntry,
  Medication,
  Appointment,
  Alert,
  PatientStats
} from '@/types/relationships'

export const usePatientDataStore = defineStore('patientData', () => {
  const authStore = useAuthStore()
  const relationshipsStore = useRelationshipsStore()

  // State
  const dailyEntries = ref<DailyEntry[]>([])
  const medications = ref<Medication[]>([])
  const appointments = ref<Appointment[]>([])
  const alerts = ref<Alert[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Real-time listeners management
  const unsubscribers = ref<Record<string, (() => void)[]>>({})

  // Computed
  const patientStats = computed((): PatientStats => {
    const entries = dailyEntries.value
    const meds = medications.value.filter(m => m.active)
    const upcomingAppts = appointments.value.filter(a =>
      a.status === 'scheduled' && new Date(a.date) > new Date()
    )
    const unresolvedAlerts = alerts.value.filter(a => !a.resolved)

    if (entries.length === 0) {
      return {
        totalEntries: 0,
        averageMood: 0,
        averagePain: 0,
        averageEnergy: 0,
        streakDays: 0,
        medicationsActive: meds.length,
        upcomingAppointments: upcomingAppts.length,
        unresolvedAlerts: unresolvedAlerts.length
      }
    }

    const avgMood = entries.reduce((sum, e) => sum + e.mood, 0) / entries.length
    const avgPain = entries.reduce((sum, e) => sum + e.pain, 0) / entries.length
    const avgEnergy = entries.reduce((sum, e) => sum + e.energy, 0) / entries.length

    // Calculate streak (consecutive days with entries)
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    let streakDays = 0
    const today = new Date().toISOString().split('T')[0]

    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = sortedEntries[i].date
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - i)
      const expectedDateStr = expectedDate.toISOString().split('T')[0]

      if (entryDate === expectedDateStr) {
        streakDays++
      } else {
        break
      }
    }

    return {
      totalEntries: entries.length,
      averageMood: Math.round(avgMood * 10) / 10,
      averagePain: Math.round(avgPain * 10) / 10,
      averageEnergy: Math.round(avgEnergy * 10) / 10,
      streakDays,
      lastEntryDate: sortedEntries[0]?.date,
      medicationsActive: meds.length,
      upcomingAppointments: upcomingAppts.length,
      unresolvedAlerts: unresolvedAlerts.length
    }
  })

  const todayEntry = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return dailyEntries.value.find(entry => entry.date === today)
  })

  const recentEntries = computed(() =>
    dailyEntries.value
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7)
  )

  // Actions

  /**
   * Save daily entry for the current patient
   */
  const saveDailyEntry = async (entry: Omit<DailyEntry, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    if (!authStore.user?.uid) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    loading.value = true
    error.value = null

    try {
      const patientId = authStore.user.uid
      const entryId = `${patientId}_${entry.date}`

      const entryData: DailyEntry = {
        ...entry,
        id: entryId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Ensure updatedAt is always a Date object
      if (!entryData.updatedAt || !(entryData.updatedAt instanceof Date)) {
        entryData.updatedAt = new Date()
      }

      // Check if entry already exists
      const existingEntryIndex = dailyEntries.value.findIndex(e => e.id === entryId)

      if (existingEntryIndex >= 0) {
        // Update existing entry
        dailyEntries.value[existingEntryIndex] = entryData
        await updateDoc(doc(db, 'patientData', patientId, 'dailyEntries', entryId), {
          ...entryData,
          updatedAt: Timestamp.fromDate(entryData.updatedAt!)
        })
      } else {
        // Create new entry
        dailyEntries.value.push(entryData)
        await setDoc(doc(db, 'patientData', patientId, 'dailyEntries', entryId), {
          ...entryData,
          createdAt: Timestamp.fromDate(entryData.createdAt),
          updatedAt: Timestamp.fromDate(entryData.updatedAt)
        })
      }

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error saving daily entry:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Load daily entries for a patient (one-time)
   */
  const loadDailyEntries = async (patientId: string): Promise<{ success: boolean; error?: string }> => {
    loading.value = true
    error.value = null

    try {
      const entriesRef = collection(db, 'patientData', patientId, 'dailyEntries')
      const q = query(entriesRef, orderBy('date', 'desc'))
      const snapshot = await getDocs(q)

      dailyEntries.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as DailyEntry[]

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error loading daily entries:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Load daily entries for a patient with real-time updates
   */
  const loadDailyEntriesRealtime = (patientId: string, onUpdate?: (entries: DailyEntry[]) => void) => {
    const entriesRef = collection(db, 'patientData', patientId, 'dailyEntries')
    const q = query(entriesRef, orderBy('date', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as DailyEntry[]

      // Update global store
      dailyEntries.value = entries

      // Call callback if provided (for cache updates)
      if (onUpdate) {
        onUpdate(entries)
      }
    }, (err) => {
      error.value = err.message
      console.error('Error in daily entries realtime listener:', err)
    })

    // Store unsubscribe function for cleanup
    if (!unsubscribers.value[patientId]) {
      unsubscribers.value[patientId] = []
    }
    unsubscribers.value[patientId].push(unsubscribe)
  }

  /**
   * Load medications for a patient (one-time)
   */
  const loadMedications = async (patientId: string): Promise<{ success: boolean; error?: string }> => {
    loading.value = true
    error.value = null

    try {
      const medsRef = collection(db, 'patientData', patientId, 'medications')
      const q = query(medsRef, where('active', '==', true), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)

      medications.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Medication[]

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error loading medications:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Load medications for a patient with real-time updates
   */
  const loadMedicationsRealtime = (patientId: string, onUpdate?: (medications: Medication[]) => void) => {
    const medsRef = collection(db, 'patientData', patientId, 'medications')
    const q = query(medsRef, where('active', '==', true), orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Medication[]

      // Update global store
      medications.value = meds

      // Call callback if provided (for cache updates)
      if (onUpdate) {
        onUpdate(meds)
      }
    }, (err) => {
      error.value = err.message
      console.error('Error in medications realtime listener:', err)
    })

    // Store unsubscribe function for cleanup
    if (!unsubscribers.value[patientId]) {
      unsubscribers.value[patientId] = []
    }
    unsubscribers.value[patientId].push(unsubscribe)
  }

  /**
   * Load appointments for a patient (one-time)
   */
  const loadAppointments = async (patientId: string): Promise<{ success: boolean; error?: string }> => {
    loading.value = true
    error.value = null

    try {
      const apptsRef = collection(db, 'patientData', patientId, 'appointments')
      const q = query(apptsRef, orderBy('date', 'desc'))
      const snapshot = await getDocs(q)

      appointments.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Appointment[]

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error loading appointments:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Load appointments for a patient with real-time updates
   */
  const loadAppointmentsRealtime = (patientId: string, onUpdate?: (appointments: Appointment[]) => void) => {
    const apptsRef = collection(db, 'patientData', patientId, 'appointments')
    const q = query(apptsRef, orderBy('date', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Appointment[]

      // Update global store
      appointments.value = appts

      // Call callback if provided (for cache updates)
      if (onUpdate) {
        onUpdate(appts)
      }
    }, (err) => {
      error.value = err.message
      console.error('Error in appointments realtime listener:', err)
    })

    // Store unsubscribe function for cleanup
    if (!unsubscribers.value[patientId]) {
      unsubscribers.value[patientId] = []
    }
    unsubscribers.value[patientId].push(unsubscribe)
  }

  /**
   * Load alerts for a patient (one-time)
   */
  const loadAlerts = async (patientId: string): Promise<{ success: boolean; error?: string }> => {
    loading.value = true
    error.value = null

    try {
      const alertsRef = collection(db, 'patientData', patientId, 'alerts')
      const q = query(alertsRef, where('resolved', '==', false), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)

      alerts.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        resolvedAt: doc.data().resolvedAt?.toDate()
      })) as Alert[]

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error loading alerts:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Load alerts for a patient with real-time updates
   */
  const loadAlertsRealtime = (patientId: string, onUpdate?: (alerts: Alert[]) => void) => {
    const alertsRef = collection(db, 'patientData', patientId, 'alerts')
    const q = query(alertsRef, where('resolved', '==', false), orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alrts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        resolvedAt: doc.data().resolvedAt?.toDate()
      })) as Alert[]

      // Update global store
      alerts.value = alrts

      // Call callback if provided (for cache updates)
      if (onUpdate) {
        onUpdate(alrts)
      }
    }, (err) => {
      error.value = err.message
      console.error('Error in alerts realtime listener:', err)
    })

    // Store unsubscribe function for cleanup
    if (!unsubscribers.value[patientId]) {
      unsubscribers.value[patientId] = []
    }
    unsubscribers.value[patientId].push(unsubscribe)
  }

  /**
   * Create an alert for a patient
   */
  const createAlert = async (
    patientId: string,
    alert: Omit<Alert, 'id' | 'createdAt' | 'resolved' | 'resolvedAt' | 'resolvedBy'>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!authStore.user?.uid) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    loading.value = true
    error.value = null

    try {
      const alertData: Omit<Alert, 'id'> = {
        ...alert,
        createdBy: authStore.user.uid,
        createdAt: new Date(),
        resolved: false
      }

      const docRef = await addDoc(collection(db, 'patientData', patientId, 'alerts'), {
        ...alertData,
        createdAt: Timestamp.fromDate(alertData.createdAt)
      })

      alerts.value.push({ id: docRef.id, ...alertData })

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating alert:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Resolve an alert
   */
  const resolveAlert = async (
    patientId: string,
    alertId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!authStore.user?.uid) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    loading.value = true
    error.value = null

    try {
      await updateDoc(doc(db, 'patientData', patientId, 'alerts', alertId), {
        resolved: true,
        resolvedAt: Timestamp.now(),
        resolvedBy: authStore.user.uid
      })

      const alertIndex = alerts.value.findIndex(a => a.id === alertId)
      if (alertIndex >= 0) {
        alerts.value[alertIndex].resolved = true
        alerts.value[alertIndex].resolvedAt = new Date()
        alerts.value[alertIndex].resolvedBy = authStore.user.uid
      }

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error resolving alert:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Load all patient data for a specific patient
   */
  const loadPatientData = async (patientId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const results = await Promise.allSettled([
        loadDailyEntries(patientId),
        loadMedications(patientId),
        loadAppointments(patientId),
        loadAlerts(patientId)
      ])

      const errors = results
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason)

      if (errors.length > 0) {
        return { success: false, error: errors.join(', ') }
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  /**
   * Initialize store for current user (if patient)
   */
  const initializeForCurrentUser = async () => {
    if (!authStore.user?.uid || authStore.userData?.role !== 'patient') return

    await loadPatientData(authStore.user.uid)
  }

  /**
   * Clear all data
   */
  const clearData = () => {
    dailyEntries.value = []
    medications.value = []
    appointments.value = []
    alerts.value = []
    error.value = null
  }

  /**
   * Cleanup all real-time listeners
   */
  const cleanupListeners = () => {
    Object.values(unsubscribers.value).forEach(unsubs => {
      unsubs.forEach(unsub => unsub())
    })
    unsubscribers.value = {}
  }

  return {
    // State
    dailyEntries,
    medications,
    appointments,
    alerts,
    loading,
    error,

    // Computed
    patientStats,
    todayEntry,
    recentEntries,

    // Actions
    saveDailyEntry,
    loadDailyEntries,
    loadDailyEntriesRealtime,
    loadMedications,
    loadMedicationsRealtime,
    loadAppointments,
    loadAppointmentsRealtime,
    loadAlerts,
    loadAlertsRealtime,
    createAlert,
    resolveAlert,
    loadPatientData,
    initializeForCurrentUser,
    clearData,
    cleanupListeners
  }
})