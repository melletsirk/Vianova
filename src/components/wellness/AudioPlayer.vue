<template>
  <div class="audio-player">
    <div class="flex items-center gap-4 mb-4">
      <button
        @click="togglePlay"
        class="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 transition-colors"
      >
        <Play v-if="!isPlaying" class="w-5 h-5 ml-0.5" />
        <Pause v-else class="w-5 h-5" />
      </button>

      <div class="flex-1">
        <div class="text-sm font-medium text-onSurface mb-1">{{ title }}</div>
        <div class="w-full bg-surfaceVariant rounded-full h-2">
          <div
            class="bg-brand-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: progress + '%' }"
          ></div>
        </div>
        <div class="flex justify-between text-xs text-onSurface/60 mt-1">
          <span>{{ currentTime }}</span>
          <span>{{ duration }}</span>
        </div>
      </div>

      <button
        @click="toggleMute"
        class="w-8 h-8 rounded-full bg-surfaceVariant text-onSurface flex items-center justify-center hover:bg-surfaceVariant/80 transition-colors"
      >
        <Volume2 v-if="!isMuted" class="w-4 h-4" />
        <VolumeX v-else class="w-4 h-4" />
      </button>
    </div>

    <audio
      ref="audioRef"
      :src="src"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      preload="metadata"
    ></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Play, Pause, Volume2, VolumeX } from 'lucide-vue-next'

interface Props {
  src: string
  title: string
  autoplay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: false
})

const emit = defineEmits<{
  ended: []
  timeupdate: [currentTime: number, duration: number]
}>()

const audioRef = ref<HTMLAudioElement>()
const isPlaying = ref(false)
const isMuted = ref(false)
const currentTimeValue = ref(0)
const durationValue = ref(0)

const progress = computed(() => {
  if (durationValue.value === 0) return 0
  return (currentTimeValue.value / durationValue.value) * 100
})

const currentTime = computed(() => formatTime(currentTimeValue.value))
const duration = computed(() => formatTime(durationValue.value))

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const togglePlay = () => {
  if (!audioRef.value) return

  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play()
  }
  isPlaying.value = !isPlaying.value
}

const toggleMute = () => {
  if (!audioRef.value) return

  audioRef.value.muted = !audioRef.value.muted
  isMuted.value = audioRef.value.muted
}

const onLoadedMetadata = () => {
  if (audioRef.value) {
    durationValue.value = audioRef.value.duration
  }
}

const onTimeUpdate = () => {
  if (audioRef.value) {
    currentTimeValue.value = audioRef.value.currentTime
    emit('timeupdate', audioRef.value.currentTime, audioRef.value.duration)
  }
}

const onEnded = () => {
  isPlaying.value = false
  emit('ended')
}

// Cleanup on unmount
onUnmounted(() => {
  if (audioRef.value) {
    audioRef.value.pause()
  }
})
</script>