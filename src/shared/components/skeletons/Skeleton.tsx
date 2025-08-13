import { cn } from "@/shared/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'text' | 'rectangular'
  animation?: 'pulse' | 'wave' | 'none'
  width?: string | number
  height?: string | number
}

export function Skeleton({
  className,
  variant = 'default',
  animation = 'pulse',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const animationClass = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  }[animation]

  const variantClass = {
    default: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded h-4',
    rectangular: 'rounded-none'
  }[variant]

  return (
    <div
      className={cn(
        "bg-gray-200 dark:bg-gray-700",
        animationClass,
        variantClass,
        className
      )}
      style={{
        width,
        height,
        ...style
      }}
      {...props}
    />
  )
}