import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { storage } from '@/firebase'
import { useAuthStore } from './auth'

export const useWellnessStore = defineStore('wellness', () => {
  const authStore = useAuthStore()

  // State
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const error = ref<string | null>(null)

  /**
   * Upload an audio file to Firebase Storage
   */
  const uploadAudioFile = async (
    file: File,
    fileName: string,
    category: 'breathing' | 'meditation' | 'music' | 'reflection' = 'meditation'
  ): Promise<{ success: boolean; downloadURL?: string; error?: string }> => {
    if (!authStore.user?.uid) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      return { success: false, error: 'El archivo debe ser de tipo audio' }
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return { success: false, error: 'El archivo no puede superar los 10MB' }
    }

    uploading.value = true
    uploadProgress.value = 0
    error.value = null

    try {
      // Create a unique filename
      const timestamp = Date.now()
      const extension = file.name.split('.').pop()
      const uniqueFileName = `${category}/${timestamp}_${fileName}.${extension}`

      // Create storage reference
      const audioRef = storageRef(storage, `wellness/audio/${uniqueFileName}`)

      // Upload file
      const snapshot = await uploadBytes(audioRef, file)

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref)

      return { success: true, downloadURL }
    } catch (err: any) {
      error.value = err.message
      console.error('Error uploading audio file:', err)
      return { success: false, error: err.message }
    } finally {
      uploading.value = false
      uploadProgress.value = 0
    }
  }

  /**
   * Delete an audio file from Firebase Storage
   */
  const deleteAudioFile = async (fileURL: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Extract the file path from the URL
      const url = new URL(fileURL)
      const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0])

      const audioRef = storageRef(storage, path)
      await deleteObject(audioRef)

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting audio file:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Get all audio files for a category (for admin management)
   */
  const getAudioFiles = async (category?: string): Promise<{ success: boolean; files?: any[]; error?: string }> => {
    // Note: Firebase Storage doesn't have a direct list operation
    // This would require storing file metadata in Firestore
    // For now, return empty array
    return { success: true, files: [] }
  }

  /**
   * Validate audio file before upload
   */
  const validateAudioFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!file.type.startsWith('audio/')) {
      return { valid: false, error: 'Solo se permiten archivos de audio' }
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'El archivo no puede superar los 10MB' }
    }

    // Check file extension
    const allowedExtensions = ['mp3', 'wav', 'm4a', 'aac', 'ogg']
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !allowedExtensions.includes(extension)) {
      return { valid: false, error: 'Formato de audio no soportado. Use MP3, WAV, M4A, AAC o OGG' }
    }

    return { valid: true }
  }

  return {
    // State
    uploading,
    uploadProgress,
    error,

    // Actions
    uploadAudioFile,
    deleteAudioFile,
    getAudioFiles,
    validateAudioFile
  }
})