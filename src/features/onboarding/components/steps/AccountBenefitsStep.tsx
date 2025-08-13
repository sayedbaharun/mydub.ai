/**
 * Account Benefits Step
 * Final step showing benefits of creating an account
 */

import { motion } from 'framer-motion'
import { Check, User, Bookmark, Clock, Shield } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'

interface AccountBenefitsStepProps {
  onNext: () => void
}

const benefits = [
  {
    icon: Bookmark,
    title: 'Save Your Favorites',
    description: 'Bookmark articles, places, and events to access them anytime'
  },
  {
    icon: Clock,
    title: 'Personalized Feed',
    description: 'Get content recommendations based on your interests and history'
  },
  {
    icon: Shield,
    title: 'Sync Across Devices',
    description: 'Access your preferences and bookmarks on any device'
  },
  {
    icon: User,
    title: 'Exclusive Features',
    description: 'Unlock premium features and early access to new updates'
  }
]

export function AccountBenefitsStep({ onNext }: AccountBenefitsStepProps) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const handleCreateAccount = () => {
    navigate('/auth/signup')
    onNext()
  }

  const handleSkip = () => {
    onNext()
  }

  // If user is already authenticated, show a different message
  if (isAuthenticated) {
    return (
      <div className="space-y-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto"
        >
          <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            You're All Set!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Thank you for taking the tour. You're already signed in and can enjoy 
            all the features MyDub.AI has to offer.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button onClick={onNext} size="lg" className="min-w-[200px]">
            Start Exploring
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create Your Free Account
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Unlock the full MyDub.AI experience with these benefits
        </p>
      </div>

      <div className="space-y-3">
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 + index * 0.1 }}
            className="flex items-start gap-4"
          >
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
              <benefit.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {benefit.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {benefit.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-3 pt-4"
      >
        <Button 
          onClick={handleCreateAccount} 
          size="lg" 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Create Free Account
        </Button>
        <Button 
          onClick={handleSkip} 
          variant="ghost" 
          className="w-full"
        >
          Maybe Later
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-xs text-gray-500 dark:text-gray-400"
      >
        No credit card required • Free forever • Cancel anytime
      </motion.p>
    </div>
  )
}