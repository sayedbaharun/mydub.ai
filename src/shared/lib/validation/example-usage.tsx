/**
 * Example usage of validation components and hooks
 */

import React from 'react'
import { useForm } from './hooks'
import { signupSchema, SignupInput } from './schemas'
import { ValidatedInput, ValidatedCheckbox } from './components'
import { Button } from '@/shared/components/ui/button'
import { useToast } from '@/shared/hooks/use-toast'

export function SignupFormExample() {
  const { toast } = useToast()
  
  const {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    getFieldProps,
    handleSubmit,
  } = useForm<SignupInput>({
    schema: signupSchema,
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      acceptTerms: false,
    },
    onSubmit: async (data) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      toast({
        title: 'Account created',
        description: 'Your account has been created successfully.',
      })
      
          },
  })

  return (
    <form onSubmit={handleSubmit()} className="space-y-4 max-w-md mx-auto">
      <ValidatedInput
        label="Full Name"
        required
        {...getFieldProps('fullName')}
        placeholder="John Doe"
      />

      <ValidatedInput
        label="Email"
        type="email"
        required
        {...getFieldProps('email')}
        placeholder="john@example.com"
      />

      <ValidatedInput
        label="Password"
        type="password"
        required
        {...getFieldProps('password')}
        placeholder="••••••••"
      />

      <ValidatedInput
        label="Confirm Password"
        type="password"
        required
        {...getFieldProps('confirmPassword')}
        placeholder="••••••••"
      />

      <ValidatedCheckbox
        {...getFieldProps('acceptTerms')}
        label="I accept the terms and conditions"
      />

      <Button
        type="submit"
        className="w-full"
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? 'Creating Account...' : 'Create Account'}
      </Button>

      {/* Debug info - remove in production */}
      <div className="mt-4 p-4 bg-gray-100 rounded text-xs">
        <p>Form Valid: {isValid ? 'Yes' : 'No'}</p>
        <p>Errors: {JSON.stringify(errors, null, 2)}</p>
      </div>
    </form>
  )
}