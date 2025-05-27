import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HomeIcon, 
  ChartBarIcon, 
  FolderIcon, 
  CogIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

// Components
import HomePage from './components/HomePage'
import EvaluationPage from './components/EvaluationPage'
import ResultsPage from './components/ResultsPage'
import DatasetPage from './components/DatasetPage'
import SettingsPage from './components/SettingsPage'

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'New Evaluation', href: '/evaluation', icon: BeakerIcon },
  { name: 'Results', href: '/results', icon: ChartBarIcon },
  { name: 'Datasets', href: '/datasets', icon: FolderIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="gradient-bg shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <BeakerIcon className="h-8 w-8 text-white mr-3" />
              <h1 className="text-xl font-bold text-white">
                AI Agent Evaluation System
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={clsx(
                    'relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-white bg-white/20 shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white/20 rounded-lg"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/evaluation" element={<EvaluationPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/datasets" element={<DatasetPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </main>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <AnimatedRoutes />
      </div>
    </Router>
  )
}

export default App
