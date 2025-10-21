// Wellness content data
export interface WellnessActivity {
  id: string
  title: string
  subtitle: string
  icon: string
  iconBg: string
  audioSrc?: string
  audioTitle?: string
  textContent?: Array<{
    title?: string
    content: string
  }>
  instructions?: Array<{
    title: string
    description: string
  }>
  buttonText: string
  type: 'breathing' | 'music' | 'meditation' | 'reflection'
}

// URLs de audio - OPCIÓN 1: Archivos locales (recomendado para desarrollo)
// Coloca tus archivos MP3 en la carpeta public/audio/
const AUDIO_URLS = {
  breathing: '/audio/breathing-guide.mp3',
  meditation: '/audio/meditation-guided.mp3',
  music: '/audio/relaxation-alpha.mp3',
  reflection: '/audio/ambient-reflection.mp3'
}

// OPCIÓN 2: URLs externas (descomenta si prefieres usar enlaces externos)
// const AUDIO_URLS = {
//   breathing: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
//   meditation: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
//   music: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
//   reflection: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
// }

export const wellnessActivities: WellnessActivity[] = [
  {
    id: 'breathing',
    title: 'Respiración Consciente',
    subtitle: '5 minutos de relajación profunda',
    icon: 'Heart',
    iconBg: 'rgb(var(--color-success))',
    instructions: [
      { title: 'Inhala', description: '4 segundos - Siente cómo el aire llena tus pulmones' },
      { title: 'Retén', description: '7 segundos - Mantén la respiración suavemente' },
      { title: 'Exhala', description: '8 segundos - Libera el aire lentamente' },
      { title: 'Relaja', description: 'Relaja la mandíbula, hombros y cuello' }
    ],
    buttonText: 'Comenzar Respiración',
    type: 'breathing'
  },
  {
    id: 'music',
    title: 'Relajación Musical',
    subtitle: 'Música terapéutica especializada',
    icon: 'Music',
    iconBg: 'rgb(var(--brand-500))',
    audioSrc: AUDIO_URLS.music,
    audioTitle: 'Música de Relajación',
    textContent: [
      {
        title: 'Sobre la Música Terapéutica',
        content: 'Esta música ha sido diseñada con frecuencias específicas para promover la relajación profunda y reducir el estrés. Las ondas alfa (8-12 Hz) ayudan a inducir un estado de calma mental.'
      },
      {
        title: 'Beneficios',
        content: 'Reduce la ansiedad, mejora la concentración, facilita el sueño reparador y promueve un estado de bienestar general.'
      }
    ],
    buttonText: 'Reproducir Música',
    type: 'music'
  },
  {
    id: 'meditation',
    title: 'Meditación Guiada',
    subtitle: 'Sesiones de mindfulness',
    icon: 'BookOpen',
    iconBg: 'rgb(var(--color-success))',
    audioSrc: AUDIO_URLS.meditation,
    audioTitle: 'Meditación Guiada - Presencia Plena',
    textContent: [
      {
        title: 'Meditación para Principiantes',
        content: 'Siéntate cómodamente en una silla o cojín. Mantén la espalda recta pero relajada. Coloca las manos en tu regazo o rodillas.'
      },
      {
        title: 'Enfoque en la Respiración',
        content: 'Observa tu respiración natural. Siente cómo el aire entra y sale de tus fosas nasales. No intentes controlar la respiración, solo obsérvala.'
      },
      {
        title: 'Manejo de Pensamientos',
        content: 'Cuando tu mente divague, gentilmente trae tu atención de vuelta a la respiración. No juzgues tus pensamientos, solo obsérvalos pasar como nubes.'
      }
    ],
    instructions: [
      { title: 'Postura', description: 'Siéntate cómodo con espalda recta' },
      { title: 'Respiración', description: 'Observa tu respiración natural' },
      { title: 'Atención', description: 'Regresa gentilmente cuando la mente divague' },
      { title: 'Tiempo', description: 'Comienza con 5 minutos diarios' }
    ],
    buttonText: 'Iniciar Meditación',
    type: 'meditation'
  },
  {
    id: 'reflection',
    title: 'Reflexión Espiritual',
    subtitle: 'Momentos de conexión interna',
    icon: 'Sparkles',
    iconBg: 'rgb(var(--brand-600))',
    audioSrc: AUDIO_URLS.reflection,
    audioTitle: 'Música Ambiental - Reflexión Interior',
    textContent: [
      {
        title: 'Frase del Día',
        content: '"Cada momento es una oportunidad para elegir la paz sobre el conflicto, el amor sobre el miedo, y la gratitud sobre la queja."'
      },
      {
        title: 'Reflexión',
        content: 'Tómate un momento para respirar profundamente. ¿Qué aspectos de tu vida te hacen sentir agradecido hoy? ¿Qué lecciones has aprendido recientemente?'
      },
      {
        title: 'Conexión Interior',
        content: 'En el silencio de este momento, conecta con tu esencia más profunda. Recuerda que eres parte de algo mucho más grande, y que cada experiencia contribuye a tu crecimiento.'
      },
      {
        title: 'Bendición Final',
        content: 'Que encuentres paz en tu corazón, fuerza en tu espíritu, y amor en tus acciones. Namasté.'
      }
    ],
    buttonText: 'Comenzar Reflexión',
    type: 'reflection'
  }
]

// Helper function to get activity by ID
export const getWellnessActivity = (id: string): WellnessActivity | undefined => {
  return wellnessActivities.find(activity => activity.id === id)
}