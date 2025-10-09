import { defineComponent, ref } from 'vue'
import AppButton from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Users, Calendar, BookOpen, MessageCircle, Bell, Heart, Clock, AlertTriangle,
  CheckCircle2, Pill, ArrowLeft, Home, Activity, TrendingUp, Shield, Phone,
  Plus, ChevronRight, Star, Target
} from 'lucide-vue-next'

type TabId = 'home' | 'agenda' | 'monitoring' | 'support'

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
    const completedTasks = ref<Set<string>>(new Set())
    const activeTab = ref<TabId>('home')

    const toggleTask = (taskId: string) => {
      const next = new Set(completedTasks.value)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      completedTasks.value = next
    }

    const navTabs: Array<{ id: TabId; label: string; icon: () => JSX.Element }> = [
      { id: 'home', label: 'Inicio', icon: () => <Home class="h-5 w-5" /> },
      { id: 'agenda', label: 'Agenda', icon: () => <Calendar class="h-5 w-5" /> },
      { id: 'monitoring', label: 'Seguimiento', icon: () => <Activity class="h-5 w-5" /> },
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
      <div class="app-container min-h-screen gradient-calm text-onSurface">
        {/* Header */}
        <div class="mobile-header sticky top-0 z-40 backdrop-blur bg-surface/70 border-b border-outline/40">
          <div class="flex items-center justify-between px-6 h-14">
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

            <div class="w-10" />
          </div>
        </div>

        <div class="mobile-content px-6 py-6 space-y-6">
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
                </CardHeader>
                <CardContent class="space-y-4">
                  <div class="flex items-center gap-4 p-3 rounded-2xl border border-[rgb(var(--color-error))/0.35] bg-white/50">
                    <div class="w-10 h-10 rounded-xl grid place-items-center bg-[rgb(var(--color-error))]">
                      <AlertTriangle class="h-5 w-5 text-white" />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-onSurface">Medicación urgente pendiente</p>
                      <p class="text-sm text-onSurface/80">14:00 - Medicación para el dolor</p>
                    </div>
                    <Badge class="bg-[rgb(var(--color-error))] text-white border-[rgb(var(--color-error))]">Urgente</Badge>
                  </div>

                  <div class="flex items-center gap-4 p-3 rounded-2xl border border-brand-400/40 bg-brand-50">
                    <div class="w-10 h-10 rounded-xl grid place-items-center"
                         style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                      <Calendar class="h-5 w-5 text-onPrimary" />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-onSurface">Cita médica programada</p>
                      <p class="text-sm text-onSurface/80">Mañana 10:00 - Dr. García</p>
                    </div>
                    <Badge class="bg-brand-50 text-brand-700 border-brand-400/40">Mañana</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* resumen */}
              <Card class="rounded-2xl border border-outline/40 bg-surface">
                <CardHeader class="pb-4">
                  <CardTitle class="text-lg flex items-center gap-2">
                    <TrendingUp class="h-5 w-5 text-brand-600" />
                    <span>Resumen de Hoy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div class="grid grid-cols-3 gap-4">
                    <div class="text-center">
                      <div class="w-14 h-14 mx-auto mb-3 rounded-2xl grid place-items-center shadow-lg"
                          style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                        <CheckCircle2 class="h-7 w-7 text-white" />
                      </div>
                    <p class="font-bold text-lg text-brand-600">3/5</p>
                      <p class="text-xs text-onSurface/70 font-medium">Tareas completadas</p>
                    </div>
                    <div class="text-center">
                      <div class="w-14 h-14 mx-auto mb-3 rounded-2xl grid place-items-center shadow-lg"
                          style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                        <Pill class="h-7 w-7 text-onPrimary" />
                      </div>
                      <p class="font-bold text-lg text-brand-600">2/3</p>
                      <p class="text-xs text-onSurface/70 font-medium">Medicaciones</p>
                    </div>
                    <div class="text-center">
                      <div class="w-14 h-14 mx-auto mb-3 rounded-2xl grid place-items-center shadow-lg"
                           style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                        <Heart class="h-7 w-7 text-onPrimary" />
                      </div>
                      <p class="font-bold text-lg text-onSurface">Estable</p>
                      <p class="text-xs text-onSurface/70 font-medium">Estado general</p>
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
                    <AppButton class="bg-brand-50 text-brand-600 hover:bg-brand-50/80 px-3 py-1 rounded-xl border border-brand-400/40">
                      <Plus class="h-4 w-4 mr-1" />
                      Añadir
                    </AppButton>
                  </div>
                </CardHeader>
                <CardContent class="space-y-3">
                  {dailyTasks.slice(0, 3).map((task) => {
                    const done = completedTasks.value.has(task.id)
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
                  {dailyTasks.map((task) => {
                    const done = completedTasks.value.has(task.id)
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
                          class="w-12 h-12 rounded-2xl grid place-items-center shadow-lg"
                          style={{ backgroundImage: getCategoryStyle(task.category) }}
                        >
                          {getCategoryIcon(task.category)}
                        </div>
                        <div class="flex-1">
                          <div class="flex items-center justify-between mb-1">
                            <p class={['font-medium', done ? 'line-through text-onSurface/60' : 'text-onSurface'].join(' ')}>
                              {task.task}
                            </p>
                            {task.urgent && !done && (
                              <Badge class="bg-[rgb(var(--color-error))] text-white border-[rgb(var(--color-error))] text-xs">
                                Urgente
                              </Badge>
                            )}
                          </div>
                          <p class="text-sm text-onSurface/70 flex items-center">
                            <Clock class="h-3 w-3 mr-1" />
                            {task.time}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <AppButton
                class="w-full h-14 rounded-2xl touch-manipulation shadow-lg text-onPrimary"
                style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
              >
                <Plus class="h-5 w-5 mr-2 text-onPrimary" />
                Añadir Nueva Tarea
              </AppButton>
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
                  <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-onSurface/80">Dolor</span>
                        <span class="font-bold text-[rgb(var(--color-error))]">3/10</span>
                      </div>
                      <div class="w-full bg-surfaceVariant rounded-full h-2">
                        <div class="h-2 rounded-full bg-[rgb(var(--color-error))]" style={{ width: '30%' }}></div>
                      </div>
                    </div>

                    <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-onSurface/80">Ánimo</span>
                        <span class="font-bold text-brand-600">7/10</span>
                      </div>
                      <div class="w-full bg-surfaceVariant rounded-full h-2">
                        <div class="h-2 rounded-full" style={{ width: '70%', background: 'linear-gradient(90deg, rgb(var(--brand-400)), rgb(var(--brand-600)))' }}></div>
                      </div>
                    </div>

                    <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-onSurface/80">Energía</span>
                        <span class="font-bold text-onSurface">5/10</span>
                      </div>
                      <div class="w-full bg-surfaceVariant rounded-full h-2">
                        <div class="h-2 rounded-full bg-onSurface/70" style={{ width: '50%' }}></div>
                      </div>
                    </div>

                    <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-onSurface/80">Apetito</span>
                        <span class="font-bold text-[rgb(var(--color-success))]">6/10</span>
                      </div>
                      <div class="w-full bg-surfaceVariant rounded-full h-2">
                        <div class="h-2 rounded-full bg-[rgb(var(--color-success))]" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
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
                  <div class="flex items-center justify-between p-3 rounded-xl border border-[rgb(var(--color-success))/0.35] bg-white/50">
                    <div class="flex items-center gap-3">
                      <CheckCircle2 class="h-5 w-5 text-[rgb(var(--color-success))]" />
                      <div>
                        <p class="font-medium text-onSurface">Morfina 10mg</p>
                        <p class="text-sm text-onSurface/70">08:00 - Tomada</p>
                      </div>
                    </div>
                    <Badge class="bg-[rgb(var(--color-success))] text-white border-[rgb(var(--color-success))]">Completada</Badge>
                  </div>

                  <div class="flex items-center justify-between p-3 rounded-xl border border-[rgb(var(--color-success))/0.35] bg-white/50">
                    <div class="flex items-center gap-3">
                      <CheckCircle2 class="h-5 w-5 text-[rgb(var(--color-success))]" />
                      <div>
                        <p class="font-medium text-onSurface">Vitaminas</p>
                        <p class="text-sm text-onSurface/70">12:00 - Tomada</p>
                      </div>
                    </div>
                    <Badge class="bg-[rgb(var(--color-success))] text-white border-[rgb(var(--color-success))]">Completada</Badge>
                  </div>

                  <div class="flex items-center justify-between p-3 rounded-xl border border-[rgb(var(--color-error))/0.35] bg-white/50">
                    <div class="flex items-center gap-3">
                      <Clock class="h-5 w-5 text-[rgb(var(--color-error))]" />
                      <div>
                        <p class="font-medium text-onSurface">Analgésico</p>
                        <p class="text-sm text-onSurface/70">14:00 - Pendiente</p>
                      </div>
                    </div>
                    <Badge class="bg-[rgb(var(--color-error))] text-white border-[rgb(var(--color-error))]">Urgente</Badge>
                  </div>
                </CardContent>
              </Card>
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
        <MobileBottomNav
          activeTab={activeTab.value}
          tabs={navTabs}
          onUpdate:activeTab={(t: TabId) => (activeTab.value = t)}
        />
      </div>
    )
  }
})
