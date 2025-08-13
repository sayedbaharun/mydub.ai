import { useEffect, useState } from 'react'
import { Check, X, AlertCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface PasswordStrengthMeterProps {
  password: string
  showRequirements?: boolean
  onStrengthChange?: (strength: number) => void
  className?: string
}

interface PasswordRequirement {
  regex: RegExp
  text: string
  met: boolean
}

export function PasswordStrengthMeter({
  password,
  showRequirements = true,
  onStrengthChange,
  className
}: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState(0)
  const [requirements, setRequirements] = useState<PasswordRequirement[]>([])

  useEffect(() => {
    const reqs: PasswordRequirement[] = [
      {
        regex: /.{8,}/,
        text: 'At least 8 characters',
        met: false
      },
      {
        regex: /[A-Z]/,
        text: 'One uppercase letter',
        met: false
      },
      {
        regex: /[a-z]/,
        text: 'One lowercase letter',
        met: false
      },
      {
        regex: /[0-9]/,
        text: 'One number',
        met: false
      },
      {
        regex: /[^A-Za-z0-9]/,
        text: 'One special character',
        met: false
      }
    ]

    let score = 0
    reqs.forEach(req => {
      if (req.regex.test(password)) {
        req.met = true
        score += 20
      }
    })

    // Additional strength factors
    if (password.length >= 12) score += 10
    if (password.length >= 16) score += 10
    
    // Cap at 100
    score = Math.min(score, 100)

    setRequirements(reqs)
    setStrength(score)
    onStrengthChange?.(score)
  }, [password, onStrengthChange])

  const getStrengthColor = () => {
    if (strength === 0) return 'bg-gray-200'
    if (strength <= 20) return 'bg-red-500'
    if (strength <= 40) return 'bg-orange-500'
    if (strength <= 60) return 'bg-yellow-500'
    if (strength <= 80) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (strength === 0) return ''
    if (strength <= 20) return 'Very Weak'
    if (strength <= 40) return 'Weak'
    if (strength <= 60) return 'Fair'
    if (strength <= 80) return 'Good'
    return 'Strong'
  }

  const getStrengthTextColor = () => {
    if (strength === 0) return 'text-gray-400'
    if (strength <= 20) return 'text-red-600'
    if (strength <= 40) return 'text-orange-600'
    if (strength <= 60) return 'text-yellow-600'
    if (strength <= 80) return 'text-blue-600'
    return 'text-green-600'
  }

  if (!password) return null

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Password strength</span>
          <span className={cn('text-sm font-medium', getStrengthTextColor())}>
            {getStrengthText()}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300 ease-out',
              getStrengthColor()
            )}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-1.5">
          {requirements.map((req, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2 text-sm transition-colors duration-200',
                req.met ? 'text-green-600' : 'text-gray-500'
              )}
            >
              {req.met ? (
                <Check className="h-4 w-4 flex-shrink-0" />
              ) : (
                <X className="h-4 w-4 flex-shrink-0" />
              )}
              <span>{req.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Security Tips */}
      {strength > 0 && strength < 60 && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Security tip:</p>
            <p className="mt-1">
              {strength <= 20 && 'This password is too weak. Consider using a passphrase or password manager.'}
              {strength > 20 && strength <= 40 && 'Add more character variety to make your password stronger.'}
              {strength > 40 && strength < 60 && 'Almost there! Add a special character or make it longer.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}