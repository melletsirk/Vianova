<template>
  <div class="space-y-6">
    <div class="text-center space-y-2">
      <h2 class="text-2xl font-semibold">Minijuegos</h2>
      <p class="text-onSurface/70">Actividades para relajarte y divertirte</p>
    </div>

    <div class="grid gap-3 sm:gap-4 grid-cols-1">
      <GameCard
        v-for="game in games"
        :key="game.id"
        :game="game"
        @play="playGame"
      />
    </div>

    <GameModal
      :show="showModal"
      :game="selectedGame"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GameCard from './GameCard.vue'
import GameModal from './GameModal.vue'
import type { GameInfo } from './types'

const showModal = ref(false)
const selectedGame = ref<GameInfo | null>(null)

const games = ref<GameInfo[]>([
  {
    id: 'Snake',
    name: 'Snake',
    description: 'Come manzanas y crece para lograr la mayor puntuación posible',
    icon: '🐍',
    difficulty: 'Fácil',
    estimatedTime: '5 min',
    category: 'cognitive'
  }
])

const playGame = (gameId: string) => {
  const game = games.value.find(g => g.id === gameId)
  if (game) {
    selectedGame.value = game
    showModal.value = true
  }
}

const closeModal = () => {
  showModal.value = false
  selectedGame.value = null
}
</script>