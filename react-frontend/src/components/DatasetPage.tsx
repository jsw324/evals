import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FolderIcon, 
  DocumentTextIcon, 
  CloudArrowUpIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

interface Dataset {
  id: string
  name: string
  size: number
  items: number
  lastModified: string
  type: 'json'
}

const mockDatasets: Dataset[] = [
  {
    id: '1',
    name: 'superhero_powers.json',
    size: 2048,
    items: 12,
    lastModified: '2024-01-15T10:30:00',
    type: 'json'
  },
  {
    id: '2',
    name: 'math_problems.json',
    size: 5120,
    items: 31,
    lastModified: '2024-01-14T15:20:00',
    type: 'json'
  },
  {
    id: '3',
    name: 'sentiment_analysis.json',
    size: 3072,
    items: 25,
    lastModified: '2024-01-13T09:45:00',
    type: 'json'
  },
	{
		id: '4',
		name: 'financial_modeling.json',
		size: 1024,
		items: 10,
		lastModified: '2025-05-12T12:30:00',
		type: 'json'
	},
]

export default function DatasetPage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'upload' | 'create'>('browse')
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
        <FolderIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dataset Manager</h1>
        <p className="text-gray-600">Upload, organize, and manage your evaluation datasets</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="card"
      >
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
          {[
            { id: 'browse', label: 'Browse Datasets', icon: FolderIcon },
            { id: 'upload', label: 'Upload Dataset', icon: CloudArrowUpIcon },
            { id: 'create', label: 'Create Dataset', icon: PlusIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'browse' | 'upload' | 'create')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Browse Datasets Tab */}
      {activeTab === 'browse' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockDatasets.map((dataset) => (
              <div key={dataset.id} className="card card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-8 w-8 text-primary-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">{dataset.name}</h3>
                      <p className="text-sm text-gray-500">{dataset.items} items</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Size:</span>
                    <span className="text-gray-900">{formatFileSize(dataset.size)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Modified:</span>
                    <span className="text-gray-900">{new Date(dataset.lastModified).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedDataset(dataset.id)}
                    className="flex-1 btn-secondary text-sm py-2"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Preview
                  </button>
                  <button className="btn-secondary text-sm py-2 px-3">
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                  <button className="btn-secondary text-sm py-2 px-3 text-red-600 hover:bg-red-50">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Dataset Preview Modal */}
          {selectedDataset && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setSelectedDataset(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Dataset Preview</h3>
                  <button
                    onClick={() => setSelectedDataset(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Sample Data:</h4>
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-600 mb-1"><strong>Query:</strong></p>
                        <p className="text-sm text-gray-900">What are Superman's main superpowers?</p>
                        <p className="text-sm text-gray-600 mb-1 mt-2"><strong>Response:</strong></p>
                        <p className="text-sm text-gray-900">Superman's main superpowers include super strength, flight, invulnerability, heat vision, and x-ray vision.</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-600 mb-1"><strong>Query:</strong></p>
                        <p className="text-sm text-gray-900">Can Spider-Man fly?</p>
                        <p className="text-sm text-gray-600 mb-1 mt-2"><strong>Response:</strong></p>
                        <p className="text-sm text-gray-900">No, Spider-Man cannot fly. He uses web-slinging to move through the air.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Upload Dataset Tab */}
      {activeTab === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload New Dataset</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-primary-400 transition-colors duration-200">
            <CloudArrowUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Drop your JSON file here</h3>
            <p className="text-gray-600 mb-6">or click to browse and select a file</p>
            <input type="file" accept=".json" className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="btn-primary cursor-pointer">
              Choose File
            </label>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Dataset Format Requirements:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• JSON format with array of objects</li>
              <li>• Each object must have "query" and "response" fields</li>
              <li>• Maximum file size: 10MB</li>
              <li>• Supported encoding: UTF-8</li>
            </ul>
          </div>
        </motion.div>
      )}

      {/* Create Dataset Tab */}
      {activeTab === 'create' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Dataset</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dataset Name
                </label>
                <input
                  type="text"
                  placeholder="Enter dataset name..."
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your dataset..."
                  className="input-field"
                />
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Query-Response Pairs</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Query
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter the question or prompt..."
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Response
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter the expected answer..."
                  className="input-field"
                />
              </div>
              
              <button className="btn-secondary">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button className="btn-secondary">Cancel</button>
            <button className="btn-primary">Save Dataset</button>
          </div>
        </motion.div>
      )}
    </div>
  )
} 