import { defineComponent, ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePatientDataStore } from '@/stores/patientData'
import AppButton from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import ConnectionManager from '@/components/ConnectionManager'
import GameLauncher from '@/components/games/GameLauncher.vue'
import {
  Heart, BookOpen, MessageCircle, Music, Phone, Calendar, Activity,
  ArrowLeft, Home, Sparkles, TrendingUp, Clock, Send, Sun, Moon, Sunrise, LogOut, Users
} from 'lucide-vue-next'

type TabId = 'home' | 'diary' | 'exercises' | 'contact' | 'connections'

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
    placeholder: { type: String, default: '' },
    rows: { type: Number, default: 4 },
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

const Slider = defineComponent({
  name: 'Slider',
  props: {
    modelValue: { type: Number, required: true },
    min: { type: Number, default: 1 },
    max: { type: Number, default: 10 },
    step: { type: Number, default: 1 },
    class: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => (
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.modelValue}
        class={['w-full h-2 rounded-lg appearance-none bg-outline/30 accent-current', props.class]}
        onInput={(e: Event) => emit('update:modelValue', Number((e.target as HTMLInputElement).value))}
      />
    )
  }
})

const Progress = defineComponent({
  name: 'Progress',
  props: {
    value: { type: Number, default: 0 }, // 0..100
    class: { type: String, default: '' }
  },
  setup(props) {
    const width = computed(() => `${Math.min(100, Math.max(0, props.value))}%`)
    return () => (
      <div class={['relative w-full h-3 rounded-full overflow-hidden bg-surfaceVariant', props.class]}>
        <div class="absolute inset-y-0 left-0 rounded-full"
          style={{ width: width.value, background: 'linear-gradient(90deg, rgb(var(--brand-400)), rgb(var(--brand-600)))' }} />
      </div>
    )
  }
})

/** Navegación inferior móvil */
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

export default defineComponent({
  name: 'PatientDashboard',
  emits: ['back'],
  setup(_, { emit }) {
    const authStore = useAuthStore()
    const patientDataStore = usePatientDataStore()

    // estado
    const moodLevel = ref<number>(6)
    const painLevel = ref<number>(3)
    const energyLevel = ref<number>(5)
    const journalEntry = ref('')
    const activeTab = ref<TabId>('home')
    const showGamesModal = ref(false)
    const savingEntry = ref(false)

    const motivationalMessages = [
      'Cada día es una nueva oportunidad para encontrar pequeños momentos de paz.',
      'Tu fortaleza inspira a quienes te rodean.',
      'No estás solo en este camino.',
      'Cada respiración consciente es un acto de valentía.'
    ]
    const currentMessage = ref<string>(motivationalMessages[0])

    // tabs
    const navTabs: Array<{ id: TabId; label: string; icon: () => JSX.Element }> = [
      { id: 'home', label: 'Inicio', icon: () => <Home class="h-5 w-5" /> },
      { id: 'diary', label: 'Diario', icon: () => <Activity class="h-5 w-5" /> },
      { id: 'exercises', label: 'Bienestar', icon: () => <Heart class="h-5 w-5" /> },
      { id: 'connections', label: 'Conexiones', icon: () => <Users class="h-5 w-5" /> },
      { id: 'contact', label: 'Contacto', icon: () => <MessageCircle class="h-5 w-5" /> }
    ]

    // helpers (con tokens)
    const getMoodIcon = (level: number) => {
      if (level <= 3) return <Moon class="h-5 w-5 text-onSurface/60" />
      if (level <= 7) return <Sunrise class="h-5 w-5 text-brand-600" />
      return <Sun class="h-5 w-5 text-brand-500" />
    }

    const getGreeting = () => {
      const hour = new Date().getHours()
      if (hour < 12) return 'Buenos días'
      if (hour < 18) return 'Buenas tardes'
      return 'Buenas noches'
    }

    // Save daily entry
    const saveDailyEntry = async () => {
      if (!authStore.user?.uid) return

      savingEntry.value = true
      try {
        const today = new Date().toISOString().split('T')[0]

        const result = await patientDataStore.saveDailyEntry({
          date: today,
          mood: moodLevel.value,
          pain: painLevel.value,
          energy: energyLevel.value,
          notes: journalEntry.value || undefined
        })

        if (result.success) {
          // Reset form
          journalEntry.value = ''
          // Could show success message here
        } else {
          console.error('Error saving entry:', result.error)
          // Could show error message here
        }
      } catch (error) {
        console.error('Error saving daily entry:', error)
      } finally {
        savingEntry.value = false
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
                <Heart class="h-4 w-4 text-onPrimary" />
              </div>
              <h1 class="text-lg font-semibold">Mi Bienestar</h1>
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
                <p class="text-onSurface/70">¿Cómo te sientes hoy?</p>
              </div>

              {/* mensaje del día */}
              <Card class="rounded-2xl border border-outline/40 overflow-hidden bg-surface">
                <CardContent class="p-6">
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-soft shrink-0
                                text-onPrimary"
                      style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                      <Sparkles class="h-6 w-6" />
                    </div>
                    <div class="flex-1">
                      <h3 class="font-semibold mb-2">Mensaje del Día</h3>
                      <p class="text-onSurface/80 text-sm leading-relaxed italic">"{currentMessage.value}"</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* estado rápido */}
              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <div class="flex items-center justify-between">
                    <CardTitle class="text-lg flex items-center gap-2">
                      {getMoodIcon(moodLevel.value)}
                      <span>Estado Actual</span>
                    </CardTitle>
                    <Badge class="bg-brand-50 text-brand-600 border-brand-400/40">Hoy</Badge>
                  </div>
                </CardHeader>
                <CardContent class="space-y-4">
                  <div class="grid grid-cols-3 gap-3 sm:gap-4">
                    <div class="text-center">
                      <div class="w-12 h-12 mx-auto mb-2 rounded-2xl grid place-items-center shadow-sm text-onPrimary"
                        style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-500)));">
                        <span class="font-bold">{moodLevel.value}</span>
                      </div>
                      <p class="text-xs text-onSurface/70 font-medium">Ánimo</p>
                    </div>
                    <div class="text-center">
                      <div class="w-12 h-12 mx-auto mb-2 rounded-2xl grid place-items-center shadow-sm text-onPrimary"
                        style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-500)));">
                        <span class="text-white font-bold">{painLevel.value}</span>
                      </div>
                      <p class="text-xs text-onSurface/70 font-medium">Dolor</p>
                    </div>
                    <div class="text-center">
                      <div class="w-12 h-12 mx-auto mb-2 rounded-2xl grid place-items-center shadow-sm text-onPrimary"
                        style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-500)));">
                        <span class="text-white font-bold">{energyLevel.value}</span>
                      </div>
                      <p class="text-xs text-onSurface/70 font-medium">Energía</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* progreso semanal */}
              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <CardTitle class="text-lg flex items-center gap-2">
                    <TrendingUp class="h-5 w-5 text-brand-600" />
                    <span>Mi Progreso Semanal</span>
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-5">
                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <span class="text-sm font-medium text-onSurface/80">Estado de ánimo promedio</span>
                      <span class="text-sm font-bold text-brand-600">{patientDataStore.patientStats.averageMood}/10</span>
                    </div>
                    <Progress value={patientDataStore.patientStats.averageMood * 10} />
                  </div>

                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <span class="text-sm font-medium text-onSurface/80">Racha de registros</span>
                      <span class="text-sm font-bold text-brand-600">{patientDataStore.patientStats.streakDays} días</span>
                    </div>
                    <Progress value={Math.min(patientDataStore.patientStats.streakDays * 10, 100)} />
                  </div>

                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <span class="text-sm font-medium text-onSurface/80">Total de registros</span>
                      <span class="text-sm font-bold text-brand-600">{patientDataStore.patientStats.totalEntries}</span>
                    </div>
                    <Progress value={Math.min(patientDataStore.patientStats.totalEntries * 5, 100)} />
                  </div>
                </CardContent>
              </Card>

              {/* citas */}
              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <CardTitle class="text-lg flex items-center gap-2">
                    <Calendar class="h-5 w-5 text-brand-600" />
                    <span>Próximas Citas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                  <div class="flex items-center gap-4 p-3 rounded-2xl border border-brand-400/40 bg-brand-50">
                    <div class="w-10 h-10 rounded-xl grid place-items-center text-onPrimary"
                      style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                      <Clock class="h-5 w-5" />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-onSurface">Control médico</p>
                      <p class="text-sm text-onSurface/70">Dr. García</p>
                    </div>
                    <Badge class="bg-brand-600 text-onPrimary border-brand-600">Mañana 10:00</Badge>
                  </div>

                  <div class="flex items-center gap-4 p-3 rounded-2xl border border-outline/40 bg-surface">
                    <div class="w-10 h-10 rounded-xl grid place-items-center bg-[rgb(var(--color-success))]">
                      <Heart class="h-5 w-5 text-white" />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-onSurface">Terapia psicológica</p>
                      <p class="text-sm text-onSurface/70">Lic. Martínez</p>
                    </div>
                    <Badge class="bg-[rgb(var(--color-success))] text-white border-[rgb(var(--color-success))]">Viernes 15:00</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Minijuegos Section */}
              <Card
                class="rounded-2xl border border-outline/40 bg-surface cursor-pointer transition-all duration-200 active:scale-[0.98]"
                onClick={() => (showGamesModal.value = true)}
              >
                <CardHeader class="pb-4">
                  <CardTitle class="text-lg flex items-center gap-2">
                    <span class="text-2xl">🎮</span>
                    <span>Minijuegos</span>
                  </CardTitle>
                  <CardDescription>Actividades para relajarte y divertirte</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                  <div class="text-center text-sm text-onSurface/70">
                    <span>Click para ver juegos disponibles</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* DIARY */}
          {activeTab.value === 'diary' && (
            <div class="space-y-6">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-semibold">Diario Emocional</h2>
                <p class="text-onSurface/70">Registra tu estado para recibir mejor apoyo</p>
              </div>

              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-6">
                  <CardTitle class="text-lg flex items-center gap-2">
                    <Activity class="h-5 w-5 text-brand-600" />
                    <span>¿Cómo te sientes hoy?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-8">
                  {/* Estado de ánimo */}
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <label class="font-medium text-onSurface">Estado de ánimo</label>
                      <div class="flex items-center gap-2">
                        {getMoodIcon(moodLevel.value)}
                        <span class="font-bold text-lg">{moodLevel.value}</span>
                      </div>
                    </div>
                    <div class="text-brand-600">
                      <Slider modelValue={moodLevel.value} min={1} max={10} step={1}
                        class="w-full"
                        onUpdate:modelValue={(v: number) => (moodLevel.value = v)} />
                    </div>
                    <div class="flex justify-between text-xs text-onSurface/60">
                      <span>Muy triste</span>
                      <span>Neutral</span>
                      <span>Muy feliz</span>
                    </div>
                  </div>

                  {/* Dolor */}
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <label class="font-medium text-onSurface">Nivel de dolor</label>
                      <span class="font-bold text-lg text-[rgb(var(--color-error))]">{painLevel.value}</span>
                    </div>
                    <div class="text-[rgb(var(--color-error))]">
                      <Slider modelValue={painLevel.value} min={1} max={10} step={1}
                        class="w-full"
                        onUpdate:modelValue={(v: number) => (painLevel.value = v)} />
                    </div>
                    <div class="flex justify-between text-xs text-onSurface/60">
                      <span>Sin dolor</span>
                      <span>Moderado</span>
                      <span>Intenso</span>
                    </div>
                  </div>

                  {/* Energía */}
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <label class="font-medium text-onSurface">Nivel de energía</label>
                      <span class="font-bold text-lg text-[rgb(var(--color-success))]">{energyLevel.value}</span>
                    </div>
                    <div class="text-[rgb(var(--color-success))]">
                      <Slider modelValue={energyLevel.value} min={1} max={10} step={1}
                        class="w-full"
                        onUpdate:modelValue={(v: number) => (energyLevel.value = v)} />
                    </div>
                    <div class="flex justify-between text-xs text-onSurface/60">
                      <span>Sin energía</span>
                      <span>Normal</span>
                      <span>Mucha energía</span>
                    </div>
                  </div>

                  {/* Reflexiones */}
                  <div class="space-y-4">
                    <label class="font-medium text-onSurface">Reflexiones del día (Opcional)</label>
                    <Textarea
                      rows={4}
                      placeholder="¿Cómo te sientes? ¿Qué pensamientos o emociones has experimentado hoy?"
                      v-model={journalEntry.value}
                    />
                  </div>

                  <AppButton
                    class="w-full h-14 rounded-2xl touch-manipulation shadow-lg text-onPrimary"
                    style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
                    disabled={savingEntry.value}
                    onClick={saveDailyEntry}
                  >
                    <Send class="h-5 w-5 mr-2 text-onPrimary" />
                    {savingEntry.value ? 'Guardando...' : 'Guardar Registro del Día'}
                  </AppButton>
                </CardContent>
              </Card>
            </div>
          )}

          {/* EXERCISES */}
          {activeTab.value === 'exercises' && (
            <div class="space-y-6">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-semibold">Bienestar</h2>
                <p class="text-onSurface/70">Ejercicios para tu paz interior</p>
              </div>

              <div class="grid gap-4">
                {/* Respiración: éxito (calma) */}
                <Card class="rounded-2xl border border-outline/40 overflow-hidden bg-surface">
                  <CardContent class="p-6">
                    <div class="flex items-center gap-4">
                      <div class="w-14 h-14 rounded-2xl grid place-items-center shadow-lg bg-[rgb(var(--color-success))]">
                        <Heart class="h-7 w-7 text-white" />
                      </div>
                      <div class="flex-1">
                        <h3 class="font-semibold mb-1 text-onSurface">Respiración Consciente</h3>
                        <p class="text-sm text-onSurface/70 mb-3">5 minutos de relajación profunda</p>
                        <AppButton class="rounded-xl px-3 py-1 text-onPrimary"
                          style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                          Comenzar
                        </AppButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Musical: brand */}
                <Card class="rounded-2xl border border-outline/40 overflow-hidden bg-surface">
                  <CardContent class="p-6">
                    <div class="flex items-center gap-4">
                      <div class="w-14 h-14 rounded-2xl grid place-items-center shadow-lg"
                        style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                        <Music class="h-7 w-7 text-onPrimary" />
                      </div>
                      <div class="flex-1">
                        <h3 class="font-semibold mb-1 text-onSurface">Relajación Musical</h3>
                        <p class="text-sm text-onSurface/70 mb-3">Música terapéutica especializada</p>
                        <AppButton class="rounded-xl px-3 py-1 text-onPrimary"
                          style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                          Reproducir
                        </AppButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Meditación: éxito */}
                <Card class="rounded-2xl border border-outline/40 overflow-hidden bg-surface">
                  <CardContent class="p-6">
                    <div class="flex items-center gap-4">
                      <div class="w-14 h-14 rounded-2xl grid place-items-center shadow-lg bg-[rgb(var(--color-success))]">
                        <BookOpen class="h-7 w-7 text-white" />
                      </div>
                      <div class="flex-1">
                        <h3 class="font-semibold mb-1 text-onSurface">Meditación Guiada</h3>
                        <p class="text-sm text-onSurface/70 mb-3">Sesiones de mindfulness</p>
                        <AppButton class="rounded-xl px-3 py-1 text-onPrimary"
                          style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                          Iniciar
                        </AppButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reflexión espiritual: brand */}
                <Card class="rounded-2xl border border-outline/40 overflow-hidden bg-surface">
                  <CardContent class="p-6">
                    <div class="flex items-center gap-4">
                      <div class="w-14 h-14 rounded-2xl grid place-items-center shadow-lg"
                        style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                        <Sparkles class="h-7 w-7 text-onPrimary" />
                      </div>
                      <div class="flex-1">
                        <h3 class="font-semibold mb-1 text-onSurface">Reflexión Espiritual</h3>
                        <p class="text-sm text-onSurface/70 mb-3">Momentos de conexión interna</p>
                        <AppButton class="rounded-xl px-3 py-1 text-onPrimary"
                          style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                          Comenzar
                        </AppButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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

          {/* CONTACT */}
          {activeTab.value === 'contact' && (
            <div class="space-y-6">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-semibold">Contacto</h2>
                <p class="text-onSurface/70">Tu red de apoyo está aquí</p>
              </div>

              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <CardTitle class="text-lg flex items-center gap-2">
                    <Phone class="h-5 w-5 text-[rgb(var(--color-error))]" />
                    <span>Contacto de Emergencia</span>
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                  <AppButton class="w-full h-14 rounded-2xl touch-manipulation shadow-lg text-white"
                    style="background-image: linear-gradient(90deg, rgb(var(--color-error)), rgb(var(--color-error)));">
                    <Phone class="h-5 w-5 mr-2 text-white" />
                    Llamar a Familiar Principal
                  </AppButton>
                  <AppButton class="w-full h-14 rounded-2xl touch-manipulation shadow-lg text-onPrimary"
                    style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                    <Activity class="h-5 w-5 mr-2 text-onPrimary" />
                    Contactar Profesional de Salud
                  </AppButton>
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
                  <div class="p-4 rounded-2xl border border-brand-400/40 bg-brand-50">
                    <div class="flex items-center gap-3 mb-2">
                      <div class="w-8 h-8 rounded-full grid place-items-center text-onPrimary"
                        style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                        <span class="text-sm font-medium">Dr</span>
                      </div>
                      <div class="flex-1">
                        <p class="font-medium text-onSurface">Dr. García</p>
                        <p class="text-xs text-onSurface/60">Hace 2 horas</p>
                      </div>
                    </div>
                    <p class="text-sm text-onSurface/80">
                      Recuerda tomar tu medicación a las 2 PM. ¿Cómo te has sentido hoy?
                    </p>
                  </div>

                  <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                    <div class="flex items-center gap-3 mb-2">
                      <div class="w-8 h-8 bg-[rgb(var(--color-success))] rounded-full grid place-items-center">
                        <span class="text-white text-sm font-medium">M</span>
                      </div>
                      <div class="flex-1">
                        <p class="font-medium text-onSurface">María (Hija)</p>
                        <p class="text-xs text-onSurface/60">Hace 30 min</p>
                      </div>
                    </div>
                    <p class="text-sm text-onSurface/80">
                      Te amo, papá. Llego en una hora para acompañarte. ❤️
                    </p>
                  </div>

                  <AppButton class="w-full h-12 rounded-2xl touch-manipulation text-onPrimary"
                    style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                    <MessageCircle class="h-5 w-5 mr-2 text-onPrimary" />
                    Ver Todos los Mensajes
                  </AppButton>
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

        {/* Games Modal */}
        {showGamesModal.value && (
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
            <div class="bg-surface rounded-2xl w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
              {/* Header */}
              <div class="p-3 sm:p-4 border-b border-outline/40 flex items-center justify-between">
                <div class="flex items-center gap-2 sm:gap-3">
                  <span class="text-xl sm:text-2xl">🎮</span>
                  <div>
                    <h3 class="font-semibold text-onSurface text-base sm:text-lg">Minijuegos</h3>
                    <p class="text-xs sm:text-sm text-onSurface/60">Selecciona un juego</p>
                  </div>
                </div>
                <button
                  onClick={() => (showGamesModal.value = false)}
                  class="p-2 hover:bg-surfaceVariant rounded-lg transition-colors touch-manipulation"
                >
                  <span class="text-lg sm:text-xl">✕</span>
                </button>
              </div>

              {/* Games Content */}
              <div class="p-3 sm:p-4 max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)] overflow-y-auto">
                <GameLauncher />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
})
