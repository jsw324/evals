import { motion } from 'framer-motion'
import { 
  RocketLaunchIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
  CpuChipIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const stats = [
  { name: 'Active Evaluations', value: '3', change: '+1', changeType: 'positive' },
  { name: 'Total Datasets', value: '12', change: '+2', changeType: 'positive' },
  { name: 'Completed Evaluations', value: '47', change: '+5', changeType: 'positive' },
  { name: 'Success Rate', value: '94%', change: '+2%', changeType: 'positive' },
]

const quickActions = [
  {
    name: 'New Evaluation',
    description: 'Start a new AI model evaluation',
    icon: RocketLaunchIcon,
    color: 'from-blue-500 to-purple-600',
    action: 'evaluation'
  },
  {
    name: 'View Results',
    description: 'Analyze evaluation results',
    icon: ChartBarIcon,
    color: 'from-green-500 to-teal-600',
    action: 'results'
  },
  {
    name: 'Manage Datasets',
    description: 'Upload and organize datasets',
    icon: DocumentTextIcon,
    color: 'from-orange-500 to-red-600',
    action: 'datasets'
  },
]

const features = [
  'Multi-agent evaluation pipeline',
  'Intelligent response comparison',
  'Real-time progress monitoring',
  'Comprehensive analytics',
  'Dataset management tools',
  'Customizable evaluation metrics'
]

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="gradient-bg rounded-3xl p-12 text-white">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <CpuChipIcon className="h-16 w-16" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">
            AI Agent Evaluation System
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Multi-Agent Framework for Comprehensive AI Model Evaluation and Analysis
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            className="card card-hover"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-sm font-medium">
                {stat.change}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              className="card card-hover cursor-pointer group"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.name}</h3>
              <p className="text-gray-600 mb-4">{action.description}</p>
              <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                <span>Get started</span>
                <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">System Features</h3>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                className="flex items-center"
              >
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Upload Dataset</h4>
                <p className="text-gray-600 text-sm">Add your evaluation data to get started</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Configure Evaluation</h4>
                <p className="text-gray-600 text-sm">Set up your model and evaluation parameters</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Run & Analyze</h4>
                <p className="text-gray-600 text-sm">Execute evaluation and review results</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 