// API service for fetching evaluation results from Agentuity

interface EvaluationSummary {
  id: string
  status: 'completed' | 'running' | 'failed' | 'unknown' | 'comparison_completed' | 'dataset_loaded' | 'execution_completed'
  startedAt: string
  completedAt?: string
  dataset_name?: string
  model_name?: string
  total_cases: number
  results?: {
    totalCases: number
    averageSimilarityScore: number
    highSimilarityCount: number
    mediumSimilarityCount: number
    lowSimilarityCount: number
    highSimilarityRate: number
  }
}

interface EvaluationDetails extends EvaluationSummary {
  judge_model?: string
  similarity_threshold?: number
  evaluation_id?: string
  high_similarity_count?: number
  medium_similarity_count?: number
  low_similarity_count?: number
  average_similarity_score?: number
  comparison_results?: ComparisonCase[]
}

interface ComparisonCase {
  case_id: string
  original_query: string
  expected_response: string
  model_response: string
  similarity_score: number
  similarity_category: 'high' | 'medium' | 'low'
  judge_reasoning: string
  success: boolean
}

interface EvaluationCasesResponse {
  evaluation_id: string
  total_cases: number
  cases: ComparisonCase[]
}

interface CreateEvaluationConfig {
  evaluationId: string
  datasetSource: 'existing' | 'upload'
  selectedDataset?: string
  datasetJson?: Record<string, unknown>[]
  modelName: string
  maxTokens: number
  temperature: number
  judgeModel: string
  similarityThreshold: number
  promptTemplate: string
}

interface CreateEvaluationResponse {
  success: boolean
  evaluation_id?: string
  error?: string
}

interface DatasetLoaderPayload extends Record<string, unknown> {
  evaluation_id: string
  format: string
  prompt_template: {
    template: string
    variables: string[]
  }
  model_config: {
    model_name: string
    max_tokens: number
    temperature: number
  }
  evaluation_settings: {
    similarity_threshold: number
    judge_model: string
  }
  dataset_path?: string
  dataset_json?: Record<string, unknown>[]
}

class ApiService {
  private baseUrl: string
  private datasetLoaderUrl: string
  private apiToken?: string

  constructor() {
    // Default to local dev environment
    this.baseUrl = 'https://dev-uzeflmvib.agentuity.run/agent_b46de37831f94d01b06b2ccfd183efa0'
    this.datasetLoaderUrl = 'https://dev-uzeflmvib.agentuity.run/agent_abcf9ad4245d2d89aed9eb38aef21fd6'
    this.apiToken = undefined // Set this if authentication is required
  }

  private async makeRequest<T>(url: string, data: Record<string, unknown> = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  private async makeResultsRequest<T>(operation: string, data: Record<string, string | number> = {}): Promise<T> {
    const requestBody = {
      operation,
      ...data
    }

    return this.makeRequest<T>(this.baseUrl, requestBody)
  }

  async createEvaluation(config: CreateEvaluationConfig): Promise<CreateEvaluationResponse> {
    try {
      // Prepare the request payload for the dataset_loader agent
      const payload: DatasetLoaderPayload = {
        evaluation_id: config.evaluationId,
        format: "query_response_pairs",
        prompt_template: {
          template: config.promptTemplate,
          variables: ["query"]
        },
        model_config: {
          model_name: config.modelName,
          max_tokens: config.maxTokens,
          temperature: config.temperature
        },
        evaluation_settings: {
          similarity_threshold: config.similarityThreshold,
          judge_model: config.judgeModel
        }
      }

      // Add dataset source based on configuration
      if (config.datasetSource === 'existing' && config.selectedDataset) {
        payload.dataset_path = `datasets/${config.selectedDataset}`
      } else if (config.datasetSource === 'upload' && config.datasetJson) {
        payload.dataset_json = config.datasetJson
      } else {
        throw new Error('Invalid dataset configuration')
      }

      // Call the dataset_loader agent
      const response = await this.makeRequest<Record<string, unknown>>(this.datasetLoaderUrl, payload)
      
      if (response.error && typeof response.error === 'string') {
        return {
          success: false,
          error: response.error
        }
      }

      return {
        success: true,
        evaluation_id: config.evaluationId
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async listEvaluations(): Promise<EvaluationSummary[]> {
    const response = await this.makeResultsRequest<{ evaluations: EvaluationSummary[] }>('list_evaluations')
    return response.evaluations
  }

  async getEvaluationDetails(evaluationId: string): Promise<EvaluationDetails> {
    const response = await this.makeResultsRequest<{ evaluation: EvaluationDetails, status: string }>('get_evaluation_details', { evaluation_id: evaluationId })
    return response.evaluation
  }

  async getEvaluationCases(evaluationId: string): Promise<ComparisonCase[]> {
    const response = await this.makeResultsRequest<EvaluationCasesResponse>('get_evaluation_cases', { evaluation_id: evaluationId })
    return response.cases
  }

  // Method to update configuration
  updateConfig(baseUrl: string, datasetLoaderUrl: string, apiToken?: string) {
    this.baseUrl = baseUrl
    this.datasetLoaderUrl = datasetLoaderUrl
    this.apiToken = apiToken
  }
}

export const apiService = new ApiService()
export type { EvaluationSummary, EvaluationDetails, ComparisonCase, CreateEvaluationConfig, CreateEvaluationResponse } 