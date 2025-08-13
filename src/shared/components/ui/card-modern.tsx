import * as React from "react"
import { cn } from '@/shared/lib/utils'
import { motion } from "framer-motion"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  clickable?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, clickable = false, ...props }, ref) => {
    const cardClasses = cn(
      "rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden",
      hoverable && "transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      clickable && "cursor-pointer",
      className
    )

    if (hoverable) {
      return (
        <motion.div
          ref={ref}
          className={cardClasses}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          {...(props as any)}
        />
      )
    }

    return (
      <div
        ref={ref}
        className={cardClasses}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-tight tracking-tight text-gray-900",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: "square" | "video" | "wide"
}

const CardImage = React.forwardRef<HTMLImageElement, CardImageProps>(
  ({ className, aspectRatio = "video", alt = "", ...props }, ref) => {
    const aspectClasses = {
      square: "aspect-square",
      video: "aspect-video",
      wide: "aspect-[21/9]"
    }

    return (
      <div className={cn("relative overflow-hidden", aspectClasses[aspectRatio])}>
        <img
          ref={ref}
          className={cn(
            "h-full w-full object-cover transition-transform duration-300 hover:scale-105",
            className
          )}
          alt={alt}
          {...props}
        />
      </div>
    )
  }
)
CardImage.displayName = "CardImage"

interface NewsCardProps {
  title: string
  description: string
  image?: string
  category?: string
  date?: string
  author?: string
  href?: string
  onClick?: () => void
}

const NewsCard = React.forwardRef<HTMLDivElement, NewsCardProps>(
  ({ title, description, image, category, date, author, href, onClick }, ref) => {
    const handleClick = () => {
      if (onClick) {
        onClick()
      } else if (href) {
        window.location.href = href
      }
    }

    return (
      <Card
        ref={ref}
        hoverable
        clickable={!!(onClick || href)}
        onClick={handleClick}
        className="h-full flex flex-col"
      >
        {image && <CardImage src={image} alt={title} />}
        <div className="flex-1 flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              {category && (
                <>
                  <span className="font-medium text-blue-600">{category}</span>
                  {date && <span>•</span>}
                </>
              )}
              {date && <span>{date}</span>}
            </div>
            <CardTitle className="line-clamp-2">{title}</CardTitle>
            {description && (
              <CardDescription className="line-clamp-3 mt-2">
                {description}
              </CardDescription>
            )}
          </CardHeader>
          {author && (
            <CardFooter className="mt-auto">
              <span className="text-sm text-gray-500">By {author}</span>
            </CardFooter>
          )}
        </div>
      </Card>
    )
  }
)
NewsCard.displayName = "NewsCard"

interface FeatureCardProps {
  title: string
  description: string
  icon?: React.ReactNode
  onClick?: () => void
  className?: string
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ title, description, icon, onClick, className }, ref) => {
    return (
      <Card
        ref={ref}
        hoverable
        clickable={!!onClick}
        onClick={onClick}
        className={cn("h-full", className)}
      >
        <CardHeader>
          {icon && (
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              {icon}
            </div>
          )}
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-2">{description}</CardDescription>
        </CardHeader>
      </Card>
    )
  }
)
FeatureCard.displayName = "FeatureCard"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardImage,
  NewsCard,
  FeatureCard
}