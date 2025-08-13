import { ReactNode } from 'react'
import { Card } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'
import { Link } from 'react-router-dom'

interface CategoryCardProps {
  title: string
  description?: string
  image?: string
  href?: string
  overlay?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children?: ReactNode
}

export function CategoryCard({
  title,
  description,
  image,
  href,
  overlay,
  className,
  size = 'md',
  children
}: CategoryCardProps) {
  const sizeClasses = {
    sm: 'aspect-[4/3]',
    md: 'aspect-[3/2]',
    lg: 'aspect-[16/9]',
    xl: 'aspect-[21/9]'
  }

  const content = (
    <Card className={cn(
      'group relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 border-desert-gold/20 hover:border-desert-gold/40',
      className
    )}>
      <div className={cn('relative', sizeClasses[size])}>
        {image && (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        
        {/* Luxury Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-black/80 via-midnight-black/30 to-transparent" />
        
        {/* Desert Gold Accent */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-desert-gold/40 to-transparent" />
        
        {/* Content Overlay */}
        <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-end">
          <h3 className="text-xl md:text-2xl font-bold mb-2 text-pearl-white group-hover:text-desert-gold group-hover:transform group-hover:translate-y-[-2px] transition-all duration-300">
            {title}
          </h3>
          {description && (
            <p className="text-sm md:text-base text-pearl-white/90 line-clamp-2 group-hover:text-pearl-white transition-colors">
              {description}
            </p>
          )}
          {/* Subtle AI Blue accent line */}
          <div className="w-8 h-0.5 bg-ai-blue mt-2 group-hover:w-16 transition-all duration-300"></div>
        </div>
        
        {/* Custom Overlay Content */}
        {overlay && (
          <div className="absolute inset-0">
            {overlay}
          </div>
        )}
        
        {children}
      </div>
    </Card>
  )

  if (href) {
    return <Link to={href}>{content}</Link>
  }

  return content
} 