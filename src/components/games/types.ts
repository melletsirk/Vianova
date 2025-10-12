// Game-related types
export interface GameInfo {
  id: string
  name: string
  description: string
  icon: string
  difficulty: 'Fácil' | 'Medio' | 'Difícil'
  estimatedTime: string
  category: 'relaxing' | 'cognitive' | 'fun'
}

export interface GameStats {
  played: number
  highScore: number
  totalTime: number
  lastPlayed?: Date
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

export interface Position {
  x: number
  y: number
}

export interface SnakeGameState {
  snake: Position[]
  food: Position
  direction: Direction
  score: number
  gameOver: boolean
  paused: boolean
}