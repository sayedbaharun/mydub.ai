import { User } from '@/shared/types'

export interface SignUpFormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  userType: 'resident' | 'tourist' | 'business'
  acceptTerms: boolean
}

export interface SignInFormData {
  email: string
  password: string
  rememberMe: boolean
}

export interface OnboardingData {
  language: string
  interests: string[]
  favoriteDistricts: string[]
  notificationPreferences: {
    email: boolean
    push: boolean
    sms: boolean
  }
}

export interface AuthError {
  message: string
  code?: string
  details?: any
}

export interface AuthSession {
  user: User
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export type SocialProvider = 'google' | 'apple' | 'facebook'