import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Mail, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { useToast } from '@/shared/hooks/use-toast'

export default function VerifyEmailSentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isResending, setIsResending] = useState(false)
  const email = location.state?.email || ''

  const handleResendEmail = async () => {
    if (!email) return

    setIsResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) throw error

      toast({
        title: 'Verification email resent',
        description: 'Please check your email inbox and spam folder.',
      })
    } catch (error: any) {
      toast({
        title: 'Failed to resend email',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We've sent a verification email to:
            <br />
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="mb-2">To complete your registration:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Check your email inbox</li>
              <li>Click the verification link in the email</li>
              <li>Return here to sign in</li>
            </ol>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Didn't receive the email?</p>
            <p>Check your spam folder or</p>
          </div>

          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? 'Resending...' : 'Resend verification email'}
          </Button>

          <Button
            onClick={() => navigate('/auth/signin')}
            variant="ghost"
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}