import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import { Label } from '@/shared/components/ui/label'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Progress } from '@/shared/components/ui/progress'
import { useToast } from '@/shared/hooks/use-toast'
import { useAuth } from '../context/AuthContext'
import { LANGUAGES, INTEREST_CATEGORIES, DUBAI_DISTRICTS } from '@/shared/lib/constants'
import { OnboardingData } from '../types'

const STEPS = [
  { id: 'language', title: 'Choose Your Language', description: 'Select your preferred language' },
  { id: 'interests', title: 'Your Interests', description: 'What would you like to explore?' },
  { id: 'districts', title: 'Favorite Areas', description: 'Select your preferred Dubai districts' },
  { id: 'notifications', title: 'Stay Updated', description: 'Choose how you want to receive updates' },
]

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    language: 'en',
    interests: [],
    favoriteDistricts: [],
    notificationPreferences: {
      email: true,
      push: true,
      sms: false,
    },
  })

  const { updateProfile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const progress = ((currentStep + 1) / STEPS.length) * 100

  async function handleComplete() {
    setIsLoading(true)
    try {
      const { error } = await updateProfile({
        language: data.language,
        // Store preferences as JSON in user metadata
        // In a real app, you might have separate tables for these
        metadata: {
          interests: data.interests,
          favoriteDistricts: data.favoriteDistricts,
          notificationPreferences: data.notificationPreferences,
          onboardingCompleted: true,
        },
      } as any)

      if (error) {
        toast({
          title: 'Failed to save preferences',
          description: error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Welcome to MyDub.AI!',
        description: 'Your preferences have been saved.',
      })

      navigate('/')
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description: 'Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  function canProceed() {
    switch (STEPS[currentStep].id) {
      case 'language':
        return !!data.language
      case 'interests':
        return data.interests.length > 0
      case 'districts':
        return data.favoriteDistricts.length > 0
      case 'notifications':
        return true
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Progress value={progress} className="mb-4" />
          <CardTitle className="text-2xl">
            {STEPS[currentStep].title}
          </CardTitle>
          <CardDescription>
            {STEPS[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Language Selection */}
              {STEPS[currentStep].id === 'language' && (
                <RadioGroup
                  value={data.language}
                  onValueChange={(value) => setData({ ...data, language: value })}
                  className="grid grid-cols-2 gap-4"
                >
                  {LANGUAGES.map((lang) => (
                    <div key={lang.code} className="relative">
                      <RadioGroupItem
                        value={lang.code}
                        id={lang.code}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={lang.code}
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <span className="text-3xl mb-2">{lang.flag}</span>
                        <span className="font-semibold">{lang.name}</span>
                        <span className="text-sm text-muted-foreground">{lang.nativeName}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {/* Interests Selection */}
              {STEPS[currentStep].id === 'interests' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {INTEREST_CATEGORIES.map((category) => (
                    <div key={category.id} className="relative">
                      <Checkbox
                        id={category.id}
                        checked={data.interests.includes(category.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setData({
                              ...data,
                              interests: [...data.interests, category.id],
                            })
                          } else {
                            setData({
                              ...data,
                              interests: data.interests.filter((id) => id !== category.id),
                            })
                          }
                        }}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={category.id}
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <span className="font-medium">{category.label}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {/* Districts Selection */}
              {STEPS[currentStep].id === 'districts' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {DUBAI_DISTRICTS.map((district) => (
                    <div key={district} className="relative">
                      <Checkbox
                        id={district}
                        checked={data.favoriteDistricts.includes(district)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setData({
                              ...data,
                              favoriteDistricts: [...data.favoriteDistricts, district],
                            })
                          } else {
                            setData({
                              ...data,
                              favoriteDistricts: data.favoriteDistricts.filter((d) => d !== district),
                            })
                          }
                        }}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={district}
                        className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-sm"
                      >
                        {district}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {/* Notification Preferences */}
              {STEPS[currentStep].id === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notif" className="text-base">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates and news via email
                      </p>
                    </div>
                    <Checkbox
                      id="email-notif"
                      checked={data.notificationPreferences.email}
                      onCheckedChange={(checked) =>
                        setData({
                          ...data,
                          notificationPreferences: {
                            ...data.notificationPreferences,
                            email: checked as boolean,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notif" className="text-base">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get instant alerts on your device
                      </p>
                    </div>
                    <Checkbox
                      id="push-notif"
                      checked={data.notificationPreferences.push}
                      onCheckedChange={(checked) =>
                        setData({
                          ...data,
                          notificationPreferences: {
                            ...data.notificationPreferences,
                            push: checked as boolean,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-notif" className="text-base">
                        SMS Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive important updates via SMS
                      </p>
                    </div>
                    <Checkbox
                      id="sms-notif"
                      checked={data.notificationPreferences.sms}
                      onCheckedChange={(checked) =>
                        setData({
                          ...data,
                          notificationPreferences: {
                            ...data.notificationPreferences,
                            sms: checked as boolean,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isLoading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  Complete
                  <Check className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}