import { defineComponent, ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRelationshipsStore } from '@/stores/relationships'
import { usePatientDataStore } from '@/stores/patientData'
import { useCareTasksStore } from '@/stores/careTasks'
import AppButton from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import ConnectionManager from '@/components/ConnectionManager'
import {
  Users, Calendar, BookOpen, MessageCircle, Bell, Heart, Clock, AlertTriangle,
  CheckCircle2, Pill, ArrowLeft, Home, Activity, TrendingUp, Shield, Phone,
  Plus, ChevronRight, Star, Target, LogOut, X
} from 'lucide-vue-next'

type TabId = 'home' | 'agenda' | 'monitoring' | 'support' | 'connections'

/* ===== UI mínimos locales con tokens ===== */
const Badge = defineComponent({
  name: 'Badge',
  props: { class: { type: String, default: '' } },
  setup(props, { slots }) {
    return () => (
      <span class={['inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border', props.class]}>
        {slots.default?.()}
      </span>
    )
  }
})

const Checkbox = defineComponent({
  name: 'Checkbox',
  props: {
    checked: { type: Boolean, default: false },
    class: { type: String, default: '' }
  },
  emits: ['update:checked', 'checkedChange'],
  setup(props, { emit }) {
    return () => (
      <input
        type="checkbox"
        class={[
          'w-5 h-5 rounded-md outline-none',
          'bg-surface border border-outline/60',
          'text-brand-600 focus:ring-2 focus:ring-[rgb(var(--brand-500))/0.25]'
          , props.class
        ]}
        checked={props.checked}
        onChange={(e: Event) => {
          const v = (e.target as HTMLInputElement).checked
          emit('update:checked', v)
          emit('checkedChange', v)
        }}
      />
    )
  }
})

const Alert = defineComponent({
  name: 'Alert',
  props: { class: { type: String, default: '' } },
  setup(props, { slots }) {
    return () => (
      <div class={['p-4 rounded-2xl border flex items-start gap-3', props.class]}>
        {slots.default?.()}
      </div>
    )
  }
})

const AlertDescription = defineComponent({
  name: 'AlertDescription',
  setup(_, { slots }) {
    return () => <div class="text-sm text-onSurface/80">{slots.default?.()}</div>
  }
})

const MobileBottomNav = defineComponent({
  name: 'MobileBottomNav',
  props: {
    activeTab: { type: String as () => TabId, required: true },
    tabs: {
      type: Array as () => Array<{ id: TabId; label: string; icon: () => JSX.Element }>,
      required: true
    }
  },
  emits: ['update:activeTab'],
  setup(props, { emit }) {
    return () => (
      <nav class="sticky bottom-0 z-40 bg-surface/70 backdrop-blur border-t border-outline/40">
        <div class="grid grid-cols-4">
          {props.tabs.map((t) => {
            const active = props.activeTab === t.id
            return (
              <button
                key={t.id}
                class={[
                  'py-3 text-sm flex flex-col items-center justify-center gap-1',
                  active ? 'text-brand-600 font-medium' : 'text-onSurface/70'
                ]}
                onClick={() => emit('update:activeTab', t.id)}
              >
                {t.icon()}
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    )
  }
})
/* ===== fin UI mínimos ===== */

export default defineComponent({
  name: 'CaregiverDashboard',
  emits: ['back'],
  setup(_, { emit }) {
    const authStore = useAuthStore()
    const relationshipsStore = useRelationshipsStore()
    const patientDataStore = usePatientDataStore()
    const careTasksStore = useCareTasksStore()
    const completedTasks = ref<Set<string>>(new Set())
    const deletedTasks = ref<Set<string>>(new Set())

    // Load completed tasks from localStorage
    const loadCompletedTasksFromStorage = () => {
      try {
        const stored = localStorage.getItem('caregiver_completed_tasks')
        if (stored) {
          const completedArray = JSON.parse(stored)
          completedTasks.value = new Set(completedArray)
        }
      } catch (error) {
        console.error('Error loading completed tasks from localStorage:', error)
      }
    }

    // Save completed tasks to localStorage
    const saveCompletedTasksToStorage = () => {
      try {
        localStorage.setItem('caregiver_completed_tasks', JSON.stringify([...completedTasks.value]))
      } catch (error) {
        console.error('Error saving completed tasks to localStorage:', error)
      }
    }

    // Load deleted tasks from localStorage
    const loadDeletedTasksFromStorage = () => {
      try {
        const stored = localStorage.getItem('caregiver_deleted_tasks')
        if (stored) {
          const deletedArray = JSON.parse(stored)
          deletedTasks.value = new Set(deletedArray)
        }
      } catch (error) {
        console.error('Error loading deleted tasks from localStorage:', error)
      }
    }

    // Save deleted tasks to localStorage
    const saveDeletedTasksToStorage = () => {
      try {
        localStorage.setItem('caregiver_deleted_tasks', JSON.stringify([...deletedTasks.value]))
      } catch (error) {
        console.error('Error saving deleted tasks to localStorage:', error)
      }
    }

    const activeTab = ref<TabId>('home')
    const selectedPatientId = ref<string>('')
    const patientDataCache = ref<Record<string, any>>({})

    // Task management - now using Firebase store
    const customTasks = computed(() =>
      careTasksStore.tasks.filter(task => task.patientId === selectedPatient.value?.userId)
    )

    // Load all data on mount
    loadCompletedTasksFromStorage()
    loadDeletedTasksFromStorage()

    const showAddTaskModal = ref(false)
    const newTask = ref({
      time: '09:00',
      task: '',
      urgent: false,
      category: 'comfort'
    })
    const selectedTasksToDelete = ref<string[]>([])

    // Computed property for selected tasks count to ensure reactivity
    const selectedTasksCount = computed(() => selectedTasksToDelete.value.length)

    // Computed properties for patient data
    const myPatients = computed(() => relationshipsStore.myPatients)
    const selectedPatient = computed(() =>
      myPatients.value.find(p => p.userId === selectedPatientId.value) || myPatients.value[0]
    )

    // Load patient data when patients change
    watch(myPatients, async (newPatients) => {
      if (newPatients.length > 0) {
        // Load data for all patients in parallel and cache results
        const results = await Promise.allSettled(
          newPatients.map(async (patient) => {
            const result = await patientDataStore.loadPatientData(patient.userId)
            if (result.success) {
              // Cache the loaded data
              patientDataCache.value[patient.userId] = {
                dailyEntries: [...patientDataStore.dailyEntries],
                medications: [...patientDataStore.medications],
                appointments: [...patientDataStore.appointments],
                alerts: [...patientDataStore.alerts],
                stats: { ...patientDataStore.patientStats }
              }
            }
            return result
          })
        )

        // Log any errors but don't break the flow
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Error loading data for patient ${newPatients[index].userId}:`, result.reason)
          }
        })
      }
    }, { immediate: true })

    const selectedPatientData = computed(() => {
      if (!selectedPatient.value) return null
      // Return cached data instead of loading on every access
      return patientDataCache.value[selectedPatient.value.userId]?.stats || null
    })

    // Real medications for selected patient
    const selectedPatientMedications = computed(() => {
      if (!selectedPatient.value) return []
      return patientDataCache.value[selectedPatient.value.userId]?.medications || []
    })

    // Real alerts for selected patient
    const selectedPatientAlerts = computed(() => {
      if (!selectedPatient.value) return []
      return patientDataCache.value[selectedPatient.value.userId]?.alerts || []
    })

    // Set first patient as selected by default
    if (myPatients.value.length > 0 && !selectedPatientId.value) {
      selectedPatientId.value = myPatients.value[0].userId
    }

    const toggleTask = async (taskId: string) => {
      // Check if it's a custom task from Firebase
      const customTask = customTasks.value.find(t => t.id === taskId)
      if (customTask) {
        // Toggle completion in Firebase
        const result = await careTasksStore.toggleTaskCompletion(taskId)
        if (!result.success) {
          alert('Error al actualizar la tarea: ' + result.error)
          return
        }
      } else {
        // Toggle completion in localStorage for default tasks
        const next = new Set(completedTasks.value)
        next.has(taskId) ? next.delete(taskId) : next.add(taskId)
        completedTasks.value = next
        saveCompletedTasksToStorage()
      }
    }

    // Navigation functions
    const goToAgenda = () => {
      activeTab.value = 'agenda'
    }

    // Task management functions
    const openAddTaskModal = () => {
      showAddTaskModal.value = true
      newTask.value = {
        time: '09:00',
        task: '',
        urgent: false,
        category: 'comfort'
      }
    }

    const closeAddTaskModal = () => {
      showAddTaskModal.value = false
    }

    const addCustomTask = async () => {
      if (!newTask.value.task.trim() || !selectedPatient.value || !authStore.user?.uid) {
        alert('Por favor complete el nombre de la tarea y seleccione un paciente')
        return
      }

      const result = await careTasksStore.createTask({
        patientId: selectedPatient.value.userId,
        caregiverId: authStore.user.uid,
        time: newTask.value.time,
        task: newTask.value.task,
        urgent: newTask.value.urgent,
        category: newTask.value.category as 'medication' | 'nutrition' | 'comfort' | 'other',
        completed: false
      })

      if (result.success) {
        closeAddTaskModal()
      } else {
        alert('Error al crear la tarea: ' + result.error)
      }
    }

    const removeTask = async (taskId: string) => {
      // Check if it's a custom task (from Firebase)
      const customTask = customTasks.value.find(t => t.id === taskId)
      if (customTask) {
        // Remove from Firebase
        const result = await careTasksStore.deleteTask(taskId)
        if (!result.success) {
          alert('Error al eliminar la tarea: ' + result.error)
          return
        }
      } else {
        // It's a default task, add to deleted tasks
        deletedTasks.value.add(taskId)
        saveDeletedTasksToStorage()
      }

      // Always remove from completed tasks if it was completed
      completedTasks.value.delete(taskId)
      saveCompletedTasksToStorage()
    }

    const toggleTaskSelection = (taskId: string) => {
      const index = selectedTasksToDelete.value.indexOf(taskId)
      if (index >= 0) {
        selectedTasksToDelete.value.splice(index, 1)
      } else {
        selectedTasksToDelete.value.push(taskId)
      }
    }

    const deleteSelectedTasks = () => {
      if (selectedTasksCount.value === 0) {
        alert('Selecciona al menos una tarea para eliminar')
        return
      }

      const taskCount = selectedTasksCount.value
      const confirmDelete = confirm(`¿Estás seguro de que quieres eliminar ${taskCount} tarea(s)? Esta acción no se puede deshacer.`)
      if (!confirmDelete) return

      // Create a copy of the array to avoid mutation issues during iteration
      const tasksToDelete = [...selectedTasksToDelete.value]

      tasksToDelete.forEach(taskId => {
        removeTask(taskId)
      })

      // Clear the selection array properly for reactivity
      selectedTasksToDelete.value = []
    }

    // Combined tasks for display (default + custom for selected patient)
    const allTasks = computed(() => {
      if (!selectedPatient.value) return []

      const defaultTasks = dailyTasks
        .filter(task => !deletedTasks.value.has(task.id))
        .map(task => ({
          ...task,
          patientId: selectedPatient.value.userId
        }))

      const patientCustomTasks = customTasks.value.filter(task =>
        task.patientId === selectedPatient.value.userId
      )

      return [...defaultTasks, ...patientCustomTasks].sort((a, b) =>
        a.time.localeCompare(b.time)
      )
    })

    const navTabs: Array<{ id: TabId; label: string; icon: () => JSX.Element }> = [
      { id: 'home', label: 'Inicio', icon: () => <Home class="h-5 w-5" /> },
      { id: 'agenda', label: 'Agenda', icon: () => <Calendar class="h-5 w-5" /> },
      { id: 'monitoring', label: 'Seguimiento', icon: () => <Activity class="h-5 w-5" /> },
      { id: 'connections', label: 'Conexiones', icon: () => <Users class="h-5 w-5" /> },
      { id: 'support', label: 'Apoyo', icon: () => <MessageCircle class="h-5 w-5" /> }
    ]

    const dailyTasks = [
      { id: '1', time: '08:00', task: 'Medicación matutina - Morfina 10mg', urgent: false, category: 'medication' },
      { id: '2', time: '12:00', task: 'Almuerzo y revisión de líquidos', urgent: false, category: 'nutrition' },
      { id: '3', time: '14:00', task: 'Medicación para el dolor', urgent: true, category: 'medication' },
      { id: '4', time: '18:00', task: 'Cena y medicación nocturna', urgent: false, category: 'nutrition' },
      { id: '5', time: '20:00', task: 'Cambio de posición y comodidad', urgent: false, category: 'comfort' }
    ] as const

    // Icono por categoría (iconos en blanco; el color lo aporta el contenedor)
    const getCategoryIcon = (category: string) => {
      switch (category) {
        case 'medication': return <Pill class="h-4 w-4 text-white" />
        case 'nutrition':  return <Heart class="h-4 w-4 text-white" />
        case 'comfort':    return <Shield class="h-4 w-4 text-white" />
        default:           return <Clock class="h-4 w-4 text-white" />
      }
    }

    // Gradiente por categoría con paleta reducida
    const getCategoryStyle = (category: string) => {
      switch (category) {
        case 'medication':
          return 'linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)))'
        case 'nutrition':
          return 'linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)))'
        case 'comfort':
        default:
          return 'linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)))'
      }
    }

    const getGreeting = () => {
      const hour = new Date().getHours()
      if (hour < 12) return 'Buenos días'
      if (hour < 18) return 'Buenas tardes'
      return 'Buenas noches'
    }

    return () => (
      <div class="app-container min-h-screen gradient-calm text-onSurface flex flex-col">
        {/* Header */}
        <div class="mobile-header sticky top-0 z-40 backdrop-blur bg-surface/70 border-b border-outline/40 lg:bg-surface/90">
          <div class="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 max-w-7xl mx-auto">
            <AppButton
              class="touch-manipulation rounded-full w-12 h-12 bg-transparent hover:bg-surfaceVariant"
              onClick={() => emit('back')}
            >
              <ArrowLeft class="h-5 w-5 text-onSurface" />
            </AppButton>

            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-soft"
                   style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                <Users class="h-4 w-4 text-onPrimary" />
              </div>
              <h1 class="text-lg font-semibold">Panel Cuidador</h1>
            </div>

            <AppButton
              class="touch-manipulation rounded-full w-12 h-12 bg-transparent hover:bg-surfaceVariant"
              onClick={() => authStore.logout()}
            >
              <LogOut class="h-5 w-5 text-onSurface" />
            </AppButton>
          </div>
        </div>

        <div class="mobile-content px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto flex-1 pb-20">
          {/* HOME */}
          {activeTab.value === 'home' && (
            <div class="space-y-6">
              {/* saludo */}
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-semibold">{getGreeting()}</h2>
                <p class="text-onSurface/70">Cuidando con amor y dedicación</p>
              </div>

              {/* alertas */}
              <Card class="rounded-2xl border border-outline/40 overflow-hidden bg-surface">
                <CardHeader class="pb-4">
                  <CardTitle class="text-lg flex items-center gap-2">
                    <Bell class="h-5 w-5 text-brand-600" />
                    <span>Alertas Importantes</span>
                  </CardTitle>
                  {myPatients.value.length > 1 && (
                    <div class="flex gap-2 mt-2">
                      {myPatients.value.map(patient => (
                        <button
                          key={patient.userId}
                          onClick={() => selectedPatientId.value = patient.userId}
                          class={[
                            'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                            selectedPatientId.value === patient.userId
                              ? 'bg-brand-500 text-white'
                              : 'bg-surfaceVariant text-onSurface/70 hover:bg-surfaceVariant/80'
                          ]}
                        >
                          {patient.userName || 'Paciente'}
                        </button>
                      ))}
                    </div>
                  )}
                </CardHeader>
               <CardContent class="space-y-4">
                 {selectedPatient.value ? (
                   <>
                     {/* Real alerts from patient data */}
                     {selectedPatientAlerts.value.length > 0 ? selectedPatientAlerts.value.slice(0, 2).map((alert: any) => (
                       <div class="flex items-center gap-4 p-3 rounded-2xl border border-[rgb(var(--color-error))/0.35] bg-white/50">
                         <div class="w-10 h-10 rounded-xl grid place-items-center bg-[rgb(var(--color-error))]">
                           <AlertTriangle class="h-5 w-5 text-white" />
                         </div>
                         <div class="flex-1">
                           <p class="font-medium text-onSurface">{alert.message || 'Alerta médica'}</p>
                           <p class="text-sm text-onSurface/80">
                             {alert.createdAt?.toDate?.()?.toLocaleDateString('es-ES') || 'Fecha desconocida'}
                           </p>
                         </div>
                         <Badge class="bg-[rgb(var(--color-error))] text-white border-[rgb(var(--color-error))]">Atención</Badge>
                       </div>
                     )) : (
                       <div class="flex items-center gap-4 p-3 rounded-2xl border border-brand-400/40 bg-brand-50">
                         <div class="w-10 h-10 rounded-xl grid place-items-center"
                              style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                           <CheckCircle2 class="h-5 w-5 text-onPrimary" />
                         </div>
                         <div class="flex-1">
                           <p class="font-medium text-onSurface">Estado estable</p>
                           <p class="text-sm text-onSurface/80">No hay alertas activas</p>
                         </div>
                         <Badge class="bg-brand-50 text-brand-700 border-brand-400/40">Estable</Badge>
                       </div>
                     )}

                     {/* Patient status summary */}
                     <div class="flex items-center gap-4 p-3 rounded-2xl border border-outline/40 bg-surface">
                       <div class="w-10 h-10 rounded-xl grid place-items-center"
                            style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                         <Activity class="h-5 w-5 text-onPrimary" />
                       </div>
                       <div class="flex-1">
                         <p class="font-medium text-onSurface">Estado de {selectedPatient.value.userName || 'Paciente'}</p>
                         <p class="text-sm text-onSurface/80">
                           Dolor: {selectedPatientData.value?.averagePain ? selectedPatientData.value.averagePain.toFixed(1) : '--'}/10 |
                           Ánimo: {selectedPatientData.value?.averageMood ? selectedPatientData.value.averageMood.toFixed(1) : '--'}/10
                         </p>
                       </div>
                       <Badge class="bg-brand-50 text-brand-700 border-brand-400/40">
                         {selectedPatientData.value?.streakDays || 0} días racha
                       </Badge>
                     </div>
                   </>
                 ) : (
                   <div class="text-center py-8">
                     <Users class="h-12 w-12 text-onSurface/40 mx-auto mb-4" />
                     <p class="text-onSurface/60">No tienes pacientes conectados</p>
                     <p class="text-sm text-onSurface/40 mt-2">Ve a la pestaña de conexiones para agregar pacientes</p>
                   </div>
                 )}
               </CardContent>
              </Card>

              {/* resumen */}
              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <CardTitle class="text-lg flex items-center gap-2">
                    <TrendingUp class="h-5 w-5 text-brand-600" />
                    <span>Resumen de {selectedPatient.value?.userName || 'Paciente'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div class="grid grid-cols-3 gap-4">
                    <div class="text-center">
                      <div class="w-14 h-14 mx-auto mb-3 rounded-2xl grid place-items-center shadow-lg"
                          style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                        <CheckCircle2 class="h-7 w-7 text-white" />
                      </div>
                        <p class="font-bold text-lg text-brand-600">{selectedPatientData.value?.totalEntries || 0}</p>
                        <p class="text-xs text-onSurface/70 font-medium">Registros totales</p>
                    </div>
                    <div class="text-center">
                      <div class="w-14 h-14 mx-auto mb-3 rounded-2xl grid place-items-center shadow-lg"
                          style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                        <Pill class="h-7 w-7 text-onPrimary" />
                      </div>
                        <p class="font-bold text-lg text-brand-600">{selectedPatientData.value?.averageMood || 0}/10</p>
                        <p class="text-xs text-onSurface/70 font-medium">Ánimo promedio</p>
                    </div>
                    <div class="text-center">
                      <div class="w-14 h-14 mx-auto mb-3 rounded-2xl grid place-items-center shadow-lg"
                           style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                        <TrendingUp class="h-7 w-7 text-onPrimary" />
                      </div>
                        <p class="font-bold text-lg text-onSurface">{selectedPatientData.value?.streakDays || 0}</p>
                        <p class="text-xs text-onSurface/70 font-medium">Días de racha</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* próximas tareas */}
              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <div class="flex items-center justify-between">
                    <CardTitle class="text-lg flex items-center gap-2">
                      <Target class="h-5 w-5 text-brand-600" />
                      <span>Próximas Tareas</span>
                    </CardTitle>
                    <AppButton
                      class="bg-brand-50 text-brand-600 hover:bg-brand-50/80 px-3 py-1 rounded-xl border border-brand-400/40"
                      onClick={goToAgenda}
                    >
                      <Plus class="h-4 w-4 mr-1" />
                      Añadir
                    </AppButton>
                  </div>
                </CardHeader>
                <CardContent class="space-y-3">
                  {allTasks.value.slice(0, 3).map((task) => {
                    const done = 'completed' in task ? task.completed : completedTasks.value.has(task.id)
                    const base = 'flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200'
                    const state = done
                      ? 'bg-[rgb(var(--color-success))/0.1] border-[rgb(var(--color-success))/0.35]'
                      : task.urgent
                        ? 'bg-[rgb(var(--color-error))/0.1] border-[rgb(var(--color-error))/0.35]'
                        : 'bg-surfaceVariant border-outline/40'
                    return (
                      <div key={task.id} class={[base, state].join(' ')}>
                        <Checkbox
                          checked={done}
                          onCheckedChange={() => toggleTask(task.id)}
                          class="touch-manipulation"
                          onUpdate:checked={() => toggleTask(task.id)}
                        />
                        <div
                          class="w-10 h-10 rounded-xl grid place-items-center shadow-sm"
                          style={{ backgroundImage: getCategoryStyle(task.category) }}
                        >
                          {getCategoryIcon(task.category)}
                        </div>
                        <div class="flex-1">
                          <div class="flex items-center justify-between">
                            <p class={['font-medium', done ? 'line-through text-onSurface/60' : 'text-onSurface'].join(' ')}>
                              {task.task}
                            </p>
                            {task.urgent && !done && (
                              <Badge class="bg-[rgb(var(--color-error))] text-white border-[rgb(var(--color-error))] text-xs">
                                Urgente
                              </Badge>
                            )}
                          </div>
                          <p class="text-sm text-onSurface/70 mt-1">{task.time}</p>
                        </div>
                      </div>
                    )
                  })}
                  <AppButton
                    class="w-full mt-4 h-12 rounded-2xl text-onPrimary"
                    style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
                    onClick={goToAgenda}
                  >
                    Ver Agenda Completa
                    <ChevronRight class="h-4 w-4 ml-2 text-onPrimary" />
                  </AppButton>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AGENDA */}
          {activeTab.value === 'agenda' && (
            <div class="space-y-6">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-semibold">Agenda de Cuidados</h2>
                <p class="text-onSurface/70">Organiza las tareas del día</p>
              </div>

              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <div class="flex items-center justify-between">
                    <CardTitle class="text-lg">Tareas de Hoy</CardTitle>
                    <Badge class="bg-brand-50 text-brand-700 border-brand-400/40">
                      {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent class="space-y-4">
                  {selectedPatient.value ? (
                    allTasks.value.length > 0 ? allTasks.value.map((task) => {
                      const done = 'completed' in task ? task.completed : completedTasks.value.has(task.id)
                      const base = 'flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200'
                      const state = done
                        ? 'bg-[rgb(var(--color-success))/0.1] border-[rgb(var(--color-success))/0.35]'
                        : task.urgent
                          ? 'bg-[rgb(var(--color-error))/0.1] border-[rgb(var(--color-error))/0.35]'
                          : 'bg-surfaceVariant border-outline/40'
                      const isCustomTask = task.id.startsWith('custom_')

                      return (
                        <div key={task.id} class={[base, state].join(' ')}>
                          <Checkbox
                            checked={selectedTasksToDelete.value.includes(task.id)}
                            onUpdate:checked={() => toggleTaskSelection(task.id)}
                            class="touch-manipulation"
                          />
                          <div
                            class="w-12 h-12 rounded-2xl grid place-items-center shadow-lg"
                            style={{ backgroundImage: getCategoryStyle(task.category) }}
                          >
                            {getCategoryIcon(task.category)}
                          </div>
                          <div class="flex-1">
                            <div class="flex items-center justify-between mb-1">
                              <p class="font-medium text-onSurface">
                                {task.task}
                                {isCustomTask && (
                                  <span class="text-xs text-onSurface/50 ml-2">(personalizada)</span>
                                )}
                              </p>
                              <div class="flex items-center gap-2">
                                {task.urgent && (
                                  <Badge class="bg-[rgb(var(--color-error))] text-white border-[rgb(var(--color-error))] text-xs">
                                    Urgente
                                  </Badge>
                                )}
                                {isCustomTask && (
                                  <AppButton
                                    class="w-6 h-6 rounded-full bg-[rgb(var(--color-error))/0.1] hover:bg-[rgb(var(--color-error))/0.2] border border-[rgb(var(--color-error))/0.3]"
                                    onClick={() => removeTask(task.id)}
                                  >
                                    <X class="h-3 w-3 text-[rgb(var(--color-error))]" />
                                  </AppButton>
                                )}
                              </div>
                            </div>
                            <p class="text-sm text-onSurface/70 flex items-center">
                              <Clock class="h-3 w-3 mr-1" />
                              {task.time}
                            </p>
                          </div>
                        </div>
                      )
                    }) : (
                      <div class="text-center py-8">
                        <Target class="h-12 w-12 text-onSurface/40 mx-auto mb-4" />
                        <p class="text-onSurface/60">No hay tareas programadas</p>
                        <p class="text-sm text-onSurface/40 mt-2">Haz clic en "Añadir" para crear tareas personalizadas</p>
                      </div>
                    )
                  ) : (
                    <div class="text-center py-8">
                      <Target class="h-12 w-12 text-onSurface/40 mx-auto mb-4" />
                      <p class="text-onSurface/60">Selecciona un paciente</p>
                      <p class="text-sm text-onSurface/40 mt-2">para gestionar las tareas de cuidado</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div class="space-y-3">
                <AppButton
                  class="w-full h-14 rounded-2xl touch-manipulation shadow-lg text-onPrimary"
                  style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
                  onClick={openAddTaskModal}
                >
                  <Plus class="h-5 w-5 mr-2 text-onPrimary" />
                  Añadir Nueva Tarea
                </AppButton>

                <AppButton
                  class={[
                    'w-full h-14 rounded-2xl touch-manipulation shadow-lg text-onPrimary',
                    selectedTasksCount.value > 0
                      ? 'opacity-100'
                      : 'opacity-50 cursor-not-allowed'
                  ].join(' ')}
                  style="background-image: linear-gradient(90deg, rgb(var(--color-error)), rgb(var(--color-error)));"
                  onClick={deleteSelectedTasks}
                  disabled={selectedTasksCount.value === 0}
                >
                  <X class="h-5 w-5 mr-2 text-onPrimary" />
                  {selectedTasksCount.value > 0
                    ? `Eliminar ${selectedTasksCount.value} tarea(s) seleccionada(s)`
                    : 'Eliminar Tareas Seleccionadas'
                  }
                </AppButton>
              </div>
            </div>
          )}

          {/* MONITORING */}
          {activeTab.value === 'monitoring' && (
            <div class="space-y-6">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-semibold">Seguimiento</h2>
                <p class="text-onSurface/70">Monitor del estado de salud</p>
              </div>

              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <CardTitle class="text-lg flex items-center gap-2">
                    <Activity class="h-5 w-5 text-brand-600" />
                    <span>Estado Actual</span>
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                  {selectedPatient.value ? (
                    <div class="grid grid-cols-2 gap-4">
                      <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-sm font-medium text-onSurface/80">Dolor</span>
                          <span class="font-bold text-[rgb(var(--color-error))]">
                            {selectedPatientData.value?.averagePain ? selectedPatientData.value.averagePain.toFixed(1) : '--'}/10
                          </span>
                        </div>
                        <div class="w-full bg-surfaceVariant rounded-full h-2">
                          <div
                            class="h-2 rounded-full bg-[rgb(var(--color-error))]"
                            style={{ width: selectedPatientData.value?.averagePain ? `${selectedPatientData.value.averagePain * 10}%` : '0%' }}
                          ></div>
                        </div>
                      </div>

                      <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-sm font-medium text-onSurface/80">Ánimo</span>
                          <span class="font-bold text-brand-600">
                            {selectedPatientData.value?.averageMood ? selectedPatientData.value.averageMood.toFixed(1) : '--'}/10
                          </span>
                        </div>
                        <div class="w-full bg-surfaceVariant rounded-full h-2">
                          <div
                            class="h-2 rounded-full"
                            style={{
                              width: selectedPatientData.value?.averageMood ? `${selectedPatientData.value.averageMood * 10}%` : '0%',
                              background: 'linear-gradient(90deg, rgb(var(--brand-400)), rgb(var(--brand-600)))'
                            }}
                          ></div>
                        </div>
                      </div>

                      <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-sm font-medium text-onSurface/80">Energía</span>
                          <span class="font-bold text-onSurface">
                            {selectedPatientData.value?.averageEnergy ? selectedPatientData.value.averageEnergy.toFixed(1) : '--'}/10
                          </span>
                        </div>
                        <div class="w-full bg-surfaceVariant rounded-full h-2">
                          <div
                            class="h-2 rounded-full bg-onSurface/70"
                            style={{ width: selectedPatientData.value?.averageEnergy ? `${selectedPatientData.value.averageEnergy * 10}%` : '0%' }}
                          ></div>
                        </div>
                      </div>

                      <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-sm font-medium text-onSurface/80">Registros</span>
                          <span class="font-bold text-[rgb(var(--color-success))]">
                            {selectedPatientData.value?.totalEntries || 0}
                          </span>
                        </div>
                        <div class="w-full bg-surfaceVariant rounded-full h-2">
                          <div
                            class="h-2 rounded-full bg-[rgb(var(--color-success))]"
                            style={{ width: selectedPatientData.value?.totalEntries ? `${Math.min(selectedPatientData.value.totalEntries * 5, 100)}%` : '0%' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div class="text-center py-8">
                      <Activity class="h-12 w-12 text-onSurface/40 mx-auto mb-4" />
                      <p class="text-onSurface/60">No hay datos disponibles</p>
                      <p class="text-sm text-onSurface/40 mt-2">Conecta con un paciente para ver sus métricas</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <CardTitle class="text-lg flex items-center gap-2">
                    <Pill class="h-5 w-5 text-brand-600" />
                    <span>Medicación de Hoy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-3">
                  {selectedPatient.value ? (
                    selectedPatientMedications.value.length > 0 ? (
                      selectedPatientMedications.value.slice(0, 3).map((medication: any) => {
                        const isActive = medication.active
                        const isCompleted = medication.lastTaken && new Date(medication.lastTaken.toDate()).toDateString() === new Date().toDateString()

                        return (
                          <div class={[
                            'flex items-center justify-between p-3 rounded-xl border bg-white/50',
                            isActive ? 'border-[rgb(var(--color-success))/0.35]' : 'border-outline/40'
                          ].join(' ')}>
                            <div class="flex items-center gap-3">
                              {isCompleted ? (
                                <CheckCircle2 class="h-5 w-5 text-[rgb(var(--color-success))]" />
                              ) : (
                                <Clock class="h-5 w-5 text-onSurface/60" />
                              )}
                              <div>
                                <p class="font-medium text-onSurface">{medication.name || 'Medicamento'}</p>
                                <p class="text-sm text-onSurface/70">
                                  {medication.dosage || 'Dosis no especificada'} - {medication.frequency || 'Frecuencia no especificada'}
                                </p>
                              </div>
                            </div>
                            <Badge class={
                              isCompleted
                                ? 'bg-[rgb(var(--color-success))] text-white border-[rgb(var(--color-success))]'
                                : isActive
                                  ? 'bg-brand-50 text-brand-700 border-brand-400/40'
                                  : 'bg-surfaceVariant text-onSurface border-outline/40'
                            }>
                              {isCompleted ? 'Tomada' : isActive ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </div>
                        )
                      })
                    ) : (
                      <div class="text-center py-8">
                        <Pill class="h-12 w-12 text-onSurface/40 mx-auto mb-4" />
                        <p class="text-onSurface/60">No hay medicación registrada</p>
                        <p class="text-sm text-onSurface/40 mt-2">La medicación aparecerá aquí cuando sea prescrita</p>
                      </div>
                    )
                  ) : (
                    <div class="text-center py-8">
                      <Users class="h-12 w-12 text-onSurface/40 mx-auto mb-4" />
                      <p class="text-onSurface/60">Selecciona un paciente</p>
                      <p class="text-sm text-onSurface/40 mt-2">para ver su medicación</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* CONNECTIONS */}
          {activeTab.value === 'connections' && (
            <div class="space-y-6">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-semibold">Mis Conexiones</h2>
                <p class="text-onSurface/70">Gestiona tu red de apoyo</p>
              </div>
              <ConnectionManager />
            </div>
          )}

          {/* SUPPORT */}
          {activeTab.value === 'support' && (
            <div class="space-y-6">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-semibold">Red de Apoyo</h2>
                <p class="text-onSurface/70">Conecta con profesionales y recursos</p>
              </div>

              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <CardTitle class="text-lg flex items-center gap-2">
                    <Phone class="h-5 w-5 text-[rgb(var(--color-error))]" />
                    <span>Contactos de Emergencia</span>
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                  <AppButton
                    class="w-full h-14 rounded-2xl touch-manipulation shadow-lg text-white"
                    style="background-image: linear-gradient(90deg, rgb(var(--color-error)), rgb(var(--color-error)));"
                  >
                    <Phone class="h-5 w-5 mr-2 text-white" />
                    Llamada de Emergencia
                  </AppButton>
                  <AppButton
                    class="w-full h-14 rounded-2xl touch-manipulation text-onPrimary"
                    style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
                  >
                    <MessageCircle class="h-5 w-5 mr-2 text-onPrimary" />
                    Contactar Médico de Familia
                  </AppButton>
                </CardContent>
              </Card>

              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <CardTitle class="text-lg flex items-center gap-2">
                    <BookOpen class="h-5 w-5 text-brand-600" />
                    <span>Recursos de Apoyo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-3">
                  <div class="flex items-center gap-4 p-4 rounded-2xl border border-brand-400/40 bg-brand-50">
                    <div class="w-12 h-12 rounded-2xl grid place-items-center"
                         style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                      <BookOpen class="h-6 w-6 text-onPrimary" />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-onSurface">Guía de Cuidados Paliativos</p>
                      <p class="text-sm text-onSurface/70">Consejos prácticos para cuidadores</p>
                    </div>
                    <ChevronRight class="h-5 w-5 text-onSurface/40" />
                  </div>

                  <div class="flex items-center gap-4 p-4 rounded-2xl border border-outline/40 bg-surface">
                    <div class="w-12 h-12 rounded-2xl grid place-items-center"
                        style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                      <Heart class="h-6 w-6 text-white" />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-onSurface">Apoyo Emocional</p>
                      <p class="text-sm text-onSurface/70">Grupos de apoyo para familiares</p>
                    </div>
                    <ChevronRight class="h-5 w-5 text-onSurface/40" />
                  </div>

                  <div class="flex items-center gap-4 p-4 rounded-2xl border border-outline/40 bg-surface">
                    <div class="w-12 h-12 rounded-2xl grid place-items-center"
                        style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                      <Shield class="h-6 w-6 text-onPrimary" />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-onSurface">Gestión del Dolor</p>
                      <p class="text-sm text-onSurface/70">Técnicas de alivio y confort</p>
                    </div>
                    <ChevronRight class="h-5 w-5 text-onSurface/40" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Bottom Nav */}
        <nav class="fixed bottom-0 left-0 right-0 z-40 bg-surface/70 backdrop-blur border-t border-outline/40">
          <div class="grid grid-cols-5 max-w-7xl mx-auto">
            {navTabs.map((t) => {
              const active = activeTab.value === t.id
              return (
                <button
                  key={t.id}
                  class={[
                    'py-3 px-2 text-xs flex flex-col items-center justify-center gap-1 transition-colors',
                    active ? 'text-brand-600 font-medium' : 'text-onSurface/70'
                  ]}
                  onClick={() => (activeTab.value = t.id)}
                >
                  {t.icon()}
                  <span class="truncate w-full text-center">{t.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Add Task Modal */}
        {showAddTaskModal.value && (
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div class="mx-4 w-full max-w-md rounded-3xl bg-surface p-6 shadow-2xl">
              <div class="mb-6 flex items-center justify-between">
                <h3 class="text-xl font-semibold text-onSurface">Nueva Tarea</h3>
                <AppButton
                  class="rounded-full w-8 h-8 bg-surfaceVariant hover:bg-surfaceVariant/80"
                  onClick={closeAddTaskModal}
                >
                  <X class="h-4 w-4 text-onSurface" />
                </AppButton>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-onSurface/80 mb-2">Tarea</label>
                  <input
                    type="text"
                    class="w-full p-3 rounded-2xl bg-surface border border-outline/40 focus:ring-2 focus:ring-[rgb(var(--brand-500))/0.2] outline-none"
                    placeholder="Ej: Recordar tomar medicación"
                    v-model={newTask.value.task}
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-onSurface/80 mb-2">Hora</label>
                    <input
                      type="time"
                      class="w-full p-3 rounded-2xl bg-surface border border-outline/40 focus:ring-2 focus:ring-[rgb(var(--brand-500))/0.2] outline-none"
                      v-model={newTask.value.time}
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-onSurface/80 mb-2">Categoría</label>
                    <select
                      class="w-full p-3 rounded-2xl bg-surface border border-outline/40 focus:ring-2 focus:ring-[rgb(var(--brand-500))/0.2] outline-none"
                      v-model={newTask.value.category}
                    >
                      <option value="medication">Medicación</option>
                      <option value="nutrition">Alimentación</option>
                      <option value="comfort">Confort</option>
                    </select>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <Checkbox
                    checked={newTask.value.urgent}
                    onUpdate:checked={(checked: boolean) => newTask.value.urgent = checked}
                  />
                  <label class="text-sm font-medium text-onSurface/80">Marcar como urgente</label>
                </div>
              </div>

              <div class="mt-6 flex gap-3">
                <AppButton
                  class="flex-1 h-12 rounded-2xl text-onSurface bg-surface border border-outline/40"
                  onClick={closeAddTaskModal}
                >
                  Cancelar
                </AppButton>
                <AppButton
                  class="flex-1 h-12 rounded-2xl text-onPrimary"
                  style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
                  onClick={addCustomTask}
                >
                  Añadir Tarea
                </AppButton>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
})
