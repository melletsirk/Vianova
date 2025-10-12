<template>
  <Card class="rounded-2xl border border-outline/40 overflow-hidden bg-surface cursor-pointer transition-all duration-200 active:scale-[0.98]">
    <CardContent class="p-4 sm:p-6">
      <div class="flex items-start gap-3 sm:gap-4">
        <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl grid place-items-center shadow-lg text-2xl sm:text-3xl flex-shrink-0"
              :style="{ backgroundImage: 'linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)))' }">
          {{ game.icon }}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-1">
            <h3 class="font-semibold text-base sm:text-lg text-onSurface">{{ game.name }}</h3>
            <span :class="['px-2 py-1 text-xs font-medium rounded-full border self-start', getDifficultyColor(game.difficulty)]">
              {{ game.difficulty }}
            </span>
          </div>

          <p class="text-sm text-onSurface/70 mb-3 leading-relaxed">
            {{ game.description }}
          </p>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="flex items-center gap-3 sm:gap-4 text-xs text-onSurface/60">
              <span class="flex items-center gap-1">
                <span>⏱️</span>
                {{ game.estimatedTime }}
              </span>
              <span class="flex items-center gap-1">
                <span>🎯</span>
                {{ getCategoryLabel(game.category) }}
              </span>
            </div>

            <Button
              @click="$emit('play', game.id)"
              class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium w-full sm:w-auto"
            >
              Jugar
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import type { GameInfo } from './types'

interface Props {
  game: GameInfo
}

defineProps<Props>()
defineEmits<{
  play: [gameId: string]
}>()

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Fácil': return 'bg-green-50 text-green-700 border-green-400/40'
    case 'Medio': return 'bg-yellow-50 text-yellow-700 border-yellow-400/40'
    case 'Difícil': return 'bg-red-50 text-red-700 border-red-400/40'
    default: return 'bg-gray-50 text-gray-700 border-gray-400/40'
  }
}

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'relaxing': return 'Relajante'
    case 'cognitive': return 'Cognitivo'
    case 'fun': return 'Divertido'
    default: return 'Divertido'
  }
}
</script>