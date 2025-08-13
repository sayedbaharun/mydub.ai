/**
 * Features Step
 * Showcase key features of the app
 */

import { motion } from 'framer-motion'
import { 
  Newspaper, 
  UtensilsCrossed, 
  MapPin, 
  Moon, 
  Building,
  MessageSquare 
} from 'lucide-react'

interface FeaturesStepProps {
  onNext: () => void
}

const features = [
  {
    icon: Newspaper,
    title: 'Latest News',
    description: 'Stay updated with real-time news from Dubai and the UAE',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: UtensilsCrossed,
    title: 'Dining Guide',
    description: 'Discover the best restaurants and cafes in your area',
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: MapPin,
    title: 'Tourism & Events',
    description: 'Explore attractions and find exciting events happening now',
    color: 'from-green-500 to-emerald-600'
  },
  {
    icon: Moon,
    title: 'Nightlife',
    description: 'Experience Dubai\'s vibrant nightlife and entertainment',
    color: 'from-purple-500 to-pink-600'
  },
  {
    icon: Building,
    title: 'Government Services',
    description: 'Access important government services and information',
    color: 'from-gray-600 to-gray-700'
  },
  {
    icon: MessageSquare,
    title: 'AI Assistant',
    description: 'Get instant answers with our AI-powered assistant Ayyan',
    color: 'from-indigo-500 to-purple-600'
  }
]

export function FeaturesStep({ onNext }: FeaturesStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Explore Key Features
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Everything you need to experience Dubai like never before
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="group relative p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${feature.color} shadow-sm`}>
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-sm text-gray-500 dark:text-gray-400"
      >
        All features are available in both English and Arabic
      </motion.p>
    </div>
  )
}