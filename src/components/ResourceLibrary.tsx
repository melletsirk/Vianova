import { defineComponent, ref, computed, provide, inject } from 'vue'
import AppButton from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  BookOpen, Video, FileText, Heart, Search as SearchIcon,
  Play, Download, Clock, Users, MessageCircle, ArrowLeft
} from 'lucide-vue-next'

type Role = 'patient' | 'caregiver' | 'professional'

/* ========== UI mínimos locales (Input, Badge, Tabs) ========== */
const Input = defineComponent({
  name: 'Input',
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    class: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => (
      <input
        type="text"
        value={props.modelValue}
        placeholder={props.placeholder}
        class={[
          'w-full px-3 py-2 rounded-2xl outline-none transition',
          'bg-surface text-onSurface placeholder-onSurface/60',
          'border border-outline/40 focus:ring-2 focus:ring-[rgb(var(--brand-500))/0.25]'
          , props.class
        ].join(' ')}
        onInput={(e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)}
      />
    )
  }
})

const Badge = defineComponent({
  name: 'Badge',
  props: { class: { type: String, default: '' } },
  setup(props, { slots }) {
    return () => (
      <span
        class={[
          'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full',
          'border border-outline/40 bg-surfaceVariant text-onSurface/80',
          props.class
        ].join(' ')}
      >
        {slots.default?.()}
      </span>
    )
  }
})

/** Tabs context */
const TABS_CTX = Symbol('tabs')
const Tabs = defineComponent({
  name: 'Tabs',
  props: { defaultValue: { type: String, required: true }, class: { type: String, default: '' } },
  setup(props, { slots }) {
    const value = ref(props.defaultValue)
    provide(TABS_CTX, { value, setValue: (v: string) => (value.value = v) })
    return () => <div class={props.class}>{slots.default?.()}</div>
  }
})
const TabsList = defineComponent({
  name: 'TabsList',
  props: { class: { type: String, default: '' } },
  setup(props, { slots }) {
    return () => (
      <div class={['grid grid-cols-3 gap-2 p-1 rounded-2xl bg-surfaceVariant', props.class].join(' ')}>
        {slots.default?.()}
      </div>
    )
  }
})
const TabsTrigger = defineComponent({
  name: 'TabsTrigger',
  props: { value: { type: String, required: true } },
  setup(props, { slots }) {
    const ctx = inject<{ value: { value: string }; setValue: (v: string) => void }>(TABS_CTX)!
    const active = computed(() => ctx.value.value === props.value)
    return () => (
      <button
        class={[
          'px-4 py-2 text-sm rounded-xl transition border',
          active.value
            ? 'bg-surface text-onSurface border-outline/40 shadow-sm'
            : 'bg-transparent text-onSurface/70 hover:text-onSurface border-transparent'
        ].join(' ')}
        onClick={() => ctx.setValue(props.value)}
      >
        {slots.default?.()}
      </button>
    )
  }
})
const TabsContent = defineComponent({
  name: 'TabsContent',
  props: { value: { type: String, required: true }, class: { type: String, default: '' } },
  setup(props, { slots }) {
    const ctx = inject<{ value: { value: string } }>(TABS_CTX)!
    return () => (ctx.value.value === props.value ? <div class={props.class}>{slots.default?.()}</div> : null)
  }
})
/* ========== fin UI mínimos ========== */

export default defineComponent({
  name: 'ResourceLibrary',
  props: { userRole: { type: String as () => Role, required: true } },
  emits: ['back'],
  setup(props, { emit }) {
    const searchTerm = ref('')

    const articles = [
      { id: '1', title: 'Entendiendo el dolor en cuidados paliativos', description: 'Guía completa sobre tipos de dolor y métodos de alivio', category: 'medical', duration: '10 min', difficulty: 'Básico', targetAudience: ['patient','caregiver'] as Role[] },
      { id: '2', title: 'Comunicación efectiva con el paciente', description: 'Técnicas para mantener una comunicación empática y clara', category: 'communication', duration: '15 min', difficulty: 'Intermedio', targetAudience: ['caregiver','professional'] as Role[] },
      { id: '3', title: 'Manejo de la ansiedad y el miedo', description: 'Estrategias para lidiar con emociones difíciles', category: 'emotional', duration: '12 min', difficulty: 'Básico', targetAudience: ['patient','caregiver'] as Role[] },
      { id: '4', title: 'Nutrición en cuidados paliativos', description: 'Recomendaciones alimentarias para mejorar la calidad de vida', category: 'nutrition', duration: '8 min', difficulty: 'Básico', targetAudience: ['patient','caregiver'] as Role[] }
    ]
    const videos = [
      { id: '1', title: 'Ejercicios de respiración para el dolor', description: 'Técnicas guiadas para reducir el dolor mediante la respiración', duration: '20 min', category: 'exercise', targetAudience: ['patient','caregiver'] as Role[] },
      { id: '2', title: 'Movilización segura del paciente', description: 'Cómo ayudar al paciente a moverse de forma segura', duration: '15 min', category: 'care', targetAudience: ['caregiver'] as Role[] },
      { id: '3', title: 'Meditación guiada para la calma', description: 'Sesión de mindfulness para reducir el estrés', duration: '25 min', category: 'meditation', targetAudience: ['patient','caregiver'] as Role[] }
    ]
    const stories = [
      { id: '1', title: 'El jardín de María', description: 'Una historia sobre encontrar paz en los pequeños momentos', author: 'Ana García', readTime: '5 min', category: 'hope' },
      { id: '2', title: 'Cartas de despedida', description: 'Cómo una familia encontró formas de expresar su amor', author: 'Carlos Mendoza', readTime: '8 min', category: 'family' },
      { id: '3', title: 'Mi último viaje', description: 'La experiencia de un paciente en su viaje final', author: 'Elena Torres', readTime: '12 min', category: 'journey' }
    ]

    const term = computed(() => searchTerm.value.trim().toLowerCase())
    const filteredArticles = computed(() =>
      articles.filter(a =>
        a.targetAudience.includes(props.userRole) &&
        (a.title.toLowerCase().includes(term.value) || a.description.toLowerCase().includes(term.value))
      )
    )
    const filteredVideos = computed(() =>
      videos.filter(v =>
        v.targetAudience.includes(props.userRole) &&
        (v.title.toLowerCase().includes(term.value) || v.description.toLowerCase().includes(term.value))
      )
    )

    // Badge de categoría unificado a brand (sin paletas por color)
    const CategoryBadge = (label: string) => (
      <span
        class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full text-onPrimary"
        style={{ backgroundImage: 'linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)))' }}
      >
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-white/80" />
        {label}
      </span>
    )

    const titleByRole: Record<Role, string> = {
      patient: 'para Pacientes',
      caregiver: 'para Cuidadores',
      professional: 'para Profesionales'
    }

    return () => (
      <div class="min-h-screen gradient-calm p-4 text-onSurface">
        <div class="max-w-6xl mx-auto">
          {/* Header */}
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center">
              <BookOpen class="h-8 w-8 text-brand-600 mr-3" />
              <h1 class="text-3xl font-semibold">
                Biblioteca de Recursos <span class="text-onSurface/70 text-2xl">({titleByRole[props.userRole]})</span>
              </h1>
            </div>
            <AppButton
              class="rounded-2xl bg-surface border border-outline/40 text-onSurface hover:bg-surfaceVariant"
              onClick={() => emit('back')}
            >
              <ArrowLeft class="h-4 w-4 mr-2" />
              Volver
            </AppButton>
          </div>

          {/* Buscador */}
          <div class="mb-6">
            <div class="relative">
              <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 text-onSurface/50 h-4 w-4" />
              <Input placeholder="Buscar recursos..." v-model={searchTerm.value} class="pl-10" />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="articles" class="space-y-6">
            <TabsList class="w-full" />
            <div class="grid grid-cols-3 gap-2">
              <TabsTrigger value="articles">Artículos</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="stories">Historias</TabsTrigger>
            </div>

            {/* Artículos */}
            <TabsContent value="articles" class="space-y-6">
              <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredArticles.value.map(article => (
                  <Card key={article.id} class="rounded-2xl border border-outline/40 bg-surface hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div class="flex justify-between items-start mb-2">
                        {CategoryBadge(article.category)}
                        <div class="flex items-center text-sm text-onSurface/70">
                          <Clock class="h-3 w-3 mr-1" />
                          {article.duration}
                        </div>
                      </div>
                      <CardTitle class="text-lg text-onSurface">{article.title}</CardTitle>
                      <CardDescription class="text-onSurface/70">{article.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div class="flex justify-between items-center">
                        <Badge>{article.difficulty}</Badge>
                        <AppButton
                          class="rounded-xl px-3 py-1.5 text-onPrimary"
                          style={{ backgroundImage: 'linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)))' }}
                        >
                          <FileText class="h-4 w-4 mr-2 text-onPrimary" />
                          Leer
                        </AppButton>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Videos */}
            <TabsContent value="videos" class="space-y-6">
              <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVideos.value.map(video => (
                  <Card key={video.id} class="rounded-2xl border border-outline/40 bg-surface hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div class="flex justify-between items-start mb-2">
                        {CategoryBadge(video.category)}
                        <div class="flex items-center text-sm text-onSurface/70">
                          <Clock class="h-3 w-3 mr-1" />
                          {video.duration}
                        </div>
                      </div>
                      <CardTitle class="text-lg text-onSurface">{video.title}</CardTitle>
                      <CardDescription class="text-onSurface/70">{video.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div class="flex justify-between items-center">
                        <AppButton class="rounded-xl px-3 py-1.5 bg-surface border border-outline/40 text-onSurface hover:bg-surfaceVariant">
                          <Download class="h-4 w-4 mr-2" />
                          Descargar
                        </AppButton>
                        <AppButton
                          class="rounded-xl px-3 py-1.5 text-onPrimary"
                          style={{ backgroundImage: 'linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)))' }}
                        >
                          <Play class="h-4 w-4 mr-2 text-onPrimary" />
                          Reproducir
                        </AppButton>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Historias */}
            <TabsContent value="stories" class="space-y-6">
              <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stories.map(story => (
                  <Card key={story.id} class="rounded-2xl border border-outline/40 bg-surface hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div class="flex justify-between items-start mb-2">
                        {CategoryBadge(story.category)}
                        <div class="flex items-center text-sm text-onSurface/70">
                          <Clock class="h-3 w-3 mr-1" />
                          {story.readTime}
                        </div>
                      </div>
                      <CardTitle class="text-lg text-onSurface">{story.title}</CardTitle>
                      <CardDescription class="text-onSurface/70">{story.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div class="flex justify-between items-center">
                        <div class="flex items-center text-sm text-onSurface/70">
                          <Users class="h-3 w-3 mr-1" />
                          {story.author}
                        </div>
                        <AppButton
                          class="rounded-xl px-3 py-1.5 text-onPrimary"
                          style={{ backgroundImage: 'linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)))' }}
                        >
                          <Heart class="h-4 w-4 mr-2 text-onPrimary" />
                          Leer Historia
                        </AppButton>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* CTA final */}
          <div class="mt-12 text-center">
            <Card class="max-w-2xl mx-auto rounded-2xl border border-outline/40 bg-surface">
              <CardHeader>
                <CardTitle class="text-onSurface">¿Necesitas más ayuda?</CardTitle>
                <CardDescription class="text-onSurface/70">
                  Nuestro equipo está aquí para apoyarte en cada paso del camino
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div class="grid md:grid-cols-2 gap-4">
                  <AppButton class="w-full rounded-2xl bg-surface border border-outline/40 text-onSurface hover:bg-surfaceVariant">
                    <MessageCircle class="h-4 w-4 mr-2" />
                    Contactar Especialista
                  </AppButton>
                  <AppButton
                    class="w-full rounded-2xl text-onPrimary"
                    style={{ backgroundImage: 'linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)))' }}
                  >
                    <Users class="h-4 w-4 mr-2 text-onPrimary" />
                    Unirse a Grupo de Apoyo
                  </AppButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }
})
