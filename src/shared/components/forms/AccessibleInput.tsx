/**
 * Accessible Input Component for MyDub.ai
 * Enhanced input with autocomplete, validation, and accessibility features
 */

import React from 'react'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { cn } from '@/shared/lib/utils'

// Comprehensive autocomplete attribute mapping
const AUTOCOMPLETE_VALUES = {
  // Personal information
  name: 'name',
  firstName: 'given-name',
  lastName: 'family-name',
  fullName: 'name',
  nickname: 'nickname',
  
  // Contact information
  email: 'email',
  phone: 'tel',
  mobile: 'tel',
  
  // Address information
  address: 'street-address',
  address1: 'address-line1',
  address2: 'address-line2',
  city: 'address-level2',
  state: 'address-level1',
  country: 'country',
  countryName: 'country-name',
  postalCode: 'postal-code',
  zipCode: 'postal-code',
  
  // Organization information
  organization: 'organization',
  company: 'organization',
  jobTitle: 'organization-title',
  
  // Authentication
  username: 'username',
  password: 'current-password',
  newPassword: 'new-password',
  currentPassword: 'current-password',
  
  // Payment information
  creditCard: 'cc-number',
  cardNumber: 'cc-number',
  cardName: 'cc-name',
  cardExpiry: 'cc-exp',
  cardExpiryMonth: 'cc-exp-month',
  cardExpiryYear: 'cc-exp-year',
  cardCvc: 'cc-csc',
  
  // Dates
  birthday: 'bday',
  birthdate: 'bday',
  
  // URLs
  url: 'url',
  website: 'url',
  
  // Search
  search: 'off', // Typically don't want autocomplete for search
  
  // One-time codes
  otp: 'one-time-code',
  sms: 'one-time-code',
  
  // Language
  language: 'language'
} as const

type AutocompleteKey = keyof typeof AUTOCOMPLETE_VALUES

export interface AccessibleInputProps extends Omit<React.ComponentProps<typeof Input>, 'autoComplete'> {
  /** Label text for the input */
  label?: string
  /** Helper text to display below the input */
  helperText?: string
  /** Error message to display */
  error?: string
  /** Whether the field is required */
  required?: boolean
  /** Autocomplete hint for the browser */
  autoComplete?: AutocompleteKey | string | 'off'
  /** Input mode for mobile keyboards */
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
  /** Container class name */
  containerClassName?: string
  /** Label class name */
  labelClassName?: string
  /** Helper text class name */
  helperClassName?: string
  /** Error text class name */
  errorClassName?: string
  /** Whether to show asterisk for required fields */
  showRequiredAsterisk?: boolean
}

export function AccessibleInput({
  label,
  helperText,
  error,
  required,
  autoComplete,
  inputMode,
  containerClassName,
  labelClassName,
  helperClassName,
  errorClassName,
  showRequiredAsterisk = true,
  className,
  id,
  name,
  type = 'text',
  ...props
}: AccessibleInputProps) {
  const inputId = id || React.useId()
  const helperTextId = helperText ? `${inputId}-helper` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  // Determine autocomplete value
  const getAutocompleteValue = () => {
    if (autoComplete === 'off' || autoComplete === 'on') {
      return autoComplete
    }
    
    if (autoComplete && autoComplete in AUTOCOMPLETE_VALUES) {
      return AUTOCOMPLETE_VALUES[autoComplete as AutocompleteKey]
    }
    
    if (typeof autoComplete === 'string') {
      return autoComplete
    }

    // Auto-detect based on field name or type
    if (name) {
      const lowerName = name.toLowerCase()
      for (const [key, value] of Object.entries(AUTOCOMPLETE_VALUES)) {
        if (lowerName.includes(key.toLowerCase())) {
          return value
        }
      }
    }

    // Type-based defaults
    if (type === 'email') return 'email'
    if (type === 'tel') return 'tel'
    if (type === 'password') return 'current-password'
    if (type === 'url') return 'url'

    return undefined
  }

  // Determine input mode
  const getInputMode = () => {
    if (inputMode) return inputMode
    
    // Auto-detect based on type and autocomplete
    if (type === 'email') return 'email'
    if (type === 'tel') return 'tel'
    if (type === 'url') return 'url'
    if (type === 'number') return 'numeric'
    if (autoComplete === 'postalCode' || autoComplete === 'zipCode') return 'numeric'
    if (autoComplete === 'creditCard') return 'numeric'
    
    return 'text'
  }

  const describedBy = React.useMemo(() => {
    const ids = []
    if (helperTextId) ids.push(helperTextId)
    if (errorId) ids.push(errorId)
    return ids.length > 0 ? ids.join(' ') : undefined
  }, [helperTextId, errorId])

  return (
    <div className={cn('space-y-2', containerClassName)}>
      {label && (
        <Label
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            error && 'text-destructive',
            labelClassName
          )}
        >
          {label}
          {required && showRequiredAsterisk && (
            <span className="text-destructive ml-1" aria-label="required">
              *
            </span>
          )}
        </Label>
      )}
      
      <Input
        id={inputId}
        name={name}
        type={type}
        autoComplete={getAutocompleteValue()}
        inputMode={getInputMode()}
        required={required}
        aria-required={required}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        hasError={!!error}
        fieldName={label || name}
        className={cn(
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
      
      {helperText && !error && (
        <p
          id={helperTextId}
          className={cn(
            'text-sm text-muted-foreground',
            helperClassName
          )}
        >
          {helperText}
        </p>
      )}
      
      {error && (
        <p
          id={errorId}
          className={cn(
            'text-sm font-medium text-destructive',
            errorClassName
          )}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <span className="sr-only">Error: </span>
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Preset input components for common form fields
 */

export function EmailInput(props: Omit<AccessibleInputProps, 'type' | 'autoComplete' | 'inputMode'>) {
  return (
    <AccessibleInput
      type="email"
      autoComplete="email"
      inputMode="email"
      {...props}
    />
  )
}

export function PasswordInput(props: Omit<AccessibleInputProps, 'type' | 'autoComplete'>) {
  return (
    <AccessibleInput
      type="password"
      autoComplete="current-password"
      {...props}
    />
  )
}

export function NewPasswordInput(props: Omit<AccessibleInputProps, 'type' | 'autoComplete'>) {
  return (
    <AccessibleInput
      type="password"
      autoComplete="new-password"
      {...props}
    />
  )
}

export function PhoneInput(props: Omit<AccessibleInputProps, 'type' | 'autoComplete' | 'inputMode'>) {
  return (
    <AccessibleInput
      type="tel"
      autoComplete="tel"
      inputMode="tel"
      {...props}
    />
  )
}

export function NameInput(props: Omit<AccessibleInputProps, 'autoComplete'>) {
  return (
    <AccessibleInput
      autoComplete="name"
      {...props}
    />
  )
}

export function FirstNameInput(props: Omit<AccessibleInputProps, 'autoComplete'>) {
  return (
    <AccessibleInput
      autoComplete="given-name"
      {...props}
    />
  )
}

export function LastNameInput(props: Omit<AccessibleInputProps, 'autoComplete'>) {
  return (
    <AccessibleInput
      autoComplete="family-name"
      {...props}
    />
  )
}

export function AddressInput(props: Omit<AccessibleInputProps, 'autoComplete'>) {
  return (
    <AccessibleInput
      autoComplete="street-address"
      {...props}
    />
  )
}

export function CityInput(props: Omit<AccessibleInputProps, 'autoComplete'>) {
  return (
    <AccessibleInput
      autoComplete="address-level2"
      {...props}
    />
  )
}

export function PostalCodeInput(props: Omit<AccessibleInputProps, 'autoComplete' | 'inputMode'>) {
  return (
    <AccessibleInput
      autoComplete="postal-code"
      inputMode="numeric"
      {...props}
    />
  )
}

export function SearchInput(props: Omit<AccessibleInputProps, 'type' | 'autoComplete' | 'inputMode'>) {
  return (
    <AccessibleInput
      type="search"
      autoComplete="off"
      inputMode="search"
      {...props}
    />
  )
}

export function CreditCardInput(props: Omit<AccessibleInputProps, 'autoComplete' | 'inputMode'>) {
  return (
    <AccessibleInput
      autoComplete="cc-number"
      inputMode="numeric"
      {...props}
    />
  )
}

export function OTPInput(props: Omit<AccessibleInputProps, 'autoComplete' | 'inputMode'>) {
  return (
    <AccessibleInput
      autoComplete="one-time-code"
      inputMode="numeric"
      {...props}
    />
  )
}

export default AccessibleInput