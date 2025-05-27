import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ClockIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { EvaluationStorage, type SavedEvaluation } from '../utils/storage'

interface SavedEvaluationsProps {
  onSelectEvaluation?: (evaluationId: string) => void
}

export default function SavedEvaluations({ onSelectEvaluation }: SavedEvaluationsProps) {
  const [evaluations, setEvaluations] = useState<SavedEvaluation[]>([])

  useEffect(() => {
    loadEvaluations()
  }, [])

  const loadEvaluations = () => {
    const saved = EvaluationStorage.getEvaluations()
    setEvaluations(saved)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this evaluation?')) {
      EvaluationStorage.deleteEvaluation(id)
      loadEvaluations()
    }
  }

  const getStatusIcon = (status: SavedEvaluation['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'running':
        return <ClockIcon className="h-5 w-5 text-blue-600" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      default:
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: SavedEvaluation['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (evaluations.length === 0) {
    return (
      <div className="card text-center py-12">
        <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Evaluations</h3>
        <p className="text-gray-600">
          Create your first evaluation to see it here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Saved Evaluations</h2>
        <span className="text-sm text-gray-500">{evaluations.length} evaluations</span>
      </div>
      
      <div className="grid gap-4">
        {evaluations.map((evaluation, index) => (
          <motion.div
            key={evaluation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="card hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {getStatusIcon(evaluation.status)}
                  <h3 className="text-lg font-medium text-gray-900">
                    {evaluation.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(evaluation.status)}`}>
                    {evaluation.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">ID:</span>
                    <br />
                    <code className="text-xs bg-gray-100 px-1 rounded">
                      {evaluation.id}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">Model:</span>
                    <br />
                    {evaluation.config.modelName}
                  </div>
                  <div>
                    <span className="font-medium">Dataset:</span>
                    <br />
                    {evaluation.config.datasetSource === 'existing' 
                      ? evaluation.config.selectedDataset 
                      : 'Uploaded file'}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>
                    <br />
                    {new Date(evaluation.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {evaluation.status === 'completed' && onSelectEvaluation && (
                  <button
                    onClick={() => onSelectEvaluation(evaluation.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    title="View Results"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(evaluation.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Delete Evaluation"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {evaluations.length > 0 && (
        <div className="text-center pt-4">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all saved evaluations?')) {
                EvaluationStorage.clearAll()
                loadEvaluations()
              }
            }}
            className="text-sm text-red-600 hover:text-red-800 transition-colors duration-200"
          >
            Clear All Evaluations
          </button>
        </div>
      )}
    </div>
  )
} 