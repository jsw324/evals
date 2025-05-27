// Local storage utility for managing evaluation data

export interface SavedEvaluation {
  id: string
  name: string
  createdAt: string
  status: 'created' | 'running' | 'completed' | 'failed'
  config: {
    modelName: string
    judgeModel: string
    datasetSource: 'existing' | 'upload'
    selectedDataset?: string
    similarityThreshold: number
  }
}

const STORAGE_KEY = 'agentuity_evaluations'

export class EvaluationStorage {
  static saveEvaluation(evaluation: SavedEvaluation): void {
    const existing = this.getEvaluations()
    const updated = existing.filter(e => e.id !== evaluation.id)
    updated.unshift(evaluation) // Add to beginning
    
    // Keep only the last 50 evaluations
    const trimmed = updated.slice(0, 50)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  }

  static getEvaluations(): SavedEvaluation[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading evaluations from storage:', error)
      return []
    }
  }

  static getEvaluation(id: string): SavedEvaluation | null {
    const evaluations = this.getEvaluations()
    return evaluations.find(e => e.id === id) || null
  }

  static updateEvaluationStatus(id: string, status: SavedEvaluation['status']): void {
    const evaluations = this.getEvaluations()
    const evaluation = evaluations.find(e => e.id === id)
    
    if (evaluation) {
      evaluation.status = status
      localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations))
    }
  }

  static deleteEvaluation(id: string): void {
    const evaluations = this.getEvaluations()
    const filtered = evaluations.filter(e => e.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  }

  static clearAll(): void {
    localStorage.removeItem(STORAGE_KEY)
  }
} 