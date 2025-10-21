<template>
  <div class="meditation-modal">
    <div class="p-4 sm:p-6 border-b border-outline/40 flex items-center justify-between">
      <div class="flex items-center gap-2 sm:gap-3">
        <div class="w-8 h-8 rounded-full grid place-items-center text-onPrimary"
          :style="{ background: iconBg }">
          <component :is="icon" class="h-5 w-5" />
        </div>
        <div>
          <h3 class="font-semibold text-onSurface text-base sm:text-lg">{{ title }}</h3>
          <p class="text-xs sm:text-sm text-onSurface/60">{{ subtitle }}</p>
        </div>
      </div>
      <button
        @click="$emit('close')"
        class="p-2 hover:bg-surfaceVariant rounded-lg transition-colors touch-manipulation"
      >
        <span class="text-lg sm:text-xl">✕</span>
      </button>
    </div>

    <div class="p-4 sm:p-6 max-h-[calc(100vh-140px)] overflow-y-auto">
      <!-- Audio Player -->
      <div v-if="audioSrc" class="mb-6">
        <AudioPlayer
          :src="audioSrc"
          :title="audioTitle || 'Audio'"
          @ended="$emit('audioEnded')"
        />
      </div>

      <!-- Text Content -->
      <div v-if="textContent" class="space-y-4">
        <div v-for="(section, index) in textContent" :key="index" class="bg-surfaceVariant rounded-2xl p-4">
          <h4 v-if="section.title" class="font-medium text-onSurface mb-2">{{ section.title }}</h4>
          <p class="text-sm text-onSurface/80 leading-relaxed">{{ section.content }}</p>
        </div>
      </div>

      <!-- Instructions -->
      <div v-if="instructions" class="bg-brand-50 rounded-2xl p-4 border border-brand-400/40">
        <h4 class="font-medium text-onSurface mb-3">Instrucciones:</h4>
        <div class="space-y-2">
          <p v-for="(instruction, index) in instructions" :key="index" class="text-sm text-onSurface/80">
            <span class="font-medium">{{ instruction.title }}:</span> {{ instruction.description }}
          </p>
        </div>
      </div>

      <!-- Action Button -->
      <div class="mt-6">
        <button
          @click="$emit('action')"
          class="w-full h-12 rounded-2xl text-onPrimary font-medium"
          :style="{ background: buttonBg }"
        >
          {{ buttonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AudioPlayer from './AudioPlayer.vue'

interface TextSection {
  title?: string
  content: string
}

interface Instruction {
  title: string
  description: string
}

interface Props {
  type: 'breathing' | 'music' | 'meditation' | 'reflection'
  title: string
  subtitle: string
  audioSrc?: string
  audioTitle?: string
  textContent?: TextSection[]
  instructions?: Instruction[]
  buttonText: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  action: []
  audioEnded: []
}>()

const iconBg = computed(() => {
  switch (props.type) {
    case 'breathing': return 'rgb(var(--color-success))'
    case 'music': return 'linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));'
    case 'meditation': return 'rgb(var(--color-success))'
    case 'reflection': return 'linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));'
    default: return 'linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));'
  }
})

const buttonBg = computed(() => {
  return 'linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));'
})

// Import icons dynamically
const icon = computed(() => {
  switch (props.type) {
    case 'breathing': return 'Heart'
    case 'music': return 'Music'
    case 'meditation': return 'BookOpen'
    case 'reflection': return 'Sparkles'
    default: return 'Heart'
  }
})
</script>