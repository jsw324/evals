import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ChartBarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  DocumentTextIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { apiService, type EvaluationSummary, type ComparisonCase } from '../services/api'

interface EvaluationResult extends EvaluationSummary {
  detailedResults?: ComparisonCase[]
  evaluation_id?: string
  high_similarity_count?: number
  medium_similarity_count?: number
  low_similarity_count?: number
  average_similarity_score?: number
  similarity_threshold?: number
  judge_model?: string
  comparison_results?: ComparisonCase[]
}

// Component for expandable text with Read More functionality
interface ExpandableTextProps {
  text: string
  maxLength?: number
  className?: string
  expandedKey: string
  expandedStates: Record<string, boolean>
  setExpandedStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}

function ExpandableText({ 
  text, 
  maxLength = 150, 
  className = "", 
  expandedKey,
  expandedStates,
  setExpandedStates
}: ExpandableTextProps) {
  const isExpanded = expandedStates[expandedKey] || false
  const shouldTruncate = text.length > maxLength
  const displayText = shouldTruncate && !isExpanded ? text.substring(0, maxLength) : text

  const toggleExpanded = () => {
    setExpandedStates(prev => ({
      ...prev,
      [expandedKey]: !prev[expandedKey]
    }))
  }

  return (
    <div className={className}>
      <p className="text-gray-900">
        {displayText}
        {shouldTruncate && !isExpanded && '...'}
      </p>
      {shouldTruncate && (
        <button
          onClick={toggleExpanded}
          className="mt-2 inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
        >
          {isExpanded ? (
            <>
              <ChevronUpIcon className="h-4 w-4 mr-1" />
              Read Less
            </>
          ) : (
            <>
              <ChevronDownIcon className="h-4 w-4 mr-1" />
              Read More
            </>
          )}
        </button>
      )}
    </div>
  )
}

export default function ResultsPage() {
  const [availableEvaluations, setAvailableEvaluations] = useState<EvaluationSummary[]>([])
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationResult | null>(null)
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary')
  const [selectedCase, setSelectedCase] = useState<ComparisonCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({})

  // Load available evaluations from eval_registry on component mount
  useEffect(() => {
    loadAvailableEvaluations()
    
    // Check for evaluation_id in URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const evaluationId = urlParams.get('evaluation_id')
    if (evaluationId) {
      handleSelectEvaluation(evaluationId)
    }
  }, [])

  // Load detailed results when switching to detailed view
  useEffect(() => {
    if (viewMode === 'detailed' && selectedEvaluation && !selectedEvaluation.detailedResults) {
      loadDetailedResults(selectedEvaluation.id)
    }
  }, [viewMode, selectedEvaluation])

  const loadAvailableEvaluations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const evaluations = await apiService.listEvaluations()
      setAvailableEvaluations(evaluations)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evaluations from registry')
      console.error('Error loading evaluations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEvaluation = async (evaluationId: string) => {
    try {
      setLoadingDetails(true)
      setError(null)
      
      // Load evaluation details
      const details = await apiService.getEvaluationDetails(evaluationId)
      console.log('Raw details from API:', details)
      
      // Transform the new data structure to match our component expectations
      const transformedDetails: EvaluationResult = {
        id: details.evaluation_id || evaluationId,
        status: details.status || 'completed',
        startedAt: '', // Will be filled from metadata if available
        completedAt: '', // Will be filled from metadata if available
        dataset_name: '',
        model_name: '',
        total_cases: details.total_cases || 0,
        results: {
          totalCases: details.total_cases || 0,
          averageSimilarityScore: details.average_similarity_score || 0,
          highSimilarityCount: details.high_similarity_count || 0,
          mediumSimilarityCount: details.medium_similarity_count || 0,
          lowSimilarityCount: details.low_similarity_count || 0,
          highSimilarityRate: details.total_cases > 0 ? (details.high_similarity_count || 0) / details.total_cases : 0
        },
        // Store the raw data for detailed view
        evaluation_id: details.evaluation_id,
        high_similarity_count: details.high_similarity_count,
        medium_similarity_count: details.medium_similarity_count,
        low_similarity_count: details.low_similarity_count,
        average_similarity_score: details.average_similarity_score,
        similarity_threshold: details.similarity_threshold,
        judge_model: details.judge_model,
        comparison_results: details.comparison_results,
        detailedResults: details.comparison_results // Use comparison_results directly
      }
      
      console.log('Transformed details:', transformedDetails)
      console.log('Should show results?', transformedDetails.status, transformedDetails.results)
      setSelectedEvaluation(transformedDetails)
      setViewMode('summary') // Reset to summary view
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evaluation details')
      console.error('Error loading evaluation details:', err)
    } finally {
      setLoadingDetails(false)
    }
  }

  const loadDetailedResults = async (evaluationId: string) => {
    try {
      // If we already have comparison_results from the details, use those
      if (selectedEvaluation?.comparison_results) {
        setSelectedEvaluation(prev => prev ? { 
          ...prev, 
          detailedResults: prev.comparison_results 
        } : null)
        return
      }
      
      // Otherwise, fetch them separately
      const cases = await apiService.getEvaluationCases(evaluationId)
      setSelectedEvaluation(prev => prev ? { ...prev, detailedResults: cases } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load detailed results')
      console.error('Error loading detailed results:', err)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'comparison_completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'running':
      case 'execution_running':
      case 'comparison_running':
        return <ClockIcon className="h-5 w-5 text-blue-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'comparison_completed':
        return 'bg-green-100 text-green-800'
      case 'running':
      case 'execution_running':
      case 'comparison_running':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getSimilarityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 50) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getSimilarityIcon = (category: string) => {
    switch (category) {
      case 'high':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'medium':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading evaluations from registry...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center">
        <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Results</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => {
          setError(null)
          loadAvailableEvaluations()
        }} className="btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  if (availableEvaluations.length === 0) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <ChartBarIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Results Dashboard</h1>
          <p className="text-gray-600">Analyze and monitor your AI model evaluation results</p>
        </motion.div>

        <div className="card text-center">
          <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Evaluations Found</h2>
          <p className="text-gray-600 mb-4">No evaluations found in the registry. Run some evaluations to see results here.</p>
          <button onClick={loadAvailableEvaluations} className="btn-primary">
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <ChartBarIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Results Dashboard</h1>
        <p className="text-gray-600">Analyze and monitor your AI model evaluation results</p>
      </motion.div>

      {/* Show evaluation list when no specific evaluation is selected */}
      {!selectedEvaluation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Available Evaluations</h2>
            <button
              onClick={loadAvailableEvaluations}
              className="btn-secondary text-sm"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableEvaluations.map((evaluation) => (
              <motion.div
                key={evaluation.id}
                whileHover={{ scale: 1.02 }}
                className="p-4 rounded-xl border-2 border-gray-200 hover:border-primary-500 cursor-pointer transition-all duration-200"
                onClick={() => handleSelectEvaluation(evaluation.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900 truncate text-sm">{evaluation.id}</span>
                  {getStatusIcon(evaluation.status)}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(evaluation.status)}`}>
                      {evaluation.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {evaluation.total_cases} cases
                    </span>
                  </div>
                  
                  {evaluation.results && (
                    <div className="text-xs text-gray-600">
                      Avg: {evaluation.results.averageSimilarityScore.toFixed(1)}%
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    {new Date(evaluation.startedAt).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Back button when viewing evaluation details */}
      {selectedEvaluation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <button
            onClick={() => {
              setSelectedEvaluation(null)
              setError(null)
            }}
            className="btn-secondary mb-4"
          >
            ← Back to Evaluations
          </button>
        </motion.div>
      )}

      {/* Loading state for evaluation details */}
      {loadingDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Evaluation Details</h2>
          <p className="text-gray-600">Fetching detailed results from the evaluation registry...</p>
        </motion.div>
      )}

      {/* View Mode Toggle */}
      {selectedEvaluation && (selectedEvaluation.status === 'completed' || selectedEvaluation.status === 'comparison_completed') && selectedEvaluation.results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">View Results</h2>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('summary')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'summary'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ChartBarIcon className="h-4 w-4 mr-2 inline" />
                Summary
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'detailed'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <DocumentTextIcon className="h-4 w-4 mr-2 inline" />
                Detailed
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results Display */}
      {selectedEvaluation && (
        <>
          {selectedEvaluation.status === 'running' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card text-center"
            >
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-6"></div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Evaluation in Progress</h2>
              <p className="text-gray-600 mb-6">
                Your evaluation is currently running. Results will appear here when complete.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-center">
                  <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-blue-800 text-sm">
                    Started: {new Date(selectedEvaluation.startedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {(selectedEvaluation.status === 'completed' || selectedEvaluation.status === 'comparison_completed') && selectedEvaluation.results && (
            <>
              {viewMode === 'summary' && (
                <>
                  {/* Summary Metrics */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Summary Metrics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="card text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <ChartBarIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{selectedEvaluation.results.totalCases}</h3>
                        <p className="text-gray-600 text-sm">Total Cases</p>
                      </div>
                      
                      <div className="card text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {selectedEvaluation.results.averageSimilarityScore.toFixed(1)}%
                        </h3>
                        <p className="text-gray-600 text-sm">Average Score</p>
                      </div>
                      
                      <div className="card text-center">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <EyeIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {(selectedEvaluation.results.highSimilarityRate * 100).toFixed(0)}%
                        </h3>
                        <p className="text-gray-600 text-sm">High Similarity Rate</p>
                      </div>
                      
                      <div className="card text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <CheckCircleIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {(((selectedEvaluation.results.highSimilarityCount + selectedEvaluation.results.mediumSimilarityCount) / selectedEvaluation.results.totalCases) * 100).toFixed(0)}%
                        </h3>
                        <p className="text-gray-600 text-sm">Success Rate</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Detailed Breakdown */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                  >
                    <div className="card">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Similarity Distribution</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                            <span className="text-gray-700">High Similarity (≥80%)</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-gray-900">{selectedEvaluation.results.highSimilarityCount}</span>
                            <span className="text-gray-500 text-sm ml-2">
                              ({((selectedEvaluation.results.highSimilarityCount / selectedEvaluation.results.totalCases) * 100).toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                            <span className="text-gray-700">Medium Similarity (50-79%)</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-gray-900">{selectedEvaluation.results.mediumSimilarityCount}</span>
                            <span className="text-gray-500 text-sm ml-2">
                              ({((selectedEvaluation.results.mediumSimilarityCount / selectedEvaluation.results.totalCases) * 100).toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                            <span className="text-gray-700">Low Similarity (&lt;50%)</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-gray-900">{selectedEvaluation.results.lowSimilarityCount}</span>
                            <span className="text-gray-500 text-sm ml-2">
                              ({((selectedEvaluation.results.lowSimilarityCount / selectedEvaluation.results.totalCases) * 100).toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Visual Progress Bars */}
                      <div className="mt-6 space-y-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(selectedEvaluation.results.highSimilarityCount / selectedEvaluation.results.totalCases) * 100}%` }}
                          ></div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full" 
                            style={{ width: `${(selectedEvaluation.results.mediumSimilarityCount / selectedEvaluation.results.totalCases) * 100}%` }}
                          ></div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${(selectedEvaluation.results.lowSimilarityCount / selectedEvaluation.results.totalCases) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Evaluation Details</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Evaluation ID:</span>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{selectedEvaluation.id}</code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Started:</span>
                          <span className="text-gray-900">{new Date(selectedEvaluation.startedAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completed:</span>
                          <span className="text-gray-900">{selectedEvaluation.completedAt ? new Date(selectedEvaluation.completedAt).toLocaleString() : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="text-gray-900">
                            {selectedEvaluation.completedAt 
                              ? `${Math.round((new Date(selectedEvaluation.completedAt).getTime() - new Date(selectedEvaluation.startedAt).getTime()) / 60000)} minutes`
                              : 'N/A'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(selectedEvaluation.status)}`}>
                            {selectedEvaluation.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <button 
                          onClick={() => setViewMode('detailed')}
                          className="btn-primary w-full"
                        >
                          <DocumentTextIcon className="h-4 w-4 mr-2" />
                          View Detailed Results
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}

              {viewMode === 'detailed' && selectedEvaluation.detailedResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Detailed Results</h2>
                    {selectedEvaluation.judge_model && (
                      <div className="text-sm text-gray-600">
                        Judge Model: <span className="font-medium">{selectedEvaluation.judge_model}</span>
                      </div>
                    )}
                  </div>
                  
                  {selectedEvaluation.similarity_threshold && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <SparklesIcon className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-blue-800 text-sm">
                          Similarity Threshold: {selectedEvaluation.similarity_threshold}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {selectedEvaluation.detailedResults.map((result) => (
                      <div key={result.case_id} className="card hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm font-medium mr-3">
                              {result.case_id}
                            </span>
                            {getSimilarityIcon(result.similarity_category)}
                            {result.success && (
                              <CheckCircleIcon className="h-4 w-4 text-green-500 ml-2" />
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getSimilarityColor(result.similarity_score)}`}>
                              {result.similarity_score}%
                            </span>
                            <button
                              onClick={() => setSelectedCase(result)}
                              className="btn-secondary text-sm py-2"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View Details
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Query:</h4>
                            <ExpandableText
                              text={result.original_query}
                              maxLength={200}
                              className="bg-gray-50 p-3 rounded-lg text-sm"
                              expandedKey={`query-${result.case_id}`}
                              expandedStates={expandedStates}
                              setExpandedStates={setExpandedStates}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Expected Response:</h4>
                              <ExpandableText
                                text={result.expected_response}
                                maxLength={200}
                                className="bg-green-50 p-3 rounded-lg text-sm border border-green-200"
                                expandedKey={`expected-${result.case_id}`}
                                expandedStates={expandedStates}
                                setExpandedStates={setExpandedStates}
                              />
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Model Response:</h4>
                              <ExpandableText
                                text={result.model_response}
                                maxLength={200}
                                className="bg-blue-50 p-3 rounded-lg text-sm border border-blue-200"
                                expandedKey={`model-${result.case_id}`}
                                expandedStates={expandedStates}
                                setExpandedStates={setExpandedStates}
                              />
                            </div>
                          </div>
                          
                          {result.judge_reasoning && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Judge Reasoning:</h4>
                              <ExpandableText
                                text={result.judge_reasoning}
                                maxLength={250}
                                className="bg-yellow-50 p-3 rounded-lg text-sm border border-yellow-200"
                                expandedKey={`reasoning-${result.case_id}`}
                                expandedStates={expandedStates}
                                setExpandedStates={setExpandedStates}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </>
      )}

      {/* Detailed Case Modal */}
      {selectedCase && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCase(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-semibold text-gray-900">Case Details</h3>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm font-medium">
                  {selectedCase.case_id}
                </span>
                <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getSimilarityColor(selectedCase.similarity_score)}`}>
                  {selectedCase.similarity_score}% Similarity
                </span>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-600" />
                  Original Query
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-gray-900">{selectedCase.original_query}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                    Expected Response
                  </h4>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-gray-900">{selectedCase.expected_response}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <SparklesIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Model Response
                  </h4>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-gray-900">{selectedCase.model_response}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600" />
                  Judge Reasoning
                </h4>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-gray-900">{selectedCase.judge_reasoning}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
} 