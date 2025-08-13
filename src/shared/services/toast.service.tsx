import React, { ReactNode } from 'react'
import { toast as sonnerToast, ExternalToast } from 'sonner'
import { CheckCircle, XCircle, AlertCircle, InfoIcon, Loader2 } from 'lucide-react'

interface ToastOptions extends ExternalToast {
  title?: string
  message?: ReactNode
}

class ToastService {
  success(message: string | ReactNode, options?: ToastOptions) {
    return sonnerToast.success(
      <div className="flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {options?.title && <div className="font-semibold mb-1">{options.title}</div>}
          <div>{message}</div>
        </div>
      </div>,
      {
        duration: 4000,
        ...options,
      }
    )
  }

  error(message: string | ReactNode, options?: ToastOptions) {
    return sonnerToast.error(
      <div className="flex items-start gap-3">
        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {options?.title && <div className="font-semibold mb-1">{options.title}</div>}
          <div>{message}</div>
        </div>
      </div>,
      {
        duration: 6000,
        ...options,
      }
    )
  }

  warning(message: string | ReactNode, options?: ToastOptions) {
    return sonnerToast.warning(
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {options?.title && <div className="font-semibold mb-1">{options.title}</div>}
          <div>{message}</div>
        </div>
      </div>,
      {
        duration: 5000,
        ...options,
      }
    )
  }

  info(message: string | ReactNode, options?: ToastOptions) {
    return sonnerToast.info(
      <div className="flex items-start gap-3">
        <InfoIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {options?.title && <div className="font-semibold mb-1">{options.title}</div>}
          <div>{message}</div>
        </div>
      </div>,
      {
        duration: 4000,
        ...options,
      }
    )
  }

  loading(message: string | ReactNode, options?: ToastOptions) {
    return sonnerToast(
      <div className="flex items-start gap-3">
        <Loader2 className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5 animate-spin" />
        <div className="flex-1">
          {options?.title && <div className="font-semibold mb-1">{options.title}</div>}
          <div>{message}</div>
        </div>
      </div>,
      {
        duration: Infinity,
        ...options,
      }
    )
  }

  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string | ReactNode
      success: string | ReactNode | ((data: T) => string | ReactNode)
      error: string | ReactNode | ((error: any) => string | ReactNode)
    },
    options?: ToastOptions
  ) {
    return sonnerToast.promise(promise, messages, options)
  }

  custom(content: ReactNode, options?: ToastOptions) {
    return sonnerToast(content, options)
  }

  dismiss(toastId?: string | number) {
    return sonnerToast.dismiss(toastId)
  }

  // Helper methods for common scenarios
  networkError(options?: ToastOptions) {
    return this.error('Network error. Please check your connection and try again.', {
      title: 'Connection Problem',
      ...options,
    })
  }

  validationError(message?: string, options?: ToastOptions) {
    return this.error(message || 'Please check your input and try again.', {
      title: 'Validation Error',
      ...options,
    })
  }

  permissionError(options?: ToastOptions) {
    return this.error('You do not have permission to perform this action.', {
      title: 'Access Denied',
      ...options,
    })
  }

  saveSuccess(itemName?: string, options?: ToastOptions) {
    return this.success(
      itemName ? `${itemName} saved successfully!` : 'Saved successfully!',
      options
    )
  }

  deleteSuccess(itemName?: string, options?: ToastOptions) {
    return this.success(
      itemName ? `${itemName} deleted successfully!` : 'Deleted successfully!',
      options
    )
  }

  updateSuccess(itemName?: string, options?: ToastOptions) {
    return this.success(
      itemName ? `${itemName} updated successfully!` : 'Updated successfully!',
      options
    )
  }

  copySuccess(itemName?: string, options?: ToastOptions) {
    return this.success(
      itemName ? `${itemName} copied to clipboard!` : 'Copied to clipboard!',
      options
    )
  }
}

export const toast = new ToastService()
export default toast