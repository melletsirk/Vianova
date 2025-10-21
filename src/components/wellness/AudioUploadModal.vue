<template>
  <div class="audio-upload-modal">
    <div class="p-4 sm:p-6 border-b border-outline/40 flex items-center justify-between">
      <div class="flex items-center gap-2 sm:gap-3">
        <div class="w-8 h-8 rounded-full grid place-items-center text-onPrimary"
          style="background: linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-600)));">
          <Upload class="h-5 w-5" />
        </div>
        <div>
          <h3 class="font-semibold text-onSurface text-base sm:text-lg">Subir Audio</h3>
          <p class="text-xs sm:text-sm text-onSurface/60">Selecciona un archivo de audio</p>
        </div>
      </div>
      <button
        @click="$emit('close')"
        class="p-2 hover:bg-surfaceVariant rounded-lg transition-colors touch-manipulation"
      >
        <span class="text-lg sm:text-xl">✕</span>
      </button>
    </div>

    <div class="p-4 sm:p-6">
      <!-- File Input -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-onSurface/80 mb-3">
          Archivo de Audio
        </label>
        <div class="relative">
          <input
            ref="fileInputRef"
            type="file"
            accept="audio/*"
            @change="handleFileSelect"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div class="border-2 border-dashed border-outline/40 rounded-2xl p-8 text-center hover:border-brand-400/60 transition-colors">
            <Upload class="h-12 w-12 text-onSurface/40 mx-auto mb-4" />
            <p class="text-onSurface/70 mb-2">
              {{ selectedFile ? selectedFile.name : 'Haz clic para seleccionar un archivo' }}
            </p>
            <p class="text-xs text-onSurface/50">
              MP3, WAV, M4A, AAC, OGG (máx. 10MB)
            </p>
          </div>
        </div>
      </div>

      <!-- File Info -->
      <div v-if="selectedFile" class="mb-6 p-4 bg-surfaceVariant rounded-2xl">
        <h4 class="font-medium text-onSurface mb-2">Información del Archivo</h4>
        <div class="space-y-1 text-sm text-onSurface/70">
          <p><strong>Nombre:</strong> {{ selectedFile.name }}</p>
          <p><strong>Tamaño:</strong> {{ formatFileSize(selectedFile.size) }}</p>
          <p><strong>Tipo:</strong> {{ selectedFile.type }}</p>
        </div>
      </div>

      <!-- Upload Progress -->
      <div v-if="wellnessStore.uploading" class="mb-6">
        <div class="flex justify-between text-sm text-onSurface/60 mb-2">
          <span>Subiendo...</span>
          <span>{{ Math.round(wellnessStore.uploadProgress) }}%</span>
        </div>
        <div class="w-full bg-surfaceVariant rounded-full h-2">
          <div
            class="bg-brand-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: wellnessStore.uploadProgress + '%' }"
          ></div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="wellnessStore.error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
        <p class="text-red-700 text-sm">{{ wellnessStore.error }}</p>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button
          @click="$emit('close')"
          class="flex-1 h-12 rounded-2xl bg-surface border border-outline/40 text-onSurface hover:bg-surfaceVariant"
        >
          Cancelar
        </button>
        <button
          @click="uploadFile"
          :disabled="!selectedFile || wellnessStore.uploading"
          class="flex-1 h-12 rounded-2xl text-onPrimary font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          style="background: linear-gradient(90deg, rgb(var(--brand-500)), rgb(var(--brand-600)));"
        >
          {{ wellnessStore.uploading ? 'Subiendo...' : 'Subir Audio' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Upload } from 'lucide-vue-next'
import { useWellnessStore } from '@/stores/wellness'

interface Props {
  category: 'breathing' | 'meditation' | 'music' | 'reflection'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  uploaded: [url: string]
}>()

const wellnessStore = useWellnessStore()
const fileInputRef = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    const validation = wellnessStore.validateAudioFile(file)
    if (validation.valid) {
      selectedFile.value = file
    } else {
      alert(validation.error)
      // Clear the input
      if (fileInputRef.value) {
        fileInputRef.value.value = ''
      }
    }
  }
}

const uploadFile = async () => {
  if (!selectedFile.value) return

  const result = await wellnessStore.uploadAudioFile(
    selectedFile.value,
    selectedFile.value.name.replace(/\.[^/.]+$/, ''), // Remove extension
    props.category
  )

  if (result.success && result.downloadURL) {
    emit('uploaded', result.downloadURL)
    emit('close')
  }
}
</script>