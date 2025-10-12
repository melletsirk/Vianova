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
  deleteDoc
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth'
import type { CareTask } from '@/types/relationships'

export const useCareTasksStore = defineStore('careTasks', () => {
  const authStore = useAuthStore()

  // State
  const tasks = ref<CareTask[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const tasksByPatient = computed(() => {
    const grouped: Record<string, CareTask[]> = {}
    tasks.value.forEach(task => {
      if (!grouped[task.patientId]) {
        grouped[task.patientId] = []
      }
      grouped[task.patientId].push(task)
    })
    return grouped
  })

  const todayTasks = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return tasks.value.filter(task => {
      const taskDate = task.createdAt.toISOString().split('T')[0]
      return taskDate === today
    })
  })

  const completedTasks = computed(() =>
    tasks.value.filter(task => task.completed)
  )

  const pendingTasks = computed(() =>
    tasks.value.filter(task => !task.completed)
  )

  // Actions

  /**
   * Load tasks for a specific caregiver
   */
  const loadTasks = async (caregiverId: string): Promise<{ success: boolean; error?: string }> => {
    loading.value = true
    error.value = null

    try {
      const tasksRef = collection(db, 'careTasks')
      const q = query(
        tasksRef,
        where('caregiverId', '==', caregiverId),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)

      tasks.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate()
      })) as CareTask[]

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error loading tasks:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new care task
   */
  const createTask = async (taskData: Omit<CareTask, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    if (!authStore.user?.uid) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    loading.value = true
    error.value = null

    try {
      const task: Omit<CareTask, 'id'> = {
        ...taskData,
        createdAt: new Date()
      }

      const docRef = await addDoc(collection(db, 'careTasks'), {
        ...task,
        createdAt: Timestamp.fromDate(task.createdAt),
        updatedAt: task.updatedAt ? Timestamp.fromDate(task.updatedAt) : null,
        completedAt: task.completedAt ? Timestamp.fromDate(task.completedAt) : null
      })

      tasks.value.push({ id: docRef.id, ...task })

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating task:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Update a task
   */
  const updateTask = async (
    taskId: string,
    updates: Partial<Omit<CareTask, 'id' | 'createdAt'>>
  ): Promise<{ success: boolean; error?: string }> => {
    loading.value = true
    error.value = null

    try {
      const taskRef = doc(db, 'careTasks', taskId)
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      }

      if (updates.completedAt) {
        updateData.completedAt = Timestamp.fromDate(updates.completedAt)
      }

      await updateDoc(taskRef, updateData)

      // Update local state
      const taskIndex = tasks.value.findIndex(t => t.id === taskId)
      if (taskIndex >= 0) {
        tasks.value[taskIndex] = {
          ...tasks.value[taskIndex],
          ...updates,
          updatedAt: new Date()
        }
      }

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error updating task:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Toggle task completion
   */
  const toggleTaskCompletion = async (taskId: string): Promise<{ success: boolean; error?: string }> => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) {
      return { success: false, error: 'Tarea no encontrada' }
    }

    const updates: Partial<CareTask> = {
      completed: !task.completed,
      completedAt: !task.completed ? new Date() : undefined
    }

    return updateTask(taskId, updates)
  }

  /**
   * Delete a task
   */
  const deleteTask = async (taskId: string): Promise<{ success: boolean; error?: string }> => {
    loading.value = true
    error.value = null

    try {
      await deleteDoc(doc(db, 'careTasks', taskId))

      // Remove from local state
      const taskIndex = tasks.value.findIndex(t => t.id === taskId)
      if (taskIndex >= 0) {
        tasks.value.splice(taskIndex, 1)
      }

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting task:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Initialize store for current caregiver
   */
  const initialize = async () => {
    if (!authStore.user?.uid || authStore.userData?.role !== 'caregiver') return

    await loadTasks(authStore.user.uid)
  }

  /**
   * Clear all tasks
   */
  const clearTasks = () => {
    tasks.value = []
    error.value = null
  }

  return {
    // State
    tasks,
    loading,
    error,

    // Computed
    tasksByPatient,
    todayTasks,
    completedTasks,
    pendingTasks,

    // Actions
    loadTasks,
    createTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
    initialize,
    clearTasks
  }
})