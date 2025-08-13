import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { useAuth } from '../context/AuthContext'
import { AuthService } from '../services/auth.service'
import { SignInFormData } from '../types'
import { useTranslation } from 'react-i18next'
import { toast } from '@/shared/services/toast.service'
import { FormField } from '@/shared/components/form/FormField'

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
})

export function SignInForm() {
  const { t } = useTranslation('auth')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const passwordInputRef = useRef<HTMLInputElement>(null)

  // Get redirect URL from query params, location state, or default to home
  const redirect = searchParams.get('redirect')
  const from = redirect || location.state?.from?.pathname || '/'

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  async function onSubmit(data: SignInFormData) {
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await signIn(data.email, data.password)

      if (error) {
        setFailedAttempts(prev => prev + 1)
        
        // Handle specific error messages
        let errorMessage = error
        if (error.includes('Invalid login credentials')) {
          errorMessage = t('auth.errors.invalidCredentials')
          // Clear password and focus
          form.setValue('password', '')
          setTimeout(() => passwordInputRef.current?.focus(), 100)
        } else if (error.includes('Account locked') || failedAttempts >= 4) {
          errorMessage = t('auth.errors.accountLocked')
          setError(errorMessage)
        }
        
        toast.error(errorMessage, {
          title: t('auth.signInFailed'),
        })
        
        // Set error state for display
        setError(errorMessage)
        return
      }

      toast.success(t('auth.signInSuccess'), {
        title: t('auth.welcomeBack'),
      })

      // Wait for auth state to update before redirecting
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirect to the page they were trying to access or home
      navigate(from === '/auth/signin' ? '/' : from, { replace: true })
    } catch (error) {
      const errorMessage = t('errors.generic')
      setError(errorMessage)
      toast.error(errorMessage, {
        title: t('errors.somethingWrong'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSocialSignIn(provider: 'google' | 'apple') {
    setIsLoading(true)
    try {
      const { error } = await AuthService.signInWithSocial(provider)

      if (error) {
        toast({
          title: t('auth.socialSignInFailed'),
          description: error,
          variant: 'destructive',
        })
      }
      // Social sign in will redirect, so no need to handle success here
    } catch (error) {
      toast({
        title: t('errors.somethingWrong'),
        description: t('errors.tryAgainLater'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleForgotPassword() {
    const email = form.getValues('email')
    
    if (!email) {
      toast({
        title: t('auth.emailRequired'),
        description: t('auth.enterEmailFirst'),
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await AuthService.resetPassword(email)

      if (error) {
        toast({
          title: t('auth.resetFailed'),
          description: error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: t('auth.checkEmail'),
        description: t('auth.resetLinkSent'),
      })
    } catch (error) {
      toast({
        title: t('errors.somethingWrong'),
        description: t('errors.tryAgainLater'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t('auth.welcomeBack')}</CardTitle>
        <CardDescription>
          {t('auth.signInDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialSignIn('google')}
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
              onClick={() => handleSocialSignIn('apple')}
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
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Sign in failed</p>
                <p className="mt-1">{error}</p>
                {failedAttempts >= 3 && (
                  <p className="mt-2 text-xs">
                    Too many failed attempts? <Link to="/auth/forgot-password" className="underline">Reset your password</Link>
                  </p>
                )}
              </div>
            </div>
          )}

          <FormField
            label={t('auth.email')}
            error={form.formState.errors.email?.message}
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
                autoComplete="email"
              />
            </div>
          </FormField>

          <FormField
            label={
              <div className="flex items-center justify-between w-full">
                <span>{t('auth.password')}</span>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 font-normal text-sm h-auto"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  {t('auth.forgotPassword')}
                </Button>
              </div>
            }
            error={form.formState.errors.password?.message}
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
                ref={(e) => {
                  form.register('password').ref(e)
                  // @ts-expect-error - ref type mismatch between react-hook-form and native ref
                  passwordInputRef.current = e
                }}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              checked={form.watch('rememberMe')}
              onCheckedChange={(checked) => form.setValue('rememberMe', checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
              {t('auth.rememberMe')}
            </Label>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
              {error.includes('Account locked') && (
                <Link to="/support" className="ml-2 underline">
                  {t('auth.contactSupport')}
                </Link>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('auth.signingIn')}
              </>
            ) : (
              t('auth.signIn')
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-center w-full text-muted-foreground">
          {t('auth.dontHaveAccount')}{' '}
          <Link to="/auth/signup" className="text-primary hover:underline">
            {t('auth.signUp')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}