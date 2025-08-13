import { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { useRTL } from '@/shared/hooks/useRTL'

interface RTLWrapperProps {
  children: ReactNode
  className?: string
  reverseLayout?: boolean
}

// Wrapper component that automatically handles RTL layout
export function RTLWrapper({ 
  children, 
  className,
  reverseLayout = true 
}: RTLWrapperProps) {
  const { isRTL } = useRTL()

  return (
    <div 
      className={cn(
        reverseLayout && isRTL && 'flex-row-reverse',
        className
      )}
    >
      {children}
    </div>
  )
}

// Icon wrapper that flips certain icons in RTL
interface RTLIconProps {
  children: ReactNode
  flip?: boolean
  className?: string
}

export function RTLIcon({ 
  children, 
  flip = true,
  className 
}: RTLIconProps) {
  const { isRTL } = useRTL()

  return (
    <span 
      className={cn(
        flip && isRTL && 'scale-x-[-1]',
        className
      )}
    >
      {children}
    </span>
  )
}

// Text alignment helper
interface RTLTextProps {
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function RTLText({ 
  children, 
  align = 'start',
  className 
}: RTLTextProps) {
  const alignClasses = {
    start: 'text-start',
    center: 'text-center',
    end: 'text-end',
  }

  return (
    <div className={cn(alignClasses[align], className)}>
      {children}
    </div>
  )
}

// Margin/Padding helper for RTL
export function useRTLSpacing() {
  const { isRTL } = useRTL()

  const getSpacing = (start: string, end: string) => {
    if (isRTL) {
      return {
        marginRight: start,
        marginLeft: end,
        paddingRight: start,
        paddingLeft: end,
      }
    }
    return {
      marginLeft: start,
      marginRight: end,
      paddingLeft: start,
      paddingRight: end,
    }
  }

  return { getSpacing, isRTL }
}