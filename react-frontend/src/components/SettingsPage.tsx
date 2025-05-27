import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CogIcon, 
  KeyIcon, 
  ServerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { apiService } from '../services/api'

interface Settings {
  agentuityBaseUrl: string
  agentId: string
  resultsApiAgentId: string
  apiToken: string
  defaultModel: string
  defaultJudgeModel: string
  defaultMaxTokens: number
  defaultTemperature: number
  defaultThreshold: number
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'defaults'>('general')
  const [settings, setSettings] = useState<Settings>({
    agentuityBaseUrl: 'https://dev-uzeflmvib.agentuity.run',
    agentId: 'agent_abcf9ad4245d2d89aed9eb38aef21fd6',
    resultsApiAgentId: 'agent_b46de37831f94d01b06b2ccfd183efa0', // Results API agent for local dev
    apiToken: '',
    defaultModel: 'claude-3-5-sonnet-latest',
    defaultJudgeModel: 'claude-3-5-haiku-latest',
    defaultMaxTokens: 100,
    defaultTemperature: 0.1,
    defaultThreshold: 80
  })
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  const testConnection = async () => {
    setConnectionStatus('testing')
    
    try {
      // Update API service configuration
      const resultsApiUrl = `${settings.agentuityBaseUrl}/${settings.resultsApiAgentId}`
      const datasetLoaderUrl = `${settings.agentuityBaseUrl}/${settings.agentId}`
      apiService.updateConfig(resultsApiUrl, datasetLoaderUrl, settings.apiToken || undefined)
      
      // Test the connection by trying to list evaluations
      await apiService.listEvaluations()
      setConnectionStatus('success')
    } catch (error) {
      console.error('Connection test failed:', error)
      setConnectionStatus('error')
    }
  }

  const saveSettings = () => {
    // Update API service with new configuration
    const resultsApiUrl = `${settings.agentuityBaseUrl}/${settings.resultsApiAgentId}`
    const datasetLoaderUrl = `${settings.agentuityBaseUrl}/${settings.agentId}`
    apiService.updateConfig(resultsApiUrl, datasetLoaderUrl, settings.apiToken || undefined)
    
    // In a real app, you'd save these settings to localStorage or a backend
    localStorage.setItem('evalSystemSettings', JSON.stringify(settings))
    
    // Show success message (you could add a toast notification here)
    alert('Settings saved successfully!')
  }

  // Load settings from localStorage on component mount
  useState(() => {
    const savedSettings = localStorage.getItem('evalSystemSettings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
        
        // Update API service with saved settings
        const resultsApiUrl = `${parsed.agentuityBaseUrl}/${parsed.resultsApiAgentId}`
        const datasetLoaderUrl = `${parsed.agentuityBaseUrl}/${parsed.agentId}`
        apiService.updateConfig(resultsApiUrl, datasetLoaderUrl, parsed.apiToken || undefined)
      } catch (error) {
        console.error('Failed to load saved settings:', error)
      }
    }
  })

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'testing':
        return 'Testing connection...'
      case 'success':
        return 'Connection successful'
      case 'error':
        return 'Connection failed'
      default:
        return 'Not tested'
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'testing':
        return 'text-blue-600'
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
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
        <CogIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure your AI evaluation system</p>
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
            { id: 'general', label: 'General', icon: CogIcon },
            { id: 'api', label: 'API Keys', icon: KeyIcon },
            { id: 'defaults', label: 'Defaults', icon: ServerIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'general' | 'api' | 'defaults')}
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

      {/* General Tab */}
      {activeTab === 'general' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Agentuity Configuration</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agentuity Base URL
                </label>
                <input
                  type="text"
                  value={settings.agentuityBaseUrl}
                  onChange={(e) => setSettings({...settings, agentuityBaseUrl: e.target.value})}
                  className="input-field"
                  placeholder="https://your-agentuity-instance.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dataset Loader Agent ID
                </label>
                <input
                  type="text"
                  value={settings.agentId}
                  onChange={(e) => setSettings({...settings, agentId: e.target.value})}
                  className="input-field"
                  placeholder="agent_..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Results API Agent ID
                </label>
                <input
                  type="text"
                  value={settings.resultsApiAgentId}
                  onChange={(e) => setSettings({...settings, resultsApiAgentId: e.target.value})}
                  className="input-field"
                  placeholder="agent_..."
                />
                <p className="text-sm text-gray-500 mt-2">
                  Agent ID for the Results API that serves evaluation data to the frontend.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Connection Status</h2>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {getConnectionStatusIcon()}
                <span className={`ml-3 font-medium ${getConnectionStatusColor()}`}>
                  {getConnectionStatusText()}
                </span>
              </div>
              <button
                onClick={testConnection}
                disabled={connectionStatus === 'testing'}
                className="btn-primary disabled:opacity-50"
              >
                Test Connection
              </button>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Results API Endpoint:</h4>
                <code className="text-sm text-blue-800 break-all">
                  {settings.agentuityBaseUrl}/{settings.resultsApiAgentId}
                </code>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Dataset Loader Endpoint:</h4>
                <code className="text-sm text-green-800 break-all">
                  {settings.agentuityBaseUrl}/{settings.agentId}
                </code>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Authentication</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agentuity API Token
                </label>
                <input
                  type="password"
                  value={settings.apiToken}
                  onChange={(e) => setSettings({...settings, apiToken: e.target.value})}
                  className="input-field"
                  placeholder="Enter your API token..."
                />
                <p className="text-sm text-gray-500 mt-2">
                  Optional in development mode. Required for production deployments.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Model API Keys</h2>
            
            <div className="p-4 bg-blue-50 rounded-lg mb-6">
              <h4 className="font-medium text-blue-900 mb-2">Important Note:</h4>
              <p className="text-sm text-blue-800">
                Model API keys (Anthropic, OpenAI) should be configured in your Agentuity project environment, 
                not in this frontend application. Use the Agentuity CLI to set these securely.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Configure via Agentuity CLI:</h4>
                <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm font-mono">
                  <div>agentuity env set --secret ANTHROPIC_API_KEY=your_key_here</div>
                  <div>agentuity env set --secret OPENAI_API_KEY=your_key_here</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Defaults Tab */}
      {activeTab === 'defaults' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Model Defaults</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Model
                  </label>
                  <select
                    value={settings.defaultModel}
                    onChange={(e) => setSettings({...settings, defaultModel: e.target.value})}
                    className="input-field"
                  >
                    <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet (Latest)</option>
                    <option value="claude-3-5-haiku-latest">Claude 3.5 Haiku (Latest)</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Judge Model
                  </label>
                  <select
                    value={settings.defaultJudgeModel}
                    onChange={(e) => setSettings({...settings, defaultJudgeModel: e.target.value})}
                    className="input-field"
                  >
                    <option value="claude-3-5-haiku-latest">Claude 3.5 Haiku (Latest)</option>
                    <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet (Latest)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Max Tokens: {settings.defaultMaxTokens}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="4000"
                    step="50"
                    value={settings.defaultMaxTokens}
                    onChange={(e) => setSettings({...settings, defaultMaxTokens: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Temperature: {settings.defaultTemperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.defaultTemperature}
                    onChange={(e) => setSettings({...settings, defaultTemperature: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Evaluation Defaults</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Similarity Threshold: {settings.defaultThreshold}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={settings.defaultThreshold}
                    onChange={(e) => setSettings({...settings, defaultThreshold: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Minimum similarity score to consider a response as high quality
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Current Defaults Summary:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model:</span>
                      <span className="text-gray-900">{settings.defaultModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Judge Model:</span>
                      <span className="text-gray-900">{settings.defaultJudgeModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Tokens:</span>
                      <span className="text-gray-900">{settings.defaultMaxTokens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temperature:</span>
                      <span className="text-gray-900">{settings.defaultTemperature}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Threshold:</span>
                      <span className="text-gray-900">{settings.defaultThreshold}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button className="btn-secondary">Reset to Defaults</button>
            <button className="btn-primary" onClick={saveSettings}>Save Settings</button>
          </div>
        </motion.div>
      )}
    </div>
  )
} 