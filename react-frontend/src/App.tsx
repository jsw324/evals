import { useState } from 'react'
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

type Page = 'home' | 'evaluation' | 'results' | 'datasets' | 'settings'

const navigation = [
  { name: 'Home', href: 'home', icon: HomeIcon },
  { name: 'New Evaluation', href: 'evaluation', icon: BeakerIcon },
  { name: 'Results', href: 'results', icon: ChartBarIcon },
  { name: 'Datasets', href: 'datasets', icon: FolderIcon },
  { name: 'Settings', href: 'settings', icon: CogIcon },
]

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />
      case 'evaluation':
        return <EvaluationPage />
      case 'results':
        return <ResultsPage />
      case 'datasets':
        return <DatasetPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <HomePage />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
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
                const isActive = currentPage === item.href
                return (
                  <button
                    key={item.name}
                    onClick={() => setCurrentPage(item.href as Page)}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
