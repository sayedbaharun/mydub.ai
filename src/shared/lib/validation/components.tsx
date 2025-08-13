/**
 * Validation-aware form components
 */

import React from 'react'
import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { AlertCircle } from 'lucide-react'

interface ValidatedFieldProps {
  label?: string
  error?: string
  touched?: boolean
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function ValidatedField({
  label,
  error,
  touched,
  required,
  className,
  children,
}: ValidatedFieldProps) {
  const showError = touched && error

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {showError && (
        <div className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

interface ValidatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  touched?: boolean
  required?: boolean
}

export const ValidatedInput = React.forwardRef<
  HTMLInputElement,
  ValidatedInputProps
>(({ label, error, touched, required, className, ...props }, ref) => {
  const showError = touched && error

  return (
    <ValidatedField
      label={label}
      error={error}
      touched={touched}
      required={required}
    >
      <Input
        ref={ref}
        className={cn(
          showError && 'border-destructive focus:ring-destructive',
          className
        )}
        aria-invalid={showError}
        aria-describedby={showError ? `${props.name}-error` : undefined}
        {...props}
      />
    </ValidatedField>
  )
})

ValidatedInput.displayName = 'ValidatedInput'

interface ValidatedTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  touched?: boolean
  required?: boolean
}

export const ValidatedTextarea = React.forwardRef<
  HTMLTextAreaElement,
  ValidatedTextareaProps
>(({ label, error, touched, required, className, ...props }, ref) => {
  const showError = touched && error

  return (
    <ValidatedField
      label={label}
      error={error}
      touched={touched}
      required={required}
    >
      <Textarea
        ref={ref}
        className={cn(
          showError && 'border-destructive focus:ring-destructive',
          className
        )}
        aria-invalid={showError}
        aria-describedby={showError ? `${props.name}-error` : undefined}
        {...props}
      />
    </ValidatedField>
  )
})

ValidatedTextarea.displayName = 'ValidatedTextarea'

interface ValidatedSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  touched?: boolean
  required?: boolean
  options: Array<{ value: string; label: string }>
}

export const ValidatedSelect = React.forwardRef<
  HTMLSelectElement,
  ValidatedSelectProps
>(
  (
    { label, error, touched, required, className, options, ...props },
    ref
  ) => {
    const showError = touched && error

    return (
      <ValidatedField
        label={label}
        error={error}
        touched={touched}
        required={required}
      >
        <select
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            showError && 'border-destructive focus:ring-destructive',
            className
          )}
          aria-invalid={showError}
          aria-describedby={showError ? `${props.name}-error` : undefined}
          {...props}
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </ValidatedField>
    )
  }
)

ValidatedSelect.displayName = 'ValidatedSelect'

interface ValidatedCheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  touched?: boolean
}

export const ValidatedCheckbox = React.forwardRef<
  HTMLInputElement,
  ValidatedCheckboxProps
>(({ label, error, touched, className, ...props }, ref) => {
  const showError = touched && error

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            'h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary',
            showError && 'border-destructive',
            className
          )}
          aria-invalid={showError}
          aria-describedby={showError ? `${props.name}-error` : undefined}
          {...props}
        />
        <Label
          htmlFor={props.id}
          className="text-sm font-normal cursor-pointer"
        >
          {label}
        </Label>
      </div>
      {showError && (
        <div className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
})

ValidatedCheckbox.displayName = 'ValidatedCheckbox'

interface FileUploadProps {
  label?: string
  error?: string[]
  accept?: string
  multiple?: boolean
  maxSize?: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  files?: File[]
  onRemove?: (index: number) => void
}

export function ValidatedFileUpload({
  label,
  error,
  accept,
  multiple,
  maxSize,
  onChange,
  files = [],
  onRemove,
}: FileUploadProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onChange}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <span className="text-sm text-gray-600">
            Click to upload or drag and drop
          </span>
          {maxSize && (
            <span className="text-xs text-gray-500">
              Max file size: {formatFileSize(maxSize)}
            </span>
          )}
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm truncate max-w-xs">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({formatFileSize(file.size)})
                </span>
              </div>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {error && error.length > 0 && (
        <div className="space-y-1">
          {error.map((err, index) => (
            <div
              key={index}
              className="flex items-center gap-1 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}