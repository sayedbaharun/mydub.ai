/**
 * Welcome Step
 * First step of the onboarding flow
 */

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface WelcomeStepProps {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-6 py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg"
      >
        <Sparkles className="h-10 w-10 text-white" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to MyDub.AI
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Your Personalized Dubai Experience
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="max-w-md mx-auto space-y-4 text-gray-600 dark:text-gray-400"
      >
        <p>
          Discover the best of Dubai with AI-powered recommendations, real-time updates, 
          and personalized content tailored just for you.
        </p>
        <p className="text-sm">
          Let's take a quick tour to help you get the most out of MyDub.AI
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap gap-4 justify-center text-sm"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>Latest News & Updates</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <span>AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full" />
          <span>Personalized Content</span>
        </div>
      </motion.div>
    </div>
  )
}