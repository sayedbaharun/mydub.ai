# mydub.ai Design System - Quick Reference

> Quick copy-paste snippets for common patterns

## 🎨 Colors

```tsx
// Dubai Gold (Primary Brand Color)
className="text-dubai-gold-500"        // Text
className="bg-dubai-gold-500"          // Background
className="border-dubai-gold-500"      // Border
className="hover:text-dubai-gold-600"  // Hover

// Common gradients
className="bg-gradient-to-r from-dubai-gold-500 to-dubai-gold-300"
className="bg-gradient-to-b from-dubai-gold-500 to-dubai-gold-300"
```

## 📝 Typography

```tsx
// Headlines
className="text-4xl font-light tracking-tight text-midnight-black"
className="text-3xl font-light tracking-tight"
className="text-2xl font-light tracking-tight"

// Body
className="text-base text-gray-600 leading-relaxed"
className="text-sm text-gray-500"

// Emphasis
className="text-dubai-gold-700 font-medium"
```

## 🎴 Intelligence Card

```tsx
import { IntelligenceCard } from '@/shared/components/ui/intelligence-card'

// Featured (Hero)
<IntelligenceCard
  variant="featured"
  title="Title"
  description="Description"
  image="/image.jpg"
  aiGenerated={true}
  confidenceScore={94}
  sourcesAnalyzed={47}
/>

// Default (Standard)
<IntelligenceCard
  variant="default"
  title="Title"
  description="Description"
  image="/image.jpg"
/>

// Minimal (Compact)
<IntelligenceCard
  variant="minimal"
  title="Title"
  image="/image.jpg"
/>

// Luxury (Dubai Gold accents)
<IntelligenceCard
  variant="luxury"
  title="Title"
  description="Description"
  image="/image.jpg"
/>
```

## 🏗️ Layouts

### Asymmetric Grid (Homepage Pattern)

```tsx
<div className="space-y-12">
  {/* Hero */}
  <div className="mb-16">
    <IntelligenceCard variant="featured" {...article1} />
  </div>

  {/* 2:1 Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
    <div className="lg:col-span-2">
      <IntelligenceCard variant="default" {...article2} />
    </div>
    <div className="lg:col-span-1">
      <IntelligenceCard variant="minimal" {...article3} />
    </div>
  </div>

  {/* 3-column */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
    <IntelligenceCard variant="luxury" {...article4} />
    <IntelligenceCard variant="default" {...article5} />
    <IntelligenceCard variant="default" {...article6} />
  </div>
</div>
```

## 🎯 Section Headers

```tsx
{/* With Dubai Gold accent */}
<div className="mb-12 relative">
  <div className="absolute -left-6 top-0 h-full w-1 bg-gradient-to-b from-dubai-gold-500 to-dubai-gold-300" />
  <h2 className="mb-2 text-2xl font-light tracking-tight text-midnight-black">
    Section Title
  </h2>
  <p className="text-base text-gray-500">
    Section description
  </p>
</div>

{/* Centered with top accent */}
<div className="mb-12 text-center relative">
  <div className="absolute left-1/2 -translate-x-1/2 top-0 h-1 w-24 bg-gradient-to-r from-dubai-gold-500 to-dubai-gold-300 -translate-y-4" />
  <h2 className="mb-2 text-2xl font-light tracking-tight text-midnight-black">
    Centered Title
  </h2>
  <p className="text-base text-gray-500">Description</p>
</div>
```

## 🔘 Buttons

```tsx
{/* Primary - Dubai Gold */}
<Button className="bg-dubai-gold-500 hover:bg-dubai-gold-600 text-white">
  Primary Action
</Button>

{/* Outline */}
<Button
  variant="outline"
  className="border-dubai-gold-500 hover:bg-dubai-gold-500 hover:text-white"
>
  Secondary Action
</Button>

{/* Ghost */}
<Button variant="ghost" className="hover:bg-dubai-gold-50">
  Tertiary Action
</Button>
```

## 💳 Cards

```tsx
{/* Standard */}
<Card className="border-gray-200 hover:border-dubai-gold-300 transition-all">
  <CardContent className="p-6">...</CardContent>
</Card>

{/* Luxury */}
<Card className="border-2 border-dubai-gold-200 shadow-lg">
  <CardContent className="p-8">...</CardContent>
</Card>

{/* With hover lift */}
<Card className="
  transition-all duration-300
  hover:-translate-y-1
  hover:shadow-2xl
  hover:border-dubai-gold-300
">
  <CardContent>...</CardContent>
</Card>
```

## ✨ Animations

```tsx
{/* Hover lift */}
className="transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"

{/* Dubai Gold bottom accent (appears on hover) */}
<div className="relative group">
  <div className="
    absolute left-0 bottom-0
    h-1 w-0
    bg-gradient-to-r from-dubai-gold-500 to-dubai-gold-300
    transition-all duration-500
    group-hover:w-full
  " />
  Content
</div>

{/* Image zoom on hover */}
<img className="
  transition-transform duration-700
  group-hover:scale-105
" />
```

## 🤖 AI Transparency

```tsx
import { AIDisclosureBadge } from '@/shared/components/ai/AIDisclosureBadge'

{/* Compact badge */}
<AIDisclosureBadge
  variant="compact"
  sourcesAnalyzed={47}
  confidenceScore={94}
  humanReviewed={true}
/>

{/* In card metadata */}
{aiGenerated && sourcesAnalyzed && (
  <div className="flex items-center gap-1 text-xs text-gray-500">
    <Sparkles className="h-3 w-3 text-purple-600" />
    <span>{sourcesAnalyzed} sources</span>
  </div>
)}

{/* High confidence badge */}
{confidenceScore >= 90 && (
  <Badge variant="outline" className="border-green-200 text-green-700">
    High Confidence
  </Badge>
)}
```

## 📏 Spacing

```tsx
{/* Section spacing */}
className="space-y-12"  // 48px - Default sections
className="space-y-16"  // 64px - Major sections
className="space-y-20"  // 80px - Page sections
className="space-y-24"  // 96px - Homepage sections

{/* Gaps */}
className="gap-8"   // 32px - Comfortable
className="gap-12"  // 48px - Generous (preferred)
className="gap-16"  // 64px - Very generous

{/* Padding */}
className="p-6"     // 24px - Standard card
className="p-8"     // 32px - Generous card
className="py-12 px-4"  // Page sections
```

## 🌐 RTL Support

```tsx
import { useTranslation } from 'react-i18next'

const { i18n } = useTranslation()
const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

<div className={cn(
  "flex gap-4",
  isRTL && "flex-row-reverse"
)}>
  Content
</div>

<p className={cn(
  "text-base",
  isRTL && "text-right"
)}>
  Text content
</p>
```

## ♿ Accessibility

```tsx
{/* Focus ring */}
className="
  focus:outline-none
  focus:ring-2
  focus:ring-dubai-gold-500
  focus:ring-offset-2
"

{/* Screen reader only */}
className="sr-only"

{/* ARIA labels */}
<button aria-label="Share article">
  <Share2 className="h-4 w-4" />
</button>

{/* Semantic HTML */}
<article role="article" aria-labelledby="title">
  <h1 id="title">Title</h1>
</article>
```

## 📱 Responsive

```tsx
{/* Breakpoints */}
className="
  grid
  grid-cols-1           // Mobile: 1 column
  md:grid-cols-2        // Tablet: 2 columns
  lg:grid-cols-3        // Desktop: 3 columns
  gap-4                 // Mobile gap
  md:gap-6              // Tablet gap
  lg:gap-12             // Desktop gap
"

{/* Hide/show */}
className="hidden lg:block"  // Desktop only
className="block lg:hidden"  // Mobile/tablet only

{/* Responsive text */}
className="text-2xl md:text-3xl lg:text-4xl"
```

## 🎨 Complete Example

```tsx
// Article Card with all patterns
<div className="relative group">
  <IntelligenceCard
    variant="default"
    title="Dubai Announces AI Strategy"
    description="The emirate unveils comprehensive plan for 2026"
    image="/ai-strategy.jpg"
    category="Technology"
    date="2 hours ago"
    author="Sarah Al Mazrouei"
    readTime={5}
    viewCount={12453}
    aiGenerated={true}
    confidenceScore={94}
    sourcesAnalyzed={47}
    sentiment="positive"
    trending={true}
    href="/news/ai-strategy"
    className="
      transition-all duration-300
      hover:-translate-y-1
      hover:shadow-2xl
      hover:border-dubai-gold-300
    "
  >
    {/* Action buttons */}
    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
      <Button variant="ghost" size="sm">
        <Heart className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm">
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  </IntelligenceCard>

  {/* Dubai Gold bottom accent */}
  <div className="
    absolute left-0 bottom-0
    h-1 w-0
    bg-gradient-to-r from-dubai-gold-500 to-dubai-gold-300
    transition-all duration-500
    group-hover:w-full
  " />
</div>
```

---

**Full Documentation:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
**Dubai Gold Guidelines:** [DUBAI_GOLD_GUIDELINES.md](./DUBAI_GOLD_GUIDELINES.md)
