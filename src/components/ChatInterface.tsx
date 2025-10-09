import { defineComponent, ref } from 'vue'
import AppButton from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Send, Phone, Video, ArrowLeft } from 'lucide-vue-next'

/* ===== UI mínimos locales con tokens ===== */
const Input = defineComponent({
  name: 'Input',
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    class: { type: String, default: '' }
  },
  emits: ['update:modelValue', 'enter'],
  setup(props, { emit }) {
    return () => (
      <input
        type="text"
        value={props.modelValue}
        placeholder={props.placeholder}
        class={[
          'w-full px-3 py-2 rounded-xl outline-none',
          'bg-surface border border-outline/40 text-onSurface placeholder-onSurface/60',
          'focus:ring-2 focus:ring-[rgb(var(--brand-500))/0.25]',
          props.class
        ]}
        onInput={(e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)}
        onKeypress={(e: KeyboardEvent) => e.key === 'Enter' && emit('enter')}
      />
    )
  }
})

const ScrollArea = defineComponent({
  name: 'ScrollArea',
  props: { class: { type: String, default: '' } },
  setup(props, { slots }) {
    return () => <div class={['overflow-y-auto', props.class]}>{slots.default?.()}</div>
  }
})

const Avatar = defineComponent({
  name: 'Avatar',
  setup(_, { slots }) {
    return () => (
      <div class="w-9 h-9 rounded-full overflow-hidden bg-surfaceVariant border border-outline/40 grid place-items-center">
        {slots.default?.()}
      </div>
    )
  }
})

const AvatarFallback = defineComponent({
  name: 'AvatarFallback',
  props: { class: { type: String, default: '' } },
  setup(props, { slots }) {
    return () => (
      <div class={['w-full h-full grid place-items-center text-white text-sm font-medium', props.class]}>
        {slots.default?.()}
      </div>
    )
  }
})
/* ===== fin UI mínimos ===== */

export default defineComponent({
  name: 'ChatInterface',
  props: {
    contactName: { type: String, required: true },
    contactRole: { type: String as () => 'patient' | 'caregiver' | 'professional', required: true }
  },
  emits: ['back'],
  setup(props, { emit }) {
    type Message = {
      id: string
      sender: string
      content: string
      timestamp: string
      isCurrentUser: boolean
    }

    const messages = ref<Message[]>([
      { id: '1', sender: props.contactName, content: 'Hola, ¿cómo te sientes hoy?', timestamp: '10:30', isCurrentUser: false },
      { id: '2', sender: 'Tú', content: 'Hola, he tenido un día difícil. El dolor ha sido más intenso.', timestamp: '10:32', isCurrentUser: true },
      { id: '3', sender: props.contactName, content: 'Lo siento mucho. ¿Has probado los ejercicios de respiración que te recomendé?', timestamp: '10:35', isCurrentUser: false }
    ])

    const newMessage = ref('')

    const sendMessage = () => {
      if (newMessage.value.trim()) {
        messages.value.push({
          id: Date.now().toString(),
          sender: 'Tú',
          content: newMessage.value,
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          isCurrentUser: true
        })
        newMessage.value = ''
      }
    }

    const getContactInitials = () =>
      props.contactName.split(' ').map(n => n[0]).join('').toUpperCase()

    // Color del avatar según rol usando la paleta reducida
    const getContactAvatarStyle = () => {
      switch (props.contactRole) {
        case 'patient':
          return 'linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)))'
        case 'caregiver':
          return 'linear-gradient(135deg, rgb(var(--color-success)), rgb(var(--color-success)))'
        case 'professional':
        default:
          return 'linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)))'
      }
    }

    return () => (
      <div class="min-h-screen gradient-calm p-4 text-onSurface">
        <div class="max-w-4xl mx-auto">
          <Card class="h-[calc(100vh-2rem)] rounded-2xl border border-outline/40 bg-surface overflow-hidden">
            {/* Header */}
            <CardHeader class="border-b border-outline/40 bg-surface/70 backdrop-blur">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <AppButton class="bg-transparent hover:bg-surfaceVariant rounded-full w-9 h-9" onClick={() => emit('back')}>
                    <ArrowLeft class="h-4 w-4 text-onSurface" />
                  </AppButton>
                  <Avatar>
                    <AvatarFallback class="text-onPrimary" style={{ backgroundImage: getContactAvatarStyle() }}>
                      {getContactInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle class="text-lg text-onSurface">{props.contactName}</CardTitle>
                    <p class="text-sm text-onSurface/70 capitalize">
                      {props.contactRole === 'patient' ? 'Paciente' : props.contactRole === 'caregiver' ? 'Cuidador' : 'Profesional'}
                    </p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <AppButton class="bg-surface border border-outline/40 text-onSurface rounded-xl px-3 py-1.5 hover:bg-surfaceVariant">
                    <Phone class="h-4 w-4" />
                  </AppButton>
                  <AppButton class="bg-surface border border-outline/40 text-onSurface rounded-xl px-3 py-1.5 hover:bg-surfaceVariant">
                    <Video class="h-4 w-4" />
                  </AppButton>
                </div>
              </div>
            </CardHeader>

            {/* Content */}
            <CardContent class="flex flex-col h-[calc(100%-140px)] p-0">
              <ScrollArea class="flex-1 p-4">
                <div class="space-y-4">
                  {messages.value.map(m => (
                    <div key={m.id} class={['flex', m.isCurrentUser ? 'justify-end' : 'justify-start'].join(' ')}>
                      <div
                        class={[
                          'max-w-xs lg:max-w-md px-4 py-2 rounded-2xl border',
                          m.isCurrentUser
                            ? 'text-onPrimary border-transparent'
                            : 'bg-surfaceVariant text-onSurface border-outline/40'
                        ].join(' ')}
                        style={
                          m.isCurrentUser
                            ? { backgroundImage: 'linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)))' }
                            : {}
                        }
                      >
                        <p class="text-sm">{m.content}</p>
                        <p class={['text-xs mt-1', m.isCurrentUser ? 'text-white/80' : 'text-onSurface/60'].join(' ')}>
                          {m.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Composer */}
              <div class="border-t border-outline/40 p-4 bg-surface/60 backdrop-blur">
                <div class="flex gap-2">
                  <Input
                    placeholder="Escribe tu mensaje..."
                    v-model={newMessage.value}
                    class="flex-1"
                    onEnter={sendMessage}
                  />
                  <AppButton
                    onClick={sendMessage}
                    class={[
                      'rounded-xl px-4 h-10 text-onPrimary',
                      newMessage.value.trim()
                        ? ''
                        : 'opacity-50 cursor-not-allowed'
                    ].join(' ')}
                    disabled={!newMessage.value.trim()}
                    style={{
                      backgroundImage: 'linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)))'
                    }}
                  >
                    <Send class="h-4 w-4 text-onPrimary" />
                  </AppButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
})
