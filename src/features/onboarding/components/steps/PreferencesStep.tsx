/**
 * Preferences Step
 * Allow users to set their preferences during onboarding
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Palette, Bell, Heart } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import { useOnboarding } from '@/app/providers/OnboardingProvider'
import { cn } from '@/shared/lib/utils'

interface PreferencesStepProps {
  onNext: () => void
}

const INTEREST_CATEGORIES = [
  { id: 'news', label: 'News & Updates', emoji: '📰' },
  { id: 'dining', label: 'Dining & Food', emoji: '🍽️' },
  { id: 'events', label: 'Events & Activities', emoji: '🎉' },
  { id: 'tourism', label: 'Tourism & Attractions', emoji: '🏖️' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🌃' },
  { id: 'business', label: 'Business & Finance', emoji: '💼' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'culture', label: 'Arts & Culture', emoji: '🎨' }
]

export function PreferencesStep({ onNext }: PreferencesStepProps) {
  const { updatePreferences } = useOnboarding()
  const [language, setLanguage] = useState('en')
  const [theme, setTheme] = useState('system')
  const [notifications, setNotifications] = useState(true)
  const [interests, setInterests] = useState<string[]>([])

  const handleSavePreferences = async () => {
    await updatePreferences({
      language,
      theme,
      notifications,
      interests
    })
    onNext()
  }

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Personalize Your Experience
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Set your preferences to get the most relevant content
        </p>
      </div>

      <div className="space-y-6">
        {/* Language Selection */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-600" />
            <Label className="text-base font-medium">Language</Label>
          </div>
          <RadioGroup value={language} onValueChange={setLanguage}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="en" id="en" />
              <Label htmlFor="en" className="cursor-pointer">English</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ar" id="ar" />
              <Label htmlFor="ar" className="cursor-pointer">العربية (Arabic)</Label>
            </div>
          </RadioGroup>
        </motion.div>

        {/* Theme Selection */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-gray-600" />
            <Label className="text-base font-medium">Theme</Label>
          </div>
          <RadioGroup value={theme} onValueChange={setTheme}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="cursor-pointer">Light</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="cursor-pointer">Dark</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="cursor-pointer">System Default</Label>
            </div>
          </RadioGroup>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
        >
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-gray-600" />
            <div>
              <Label htmlFor="notifications" className="text-base font-medium cursor-pointer">
                Push Notifications
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get notified about breaking news and updates
              </p>
            </div>
          </div>
          <Switch
            id="notifications"
            checked={notifications}
            onCheckedChange={setNotifications}
          />
        </motion.div>

        {/* Interests */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-gray-600" />
            <Label className="text-base font-medium">Your Interests</Label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select topics you're interested in (you can change these later)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {INTEREST_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant={interests.includes(category.id) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleInterest(category.id)}
                className={cn(
                  'justify-start',
                  interests.includes(category.id) && 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                <span className="mr-2">{category.emoji}</span>
                {category.label}
              </Button>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="pt-4"
      >
        <Button onClick={handleSavePreferences} className="w-full">
          Save Preferences
        </Button>
      </motion.div>
    </div>
  )
}