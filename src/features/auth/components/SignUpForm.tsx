import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Mail, Lock, User, Building, Plane, Briefcase, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { useAuth } from '../context/AuthContext'
import { AuthService } from '../services/auth.service'
import { SignUpFormData } from '../types'
import { useTranslation } from 'react-i18next'
import { toast } from '@/shared/services/toast.service'
import { FormField } from '@/shared/components/form/FormField'
import { PasswordStrengthMeter } from '@/shared/components/PasswordStrengthMeter'
import { validateEmail, validatePassword, validatePasswordMatch } from '@/shared/lib/validation'

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  userType: z.enum(['resident', 'tourist', 'business']),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export function SignUpForm() {
  const { t } = useTranslation('auth')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({})
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      userType: 'resident',
      acceptTerms: false,
    },
    mode: 'onTouched',
  })

  const password = form.watch('password')
  const confirmPassword = form.watch('confirmPassword')

  // Real-time validation for specific fields
  useEffect(() => {
    if (fieldTouched.email) {
      const email = form.getValues('email')
      const error = validateEmail(email)
      setFieldErrors(prev => ({ ...prev, email: error || '' }))
    }
  }, [form.watch('email'), fieldTouched.email])

  useEffect(() => {
    if (fieldTouched.password) {
      const error = validatePassword(password, true)
      setFieldErrors(prev => ({ ...prev, password: error || '' }))
    }
  }, [password, fieldTouched.password])

  useEffect(() => {
    if (fieldTouched.confirmPassword && confirmPassword) {
      const error = validatePasswordMatch(password, confirmPassword)
      setFieldErrors(prev => ({ ...prev, confirmPassword: error || '' }))
    }
  }, [password, confirmPassword, fieldTouched.confirmPassword])

  const handleFieldBlur = (fieldName: string) => {
    setFieldTouched(prev => ({ ...prev, [fieldName]: true }))
  }

  async function onSubmit(data: SignUpFormData) {
    setIsLoading(true)
    try {
      const { error } = await signUp(data)

      if (error) {
        toast.error(error, {
          title: t('auth.signUpFailed'),
        })
        return
      }

      toast.success(t('auth.checkYourEmail'), {
        title: t('auth.verificationEmailSent'),
      })

      navigate('/auth/verify-email-sent', {
        state: { email: data.email }
      })
    } catch (error) {
      toast.error(t('errors.tryAgainLater'), {
        title: t('errors.somethingWrong'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSocialSignUp(provider: 'google' | 'apple') {
    setIsLoading(true)
    try {
      const { error } = await AuthService.signInWithSocial(provider)

      if (error) {
        toast.error(error, {
          title: t('auth.socialSignUpFailed'),
        })
      } else {
        toast.success(t('auth.welcomeToMyDub'))
      }
    } catch (error) {
      toast.error(t('errors.tryAgainLater'), {
        title: t('errors.somethingWrong'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t('auth.createAccount')}</CardTitle>
        <CardDescription>
          {t('auth.signUpDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialSignUp('google')}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t('auth.google')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialSignUp('apple')}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
              </svg>
              {t('auth.apple')}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
            </div>
          </div>

          {/* Form Fields */}
          <FormField
            label={t('auth.fullName')}
            error={form.formState.errors.fullName?.message}
            required
          >
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                placeholder={t('auth.fullNamePlaceholder')}
                className="pl-10 pr-10"
                {...form.register('fullName')}
                disabled={isLoading}
                onBlur={() => handleFieldBlur('fullName')}
              />
            </div>
          </FormField>

          <FormField
            label={t('auth.email')}
            error={fieldErrors.email || form.formState.errors.email?.message}
            success={fieldTouched.email && !fieldErrors.email && form.getValues('email') ? 'Email is valid' : undefined}
            required
          >
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                className="pl-10 pr-10"
                {...form.register('email')}
                disabled={isLoading}
                onBlur={() => handleFieldBlur('email')}
              />
            </div>
          </FormField>

          <FormField
            label={t('auth.password')}
            error={fieldErrors.password || form.formState.errors.password?.message}
            required
          >
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.passwordPlaceholder')}
                className="pl-10 pr-10"
                {...form.register('password')}
                disabled={isLoading}
                onBlur={() => handleFieldBlur('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          {password && (
            <PasswordStrengthMeter 
              password={password}
              showRequirements={true}
              className="mt-2"
            />
          )}

          <FormField
            label={t('auth.confirmPassword')}
            error={fieldErrors.confirmPassword || form.formState.errors.confirmPassword?.message}
            success={fieldTouched.confirmPassword && !fieldErrors.confirmPassword && confirmPassword && password === confirmPassword ? 'Passwords match' : undefined}
            required
          >
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t('auth.passwordPlaceholder')}
                className="pl-10 pr-10"
                {...form.register('confirmPassword')}
                disabled={isLoading}
                onBlur={() => handleFieldBlur('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          {/* User Type Selection */}
          <div className="space-y-2">
            <Label>{t('auth.iAmA')}</Label>
            <RadioGroup
              value={form.watch('userType')}
              onValueChange={(value) => form.setValue('userType', value as any)}
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="resident" id="resident" />
                <Label htmlFor="resident" className="flex items-center cursor-pointer">
                  <Building className="mr-2 h-4 w-4" />
                  {t('auth.dubaiResident')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tourist" id="tourist" />
                <Label htmlFor="tourist" className="flex items-center cursor-pointer">
                  <Plane className="mr-2 h-4 w-4" />
                  {t('auth.tourist')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="business" id="business" />
                <Label htmlFor="business" className="flex items-center cursor-pointer">
                  <Briefcase className="mr-2 h-4 w-4" />
                  {t('auth.businessVisitor')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={form.watch('acceptTerms')}
              onCheckedChange={(checked) => form.setValue('acceptTerms', checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="terms" className="text-sm leading-none cursor-pointer">
              {t('auth.iAgreeToThe')}{' '}
              <Link to="/terms" className="text-primary hover:underline">
                {t('auth.termsOfService')}
              </Link>{' '}
              {t('auth.and')}{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                {t('auth.privacyPolicy')}
              </Link>
            </Label>
          </div>
          {form.formState.errors.acceptTerms && (
            <p className="text-sm text-destructive">{form.formState.errors.acceptTerms.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('auth.creatingAccount')}
              </>
            ) : (
              t('auth.createAccount')
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-center w-full text-muted-foreground">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/auth/signin" className="text-primary hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}