<template>
  <div class="breathing-exercise p-4 sm:p-6">
    <div class="text-center mb-6">
      <h3 class="text-xl font-semibold text-onSurface mb-2">Respiración Consciente</h3>
      <p class="text-onSurface/70">5 minutos de relajación profunda</p>
    </div>

    <!-- Breathing Circle -->
    <div class="flex justify-center mb-8">
      <div
        class="breathing-circle"
        :class="{ 'breathing-in': phase === 'inhale', 'breathing-out': phase === 'exhale', 'breathing-hold': phase === 'hold' }"
      >
        <div class="text-center">
          <div class="text-2xl font-bold text-onPrimary mb-2">{{ phaseText }}</div>
          <div class="text-lg text-onPrimary/80">{{ countdown }}</div>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="bg-surfaceVariant rounded-2xl p-4 mb-6">
      <h4 class="font-medium text-onSurface mb-3">Instrucciones:</h4>
      <div class="space-y-2 text-sm text-onSurface/80">
        <p><strong>Inhala:</strong> 4 segundos - Siente cómo el aire llena tus pulmones</p>
        <p><strong>Retén:</strong> 7 segundos - Mantén la respiración suavemente</p>
        <p><strong>Exhala:</strong> 8 segundos - Libera el aire lentamente</p>
        <p><strong>Relaja:</strong> Relaja la mandíbula, hombros y cuello</p>
      </div>
    </div>

    <!-- Progress -->
    <div class="mb-6">
      <div class="flex justify-between text-sm text-onSurface/60 mb-2">
        <span>Progreso</span>
        <span>{{ Math.round(progress) }}%</span>
      </div>
      <div class="w-full bg-surfaceVariant rounded-full h-2">
        <div
          class="bg-brand-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: progress + '%' }"
        ></div>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex gap-3">
      <button
        @click="toggleExercise"
        class="flex-1 h-12 rounded-2xl text-onPrimary font-medium"
        :class="isActive ? 'bg-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))/0.9]' : 'bg-brand-600 hover:bg-brand-700'"
      >
        {{ isActive ? 'Detener' : 'Comenzar' }}
      </button>

      <button
        @click="$emit('close')"
        class="flex-1 h-12 rounded-2xl bg-surface border border-outline/40 text-onSurface hover:bg-surfaceVariant"
      >
        Cerrar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  close: []
}>()

const isActive = ref(false)
const phase = ref<'inhale' | 'hold' | 'exhale' | 'relax'>('inhale')
const countdown = ref(4)
const cycleCount = ref(0)
const totalCycles = 5 // 5 minutes with 4-7-8 breathing
const startTime = ref(0)
const interval = ref<number | null>(null)

const phaseText = computed(() => {
  switch (phase.value) {
    case 'inhale': return 'Inhala'
    case 'hold': return 'Retén'
    case 'exhale': return 'Exhala'
    case 'relax': return 'Relaja'
    default: return 'Inhala'
  }
})

const progress = computed(() => {
  return (cycleCount.value / totalCycles) * 100
})

const breathingPhases = [
  { phase: 'inhale', duration: 4 },
  { phase: 'hold', duration: 7 },
  { phase: 'exhale', duration: 8 },
  { phase: 'relax', duration: 3 }
]

const startExercise = () => {
  isActive.value = true
  cycleCount.value = 0
  startTime.value = Date.now()
  runBreathingCycle()
}

const stopExercise = () => {
  isActive.value = false
  if (interval.value) {
    clearInterval(interval.value)
    interval.value = null
  }
  phase.value = 'inhale'
  countdown.value = 4
}

const toggleExercise = () => {
  if (isActive.value) {
    stopExercise()
  } else {
    startExercise()
  }
}

const runBreathingCycle = () => {
  let phaseIndex = 0
  let timeLeft = breathingPhases[0].duration

  interval.value = setInterval(() => {
    countdown.value = timeLeft

    if (timeLeft <= 0) {
      phaseIndex++
      if (phaseIndex >= breathingPhases.length) {
        // Complete cycle
        cycleCount.value++
        if (cycleCount.value >= totalCycles) {
          stopExercise()
          return
        }
        phaseIndex = 0
      }

      phase.value = breathingPhases[phaseIndex].phase as any
      timeLeft = breathingPhases[phaseIndex].duration
    }

    timeLeft--
  }, 1000)
}

onUnmounted(() => {
  stopExercise()
})
</script>

<style scoped>
.breathing-circle {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 1s ease-in-out;
  box-shadow: 0 8px 32px rgba(var(--brand-500), 0.3);
}

.breathing-in {
  transform: scale(1.2);
  box-shadow: 0 12px 48px rgba(var(--brand-500), 0.4);
}

.breathing-out {
  transform: scale(0.8);
  box-shadow: 0 4px 16px rgba(var(--brand-500), 0.2);
}

.breathing-hold {
  transform: scale(1.1);
  box-shadow: 0 10px 40px rgba(var(--brand-500), 0.35);
}
</style>