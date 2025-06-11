import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BeakerIcon, 
  CogIcon, 
  DocumentTextIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { apiService, CreateEvaluationConfig, Dataset } from '../services/api'
import { EvaluationStorage, type SavedEvaluation } from '../utils/storage'

interface EvaluationConfig {
  evaluationId: string
  evaluationName: string
  datasetSource: 'existing' | 'upload'
  selectedDataset: string
  modelName: string
  maxTokens: number
  temperature: number
  judgeModel: string
  similarityThreshold: number
  promptTemplate: string
}

const models = [
	'claude-opus-4-20250514',
	'claude-sonnet-4-20250514',
	'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-latest',
  'claude-3-5-haiku-latest',
  'claude-3-opus-latest',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-3.5-turbo'
]

const judgeModels = [
 'claude-opus-4-20250514',
	'claude-sonnet-4-20250514',
	'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-latest',
  'claude-3-5-haiku-latest',
  'claude-3-opus-latest',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-3.5-turbo'
]



// Funny loading messages to cycle through
const funnyLoadingMessages = [
  "🤖 Teaching AI to think harder than a philosophy student...",
  "🧠 Convincing models that 2+2 actually equals 4...",
  "🎭 Watching AI perform Shakespeare... badly...",
  "🔬 Running experiments that would make Einstein jealous...",
  "🎪 Herding digital cats through evaluation hoops...",
  "🚀 Launching rockets to the moon of understanding...",
  "🎲 Rolling dice in the casino of artificial intelligence...",
  "🎨 Teaching robots to appreciate fine art (spoiler: they don't)...",
  "🍕 Ordering pizza for the AI overlords... they prefer pepperoni...",
  "🎵 Playing elevator music for impatient algorithms...",
  "🧙‍♂️ Casting spells to make models more magical...",
  "🎯 Aiming for perfection, hitting 'pretty good'...",
  "🎪 Running a three-ring circus of neural networks...",
  "🏃‍♂️ Racing against time (and losing gracefully)...",
  "🎭 Performing interpretive dance for confused models...",
  "🎨 Painting masterpieces with ones and zeros...",
  "🎪 Juggling flaming torches of computational complexity...",
  "🚂 All aboard the hype train to Accuracy Station!",
  "🎮 Playing chess with AI (they always win)...",
  "🎪 Taming wild algorithms with treats and positive reinforcement..."
]

export default function EvaluationPage() {
  const [config, setConfig] = useState<EvaluationConfig>({
    evaluationId: `eval_${Date.now()}`,
    evaluationName: '',
    datasetSource: 'existing',
    selectedDataset: '',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 100,
    temperature: 0.1,
    judgeModel: 'gpt-4o-mini',
    similarityThreshold: 80,
    promptTemplate: 'You are an expert assistant. Answer the following question: {{query}}'
  })

  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([])
  const [datasetsLoading, setDatasetsLoading] = useState(false)

  useEffect(() => {
    loadDatasets()
  }, [])

  const loadDatasets = async () => {
    try {
      setDatasetsLoading(true)
      const datasets = await apiService.listDatasets()
      setAvailableDatasets(datasets)
    } catch (err) {
      console.error('Failed to load datasets:', err)
      setError('Failed to load available datasets')
    } finally {
      setDatasetsLoading(false)
    }
  }

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [evaluationResults, setEvaluationResults] = useState<{
    summary: {
      total_cases?: number;
      results?: {
        averageSimilarityScore?: number;
        highSimilarityRate?: number;
        highSimilarityCount?: number;
        mediumSimilarityCount?: number;
        lowSimilarityCount?: number;
      };
    };
    cases?: Array<{
      case_id: string;
      similarity_score: number;
      similarity_category: string;
    }>;
  } | null>(null)
  
  // State for funny loading messages
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isPolling, setIsPolling] = useState(false)
  const [pollAttempts, setPollAttempts] = useState(0)

  const steps = [
    { id: 1, name: 'Configure', icon: CogIcon },
    { id: 2, name: 'Execute', icon: RocketLaunchIcon },
    { id: 3, name: 'Results', icon: CheckCircleIcon }
  ]

  // Cycle through funny messages every 3 seconds while polling
  useEffect(() => {
    if (isPolling) {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % funnyLoadingMessages.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isPolling])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/json') {
      setUploadedFile(file)
      setError(null)
    } else {
      setError('Please select a valid JSON file')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    // Validate configuration first
    if (!config.evaluationName.trim()) {
      setError('Please enter an evaluation name')
      setIsSubmitting(false)
      return
    }
    
    if (config.datasetSource === 'existing' && !config.selectedDataset) {
      setError('Please select a dataset')
      setIsSubmitting(false)
      return
    }
    
    if (config.datasetSource === 'upload' && !uploadedFile) {
      setError('Please upload a dataset file')
      setIsSubmitting(false)
      return
    }

    // Move to execution step immediately after validation passes
    setCurrentStep(2)
    setIsPolling(true)
    setPollAttempts(0)
    setCurrentMessageIndex(0)
    setIsSubmitting(false) // Reset submitting state since we're now in execute step
    
    try {
      // Save evaluation to local storage first
      const savedEvaluation: SavedEvaluation = {
        id: config.evaluationId,
        name: config.evaluationName,
        createdAt: new Date().toISOString(),
        status: 'created',
        config: {
          modelName: config.modelName,
          judgeModel: config.judgeModel,
          datasetSource: config.datasetSource,
          selectedDataset: config.selectedDataset,
          similarityThreshold: config.similarityThreshold
        }
      }
      
      EvaluationStorage.saveEvaluation(savedEvaluation)

      // Prepare the configuration for the API
      const createConfig: CreateEvaluationConfig = {
        evaluationId: config.evaluationId,
        datasetSource: config.datasetSource,
        selectedDataset: config.selectedDataset,
        modelName: config.modelName,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        judgeModel: config.judgeModel,
        similarityThreshold: config.similarityThreshold,
        promptTemplate: config.promptTemplate
      }

      // If uploading a file, parse it
      if (config.datasetSource === 'upload' && uploadedFile) {
        const fileContent = await uploadedFile.text()
        try {
          const datasetJson = JSON.parse(fileContent)
          createConfig.datasetJson = datasetJson
        } catch {
          throw new Error('Invalid JSON file format')
        }
      }

      // Update status to running
      EvaluationStorage.updateEvaluationStatus(config.evaluationId, 'running')

      // Create the evaluation
      const result = await apiService.createEvaluation(createConfig)
      
      if (!result.success) {
        // Update status to failed
        EvaluationStorage.updateEvaluationStatus(config.evaluationId, 'failed')
        throw new Error(result.error || 'Failed to create evaluation')
      }

      // Start polling for completion
      startPolling()
      
    } catch (err) {
      // Update status to failed if we saved it
      if (config.evaluationId) {
        EvaluationStorage.updateEvaluationStatus(config.evaluationId, 'failed')
      }
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setIsPolling(false) // Stop polling if there was an error
    }
  }

  const startPolling = () => {
    const maxAttempts = 40 // 200 seconds with 5-second intervals
    
    const poll = async (): Promise<void> => {
      try {
        setPollAttempts(prev => prev + 1)
        
        // Try to get evaluation details to check status
        const details = await apiService.getEvaluationDetails(config.evaluationId)
        
        if (details.status === 'completed' || details.status === 'comparison_completed') {
          // Evaluation completed successfully
          setIsPolling(false)
          EvaluationStorage.updateEvaluationStatus(config.evaluationId, 'completed')
          
          // Fetch detailed results
          try {
            const detailedResults = await apiService.getEvaluationDetails(config.evaluationId)
            const cases = await apiService.getEvaluationCases(config.evaluationId)
            
            setEvaluationResults({
              summary: detailedResults,
              cases: cases
            })
            
            // Show success toast
            setShowSuccessToast(true)
            setTimeout(() => setShowSuccessToast(false), 5000)
            
          } catch (resultsError) {
            console.warn('Failed to fetch detailed results:', resultsError)
          }
          
          setCurrentStep(3)
          return
        } else if (details.status === 'failed') {
          // Evaluation failed
          setIsPolling(false)
          EvaluationStorage.updateEvaluationStatus(config.evaluationId, 'failed')
          setError('Evaluation failed during processing')
          return
        } else if (pollAttempts >= maxAttempts) {
          // Timeout
          setIsPolling(false)
          EvaluationStorage.updateEvaluationStatus(config.evaluationId, 'failed')
          setError('Evaluation timed out - please check the results page later')
          return
        } else {
          // Still running, poll again
          setTimeout(poll, 5000)
        }
      } catch (pollError) {
        console.warn('Polling error:', pollError)
        if (pollAttempts >= maxAttempts) {
          // If we can't get status and we've reached max attempts, stop polling
          setIsPolling(false)
          setError('Unable to check evaluation status - please check the results page manually')
        } else {
          // Retry polling
          setTimeout(poll, 5000)
        }
      }
    }
    
    // Start polling after a short delay to let the pipeline start
    setTimeout(poll, 5000)
  }

  return (
    <div className="space-y-8">
      {/* Success Toast Notification */}
      {showSuccessToast && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center"
        >
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          <span>Evaluation completed! View results below.</span>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <BeakerIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Evaluation</h1>
        <p className="text-gray-600">Configure and run AI model evaluations with our multi-agent framework</p>
      </motion.div>

      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= step.id 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                <step.icon className="h-5 w-5" />
              </div>
              <span className={`ml-3 font-medium ${
                currentStep >= step.id ? 'text-primary-600' : 'text-gray-500'
              }`}>
                {step.name}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Configuration Form */}
      {currentStep === 1 && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Basic Configuration */}
          <div className="card">
            <div className="flex items-center mb-6">
              <CogIcon className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Basic Configuration</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evaluation ID
                </label>
                <input
                  type="text"
                  value={config.evaluationId}
                  onChange={(e) => setConfig({...config, evaluationId: e.target.value})}
                  className="input-field"
                  placeholder="Enter evaluation ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evaluation Name
                </label>
                <input
                  type="text"
                  value={config.evaluationName}
                  onChange={(e) => setConfig({...config, evaluationName: e.target.value})}
                  className="input-field"
                  placeholder="Enter evaluation name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dataset Source
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="existing"
                      checked={config.datasetSource === 'existing'}
                      onChange={(e) => setConfig({...config, datasetSource: e.target.value as 'existing' | 'upload'})}
                      className="mr-2"
                    />
                    Use Existing Dataset
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="upload"
                      checked={config.datasetSource === 'upload'}
                      onChange={(e) => setConfig({...config, datasetSource: e.target.value as 'existing' | 'upload'})}
                      className="mr-2"
                    />
                    Upload New Dataset
                  </label>
                </div>
              </div>
            </div>

            {config.datasetSource === 'existing' && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Dataset
                </label>
                <select
                  value={config.selectedDataset}
                  onChange={(e) => setConfig({...config, selectedDataset: e.target.value})}
                  className="input-field"
                  disabled={datasetsLoading}
                >
                  <option value="">
                    {datasetsLoading ? 'Loading datasets...' : 'Choose a dataset...'}
                  </option>
                  {availableDatasets.map(dataset => (
                    <option key={dataset.name} value={dataset.name}>
                      {dataset.name} ({dataset.items} items)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {config.datasetSource === 'upload' && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Dataset
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors duration-200">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Drop your JSON file here or click to browse</p>
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleFileUpload}
                    className="hidden" 
                    id="dataset-upload"
                  />
                  <label htmlFor="dataset-upload" className="btn-secondary cursor-pointer">
                    Choose File
                  </label>
                  {uploadedFile && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {uploadedFile.name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Model Configuration */}
          <div className="card">
            <div className="flex items-center mb-6">
              <BeakerIcon className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Model Configuration</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <select
                  value={config.modelName}
                  onChange={(e) => setConfig({...config, modelName: e.target.value})}
                  className="input-field"
                >
                  {models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judge Model
                </label>
                <select
                  value={config.judgeModel}
                  onChange={(e) => setConfig({...config, judgeModel: e.target.value})}
                  className="input-field"
                >
                  {judgeModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens: {config.maxTokens}
                </label>
                <input
                  type="range"
                  min="1"
                  max="4000"
                  step="50"
                  value={config.maxTokens}
                  onChange={(e) => setConfig({...config, maxTokens: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {config.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Similarity Threshold: {config.similarityThreshold}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.similarityThreshold}
                onChange={(e) => setConfig({...config, similarityThreshold: parseInt(e.target.value)})}
                className="w-full"
              />
            </div>
          </div>

          {/* Prompt Template */}
          <div className="card">
            <div className="flex items-center mb-6">
              <DocumentTextIcon className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Prompt Template</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template
              </label>
              <textarea
                value={config.promptTemplate}
                onChange={(e) => setConfig({...config, promptTemplate: e.target.value})}
                rows={4}
                className="input-field"
                placeholder="Enter your prompt template..."
              />
              <p className="text-sm text-gray-500 mt-2">
                Use <code className="bg-gray-100 px-1 rounded">{'{{query}}'}</code> as a placeholder for the question
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={
                isSubmitting || 
                !config.evaluationId || 
                !config.evaluationName ||
                (config.datasetSource === 'existing' && !config.selectedDataset) ||
                (config.datasetSource === 'upload' && !uploadedFile)
              }
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Starting Evaluation...
                </>
              ) : (
                <>
                  <RocketLaunchIcon className="h-4 w-4 mr-2" />
                  Start Evaluation
                </>
              )}
            </button>
          </div>
        </motion.form>
      )}

      {/* Execution Status */}
      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Evaluation in Progress</h2>
          
          {/* Funny loading message */}
          <motion.p 
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-gray-600 mb-6 text-lg"
          >
            {funnyLoadingMessages[currentMessageIndex]}
          </motion.p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-800 text-sm">
                Evaluation ID: <code className="font-mono">{config.evaluationId}</code>
              </span>
            </div>
            {isPolling && (
              <div className="text-blue-700 text-sm">
                Polling attempt: {pollAttempts} • Checking status every 5 seconds
              </div>
            )}
          </div>
          
          <div className="text-left bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Pipeline Steps:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Dataset loaded and validated</li>
              <li>✅ Configuration saved</li>
              <li>🔄 Processing through multi-agent pipeline</li>
              <li>⏳ Running model evaluations</li>
              <li>⏳ Comparing responses with judge model</li>
              <li>⏳ Generating final results</li>
            </ul>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="text-yellow-800 text-sm">
                  This process typically takes 2-5 minutes depending on dataset size
                </span>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => {
                // Navigate to results page to check manually
                const url = `/results?evaluation_id=${config.evaluationId}`
                window.location.href = url
              }}
              className="btn-secondary"
            >
              Check Results Manually
            </button>
            <button
              onClick={() => {
                setIsPolling(false)
                setCurrentStep(1)
                setError(null)
              }}
              className="btn-secondary"
            >
              Back to Configure
            </button>
          </div>
        </motion.div>
      )}

      {/* Results Ready */}
      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Success Header */}
          <div className="card text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Evaluation Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your evaluation has been successfully processed. Here are the results:
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 text-sm">
                  Evaluation ID: <code className="font-mono">{config.evaluationId}</code>
                </span>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          {evaluationResults?.summary && (
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Results Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {evaluationResults.summary.total_cases || 0}
                  </div>
                  <div className="text-sm text-blue-800">Total Cases</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {evaluationResults.summary.results?.averageSimilarityScore || 0}%
                  </div>
                  <div className="text-sm text-green-800">Average Similarity</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {evaluationResults.summary.results?.highSimilarityRate || 0}%
                  </div>
                  <div className="text-sm text-purple-800">High Similarity Rate</div>
                </div>
              </div>
              
              {evaluationResults.summary.results && (
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-green-600">
                      {evaluationResults.summary.results.highSimilarityCount}
                    </div>
                    <div className="text-sm text-gray-600">High Similarity</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-yellow-600">
                      {evaluationResults.summary.results.mediumSimilarityCount}
                    </div>
                    <div className="text-sm text-gray-600">Medium Similarity</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-600">
                      {evaluationResults.summary.results.lowSimilarityCount}
                    </div>
                    <div className="text-sm text-gray-600">Low Similarity</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="card">
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setCurrentStep(1)
                  setConfig({
                    ...config,
                    evaluationId: `eval_${Date.now()}`,
                    evaluationName: '',
                    selectedDataset: '',
                  })
                  setUploadedFile(null)
                  setError(null)
                  setEvaluationResults(null)
                }}
                className="btn-secondary"
              >
                Create Another Evaluation
              </button>
              <button
                onClick={() => {
                  // Navigate to detailed results page with evaluation ID
                  const url = `/results?evaluation_id=${config.evaluationId}`
                  window.location.href = url
                }}
                className="btn-primary"
              >
                View Detailed Results
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
} 