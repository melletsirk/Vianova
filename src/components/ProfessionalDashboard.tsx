import { defineComponent, ref, computed, watch, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRelationshipsStore } from '@/stores/relationships'
import { usePatientDataStore } from '@/stores/patientData'
import { useMessagesStore } from '@/stores/messages'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import AppButton from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import ConnectionManager from '@/components/ConnectionManager'
import {
  Stethoscope, Users, Activity, MessageCircle, AlertTriangle, Clock,
  TrendingDown, TrendingUp, Heart, FileText, Send, ArrowLeft, Home, User,
  BarChart3, Calendar, ChevronRight, Plus, Filter, Search, Bell, CheckCircle2, XCircle, Minus, LogOut, X, ChevronLeft
} from 'lucide-vue-next'

type TabId = 'patients' | 'analytics' | 'schedule' | 'communication' | 'connections'

/* ===== UI mínimos locales ===== */
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

const Textarea = defineComponent({
  name: 'Textarea',
  props: {
    modelValue: { type: String, default: '' },
    rows: { type: Number, default: 4 },
    placeholder: { type: String, default: '' },
    class: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => (
      <textarea
        value={props.modelValue}
        rows={props.rows}
        placeholder={props.placeholder}
        class={[
          'w-full px-3 py-2 rounded-2xl border outline-none focus:ring-2',
          'bg-surfaceVariant border-outline/40 text-onSurface placeholder-onSurface/50',
          'focus:ring-[rgb(var(--brand-500))/0.2]',
          props.class
        ]}
        onInput={(e: Event) => emit('update:modelValue', (e.target as HTMLTextAreaElement).value)}
      />
    )
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
          {props.tabs.map(t => {
            const active = props.activeTab === t.id
            return (
              <button
                key={t.id}
                class={[
                  'py-3 text-sm flex flex-col items-center justify-center gap-1',
                  active ? 'text-brand-600 font-medium' : 'text-onSurface/70'
                ].join(' ')}
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
  name: 'ProfessionalDashboard',
  emits: ['back'],
  setup(_, { emit }) {
    const authStore = useAuthStore()
    const relationshipsStore = useRelationshipsStore()
    const patientDataStore = usePatientDataStore()
    const messagesStore = useMessagesStore()
    const selectedPatient = ref('')
    const recommendation = ref('')
    const activeTab = ref<TabId>('patients')
    const patientDataCache = ref<Record<string, any>>({})
    const isLoadingPatients = ref(false)
    const isLoadingAnalytics = ref(false)
    const searchQuery = ref('')

    // Modal states for schedule functionality
    const showAddAppointmentModal = ref(false)
    const showCalendarModal = ref(false)
    const showPatientDetailModal = ref(false)
    const selectedPatientForDetail = ref<string | null>(null)

    // New appointment form data
    const newAppointment = ref({
      patientId: '',
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      time: '09:00',
      duration: 30,
      type: 'consultation' as 'consultation' | 'followup' | 'emergency'
    })

    // Computed properties for real patient data
    const myPatients = computed(() => relationshipsStore.myPatients)

    // Filtered patients based on search query
    const filteredPatients = computed(() => {
      if (!searchQuery.value.trim()) {
        return myPatients.value
      }

      const query = searchQuery.value.toLowerCase().trim()
      return myPatients.value.filter(patient => {
        const name = patient.userName?.toLowerCase() || ''
        const email = patient.userEmail?.toLowerCase() || ''
        const id = patient.userId.toLowerCase()

        return name.includes(query) ||
               email.includes(query) ||
               id.includes(query)
      })
    })

    // Selected patient data for detail modal
    const selectedPatientData = computed(() => {
      if (!selectedPatientForDetail.value) return null
      const patient = myPatients.value.find(p => p.userId === selectedPatientForDetail.value)
      const cachedData = patientDataCache.value[selectedPatientForDetail.value]
      return { patient, data: cachedData }
    })

    // Load patient data when patients change with initial load + real-time listeners
    watch(myPatients, async (newPatients) => {
      if (newPatients.length > 0) {
        isLoadingPatients.value = true

        // First load existing historical data for all patients in parallel with controlled concurrency
        const BATCH_SIZE = 3 // Load 3 patients at a time to avoid overwhelming Firebase
        for (let i = 0; i < newPatients.length; i += BATCH_SIZE) {
          const batch = newPatients.slice(i, i + BATCH_SIZE)
          const results = await Promise.allSettled(
            batch.map(async (patient) => {
              // Skip if already cached
              if (patientDataCache.value[patient.userId]) {
                return { success: true }
              }

              const result = await patientDataStore.loadPatientData(patient.userId)
              if (result.success) {
                // Cache the loaded data
                patientDataCache.value[patient.userId] = {
                  dailyEntries: [...patientDataStore.dailyEntries],
                  medications: [...patientDataStore.medications],
                  appointments: [...patientDataStore.appointments],
                  alerts: [...patientDataStore.alerts],
                  stats: { ...patientDataStore.patientStats },
                  loadedAt: Date.now()
                }
              }
              return result
            })
          )

          // Log any errors but don't break the flow
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.error(`Error loading data for patient ${batch[index].userId}:`, result.reason)
            }
          })

          // Small delay between batches to prevent rate limiting
          if (i + BATCH_SIZE < newPatients.length) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }

        // Then setup real-time listeners for continuous updates
        newPatients.forEach(patient => {
          patientDataStore.loadDailyEntriesRealtime(patient.userId, (entries) => {
            if (patientDataCache.value[patient.userId]) {
              // Replace entire cache entry to trigger reactivity
              patientDataCache.value[patient.userId] = {
                ...patientDataCache.value[patient.userId],
                dailyEntries: [...entries],
                stats: { ...patientDataStore.patientStats }
              }
            }
          })
          patientDataStore.loadMedicationsRealtime(patient.userId, (medications) => {
            if (patientDataCache.value[patient.userId]) {
              // Replace entire cache entry to trigger reactivity
              patientDataCache.value[patient.userId] = {
                ...patientDataCache.value[patient.userId],
                medications: [...medications]
              }
            }
          })
          patientDataStore.loadAppointmentsRealtime(patient.userId, (appointments) => {
            if (patientDataCache.value[patient.userId]) {
              // Replace entire cache entry to trigger reactivity
              patientDataCache.value[patient.userId] = {
                ...patientDataCache.value[patient.userId],
                appointments: [...appointments]
              }
            }
          })
          patientDataStore.loadAlertsRealtime(patient.userId, (alerts) => {
            if (patientDataCache.value[patient.userId]) {
              // Replace entire cache entry to trigger reactivity
              patientDataCache.value[patient.userId] = {
                ...patientDataCache.value[patient.userId],
                alerts: [...alerts]
              }
            }
          })
        })

        isLoadingPatients.value = false
      }
    }, { immediate: true })

    // Cleanup listeners when component unmounts
    onUnmounted(() => {
      patientDataStore.cleanupListeners()
    })

    const patientStats = computed(() => {
      const patients = myPatients.value
      if (patients.length === 0) return { stable: 0, attention: 0, alerts: 0 }

      let stable = 0
      let attention = 0
      let totalAlerts = 0

      patients.forEach(patient => {
        // Get stats from cached data
        const cachedData = patientDataCache.value[patient.userId]
        if (cachedData?.stats) {
          const patientStats = cachedData.stats
          if (patientStats.averagePain > 7 || patientStats.averageMood < 4) {
            attention++
          } else {
            stable++
          }
          totalAlerts += patientStats.unresolvedAlerts || 0
        }
      })

      return { stable, attention, alerts: totalAlerts }
    })

    // Analytics data from real patient data
    const analyticsData = computed(() => {
      // Don't compute analytics while loading patients
      if (isLoadingPatients.value) {
        isLoadingAnalytics.value = true
        return {
          averagePain: 0,
          averageMood: 0,
          totalEntries: 0,
          activeMedications: 0,
          painTrend: 'stable' as 'up' | 'down' | 'stable',
          moodTrend: 'stable' as 'up' | 'down' | 'stable'
        }
      }

      isLoadingAnalytics.value = false
      const patients = myPatients.value
      if (patients.length === 0) {
        return {
          averagePain: 0,
          averageMood: 0,
          totalEntries: 0,
          activeMedications: 0,
          painTrend: 'stable' as 'up' | 'down' | 'stable',
          moodTrend: 'stable' as 'up' | 'down' | 'stable'
        }
      }

      let totalPain = 0
      let totalMood = 0
      let totalEntries = 0
      let activeMedications = 0
      let painCount = 0
      let moodCount = 0

      patients.forEach(patient => {
        const cachedData = patientDataCache.value[patient.userId]
        if (cachedData?.stats) {
          const stats = cachedData.stats
          if (stats.averagePain > 0) {
            totalPain += stats.averagePain
            painCount++
          }
          if (stats.averageMood > 0) {
            totalMood += stats.averageMood
            moodCount++
          }
          totalEntries += stats.totalEntries || 0
          activeMedications += stats.medicationsActive || 0
        }
      })

      return {
        averagePain: painCount > 0 ? totalPain / painCount : 0,
        averageMood: moodCount > 0 ? totalMood / moodCount : 0,
        totalEntries,
        activeMedications,
        painTrend: 'stable' as 'up' | 'down' | 'stable', // Would need historical data for real trends
        moodTrend: 'stable' as 'up' | 'down' | 'stable'
      }
    })

    // Real alerts from patients
    const realAlerts = computed(() => {
      const alerts: Array<{
        id: string
        patientName: string
        message: string
        severity: 'high' | 'medium' | 'low'
        type: 'pain' | 'mood' | 'medication' | 'activity'
      }> = []

      myPatients.value.forEach(patient => {
        const cachedData = patientDataCache.value[patient.userId]
        if (cachedData?.alerts) {
          cachedData.alerts.forEach((alert: any) => {
            if (!alert.resolved) {
              alerts.push({
                id: alert.id,
                patientName: patient.userName || 'Paciente',
                message: alert.message || 'Alerta médica',
                severity: alert.severity === 'high' ? 'high' : alert.severity === 'medium' ? 'medium' : 'low',
                type: alert.type || 'activity'
              })
            }
          })
        }

        // Generate alerts based on patient stats
        if (cachedData?.stats) {
          const stats = cachedData.stats
          if (stats.averagePain > 7) {
            alerts.push({
              id: `pain-${patient.userId}`,
              patientName: patient.userName || 'Paciente',
              message: `Dolor elevado (${stats.averagePain.toFixed(1)}/10)`,
              severity: 'high',
              type: 'pain'
            })
          }
          if (stats.averageMood < 4) {
            alerts.push({
              id: `mood-${patient.userId}`,
              patientName: patient.userName || 'Paciente',
              message: `Ánimo bajo (${stats.averageMood.toFixed(1)}/10)`,
              severity: 'medium',
              type: 'mood'
            })
          }
        }
      })

      return alerts.slice(0, 5) // Show top 5 alerts
    })

    // Real appointments from patients (only today's appointments for performance)
    const realAppointments = computed(() => {
      // Don't compute if loading
      if (isLoadingPatients.value) return []

      const appointments: Array<{
        id: string
        patientName: string
        title: string
        description: string
        time: string
        type: 'consultation' | 'followup' | 'emergency'
      }> = []

      // Only process if we have cached data to avoid unnecessary computations
      if (Object.keys(patientDataCache.value).length === 0) {
        return appointments
      }

      myPatients.value.forEach(patient => {
        const cachedData = patientDataCache.value[patient.userId]
        if (cachedData?.appointments) {
          cachedData.appointments.forEach((appt: any) => {
            const apptDate = appt.date?.toDate?.() || new Date(appt.date)
            const today = new Date()
            const isToday = apptDate.toDateString() === today.toDateString()

            if (isToday && appt.status === 'scheduled') {
              appointments.push({
                id: appt.id,
                patientName: patient.userName || 'Paciente',
                title: appt.title || 'Cita médica',
                description: appt.description || 'Consulta programada',
                time: appt.time || apptDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                type: appt.type || 'consultation'
              })
            }
          })
        }
      })

      return appointments.sort((a, b) => a.time.localeCompare(b.time))
    })

    // All appointments for calendar modal (computed only when modal is open)
    const allAppointments = computed(() => {
      if (!showCalendarModal.value || isLoadingPatients.value) return []

      const appointments: Array<{
        id: string
        patientName: string
        title: string
        description: string
        date: Date
        time: string
        type: 'consultation' | 'followup' | 'emergency'
      }> = []

      const currentMonthStart = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1)
      const currentMonthEnd = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 0, 23, 59, 59)
      const now = new Date()

      myPatients.value.forEach(patient => {
        const cachedData = patientDataCache.value[patient.userId]
        if (cachedData?.appointments) {
          cachedData.appointments.forEach((appt: any) => {
            if (appt.status === 'scheduled') {
              const apptDate = appt.date?.toDate?.() || new Date(appt.date)

              // Filter appointments for current month and future dates only
              if (apptDate >= currentMonthStart && apptDate <= currentMonthEnd && apptDate >= now) {
                appointments.push({
                  id: appt.id,
                  patientName: patient.userName || 'Paciente',
                  title: appt.title || 'Cita médica',
                  description: appt.description || 'Consulta programada',
                  date: apptDate,
                  time: appt.time || apptDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                  type: appt.type || 'consultation'
                })
              }
            }
          })
        }
      })

      return appointments.sort((a, b) => a.date.getTime() - b.date.getTime())
    })

    // Calendar functionality
    const currentMonth = ref(new Date())
    const selectedDate = ref<Date | null>(null)

    const monthName = computed(() => {
      return currentMonth.value.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    })

    const changeMonth = (direction: number) => {
      currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + direction, 1)
      // Force reactivity update for allAppointments
      showCalendarModal.value = showCalendarModal.value
    }

    // Set first patient as selected by default
    if (myPatients.value.length > 0 && !selectedPatient.value) {
      selectedPatient.value = myPatients.value[0].userId
    }


    const navTabs: Array<{ id: TabId; label: string; icon: () => JSX.Element }> = [
      { id: 'patients', label: 'Pacientes',     icon: () => <User class="h-5 w-5" /> },
      { id: 'analytics', label: 'Análisis',     icon: () => <BarChart3 class="h-5 w-5" /> },
      { id: 'schedule',  label: 'Agenda',       icon: () => <Calendar class="h-5 w-5" /> },
      { id: 'connections', label: 'Conexiones', icon: () => <Users class="h-5 w-5" /> },
      { id: 'communication', label: 'Comunicación', icon: () => <MessageCircle class="h-5 w-5" /> }
    ]

    // Map de estado -> estilos con tokens (paleta reducida)
    const statusGradient: Record<string, string> = {
      good:      'linear-gradient(135deg, rgb(var(--color-success)), rgb(var(--color-success)))',
      stable:    'linear-gradient(135deg, rgb(var(--brand-400)),  rgb(var(--brand-600)))',
      attention: 'linear-gradient(135deg, rgb(var(--brand-400)),  rgb(var(--brand-600)))', // sin warning: usamos brand en modo "atención"
      critical:  'linear-gradient(135deg, rgb(var(--color-error)),  rgb(var(--color-error)))'
    }

    const getStatusBadge = (status: string) => {
      const badgeMap: Record<string, { bg: string; text: string; label: string; border?: string }> = {
        good:      { bg: 'bg-[rgb(var(--color-success))]', text: 'text-white',            label: 'Bien' },
        stable:    { bg: 'bg-brand-50',                    text: 'text-brand-700',       label: 'Estable', border: 'border border-brand-400/40' },
        attention: { bg: 'bg-brand-50',                    text: 'text-brand-700',       label: 'Atención', border: 'border border-brand-400/40' },
        critical:  { bg: 'bg-[rgb(var(--color-error))]',   text: 'text-white',            label: 'Crítico' }
      }
      const s = badgeMap[status] || { bg: 'bg-surfaceVariant', text: 'text-onSurface', label: status }
      return <Badge class={[s.bg, s.text, s.border || 'border-outline/40'].join(' ')}>{s.label}</Badge>
    }

    const getTrendIcon = (trend: string) => {
      switch (trend) {
        case 'up':    return <TrendingUp   class="h-4 w-4 text-[rgb(var(--color-success))]" />
        case 'down':  return <TrendingDown class="h-4 w-4 text-[rgb(var(--color-error))]" />
        case 'stable':
        default:      return <Minus        class="h-4 w-4 text-onSurface/60" />
      }
    }

    const getGreeting = () => {
      const hour = new Date().getHours()
      if (hour < 12) return 'Buenos días'
      if (hour < 18) return 'Buenas tardes'
      return 'Buenas noches'
    }

    // Schedule functionality
    const openAddAppointmentModal = () => {
      showAddAppointmentModal.value = true
      // Reset form
      newAppointment.value = {
        patientId: myPatients.value.length > 0 ? myPatients.value[0].userId : '',
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        duration: 30,
        type: 'consultation'
      }
    }

    const closeAddAppointmentModal = () => {
      showAddAppointmentModal.value = false
    }

    const openCalendarModal = () => {
      showCalendarModal.value = true
    }

    const closeCalendarModal = () => {
      showCalendarModal.value = false
    }

    const openPatientDetailModal = (patientId: string) => {
      selectedPatientForDetail.value = patientId
      showPatientDetailModal.value = true
    }

    const closePatientDetailModal = () => {
      showPatientDetailModal.value = false
      selectedPatientForDetail.value = null
    }

    const saveAppointment = async () => {
      if (!newAppointment.value.patientId || !newAppointment.value.title) {
        alert('Por favor complete todos los campos requeridos')
        return
      }

      // Validate date and time
      const appointmentDateTime = new Date(`${newAppointment.value.date}T${newAppointment.value.time}`)
      const now = new Date()

      if (appointmentDateTime <= now) {
        alert('La fecha y hora de la cita deben ser futuras')
        return
      }

      try {
        const appointmentData = {
          title: newAppointment.value.title,
          description: newAppointment.value.description,
          date: appointmentDateTime,
          time: newAppointment.value.time,
          duration: newAppointment.value.duration,
          type: newAppointment.value.type,
          status: 'scheduled',
          patientId: newAppointment.value.patientId,
          professionalId: authStore.user?.uid,
          professionalName: authStore.userData?.name || 'Profesional',
          createdAt: new Date()
        }

        // Save to patient's appointments subcollection
        await addDoc(
          collection(db, 'patientData', newAppointment.value.patientId, 'appointments'),
          {
            ...appointmentData,
            date: Timestamp.fromDate(appointmentData.date),
            createdAt: Timestamp.fromDate(appointmentData.createdAt)
          }
        )

        // Refresh patient data to show the new appointment
        await patientDataStore.loadPatientData(newAppointment.value.patientId)

        closeAddAppointmentModal()
        alert('Cita programada exitosamente')
      } catch (error) {
        console.error('Error saving appointment:', error)
        alert('Error al guardar la cita')
      }
    }

    const sendRecommendation = async () => {
      if (!selectedPatient.value || !recommendation.value.trim()) {
        alert('Por favor selecciona un paciente y escribe una recomendación')
        return
      }

      try {
        const result = await messagesStore.sendMessage(selectedPatient.value, {
          type: 'recommendation',
          title: 'Recomendación Médica',
          content: recommendation.value.trim()
        })

        if (result.success) {
          recommendation.value = ''
          alert('Recomendación enviada exitosamente')
        } else {
          alert(result.error || 'Error al enviar la recomendación')
        }
      } catch (error) {
        console.error('Error sending recommendation:', error)
        alert('Error al enviar la recomendación')
      }
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
              <div class="w-8 h-8 rounded-full grid place-items-center shadow-soft"
                  style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                <Stethoscope class="h-4 w-4 text-onPrimary" />
              </div>
              <h1 class="text-lg font-semibold">Panel Médico</h1>
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
          {/* PATIENTS */}
          {activeTab.value === 'patients' && (
            <div class="space-y-6">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-semibold">{getGreeting()}, {authStore.userData?.name || 'Dr.'}</h2>
                <p class="text-onSurface/70">Tienes {myPatients.value.length} paciente{myPatients.value.length !== 1 ? 's' : ''} bajo seguimiento</p>
              </div>

              <Card class="rounded-2xl border border-outline/40 overflow-hidden bg-surface">
                <CardContent class="p-6" style="min-height: 148px;">
                  <div class="grid grid-cols-3 gap-4">
                    <div class="text-center">
                      <div class="w-12 h-12 mx-auto mb-2 rounded-2xl grid place-items-center shadow-lg"
                          style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                        <CheckCircle2 class="h-6 w-6 text-white" />
                      </div>
                      <p class="font-bold text-lg text-brand-600">{patientStats.value.stable}</p>
                      <p class="text-xs text-onSurface/70 font-medium">Estables</p>
                    </div>
                    <div class="text-center">
                      <div class="w-12 h-12 mx-auto mb-2 rounded-2xl grid place-items-center shadow-lg"
                          style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                        <AlertTriangle class="h-6 w-6 text-onPrimary" />
                      </div>
                      <p class="font-bold text-lg text-brand-600">{patientStats.value.attention}</p>
                      <p class="text-xs text-onSurface/70 font-medium">Atención</p>
                    </div>
                    <div class="text-center">
                      <div class="w-12 h-12 mx-auto mb-2 rounded-2xl grid place-items-center shadow-lg"
                          style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                        <Bell class="h-6 w-6 text-onPrimary" />
                      </div>
                      <p class="font-bold text-lg text-brand-600">{patientStats.value.alerts}</p>
                      <p class="text-xs text-onSurface/70 font-medium">Alertas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div class="flex gap-3" style="height: 56px; width: 100%; max-width: 100%; box-sizing: border-box; overflow: hidden;">
                <div class="relative flex-shrink-0" style="width: calc(100% - 68px); min-width: calc(100% - 68px); max-width: calc(100% - 68px);">
                  <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-onSurface/50" />
                  <input
                    type="text"
                    placeholder="Buscar paciente..."
                    maxlength="25"
                    class="w-full h-full pl-10 pr-4 bg-surface rounded-2xl border border-outline/40 focus:ring-2 focus:ring-[rgb(var(--brand-500))/0.2] outline-none"
                    style="box-sizing: border-box; overflow: hidden; text-overflow: ellipsis;"
                    v-model={searchQuery.value}
                  />
                </div>
                <AppButton class="rounded-2xl px-4 bg-surface text-onSurface border border-outline/40 flex-shrink-0" style="height: 56px; width: 56px; flex-basis: 56px; box-sizing: border-box;">
                  <Filter class="h-4 w-4" />
                </AppButton>
              </div>

              <div class="space-y-4" style="min-height: 200px;">
                {isLoadingPatients.value ? (
                  <div class="text-center py-12">
                    <div class="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p class="text-onSurface/70">Cargando pacientes...</p>
                  </div>
                ) : filteredPatients.value.length > 0 ? filteredPatients.value.map(patient => {
                  // Get patient data from cache
                  const cachedData = patientDataCache.value[patient.userId]
                  const patientData = cachedData?.stats || {
                    totalEntries: 0,
                    averageMood: 0,
                    averagePain: 0,
                    averageEnergy: 0,
                    streakDays: 0,
                    medicationsActive: 0,
                    upcomingAppointments: 0,
                    unresolvedAlerts: 0
                  }

                  // Determine status based on data
                  const status = patientData.averagePain > 7 || patientData.averageMood < 4 ? 'attention' :
                                patientData.unresolvedAlerts > 0 ? 'attention' : 'stable'

                  return (
                    <Card
                      key={patient.userId}
                      class="rounded-2xl border border-outline/40 cursor-pointer transition-all duration-200 active:scale-[0.98] bg-surface"
                      onClick={() => openPatientDetailModal(patient.userId)}
                    >
                      <CardContent class="p-4">
                        <div class="flex items-center gap-4">
                          <div
                            class="w-14 h-14 rounded-2xl grid place-items-center shadow-lg text-white"
                            style={{ backgroundImage: statusGradient[status] || statusGradient.stable }}
                          >
                            <span class="font-bold text-lg">{patient.userName?.charAt(0).toUpperCase() || '?'}</span>
                          </div>
                          <div class="flex-1">
                            <div class="flex items-center justify-between mb-1">
                              <h3 class="font-semibold">{patient.userName || 'Paciente'}</h3>
                              {getStatusBadge(status)}
                            </div>
                            <p class="text-sm text-onSurface/70 mb-2">
                              Paciente registrado • ID: {patient.userId.slice(-4)}
                            </p>
                            <div class="flex items-center justify-between">
                              <div class="flex items-center gap-4 text-xs text-onSurface/60">
                                <span class="flex items-center">
                                  <Activity class="h-3 w-3 mr-1" />
                                  {patientData.totalEntries} registros
                                </span>
                                <span class="flex items-center">
                                  <Heart class="h-3 w-3 mr-1 text-[rgb(var(--color-error))]" />
                                  Dolor: {patientData.averagePain.toFixed(1)}/10
                                </span>
                                <span class="flex items-center">
                                  <TrendingUp class="h-3 w-3 mr-1 text-brand-600" />
                                  Ánimo: {patientData.averageMood.toFixed(1)}/10
                                </span>
                              </div>
                              <div class="flex items-center gap-2">
                                {patientData.unresolvedAlerts > 0 && (
                                  <Badge class="bg-[rgb(var(--color-error))] text-white border-[rgb(var(--color-error))] text-xs">
                                    {patientData.unresolvedAlerts} alerta{patientData.unresolvedAlerts > 1 ? 's' : ''}
                                  </Badge>
                                )}
                                <ChevronRight class="h-4 w-4 text-onSurface/40" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                }) : searchQuery.value.trim() ? (
                  <div class="text-center py-12">
                    <Search class="h-16 w-16 text-onSurface/40 mx-auto mb-4" />
                    <h3 class="text-lg font-semibold text-onSurface mb-2">No se encontraron pacientes</h3>
                    <p class="text-onSurface/60 mb-6">No hay pacientes que coincidan con "{searchQuery.value}"</p>
                    <AppButton
                      class="rounded-2xl text-onPrimary"
                      style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
                      onClick={() => (searchQuery.value = '')}
                    >
                      Limpiar búsqueda
                    </AppButton>
                  </div>
                ) : (
                  <div class="text-center py-12">
                    <Users class="h-16 w-16 text-onSurface/40 mx-auto mb-4" />
                    <h3 class="text-lg font-semibold text-onSurface mb-2">No tienes pacientes conectados</h3>
                    <p class="text-onSurface/60 mb-6">Los pacientes aparecerán aquí cuando se conecten contigo</p>
                    <AppButton
                      class="rounded-2xl text-onPrimary"
                      style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
                      onClick={() => (activeTab.value = 'connections')}
                    >
                      <Plus class="h-4 w-4 mr-2 text-onPrimary" />
                      Invitar Pacientes
                    </AppButton>
                  </div>
                )}
              </div>

              <AppButton
                class="w-full h-14 rounded-2xl touch-manipulation shadow-lg text-onPrimary"
                style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
                onClick={() => (activeTab.value = 'connections')}
              >
                <Plus class="h-5 w-5 mr-2 text-onPrimary" />
                Añadir Nuevo Paciente
              </AppButton>
            </div>
          )}

          {/* ANALYTICS */}
          {activeTab.value === 'analytics' && (
            <div class="space-y-6">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-semibold">Análisis Clínico</h2>
                <p class="text-onSurface/70">Tendencias y patrones de tus pacientes</p>
              </div>

              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <CardTitle class="text-lg flex items-center gap-2">
                    <BarChart3 class="h-5 w-5 text-brand-600" />
                    <span>Métricas de la Semana</span>
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                  {isLoadingAnalytics.value ? (
                    <div class="text-center py-8">
                      <div class="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p class="text-onSurface/70">Calculando métricas...</p>
                    </div>
                  ) : myPatients.value.length > 0 ? (
                    <div class="grid grid-cols-2 gap-4">
                      <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-sm font-medium text-onSurface/80">Dolor Promedio</span>
                          {getTrendIcon(analyticsData.value.painTrend)}
                        </div>
                        <p class="text-2xl font-bold text-onSurface">
                          {analyticsData.value.averagePain > 0 ? analyticsData.value.averagePain.toFixed(1) : '--'}/10
                        </p>
                        <p class="text-xs text-onSurface/60">
                          {analyticsData.value.averagePain > 0 ? 'Promedio general' : 'Sin datos'}
                        </p>
                      </div>

                      <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-sm font-medium text-onSurface/80">Ánimo General</span>
                          {getTrendIcon(analyticsData.value.moodTrend)}
                        </div>
                        <p class="text-2xl font-bold text-onSurface">
                          {analyticsData.value.averageMood > 0 ? analyticsData.value.averageMood.toFixed(1) : '--'}/10
                        </p>
                        <p class="text-xs text-onSurface/60">
                          {analyticsData.value.averageMood > 0 ? 'Promedio general' : 'Sin datos'}
                        </p>
                      </div>

                      <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-sm font-medium text-onSurface/80">Medicamentos</span>
                          <CheckCircle2 class="h-4 w-4 text-brand-600" />
                        </div>
                        <p class="text-2xl font-bold text-onSurface">{analyticsData.value.activeMedications}</p>
                        <p class="text-xs text-onSurface/60">Activos totales</p>
                      </div>

                      <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-sm font-medium text-onSurface/80">Seguimiento</span>
                          <Activity class="h-4 w-4 text-brand-600" />
                        </div>
                        <p class="text-2xl font-bold text-onSurface">{analyticsData.value.totalEntries}</p>
                        <p class="text-xs text-onSurface/60">Registros totales</p>
                      </div>
                    </div>
                  ) : (
                    <div class="text-center py-8">
                      <BarChart3 class="h-12 w-12 text-onSurface/40 mx-auto mb-3" />
                      <p class="text-onSurface/70">No hay datos disponibles</p>
                      <p class="text-sm text-onSurface/50">Conecta con pacientes para ver métricas</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <CardTitle class="text-lg flex items-center gap-2">
                    <AlertTriangle class="h-5 w-5 text-[rgb(var(--color-error))]" />
                    <span>Alertas Clínicas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-3">
                  {realAlerts.value.length > 0 ? realAlerts.value.map(alert => {
                    const isHigh = alert.severity === 'high'
                    const isMedium = alert.severity === 'medium'

                    return (
                      <div
                        key={alert.id}
                        class={[
                          'flex items-center gap-4 p-3 rounded-2xl border',
                          isHigh ? 'border-[rgb(var(--color-error))/0.35] bg-white/50' :
                          isMedium ? 'border-brand-400/40 bg-brand-50' :
                          'border-outline/40 bg-surface'
                        ]}
                      >
                        <div class={[
                          'w-10 h-10 rounded-xl grid place-items-center',
                          isHigh ? 'bg-[rgb(var(--color-error))]' :
                          isMedium ? '' : 'bg-surfaceVariant',
                          isMedium ? 'text-onPrimary' : 'text-white'
                        ]}
                        style={isMedium ? "background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));" : undefined}
                        >
                          {alert.type === 'pain' ? <Heart class="h-5 w-5" /> :
                           alert.type === 'mood' ? <TrendingUp class="h-5 w-5" /> :
                           alert.type === 'medication' ? <CheckCircle2 class="h-5 w-5" /> :
                           <AlertTriangle class="h-5 w-5" />}
                        </div>
                        <div class="flex-1">
                          <p class="font-medium text-onSurface">{alert.patientName}</p>
                          <p class="text-sm text-onSurface/80">{alert.message}</p>
                        </div>
                        <Badge class={
                          isHigh ? 'bg-[rgb(var(--color-error))] text-white border-[rgb(var(--color-error))]' :
                          isMedium ? 'bg-brand-50 text-brand-700 border-brand-400/40' :
                          'bg-surfaceVariant text-onSurface border-outline/40'
                        }>
                          {isHigh ? 'Alta' : isMedium ? 'Media' : 'Baja'}
                        </Badge>
                      </div>
                    )
                  }) : (
                    <div class="text-center py-8">
                      <CheckCircle2 class="h-12 w-12 text-[rgb(var(--color-success))] mx-auto mb-3" />
                      <p class="text-onSurface/70">No hay alertas activas</p>
                      <p class="text-sm text-onSurface/50">Todos los pacientes están bien</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* SCHEDULE */}
          {activeTab.value === 'schedule' && (
            <div class="space-y-6">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-semibold">Agenda Médica</h2>
                <p class="text-onSurface/70">Citas y seguimientos programados</p>
              </div>

              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <div class="flex items-center justify-between">
                    <CardTitle class="text-lg">
                      Hoy - {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </CardTitle>
                    <AppButton
                      class="rounded-2xl px-3 py-1 text-brand-600 bg-brand-50 border border-brand-400/40 hover:bg-brand-50/80"
                      onClick={openAddAppointmentModal}
                    >
                      <Plus class="h-4 w-4 mr-1" />
                      Añadir
                    </AppButton>
                  </div>
                </CardHeader>
                <CardContent class="space-y-4">
                  {realAppointments.value.length > 0 ? realAppointments.value.map(appointment => {
                    const isConsultation = appointment.type === 'consultation'
                    const isEmergency = appointment.type === 'emergency'

                    return (
                      <div
                        key={appointment.id}
                        class="flex items-center gap-4 p-4 rounded-2xl border border-brand-400/40 bg-brand-50"
                      >
                        <div
                          class={[
                            'w-12 h-12 rounded-2xl grid place-items-center',
                            isEmergency ? 'bg-[rgb(var(--color-error))]' :
                            isConsultation ? 'bg-[rgb(var(--color-success))]' :
                            ''
                          ]}
                          style={!isEmergency && !isConsultation ? "background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)));" : undefined}
                        >
                          {appointment.type === 'consultation' ? <Users class="h-6 w-6 text-white" /> :
                           appointment.type === 'followup' ? <Heart class="h-6 w-6 text-onPrimary" /> :
                           appointment.type === 'emergency' ? <AlertTriangle class="h-6 w-6 text-white" /> :
                           <Clock class="h-6 w-6 text-onPrimary" />}
                        </div>
                        <div class="flex-1">
                          <p class="font-medium text-onSurface">{appointment.title} - {appointment.patientName}</p>
                          <p class="text-sm text-onSurface/70">{appointment.description}</p>
                          <p class="text-xs text-brand-600 font-medium mt-1">{appointment.time}</p>
                        </div>
                      </div>
                    )
                  }) : (
                    <div class="text-center py-8">
                      <Calendar class="h-12 w-12 text-onSurface/40 mx-auto mb-3" />
                      <p class="text-onSurface/70">No hay citas programadas para hoy</p>
                      <p class="text-sm text-onSurface/50">Las citas aparecerán aquí cuando se programen</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <AppButton
                class="w-full h-14 rounded-2xl touch-manipulation shadow-lg text-onPrimary"
                style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
                onClick={openCalendarModal}
              >
                <Calendar class="h-5 w-5 mr-2 text-onPrimary" />
                Ver Calendario Completo
              </AppButton>
            </div>
          )}

          {/* CONNECTIONS */}
          {activeTab.value === 'connections' && (
            <div class="space-y-6">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-semibold">Mis Conexiones</h2>
                <p class="text-onSurface/70">Gestiona tu red de pacientes</p>
              </div>
              <ConnectionManager />
            </div>
          )}

          {/* COMMUNICATION */}
          {activeTab.value === 'communication' && (
            <div class="space-y-6">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-semibold">Comunicación</h2>
                <p class="text-onSurface/70">Mensajes y consultas de pacientes</p>
              </div>

              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <CardTitle class="text-lg flex items-center gap-2">
                    <FileText class="h-5 w-5 text-brand-600" />
                    <span>Enviar Recomendación</span>
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                  <select
                    class="w-full p-3 rounded-2xl bg-surface border border-outline/40 focus:ring-2 focus:ring-[rgb(var(--brand-500))/0.2] outline-none"
                    v-model={selectedPatient.value}
                  >
                    <option value="">Seleccionar paciente</option>
                    {myPatients.value.map(p => (
                      <option key={p.userId} value={p.userId}>{p.userName || 'Paciente'}</option>
                    ))}
                  </select>

                  <Textarea
                    rows={4}
                    placeholder="Escribe tu recomendación médica..."
                    v-model={recommendation.value}
                    class="resize-none"
                  />

                  <button
                    class="w-full h-12 rounded-2xl touch-manipulation text-onPrimary inline-flex items-center justify-center rounded-xl px-4 py-2"
                    style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
                    onClick={sendRecommendation}
                  >
                    <Send class="h-4 w-4 mr-2 text-onPrimary" />
                    Enviar Recomendación
                  </button>
                </CardContent>
              </Card>

              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <CardTitle class="text-lg flex items-center gap-2">
                    <MessageCircle class="h-5 w-5 text-brand-600" />
                    <span>Mensajes Recientes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                  {myPatients.value.length > 0 ? (
                    <>
                      <div class="text-center py-4">
                        <MessageCircle class="h-8 w-8 text-onSurface/40 mx-auto mb-2" />
                        <p class="text-onSurface/70">Sistema de mensajería</p>
                        <p class="text-sm text-onSurface/50">Los mensajes de pacientes aparecerán aquí</p>
                      </div>

                      <AppButton class="w-full h-12 rounded-2xl touch-manipulation text-onSurface bg-surface border border-outline/40 hover:bg-surfaceVariant">
                        <MessageCircle class="h-4 w-4 mr-2" />
                        Ver Todos los Mensajes
                      </AppButton>
                    </>
                  ) : (
                    <div class="text-center py-8">
                      <Users class="h-12 w-12 text-onSurface/40 mx-auto mb-3" />
                      <p class="text-onSurface/70">Conecta con pacientes</p>
                      <p class="text-sm text-onSurface/50">para acceder al sistema de mensajería</p>
                    </div>
                  )}
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

        {/* Add Appointment Modal */}
        {showAddAppointmentModal.value && (
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div class="mx-4 w-full max-w-md rounded-3xl bg-surface p-6 shadow-2xl">
              <div class="mb-6 flex items-center justify-between">
                <h3 class="text-xl font-semibold text-onSurface">Nueva Cita</h3>
                <AppButton
                  class="rounded-full w-8 h-8 bg-surfaceVariant hover:bg-surfaceVariant/80"
                  onClick={closeAddAppointmentModal}
                >
                  <X class="h-4 w-4 text-onSurface" />
                </AppButton>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-onSurface/80 mb-2">Paciente</label>
                  <select
                    class="w-full p-3 rounded-2xl bg-surface border border-outline/40 focus:ring-2 focus:ring-[rgb(var(--brand-500))/0.2] outline-none"
                    v-model={newAppointment.value.patientId}
                  >
                    {myPatients.value.map(patient => (
                      <option key={patient.userId} value={patient.userId}>
                        {patient.userName || 'Paciente'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-onSurface/80 mb-2">Título</label>
                  <input
                    type="text"
                    class="w-full p-3 rounded-2xl bg-surface border border-outline/40 focus:ring-2 focus:ring-[rgb(var(--brand-500))/0.2] outline-none"
                    placeholder="Ej: Control mensual"
                    v-model={newAppointment.value.title}
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-onSurface/80 mb-2">Descripción</label>
                  <Textarea
                    rows={3}
                    placeholder="Detalles de la cita..."
                    v-model={newAppointment.value.description}
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-onSurface/80 mb-2">Fecha</label>
                    <input
                      type="date"
                      class="w-full p-3 rounded-2xl bg-surface border border-outline/40 focus:ring-2 focus:ring-[rgb(var(--brand-500))/0.2] outline-none"
                      v-model={newAppointment.value.date}
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-onSurface/80 mb-2">Hora</label>
                    <input
                      type="time"
                      class="w-full p-3 rounded-2xl bg-surface border border-outline/40 focus:ring-2 focus:ring-[rgb(var(--brand-500))/0.2] outline-none"
                      v-model={newAppointment.value.time}
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-onSurface/80 mb-2">Duración (min)</label>
                    <select
                      class="w-full p-3 rounded-2xl bg-surface border border-outline/40 focus:ring-2 focus:ring-[rgb(var(--brand-500))/0.2] outline-none"
                      v-model={newAppointment.value.duration}
                    >
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-onSurface/80 mb-2">Tipo</label>
                    <select
                      class="w-full p-3 rounded-2xl bg-surface border border-outline/40 focus:ring-2 focus:ring-[rgb(var(--brand-500))/0.2] outline-none"
                      v-model={newAppointment.value.type}
                    >
                      <option value="consultation">Consulta</option>
                      <option value="followup">Seguimiento</option>
                      <option value="emergency">Emergencia</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="mt-6 flex gap-3">
                <AppButton
                  class="flex-1 h-12 rounded-2xl text-onSurface bg-surface border border-outline/40"
                  onClick={closeAddAppointmentModal}
                >
                  Cancelar
                </AppButton>
                <AppButton
                  class="flex-1 h-12 rounded-2xl text-onPrimary"
                  style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
                  onClick={saveAppointment}
                >
                  Guardar Cita
                </AppButton>
              </div>
            </div>
          </div>
        )}

        {/* Patient Detail Modal */}
        {showPatientDetailModal.value && selectedPatientData.value && (
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div class="mx-4 w-full max-w-4xl max-h-[90vh] rounded-3xl bg-surface p-6 shadow-2xl overflow-y-auto">
              <div class="mb-6 flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div
                    class="w-12 h-12 rounded-2xl grid place-items-center shadow-lg text-white"
                    style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));"                  >
                    <span class="font-bold text-lg">{selectedPatientData.value.patient?.userName?.charAt(0).toUpperCase() || '?'}</span>
                  </div>
                  <div>
                    <h3 class="text-xl font-semibold text-onSurface">{selectedPatientData.value.patient?.userName || 'Paciente'}</h3>
                    <p class="text-sm text-onSurface/70">Historial clínico • ID: {selectedPatientData.value.patient?.userId.slice(-4)}</p>
                  </div>
                </div>
                <AppButton
                  class="rounded-full w-8 h-8 bg-surfaceVariant hover:bg-surfaceVariant/80"
                  onClick={closePatientDetailModal}
                >
                  <span class="text-lg font-bold text-onSurface">×</span>
                </AppButton>
              </div>

              <div class="space-y-6">
                {/* Patient Stats */}
                <Card class="rounded-2xl border border-outline/40 bg-surface">
                  <CardHeader class="pb-4">
                    <CardTitle class="text-lg flex items-center gap-2">
                      <Activity class="h-5 w-5 text-brand-600" />
                      <span>Estadísticas del Paciente</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent class="space-y-4">
                    {selectedPatientData.value.data?.stats ? (
                      <div class="grid grid-cols-2 gap-4">
                        <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                          <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium text-onSurface/80">Dolor Promedio</span>
                            <Heart class="h-4 w-4 text-[rgb(var(--color-error))]" />
                          </div>
                          <p class="text-2xl font-bold text-onSurface">
                            {selectedPatientData.value.data.stats.averagePain.toFixed(1)}/10
                          </p>
                          <p class="text-xs text-onSurface/60">Últimos registros</p>
                        </div>

                        <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                          <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium text-onSurface/80">Ánimo General</span>
                            <TrendingUp class="h-4 w-4 text-brand-600" />
                          </div>
                          <p class="text-2xl font-bold text-onSurface">
                            {selectedPatientData.value.data.stats.averageMood.toFixed(1)}/10
                          </p>
                          <p class="text-xs text-onSurface/60">Últimos registros</p>
                        </div>

                        <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                          <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium text-onSurface/80">Total Registros</span>
                            <Activity class="h-4 w-4 text-brand-600" />
                          </div>
                          <p class="text-2xl font-bold text-onSurface">{selectedPatientData.value.data.stats.totalEntries}</p>
                          <p class="text-xs text-onSurface/60">Registros realizados</p>
                        </div>

                        <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                          <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium text-onSurface/80">Racha Actual</span>
                            <CheckCircle2 class="h-4 w-4 text-[rgb(var(--color-success))]" />
                          </div>
                          <p class="text-2xl font-bold text-onSurface">{selectedPatientData.value.data.stats.streakDays}</p>
                          <p class="text-xs text-onSurface/60">Días consecutivos</p>
                        </div>
                      </div>
                    ) : (
                      <div class="text-center py-8">
                        <Activity class="h-12 w-12 text-onSurface/40 mx-auto mb-3" />
                        <p class="text-onSurface/70">No hay estadísticas disponibles</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Daily Entries History */}
                <Card class="rounded-2xl border border-outline/40 bg-surface">
                  <CardHeader class="pb-4">
                    <CardTitle class="text-lg flex items-center gap-2">
                      <FileText class="h-5 w-5 text-brand-600" />
                      <span>Historial de Registros Diarios</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent class="space-y-4">
                    {selectedPatientData.value.data?.dailyEntries && selectedPatientData.value.data.dailyEntries.length > 0 ? (
                      selectedPatientData.value.data.dailyEntries
                        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 10) // Show last 10 entries
                        .map((entry: any) => {
                          const entryDate = new Date(entry.date)
                          const isToday = entry.date === new Date().toISOString().split('T')[0]

                          return (
                            <div key={entry.id} class="p-4 rounded-2xl border border-outline/40 bg-surface">
                              <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center gap-2">
                                  <Calendar class="h-4 w-4 text-brand-600" />
                                  <span class="font-medium text-onSurface">
                                    {isToday ? 'Hoy' : entryDate.toLocaleDateString('es-ES', {
                                      weekday: 'long',
                                      day: 'numeric',
                                      month: 'long'
                                    })}
                                  </span>
                                </div>
                                <Badge class="bg-brand-50 text-brand-700 border-brand-400/40">
                                  {entryDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                </Badge>
                              </div>

                              <div class="grid grid-cols-3 gap-3 mb-3">
                                <div class="text-center">
                                  <div class="w-8 h-8 mx-auto mb-1 rounded-lg grid place-items-center shadow-sm text-onPrimary"
                                    style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-500)));">
                                    <span class="font-bold text-sm">{entry.mood}</span>
                                  </div>
                                  <p class="text-xs text-onSurface/70">Ánimo</p>
                                </div>
                                <div class="text-center">
                                  <div class="w-8 h-8 mx-auto mb-1 rounded-lg grid place-items-center shadow-sm text-white"
                                    style="background: rgb(var(--color-error));">
                                    <span class="font-bold text-sm">{entry.pain}</span>
                                  </div>
                                  <p class="text-xs text-onSurface/70">Dolor</p>
                                </div>
                                <div class="text-center">
                                  <div class="w-8 h-8 mx-auto mb-1 rounded-lg grid place-items-center shadow-sm text-onPrimary"
                                    style="background: rgb(var(--color-success));">
                                    <span class="font-bold text-sm">{entry.energy}</span>
                                  </div>
                                  <p class="text-xs text-onSurface/70">Energía</p>
                                </div>
                              </div>

                              {entry.notes && (
                                <div class="mt-3 p-3 rounded-xl bg-surfaceVariant border border-outline/20">
                                  <p class="text-sm text-onSurface/80 italic">"{entry.notes}"</p>
                                </div>
                              )}
                            </div>
                          )
                        })
                    ) : (
                      <div class="text-center py-8">
                        <FileText class="h-12 w-12 text-onSurface/40 mx-auto mb-3" />
                        <p class="text-onSurface/70">No hay registros diarios</p>
                        <p class="text-sm text-onSurface/50">El paciente aún no ha realizado registros</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Modal */}
        {showCalendarModal.value && (
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div class="mx-4 w-full max-w-4xl max-h-[90vh] rounded-3xl bg-surface p-6 shadow-2xl overflow-y-auto">
              <div class="mb-6 flex items-center justify-between">
                <h3 class="text-xl font-semibold text-onSurface">Calendario de Citas</h3>
                <AppButton
                  class="rounded-full w-8 h-8 bg-surfaceVariant hover:bg-surfaceVariant/80"
                  onClick={closeCalendarModal}
                >
                  <X class="h-4 w-4 text-onSurface" />
                </AppButton>
              </div>

              <div class="space-y-6">
                {/* Calendar Header */}
                <div class="flex items-center justify-between">
                  <h4 class="text-lg font-medium text-onSurface">
                    {monthName.value}
                  </h4>
                  <div class="flex gap-2">
                    <AppButton
                      class="rounded-xl px-3 py-1 text-brand-600 bg-brand-50 border border-brand-400/40"
                      onClick={() => changeMonth(-1)}
                    >
                      <ChevronLeft class="h-4 w-4" />
                    </AppButton>
                    <AppButton
                      class="rounded-xl px-3 py-1 text-brand-600 bg-brand-50 border border-brand-400/40"
                      onClick={() => changeMonth(1)}
                    >
                      <ChevronRight class="h-4 w-4" />
                    </AppButton>
                  </div>
                </div>

                {/* Appointments List */}
                <div class="space-y-4">
                  {allAppointments.value.length > 0 ? (
                    <div class="space-y-3">
                      {allAppointments.value.map(appointment => {
                        const appointmentDate = appointment.date
                        const isToday = appointmentDate.toDateString() === new Date().toDateString()
                        const isTomorrow = appointmentDate.toDateString() === new Date(Date.now() + 86400000).toDateString()

                        let dateLabel = appointmentDate.toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })

                        if (isToday) {
                          dateLabel = 'Hoy'
                        } else if (isTomorrow) {
                          dateLabel = 'Mañana'
                        }

                        const timeLabel = `${dateLabel} ${appointment.time}`

                        return (
                          <div
                            key={appointment.id}
                            class="flex items-center gap-4 p-4 rounded-2xl border border-brand-400/40 bg-brand-50"
                          >
                            <div
                              class="w-12 h-12 rounded-2xl grid place-items-center text-onPrimary"
                              style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"                        >
                              <Clock class="h-6 w-6" />
                            </div>
                            <div class="flex-1">
                              <p class="font-medium text-onSurface">{appointment.title} - {appointment.patientName}</p>
                              <p class="text-sm text-onSurface/70">{appointment.description}</p>
                              <p class="text-xs text-brand-600 font-medium mt-1">{timeLabel}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div class="text-center py-12">
                      <Calendar class="h-16 w-16 text-onSurface/40 mx-auto mb-4" />
                      <p class="text-onSurface/70">No hay citas programadas</p>
                      <p class="text-sm text-onSurface/50">Las citas aparecerán aquí cuando se programen</p>
                    </div>
                  )}
                </div>

                <div class="flex gap-3 pt-4 border-t border-outline/40">
                  <AppButton
                    class="flex-1 h-12 rounded-2xl text-onSurface bg-surface border border-outline/40"
                    onClick={closeCalendarModal}
                  >
                    Cerrar
                  </AppButton>
                  <AppButton
                    class="flex-1 h-12 rounded-2xl text-onPrimary"
                    style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
                    onClick={() => { closeCalendarModal(); openAddAppointmentModal(); }}
                  >
                    <Plus class="h-4 w-4 mr-2" />
                    Nueva Cita
                  </AppButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
})
