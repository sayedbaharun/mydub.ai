import { SignInForm } from '@/features/auth/components'
import { Link } from 'react-router-dom'
import { APP_NAME } from '@/shared/lib/constants'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold text-obsidian">
            <span className="text-xl font-bold">M</span>
          </div>
          <span className="font-bold text-2xl">{APP_NAME}</span>
        </Link>
      </div>
      
      <SignInForm />
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          By signing in, you agree to our{' '}
          <Link to="/terms" className="underline hover:text-primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}