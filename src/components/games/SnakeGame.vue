<template>
  <div class="text-center space-y-4">
    <!-- Score display -->
    <div class="flex justify-between items-center text-sm">
      <div class="text-onSurface/70">Puntaje: <span class="font-bold text-brand-600">{{ gameState.score }}</span></div>
      <div class="text-onSurface/70">Record: <span class="font-bold text-brand-600">{{ highScore }}</span></div>
    </div>

    <!-- Game canvas -->
    <div class="relative flex justify-center">
      <canvas
        ref="canvas"
        class="border-2 border-outline/40 rounded-lg bg-black max-w-full h-auto"
        style="max-width: 400px; aspect-ratio: 1;"
      />

      <!-- Game Over Overlay -->
      <div
        v-if="gameState.gameOver"
        class="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg"
      >
        <div class="text-center text-white">
          <h3 class="text-xl font-bold mb-2">¡Game Over!</h3>
          <p class="mb-4">Puntaje final: {{ gameState.score }}</p>
          <Button
            @click="startGame"
            class="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            Jugar de Nuevo
          </Button>
        </div>
      </div>

      <!-- Paused Overlay -->
      <div
        v-else-if="gameState.paused"
        class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"
      >
        <div class="text-white text-xl font-bold">PAUSADO</div>
      </div>
    </div>

    <!-- Controls -->
    <div class="space-y-4">
      <!-- Mobile touch controls -->
      <div class="flex justify-center">
        <div class="grid grid-cols-3 gap-1 sm:gap-2 max-w-32 sm:max-w-48">
          <div></div>
          <button
            @touchstart.prevent="changeDirection('UP')"
            class="aspect-square bg-brand-500 text-white rounded-lg hover:bg-brand-600 active:bg-brand-700 touch-manipulation text-lg sm:text-xl font-bold transition-colors"
          >
            ↑
          </button>
          <div></div>

          <button
            @touchstart.prevent="changeDirection('LEFT')"
            class="aspect-square bg-brand-500 text-white rounded-lg hover:bg-brand-600 active:bg-brand-700 touch-manipulation text-lg sm:text-xl font-bold transition-colors"
          >
            ←
          </button>
          <div class="bg-gray-200 rounded-lg flex items-center justify-center">
            <span class="text-xs text-gray-600">🐍</span>
          </div>
          <button
            @touchstart.prevent="changeDirection('RIGHT')"
            class="aspect-square bg-brand-500 text-white rounded-lg hover:bg-brand-600 active:bg-brand-700 touch-manipulation text-lg sm:text-xl font-bold transition-colors"
          >
            →
          </button>

          <div></div>
          <button
            @touchstart.prevent="changeDirection('DOWN')"
            class="aspect-square bg-brand-500 text-white rounded-lg hover:bg-brand-600 active:bg-brand-700 touch-manipulation text-lg sm:text-xl font-bold transition-colors"
          >
            ↓
          </button>
          <div></div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex flex-wrap gap-2 sm:gap-3 justify-center">
        <Button
          v-if="!gameState.gameOver"
          @click="gameState.paused = !gameState.paused"
          class="px-3 sm:px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm sm:text-base"
        >
          {{ gameState.paused ? 'Reanudar' : 'Pausar' }}
        </Button>

        <Button
          @click="startGame"
          class="px-3 sm:px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 text-sm sm:text-base"
        >
          {{ gameState.gameOver ? 'Reiniciar' : 'Nuevo Juego' }}
        </Button>

        <Button
          @click="$emit('close')"
          class="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm sm:text-base"
        >
          Salir
        </Button>
      </div>

      <!-- Instructions -->
      <div class="text-xs sm:text-sm text-onSurface/60 space-y-1 px-2">
        <p><strong>Controles:</strong> Flechas del teclado o botones táctiles</p>
        <p><strong>Objetivo:</strong> Come la comida roja para crecer y aumentar tu puntaje</p>
        <p><strong>Evita:</strong> Chocar contra las paredes o tu propio cuerpo</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import Button from '@/components/ui/Button'
import type { Direction, Position, SnakeGameState } from './types'

defineEmits<{
  close: []
}>()

// Refs
const canvas = ref<HTMLCanvasElement>()
const ctx = ref<CanvasRenderingContext2D>()

// Game state
const gameState = ref<SnakeGameState>({
  snake: [{ x: 10, y: 10 }],
  food: { x: 15, y: 15 },
  direction: 'RIGHT',
  score: 0,
  gameOver: false,
  paused: false
})

const highScore = ref(parseInt(localStorage.getItem('snake-high-score') || '0'))
const gameLoop = ref<number>()
const cellSize = ref(20)
const gridSize = 20

// Initialize canvas
const initCanvas = async () => {
  await nextTick()
  if (!canvas.value) return

  const canvasEl = canvas.value
  const container = canvasEl.parentElement
  if (!container) return

  // Calculate responsive size - ensure it's exactly divisible by gridSize
  const maxSize = Math.min(container.clientWidth - 20, 400) // Max 400px, with padding
  const size = Math.floor(maxSize / gridSize) * gridSize // Ensure it's divisible by gridSize

  canvasEl.width = size
  canvasEl.height = size

  // Calculate actual cell size based on canvas size
  const actualCellSize = size / gridSize

  // Update cellSize to match actual canvas size
  cellSize.value = actualCellSize

  ctx.value = canvasEl.getContext('2d')!
  if (ctx.value) {
    ctx.value.fillStyle = '#000'
    ctx.value.fillRect(0, 0, canvasEl.width, canvasEl.height)
  }
}

// Generate random food position
const generateFood = (): Position => {
  let newFood: Position
  do {
    newFood = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize)
    }
  } while (gameState.value.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
  return newFood
}

// Draw game
const draw = () => {
  if (!ctx.value) return

  const context = ctx.value

  // Clear canvas
  context.fillStyle = '#000'
  context.fillRect(0, 0, canvas.value!.width, canvas.value!.height)

  // Draw snake
  gameState.value.snake.forEach((segment, index) => {
    if (index === 0) {
      context.fillStyle = '#22c55e' // green-500 (head)
    } else {
      context.fillStyle = '#4ade80' // green-400 (body)
    }
    context.fillRect(
      segment.x * cellSize.value,
      segment.y * cellSize.value,
      cellSize.value - 2,
      cellSize.value - 2
    )
  })

  // Draw food
  context.fillStyle = '#ef4444' // red-500
  context.fillRect(
    gameState.value.food.x * cellSize.value,
    gameState.value.food.y * cellSize.value,
    cellSize.value - 2,
    cellSize.value - 2
  )

  // Draw score
  context.fillStyle = '#fff'
  context.font = '16px Arial'
  context.fillText(`Score: ${gameState.value.score}`, 10, 20)
}

// Move snake
const moveSnake = () => {
  if (gameState.value.gameOver || gameState.value.paused) return

  const head = { ...gameState.value.snake[0] }

  switch (gameState.value.direction) {
    case 'UP':
      head.y -= 1
      break
    case 'DOWN':
      head.y += 1
      break
    case 'LEFT':
      head.x -= 1
      break
    case 'RIGHT':
      head.x += 1
      break
  }

  // Check wall collision
  if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
    gameOver()
    return
  }

  // Check self collision
  if (gameState.value.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver()
    return
  }

  gameState.value.snake.unshift(head)

  // Check food collision
  if (head.x === gameState.value.food.x && head.y === gameState.value.food.y) {
    gameState.value.score += 10
    gameState.value.food = generateFood()
  } else {
    gameState.value.snake.pop()
  }
}

// Game over
const gameOver = () => {
  gameState.value.gameOver = true
  if (gameState.value.score > highScore.value) {
    highScore.value = gameState.value.score
    localStorage.setItem('snake-high-score', highScore.value.toString())
  }
  stopGame()
}

// Start game
const startGame = () => {
  gameState.value = {
    snake: [{ x: 10, y: 10 }],
    food: generateFood(),
    direction: 'RIGHT',
    score: 0,
    gameOver: false,
    paused: false
  }
  startGameLoop()
}

// Start game loop
const startGameLoop = () => {
  if (gameLoop.value) return

  gameLoop.value = window.setInterval(() => {
    moveSnake()
    draw()
  }, 150) // Game speed
}

// Stop game
const stopGame = () => {
  if (gameLoop.value) {
    clearInterval(gameLoop.value)
    gameLoop.value = undefined
  }
}

// Change direction
const changeDirection = (newDirection: Direction) => {
  if (gameState.value.gameOver) return

  // Prevent reverse direction
  const opposites: Record<Direction, Direction> = {
    UP: 'DOWN',
    DOWN: 'UP',
    LEFT: 'RIGHT',
    RIGHT: 'LEFT'
  }

  if (opposites[newDirection] !== gameState.value.direction) {
    gameState.value.direction = newDirection
  }
}

// Keyboard controls
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      e.preventDefault()
      changeDirection('UP')
      break
    case 'ArrowDown':
    case 's':
    case 'S':
      e.preventDefault()
      changeDirection('DOWN')
      break
    case 'ArrowLeft':
    case 'a':
    case 'A':
      e.preventDefault()
      changeDirection('LEFT')
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      e.preventDefault()
      changeDirection('RIGHT')
      break
    case ' ':
      e.preventDefault()
      if (gameState.value.gameOver) {
        startGame()
      } else {
        gameState.value.paused = !gameState.value.paused
      }
      break
  }
}

onMounted(async () => {
  await initCanvas()
  draw()

  // Add keyboard listeners
  window.addEventListener('keydown', handleKeyDown)

  // Add resize listener for responsive canvas
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  stopGame()
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', handleResize)
})

// Handle window resize
const handleResize = async () => {
  await initCanvas()
  // Redraw current game state
  draw()
}
</script>