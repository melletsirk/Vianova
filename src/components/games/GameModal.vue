<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4"
        @click.self="$emit('close')"
      >
        <div class="bg-surface rounded-2xl w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
          <!-- Header -->
          <div class="p-4 border-b border-outline/40 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ game?.icon }}</span>
              <div>
                <h3 class="font-semibold text-onSurface">{{ game?.name }}</h3>
                <p class="text-sm text-onSurface/60">{{ game?.difficulty }} • {{ game?.estimatedTime }}</p>
              </div>
            </div>
            <button
              @click="$emit('close')"
              class="p-2 hover:bg-surfaceVariant rounded-lg transition-colors"
            >
              <span class="text-xl">✕</span>
            </button>
          </div>

          <!-- Game Content -->
          <div class="p-4">
            <div v-if="loading" class="flex items-center justify-center py-12">
              <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4"></div>
                <p class="text-onSurface/70">Cargando juego...</p>
              </div>
            </div>

            <component
              v-else-if="gameComponent"
              :is="gameComponent"
              @close="$emit('close')"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import type { GameInfo } from './types'

interface Props {
  show: boolean
  game: GameInfo | null
}

const props = defineProps<Props>()
defineEmits<{
  close: []
}>()

const gameComponent = ref()
const loading = ref(false)

watch(() => props.game, async (newGame) => {
  if (newGame) {
    loading.value = true
    try {
      gameComponent.value = defineAsyncComponent(() =>
        import(`./${newGame.id}Game.vue`)
      )
    } catch (error) {
      console.error('Error loading game component:', error)
    } finally {
      loading.value = false
    }
  } else {
    gameComponent.value = null
  }
}, { immediate: true })
</script>