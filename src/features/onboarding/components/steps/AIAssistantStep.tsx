/**
 * AI Assistant Step
 * Introduce the AI assistant Ayyan
 */

import { motion } from 'framer-motion'
import { MessageSquare, Zap, Globe, Clock } from 'lucide-react'

interface AIAssistantStepProps {
  onNext: () => void
}

export function AIAssistantStep({ onNext }: AIAssistantStepProps) {
  const capabilities = [
    {
      icon: Zap,
      title: 'Instant Answers',
      description: 'Get quick answers about Dubai, events, and services'
    },
    {
      icon: Globe,
      title: 'Multilingual Support',
      description: 'Chat in English, Arabic, or your preferred language'
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Always here to help, any time of day or night'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg mx-auto"
        >
          <span className="text-4xl">🤖</span>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Meet Ayyan, Your AI Assistant
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Your personal guide to everything Dubai. Ask questions, get recommendations, 
            and discover hidden gems with the power of AI.
          </p>
        </motion.div>
      </div>

      <div className="space-y-3">
        {capabilities.map((capability, index) => (
          <motion.div
            key={capability.title}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
              <capability.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {capability.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {capability.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white"
      >
        <p className="text-sm font-medium mb-2">Try asking Ayyan:</p>
        <ul className="space-y-1 text-sm opacity-90">
          <li>• "What events are happening this weekend?"</li>
          <li>• "Find the best Italian restaurants near me"</li>
          <li>• "How do I renew my Emirates ID?"</li>
          <li>• "What's the weather like today?"</li>
        </ul>
      </motion.div>
    </div>
  )
}