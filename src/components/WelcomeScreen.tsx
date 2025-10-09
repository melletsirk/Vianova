import { defineComponent } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Heart, Users, Stethoscope, Sparkles } from 'lucide-vue-next'

export default defineComponent({
  name: 'WelcomeScreen',
  emits: ['selectRole'],
  setup(_, { emit }) {
    return () => (
      <div class="app-container gradient-calm min-h-screen text-onSurface">
        {/* Header */}
        <div class="safe-area-pt px-6 pt-6 pb-4">
          <div class="text-center space-y-3">
            <div class="relative inline-flex items-center justify-center">
              {/* Halo brand */}
              <div
                class="absolute inset-0 rounded-full blur-lg opacity-30"
                style="background: radial-gradient(circle at 50% 50%, rgb(var(--brand-400)) 0%, rgba(0,0,0,0) 60%);"
              />
              <div class="relative w-16 h-16 gradient-primary rounded-full grid place-items-center shadow-lg overflow-hidden">
                <img src="/src/assets/logoVianova.png" alt="Logo VIANOVA" class="h-8 w-8 object-contain" />
              </div>
            </div>
            <h1 class="text-4xl font-semibold tracking-tight">VIANOVA</h1>
          </div>
        </div>

        <div class="px-6 space-y-3 pb-6">
          <div class="text-center mb-4">
            <div class="inline-flex items-center gap-2 bg-surface/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-outline/40">
              <Sparkles class="h-4 w-4 text-brand-600" />
              <span class="text-base text-onSurface/80 font-medium">Selecciona tu perfil</span>
            </div>
          </div>

          {/* Paciente */}
          <Card
            class="cursor-pointer overflow-hidden transition-all duration-300 active:scale-[0.98] rounded-2xl border border-outline/40 bg-surface"
            onClick={() => emit('selectRole', 'patient')}
          >
            <CardHeader class="pb-3">
              <div class="flex items-center gap-4">
                <div class="relative">
                  <div
                    class="w-12 h-12 rounded-xl grid place-items-center shadow-lg text-onPrimary"
                    style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
                  >
                    <Heart class="h-6 w-6" />
                  </div>
                  <div class="absolute -top-1 -right-1 w-4 h-4 rounded-full grid place-items-center bg-brand-50">
                    <div class="w-2 h-2 rounded-full bg-brand-600" />
                  </div>
                </div>
                <div class="flex-1">
                  <CardTitle class="text-xl font-semibold">PACIENTE</CardTitle>
                  <CardDescription class="text-base text-onSurface/70 mt-1">
                    Gestiona tu bienestar diario y recibe apoyo personalizado
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent class="pt-0">
              <div class="flex items-center gap-2 text-base text-onSurface/60">
                <div class="w-2 h-2 bg-brand-400 rounded-full" />
                <span>Diario emocional • Ejercicios • Comunicación</span>
              </div>
            </CardContent>
          </Card>

          {/* Cuidador */}
          <Card
            class="cursor-pointer overflow-hidden transition-all duration-300 active:scale-[0.98] rounded-2xl border border-outline/40 bg-surface"
            onClick={() => emit('selectRole', 'caregiver')}
          >
            <CardHeader class="pb-3">
              <div class="flex items-center gap-4">
                <div class="relative">
                  <div
                    class="w-12 h-12 rounded-xl grid place-items-center shadow-lg text-onPrimary"
                    style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
                  >
                    <Users class="h-6 w-6" />
                  </div>
                  <div class="absolute -top-1 -right-1 w-4 h-4 rounded-full grid place-items-center bg-brand-50">
                    <div class="w-2 h-2 rounded-full bg-brand-600" />
                  </div>
                </div>
                <div class="flex-1">
                  <CardTitle class="text-xl font-semibold">CUIDADOR</CardTitle>
                  <CardDescription class="text-base text-onSurface/70 mt-1">
                    Organiza cuidados y apoya a tu ser querido
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent class="pt-0">
              <div class="flex items-center gap-2 text-base text-onSurface/60">
                <div class="w-2 h-2 bg-brand-400 rounded-full" />
                <span>Agenda • Seguimiento • Recursos</span>
              </div>
            </CardContent>
          </Card>

          {/* Profesional */}
          <Card
            class="cursor-pointer overflow-hidden transition-all duration-300 active:scale-[0.98] rounded-2xl border border-outline/40 bg-surface"
            onClick={() => emit('selectRole', 'professional')}
          >
            <CardHeader class="pb-3">
              <div class="flex items-center gap-4">
                <div class="relative">
                  <div
                    class="w-12 h-12 rounded-xl grid place-items-center shadow-lg text-onPrimary"
                    style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
                  >
                    <Stethoscope class="h-6 w-6" />
                  </div>
                  <div class="absolute -top-1 -right-1 w-4 h-4 rounded-full grid place-items-center bg-brand-50">
                    <div class="w-2 h-2 rounded-full bg-brand-600" />
                  </div>
                </div>
                <div class="flex-1">
                  <CardTitle class="text-xl font-semibold">PROFESIONAL</CardTitle>
                  <CardDescription class="text-base text-onSurface/70 mt-1">
                    Monitorea pacientes y coordina atención
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent class="pt-0">
              <div class="flex items-center gap-2 text-base text-onSurface/60">
                <div class="w-2 h-2 bg-brand-400 rounded-full" />
                <span>Seguimiento • Análisis • Comunicación</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div class="px-6 pb-6 safe-area-pb">
          <div class="text-center space-y-3">
            <div class="h-px bg-gradient-to-r from-transparent via-outline to-transparent" />
            <div class="space-y-1">
              <p class="text-base text-onSurface/70">¿Ya tienes una cuenta?</p>
              <button class="text-base font-medium transition-colors duration-200 active:scale-95 text-brand-600 hover:text-brand-500">
                Iniciar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
})
