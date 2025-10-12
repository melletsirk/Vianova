# 🎮 Sistema de Minijuegos - VIANOVA

## 📁 Estructura de Archivos

```
src/components/games/
├── types.ts              # Tipos TypeScript para juegos
├── GameLauncher.vue      # Selector principal de juegos
├── GameCard.vue          # Tarjeta individual de juego
├── GameModal.vue         # Modal contenedor para juegos
├── SnakeGame.vue         # Implementación del juego Snake
└── README.md            # Este archivo
```

## 🎯 Cómo Funciona

### 1. **GameLauncher.vue**
- Muestra la lista de juegos disponibles
- Cada juego se presenta en una `GameCard`
- Maneja la apertura del modal de juego

### 2. **GameModal.vue**
- Contenedor modal para juegos
- Carga lazy del componente del juego
- Maneja estados de loading y cierre

### 3. **SnakeGame.vue**
- Juego completo de Snake
- Canvas HTML5 para renderizado
- Controles táctiles y de teclado
- Sistema de puntuación con localStorage

### 4. **GameCard.vue**
- Presentación visual de cada juego
- Información: nombre, descripción, dificultad, tiempo estimado
- Botón "Jugar" que abre el modal

## 🎮 Características del Juego Snake

### Controles
- **Teclado**: Flechas (↑↓←→) o WASD
- **Táctil**: Botones en pantalla para móviles
- **Espacio**: Pausar/Reanudar

### Mecánica
- Come comida roja para crecer
- Evita chocar contra paredes o tu propio cuerpo
- Puntaje aumenta con cada comida
- Record personal guardado en localStorage

### Optimizaciones Móviles
- Controles táctiles grandes
- Canvas responsive
- Vibración opcional (futuro)
- Rendimiento optimizado

## 🚀 Integración en Dashboard

### En PatientDashboard.vue
```vue
<!-- Nueva pestaña -->
{ id: 'games', label: 'Juegos', icon: () => <Gamepad2 /> }

<!-- Sección del juego -->
{activeTab.value === 'games' && (
  <div class="space-y-6">
    <GameLauncher />
  </div>
)}
```

### Footer Actualizado
- 6 pestañas en lugar de 5
- Nueva pestaña "Juegos" con ícono de Gamepad2
- Layout responsive mantenido

## 🎨 Diseño y UX

### Paleta de Colores
- Verde para la serpiente (#4ade80, #22c55e)
- Rojo para la comida (#ef4444)
- Fondo negro para el canvas
- Tema VIANOVA consistente

### Estados Visuales
- Game Over: Overlay con mensaje
- Pausado: Indicador visual
- Loading: Spinner durante carga lazy
- Score/High Score: Display prominente

## 📱 Compatibilidad

### PWA
- ✅ Canvas funciona perfectamente
- ✅ localStorage para puntajes
- ✅ Controles táctiles optimizados

### APK (Capacitor)
- ✅ WebView moderno soporta Canvas
- ✅ Touch events mapeados correctamente
- ✅ Sin dependencias nativas requeridas

## 🔧 Configuración Técnica

### Lazy Loading
```javascript
const gameComponent = defineAsyncComponent(() =>
  import(`./${gameId}Game.vue`)
)
```

### Canvas Setup
```javascript
const canvas = canvas.value
canvas.width = gridSize * cellSize  // 400x400
canvas.height = gridSize * cellSize
ctx.value = canvas.getContext('2d')
```

### Game Loop
```javascript
gameLoop.value = setInterval(() => {
  moveSnake()
  draw()
}, 150) // ~6.67 FPS
```

## 🎯 Próximos Juegos

### Fáciles de Implementar
1. **Pacman** - Similar complejidad a Snake
2. **Tetris** - Lógica más compleja pero factible
3. **Memory Match** - Muy simple, terapéutico
4. **Color Match** - Extremadamente simple

### Expansión Futura
- Sistema de logros
- Estadísticas por usuario
- Modos de dificultad
- Multijugador local
- Sincronización con Firestore

## 🧪 Testing

Para probar el sistema:

1. Login como paciente
2. Ir a pestaña "Juegos"
3. Click en "Snake"
4. Jugar usando controles táctiles o teclado
5. Verificar que el puntaje se guarde
6. Probar pausa y reinicio

## 🔧 Troubleshooting

### Errores Comunes
- **Canvas no carga**: Verificar que el ref esté correctamente asignado
- **Controles no responden**: Verificar event listeners en onMounted/onUnmounted
- **Puntaje no se guarda**: Verificar localStorage permissions

### Performance
- Mantener game loop por debajo de 60 FPS
- Limpiar intervals en onUnmounted
- Optimizar cálculos de colisión

## 📊 Métricas de Salud

El sistema puede rastrear:
- Tiempo total jugado
- Sesiones de juego
- Mejora en concentración
- Reducción de estrés (auto-reportado)

¡El sistema de juegos está listo para proporcionar diversión terapéutica a los pacientes de VIANOVA! 🎮✨