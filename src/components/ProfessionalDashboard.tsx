import { defineComponent, ref } from 'vue'
import AppButton from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Stethoscope, Users, Activity, MessageCircle, AlertTriangle, Clock,
  TrendingDown, TrendingUp, Heart, FileText, Send, ArrowLeft, Home, User,
  BarChart3, Calendar, ChevronRight, Plus, Filter, Search, Bell, CheckCircle2, XCircle, Minus
} from 'lucide-vue-next'

type TabId = 'patients' | 'analytics' | 'schedule' | 'communication'

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
    const selectedPatient = ref('patient1')
    const recommendation = ref('')
    const activeTab = ref<TabId>('patients')

    const patients = [
      { id: 'patient1', name: 'María González', age: 67, condition: 'Cáncer de pulmón', status: 'stable',   lastUpdate: '2 horas',  moodTrend: 'down',   painLevel: 6, alerts: 2, avatar: 'MG' },
      { id: 'patient2', name: 'Carlos Hernández', age: 72, condition: 'Insuficiencia cardíaca', status: 'attention', lastUpdate: '45 min',   moodTrend: 'stable', painLevel: 4, alerts: 1, avatar: 'CH' },
      { id: 'patient3', name: 'Ana López',      age: 58, condition: 'Cáncer de mama', status: 'good',    lastUpdate: '1 hora',   moodTrend: 'up',    painLevel: 3, alerts: 0, avatar: 'AL' }
    ] as const

    const navTabs: Array<{ id: TabId; label: string; icon: () => JSX.Element }> = [
      { id: 'patients', label: 'Pacientes',     icon: () => <Users class="h-5 w-5" /> },
      { id: 'analytics', label: 'Análisis',     icon: () => <BarChart3 class="h-5 w-5" /> },
      { id: 'schedule',  label: 'Agenda',       icon: () => <Calendar class="h-5 w-5" /> },
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
              <div class="w-8 h-8 rounded-full grid place-items-center shadow-soft"
                  style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                <Stethoscope class="h-4 w-4 text-onPrimary" />
              </div>
              <h1 class="text-lg font-semibold">Panel Médico</h1>
            </div>

            <AppButton class="rounded-full w-10 h-10 bg-transparent hover:bg-surfaceVariant relative">
              <Bell class="h-5 w-5 text-onSurface" />
              <div class="absolute -top-1 -right-1 w-3 h-3 bg-[rgb(var(--color-error))] rounded-full grid place-items-center">
                <span class="text-[10px] text-white font-bold leading-none">3</span>
              </div>
            </AppButton>
          </div>
        </div>

        <div class="mobile-content px-6 py-6 space-y-6">
          {/* PATIENTS */}
          {activeTab.value === 'patients' && (
            <div class="space-y-6">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-semibold">{getGreeting()}, Dr. García</h2>
                <p class="text-onSurface/70">Tienes 3 pacientes bajo seguimiento</p>
              </div>

              <Card class="rounded-2xl border border-outline/40 overflow-hidden bg-surface">
                <CardContent class="p-6">
                  <div class="grid grid-cols-3 gap-4">
                    <div class="text-center">
                      <div class="w-12 h-12 mx-auto mb-2 rounded-2xl grid place-items-center shadow-lg"
                          style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                        <CheckCircle2 class="h-6 w-6 text-white" />
                      </div>
                      <p class="font-bold text-lg text-brand-600">1</p>
                      <p class="text-xs text-onSurface/70 font-medium">Estables</p>
                    </div>
                    <div class="text-center">
                      <div class="w-12 h-12 mx-auto mb-2 rounded-2xl grid place-items-center shadow-lg"
                          style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                        <AlertTriangle class="h-6 w-6 text-onPrimary" />
                      </div>
                      <p class="font-bold text-lg text-brand-600">1</p>
                      <p class="text-xs text-onSurface/70 font-medium">Atención</p>
                    </div>
                    <div class="text-center">
                      <div class="w-12 h-12 mx-auto mb-2 rounded-2xl grid place-items-center shadow-lg"
                          style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                        <Bell class="h-6 w-6 text-onPrimary" />
                      </div>
                      <p class="font-bold text-lg text-brand-600">3</p>
                      <p class="text-xs text-onSurface/70 font-medium">Alertas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div class="flex gap-3">
                <div class="flex-1 relative">
                  <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-onSurface/50" />
                  <input
                    type="text"
                    placeholder="Buscar paciente..."
                    class="w-full pl-10 pr-4 py-3 bg-surface rounded-2xl border border-outline/40 focus:ring-2 focus:ring-[rgb(var(--brand-500))/0.2] outline-none transition-all"
                  />
                </div>
                <AppButton class="rounded-2xl px-4 bg-surface text-onSurface border border-outline/40">
                  <Filter class="h-4 w-4" />
                </AppButton>
              </div>

              <div class="space-y-4">
                {patients.map(patient => (
                  <Card
                    key={patient.id}
                    class="rounded-2xl border border-outline/40 cursor-pointer transition-all duration-200 active:scale-[0.98] bg-surface"
                    onClick={() => (selectedPatient.value = patient.id)}
                  >
                    <CardContent class="p-4">
                      <div class="flex items-center gap-4">
                        <div
                          class="w-14 h-14 rounded-2xl grid place-items-center shadow-lg text-white"
                          style={{ backgroundImage: statusGradient[patient.status] || 'none' }}
                        >
                          <span class="font-bold text-lg">{patient.avatar}</span>
                        </div>
                        <div class="flex-1">
                          <div class="flex items-center justify-between mb-1">
                            <h3 class="font-semibold">{patient.name}</h3>
                            {getStatusBadge(patient.status)}
                          </div>
                          <p class="text-sm text-onSurface/70 mb-2">
                            {patient.condition} • {patient.age} años
                          </p>
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4 text-xs text-onSurface/60">
                              <span class="flex items-center">
                                <Clock class="h-3 w-3 mr-1" />
                                Hace {patient.lastUpdate}
                              </span>
                              <span class="flex items-center">
                                {getTrendIcon(patient.moodTrend)}
                                <span class="ml-1">Ánimo</span>
                              </span>
                              <span class="flex items-center">
                                <Heart class="h-3 w-3 mr-1 text-[rgb(var(--color-error))]" />
                                Dolor: {patient.painLevel}/10
                              </span>
                            </div>
                            <div class="flex items-center gap-2">
                              {patient.alerts > 0 && (
                                <Badge class="bg-[rgb(var(--color-error))] text-white border-[rgb(var(--color-error))] text-xs">
                                  {patient.alerts} alerta{patient.alerts > 1 ? 's' : ''}
                                </Badge>
                              )}
                              <ChevronRight class="h-4 w-4 text-onSurface/40" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <AppButton
                class="w-full h-14 rounded-2xl touch-manipulation shadow-lg text-onPrimary"
                style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
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
                  <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-onSurface/80">Dolor Promedio</span>
                        <TrendingDown class="h-4 w-4 text-[rgb(var(--color-success))]" />
                      </div>
                      <p class="text-2xl font-bold text-onSurface">4.2/10</p>
                      <p class="text-xs text-onSurface/60">-0.8 esta semana</p>
                    </div>

                    <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-onSurface/80">Ánimo General</span>
                        <TrendingUp class="h-4 w-4 text-brand-600" />
                      </div>
                      <p class="text-2xl font-bold text-onSurface">6.8/10</p>
                      <p class="text-xs text-onSurface/60">+1.2 esta semana</p>
                    </div>

                    <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-onSurface/80">Adherencia</span>
                        <CheckCircle2 class="h-4 w-4 text-brand-600" />
                      </div>
                      <p class="text-2xl font-bold text-onSurface">94%</p>
                      <p class="text-xs text-onSurface/60">Medicación</p>
                    </div>

                    <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-onSurface/80">Seguimiento</span>
                        <Activity class="h-4 w-4 text-brand-600" />
                      </div>
                      <p class="text-2xl font-bold text-onSurface">18</p>
                      <p class="text-xs text-onSurface/60">Registros diarios</p>
                    </div>
                  </div>
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
                  <div class="flex items-center gap-4 p-3 rounded-2xl border border-[rgb(var(--color-error))/0.35] bg-white/50">
                    <div class="w-10 h-10 rounded-xl grid place-items-center bg-[rgb(var(--color-error))]">
                      <AlertTriangle class="h-5 w-5 text-white" />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-onSurface">María González</p>
                      <p class="text-sm text-onSurface/80">Dolor elevado (8/10) - Revisar medicación</p>
                    </div>
                    <Badge class="bg-[rgb(var(--color-error))] text-white border-[rgb(var(--color-error))]">Alta</Badge>
                  </div>

                  <div class="flex items-center gap-4 p-3 rounded-2xl border border-brand-400/40 bg-brand-50">
                    <div class="w-10 h-10 rounded-xl grid place-items-center"
                         style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                      <Clock class="h-5 w-5 text-onPrimary" />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-onSurface">Carlos Hernández</p>
                      <p class="text-sm text-onSurface/80">Sin registros en 24h</p>
                    </div>
                    <Badge class="bg-brand-50 text-brand-700 border-brand-400/40">Media</Badge>
                  </div>
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
                    <AppButton class="rounded-2xl px-3 py-1 text-brand-600 bg-brand-50 border border-brand-400/40 hover:bg-brand-50/80">
                      <Plus class="h-4 w-4 mr-1" />
                      Añadir
                    </AppButton>
                  </div>
                </CardHeader>
                <CardContent class="space-y-4">
                  <div class="flex items-center gap-4 p-4 rounded-2xl border border-brand-400/40 bg-brand-50">
                    <div class="w-12 h-12 rounded-2xl grid place-items-center"
                         style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                      <Clock class="h-6 w-6 text-onPrimary" />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-onSurface">Control - María González</p>
                      <p class="text-sm text-onSurface/70">Revisión de dolor y ajuste de medicación</p>
                      <p class="text-xs text-brand-600 font-medium mt-1">10:00 - 10:30</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-4 p-4 rounded-2xl border border-outline/40 bg-surface">
                    <div class="w-12 h-12 rounded-2xl grid place-items-center bg-[rgb(var(--color-success))]">
                      <Users class="h-6 w-6 text-white" />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-onSurface">Consulta familiar - Carlos Hernández</p>
                      <p class="text-sm text-onSurface/70">Reunión con esposa sobre cuidados</p>
                      <p class="text-xs text-[rgb(var(--color-success))] font-medium mt-1">14:00 - 15:00</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-4 p-4 rounded-2xl border border-outline/40 bg-surface">
                    <div class="w-12 h-12 rounded-2xl grid place-items-center"
                         style="background-image: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
                      <Heart class="h-6 w-6 text-onPrimary" />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-onSurface">Seguimiento - Ana López</p>
                      <p class="text-sm text-onSurface/70">Evaluación de estado emocional</p>
                      <p class="text-xs text-brand-600 font-medium mt-1">16:30 - 17:00</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <AppButton
                class="w-full h-14 rounded-2xl touch-manipulation shadow-lg text-onPrimary"
                style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
              >
                <Calendar class="h-5 w-5 mr-2 text-onPrimary" />
                Ver Calendario Completo
              </AppButton>
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
                  <select class="w-full p-3 rounded-2xl bg-surface border border-outline/40 focus:ring-2 focus:ring-[rgb(var(--brand-500))/0.2] outline-none">
                    <option value="">Seleccionar paciente</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <Textarea
                    rows={4}
                    placeholder="Escribe tu recomendación médica..."
                    v-model={recommendation.value}
                    class="resize-none"
                  />

                  <AppButton
                    class="w-full h-12 rounded-2xl touch-manipulation text-onPrimary"
                    style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
                  >
                    <Send class="h-4 w-4 mr-2 text-onPrimary" />
                    Enviar Recomendación
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
                      <div class="w-8 h-8 rounded-full grid place-items-center"
                           style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                        <span class="text-onPrimary text-sm font-medium">MG</span>
                      </div>
                      <div class="flex-1">
                        <p class="font-medium text-onSurface">María González</p>
                        <p class="text-xs text-onSurface/60">Hace 1 hora</p>
                      </div>
                    </div>
                    <p class="text-sm text-onSurface/80 mb-2">
                      Doctor, el dolor ha aumentado desde ayer. ¿Puedo tomar una dosis adicional?
                    </p>
                    <AppButton class="rounded-xl px-3 py-1 text-onPrimary"
                               style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                      Responder
                    </AppButton>
                  </div>

                  <div class="p-4 rounded-2xl border border-outline/40 bg-surface">
                    <div class="flex items-center gap-3 mb-2">
                      <div class="w-8 h-8 bg-[rgb(var(--color-success))] rounded-full grid place-items-center">
                        <span class="text-white text-sm font-medium">CH</span>
                      </div>
                      <div class="flex-1">
                        <p class="font-medium text-onSurface">Carlos Hernández</p>
                        <p class="text-xs text-onSurface/60">Hace 3 horas</p>
                      </div>
                    </div>
                    <p class="text-sm text-onSurface/80">Me siento mejor hoy. Gracias por ajustar la medicación.</p>
                    <AppButton class="rounded-xl px-3 py-1 text-onPrimary"
                               style="background-image: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));">
                      Responder
                    </AppButton>
                  </div>

                  <AppButton class="w-full h-12 rounded-2xl touch-manipulation text-onSurface bg-surface border border-outline/40 hover:bg-surfaceVariant">
                    <MessageCircle class="h-4 w-4 mr-2" />
                    Ver Todos los Mensajes
                  </AppButton>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <MobileBottomNav
          activeTab={activeTab.value}
          tabs={navTabs}
          onUpdate:activeTab={(t: TabId) => (activeTab.value = t)}
        />
      </div>
    )
  }
})
