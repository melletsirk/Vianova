// Script para subir archivos de audio a Firebase Storage
// Ejecutar con: node upload-audio.js

import { initializeApp } from 'firebase/app'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const firebaseConfig = {
  apiKey: "AIzaSyCi1McJ5npdsoww9qiOVcyj_0gGFsjvqM4",
  authDomain: "vianovadb.firebaseapp.com",
  projectId: "vianovadb",
  storageBucket: "vianovadb.firebasestorage.app",
  messagingSenderId: "718350529823",
  appId: "1:718350529823:web:fda1e840eae4755c312c2a"
}

const app = initializeApp(firebaseConfig)
const storage = getStorage(app)

const audioFiles = [
  {
    localPath: path.join(__dirname, 'audio', 'breathing-guide.mp3'),
    storagePath: 'wellness/audio/breathing/breathing-guide.mp3',
    category: 'breathing'
  },
  {
    localPath: path.join(__dirname, 'audio', 'meditation-guided.mp3'),
    storagePath: 'wellness/audio/meditation/meditation-guided.mp3',
    category: 'meditation'
  },
  {
    localPath: path.join(__dirname, 'audio', 'relaxation-alpha.mp3'),
    storagePath: 'wellness/audio/music/relaxation-alpha.mp3',
    category: 'music'
  },
  {
    localPath: path.join(__dirname, 'audio', 'ambient-reflection.mp3'),
    storagePath: 'wellness/audio/reflection/ambient-reflection.mp3',
    category: 'reflection'
  }
]

async function uploadAudioFiles() {
  console.log('🚀 Iniciando subida de archivos de audio...\n')

  for (const file of audioFiles) {
    try {
      console.log(`📤 Subiendo: ${file.localPath}`)

      // Verificar que el archivo existe
      if (!fs.existsSync(file.localPath)) {
        console.log(`❌ Archivo no encontrado: ${file.localPath}`)
        continue
      }

      // Leer el archivo como buffer
      const fileBuffer = fs.readFileSync(file.localPath)

      // Crear referencia de storage
      const storageRef = ref(storage, file.storagePath)

      // Subir archivo usando Uint8Array
      const snapshot = await uploadBytes(storageRef, new Uint8Array(fileBuffer), {
        contentType: 'audio/mpeg',
        customMetadata: {
          'uploadedBy': 'vianova-script',
          'category': file.category,
          'originalName': path.basename(file.localPath)
        }
      })

      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref)

      console.log(`✅ Subido exitosamente: ${file.storagePath}`)
      console.log(`🔗 URL: ${downloadURL}\n`)

    } catch (error) {
      console.error(`❌ Error subiendo ${file.localPath}:`, error.message)
      console.error('Detalles del error:', error)

      // Intentar con diferentes content types
      try {
        console.log(`🔄 Reintentando con content type 'audio/mp3'...`)
        const storageRefRetry = ref(storage, file.storagePath)
        const snapshotRetry = await uploadBytes(storageRefRetry, new Uint8Array(fileBuffer), {
          contentType: 'audio/mp3'
        })
        const downloadURLRetry = await getDownloadURL(snapshotRetry.ref)
        console.log(`✅ Subido exitosamente en reintento: ${file.storagePath}`)
        console.log(`🔗 URL: ${downloadURLRetry}\n`)
        continue
      } catch (retryError) {
        console.error(`❌ Reintento fallido:`, retryError.message)
      }
    }
  }

  console.log('🎉 Proceso completado!')
  console.log('\n📝 Copia estas URLs en wellnessData.ts reemplazando las URLs placeholder')
}

uploadAudioFiles().catch(console.error)