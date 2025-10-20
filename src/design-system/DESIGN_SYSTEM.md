# mydub.ai Design System

> **Dubai's first AI-powered news channel** - A design system inspired by Jony Ive's minimalist philosophy, enhanced with Dubai Gold accents and radical transparency.

**Version:** 1.0.0
**Last Updated:** January 2026
**Status:** Active Development

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Components](#components)
5. [Layout Principles](#layout-principles)
6. [Spacing & White Space](#spacing--white-space)
7. [Animation & Motion](#animation--motion)
8. [AI Transparency](#ai-transparency)
9. [Accessibility](#accessibility)
10. [Usage Examples](#usage-examples)

---

## Philosophy

### Design Principles

Our design system embodies three core principles:

1. **Radical Simplicity** (Jony Ive influence)
   - Remove everything unnecessary
   - Generous white space
   - Focus on content hierarchy
   - Subtle, meaningful details

2. **Dubai Excellence**
   - Dubai Gold as signature accent
   - Premium, luxury feel
   - International sophistication
   - Local cultural respect

3. **AI Transparency**
   - Clear labeling of AI-generated content
   - Visible confidence scores
   - Source attribution
   - Human review indicators

### Visual Identity

- **Primary Accent:** Dubai Gold (#D4AF37)
- **Typography:** Light weights, generous tracking
- **Layout:** Asymmetric grids, generous spacing
- **Animation:** Subtle, purposeful transitions
- **Imagery:** High-quality, Dubai-centric

---

## Color System

### Primary Palette

#### Dubai Gold
Our signature brand color - use for accents, highlights, and emphasis.

```css
/* Tailwind Classes */
.text-dubai-gold-500      /* Primary text */
.bg-dubai-gold-500        /* Primary background */
.border-dubai-gold-500    /* Primary border */
.hover:text-dubai-gold-600 /* Hover state */
```

**Full Palette:**
- `dubai-gold-50`: #FDFBF7 - Lightest tint (backgrounds)
- `dubai-gold-100`: #FAF6ED - Very light (hover states)
- `dubai-gold-200`: #F5EDD9 - Light (borders)
- `dubai-gold-300`: #EBD9B3 - Medium light (gradients)
- `dubai-gold-400`: #DFC58D - Medium (secondary accents)
- `dubai-gold-500`: #D4AF37 - **PRIMARY** (main brand color)
- `dubai-gold-600`: #C09E2F - Medium dark (hover states)
- `dubai-gold-700`: #A68628 - Dark (pressed states)
- `dubai-gold-800`: #8C6E21 - Very dark (text on light)
- `dubai-gold-900`: #6B541A - Darkest (headings)
- `dubai-gold-950`: #4D3C12 - Extreme dark (rarely used)

### Gradients

```css
/* Recommended gradients */
bg-gradient-to-r from-dubai-gold-500 to-dubai-gold-300  /* Horizontal */
bg-gradient-to-b from-dubai-gold-500 to-dubai-gold-300  /* Vertical */
bg-gradient-to-br from-dubai-gold-500 via-dubai-gold-400 to-dubai-gold-300  /* Diagonal */
```

### Neutral Colors

- **Midnight Black:** `#0A0A0A` - Primary text, dark backgrounds
- **Pearl White:** `#FAFAFA` - Light backgrounds
- **Gray Scale:** Use Tailwind's gray-50 through gray-900

### Semantic Colors

- **AI Blue:** `#4A90E2` - AI assistance, chat
- **Success:** `green-500` - Confirmations, high confidence
- **Warning:** `amber-500` - Medium confidence, alerts
- **Error:** `red-500` - Low confidence, errors
- **Info:** `blue-500` - Informational messages

---

## Typography

### Font Family

**Primary:** System font stack for optimal performance

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
             'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans',
             'Droid Sans', 'Helvetica Neue', sans-serif;
```

### Type Scale

```css
/* Headlines */
.text-7xl  /* 72px - Hero headlines */
.text-6xl  /* 60px - Page titles */
.text-5xl  /* 48px - Section headlines */
.text-4xl  /* 36px - Card titles (featured) */
.text-3xl  /* 30px - Card titles */
.text-2xl  /* 24px - Section headers */

/* Body */
.text-xl   /* 20px - Large body, introductions */
.text-lg   /* 18px - Emphasized body */
.text-base /* 16px - Default body text */
.text-sm   /* 14px - Secondary text, captions */
.text-xs   /* 12px - Labels, metadata */
```

### Font Weights

```css
.font-light    /* 300 - Headlines, emphasis */
.font-normal   /* 400 - Body text */
.font-medium   /* 500 - Subheadings, UI elements */
.font-semibold /* 600 - Strong emphasis */
.font-bold     /* 700 - Rarely used, very strong emphasis */
```

### Letter Spacing

```css
.tracking-tight  /* -0.025em - Headlines */
.tracking-normal /* 0 - Body text */
.tracking-wide   /* 0.025em - Labels, UI */
```

### Line Height

```css
.leading-tight   /* 1.25 - Headlines */
.leading-normal  /* 1.5 - Body text */
.leading-relaxed /* 1.625 - Long-form content */
```

### Typography Guidelines

**DO:**
- Use light font weights (300-400) for headlines
- Apply generous tracking to headlines (-0.025em)
- Use relaxed line-height for readability (1.625)
- Limit line length to 60-80 characters
- Use Dubai Gold for emphasis sparingly

**DON'T:**
- Don't use all caps excessively
- Don't use bold weights for large text
- Don't cram text together (maintain white space)
- Don't mix too many font sizes in one section

---

## Components

### Intelligence Card

Our signature component for displaying content with AI metadata.

#### Variants

1. **Featured** - Hero content, large images
2. **Default** - Standard article cards
3. **Minimal** - Compact, sidebar content
4. **Luxury** - Dubai Gold accents, premium content

#### Usage

```tsx
import { IntelligenceCard } from '@/shared/components/ui/intelligence-card'

<IntelligenceCard
  variant="featured"
  title="Article Title"
  description="Article summary..."
  image="/path/to/image.jpg"
  category="Technology"
  date="2 hours ago"
  author="Sarah Al Mazrouei"

  // AI Metadata
  aiGenerated={true}
  confidenceScore={94}
  sourcesAnalyzed={47}
  viewCount={12453}
  readTime={5}
  sentiment="positive"
  trending={true}

  // Interaction
  href="/news/123"
  onClick={() => navigate('/news/123')}
/>
```

#### States

- **Default:** Clean, minimal
- **Hover:** Subtle lift (-translate-y-1), Dubai Gold border, shadow increase
- **Focus:** Dubai Gold ring (keyboard navigation)
- **Loading:** Skeleton with shimmer animation

#### Anatomy

```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │         Image (16:9)            │ │ ← Gradient overlay
│ │    ┌─────────┐  ┌──────────┐   │ │ ← Category + AI badges
│ └────┴─────────┴──┴──────────┴───┘ │
│                                     │
│  Title (text-xl, font-semibold)    │ ← Tracking-tight
│                                     │
│  Description (text-sm, gray-600)   │ ← Line-clamp-2
│  Multiple lines of content...      │
│                                     │
│  ┌──────────┬──────────┬─────────┐ │
│  │ Sources  │ Views    │ High    │ │ ← Metadata bar
│  │ 47       │ 12,453   │ Conf.   │ │
│  └──────────┴──────────┴─────────┘ │
│                                     │
│  [Children content area]            │ ← Action buttons
│                                     │
│  ═══════════════════════════════   │ ← Dubai Gold accent (on hover)
└─────────────────────────────────────┘
```

### AI Disclosure Badge

Displays AI confidence score and metadata.

```tsx
import { AIDisclosureBadge } from '@/shared/components/ai/AIDisclosureBadge'

<AIDisclosureBadge
  variant="compact"
  sourcesAnalyzed={47}
  confidenceScore={94}
  humanReviewed={true}
  generatedAt={new Date()}
/>
```

**Variants:**
- `compact` - Minimal badge with score
- `full` - Detailed disclosure with all metadata
- `inline` - Text-based disclosure

### Buttons

```tsx
// Primary - Dubai Gold accent
<Button className="bg-dubai-gold-500 hover:bg-dubai-gold-600">
  Primary Action
</Button>

// Outline - With Dubai Gold on hover
<Button variant="outline" className="border-dubai-gold-500 hover:bg-dubai-gold-500 hover:text-white">
  Secondary Action
</Button>

// Ghost - Minimal
<Button variant="ghost">
  Tertiary Action
</Button>
```

### Cards

```tsx
// Standard card
<Card className="border-gray-200 hover:border-dubai-gold-300 transition-all">
  <CardContent>...</CardContent>
</Card>

// Luxury variant
<Card className="border-2 border-dubai-gold-200 shadow-lg">
  <CardContent>...</CardContent>
</Card>
```

---

## Layout Principles

### Asymmetric Grids

Inspired by Jony Ive's asymmetry, we use uneven layouts for visual interest.

#### Homepage Pattern

```tsx
{/* Hero - Full width featured card */}
<div className="mb-16">
  <IntelligenceCard variant="featured" {...article} />
</div>

{/* Asymmetric 2:1 grid */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
  <div className="lg:col-span-2">
    <IntelligenceCard variant="default" {...article2} />
  </div>
  <div className="lg:col-span-1">
    <IntelligenceCard variant="minimal" {...article3} />
  </div>
</div>

{/* Standard 3-column with luxury accent */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
  <IntelligenceCard variant="luxury" {...article4} />
  <IntelligenceCard variant="default" {...article5} />
  <IntelligenceCard variant="default" {...article6} />
</div>
```

#### Grid Gaps

```css
.gap-4   /* 16px - Compact layouts */
.gap-6   /* 24px - Standard spacing */
.gap-8   /* 32px - Comfortable spacing */
.gap-12  /* 48px - Generous spacing (preferred) */
.gap-16  /* 64px - Section spacing */
```

### Container Widths

```css
.max-w-6xl  /* 72rem / 1152px - Default content width */
.max-w-7xl  /* 80rem / 1280px - Wide content */
.max-w-4xl  /* 56rem / 896px - Narrow content (articles) */
```

### Section Spacing

```css
.space-y-12  /* 48px vertical rhythm - Sections */
.space-y-16  /* 64px vertical rhythm - Major sections */
.space-y-20  /* 80px vertical rhythm - Page sections */
.space-y-24  /* 96px vertical rhythm - Homepage sections */
```

---

## Spacing & White Space

### Philosophy

"Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away." - Antoine de Saint-Exupéry

We embrace generous white space to create breathing room and hierarchy.

### Spacing Scale

```css
/* Tailwind Spacing */
0.5  /* 2px - Minimal separation */
1    /* 4px - Tight spacing */
2    /* 8px - Small padding */
3    /* 12px - Default gap */
4    /* 16px - Standard padding */
6    /* 24px - Comfortable padding */
8    /* 32px - Card padding */
12   /* 48px - Section spacing */
16   /* 64px - Large spacing */
20   /* 80px - Major sections */
24   /* 96px - Hero spacing */
```

### Padding Guidelines

```tsx
{/* Card padding */}
<CardContent className="p-6">  {/* Standard */}
<CardContent className="p-8">  {/* Generous (luxury) */}

{/* Page padding */}
<div className="px-4 sm:px-6 lg:px-12">  {/* Responsive */}

{/* Section padding */}
<section className="py-12 sm:py-16 lg:py-20">  {/* Vertical */}
```

### Margin Collapse Prevention

Use `space-y-*` instead of `mb-*` for consistent vertical rhythm:

```tsx
{/* GOOD - Consistent spacing */}
<div className="space-y-12">
  <Section1 />
  <Section2 />
  <Section3 />
</div>

{/* AVOID - Margin collapse issues */}
<div>
  <Section1 className="mb-12" />
  <Section2 className="mb-12" />
  <Section3 />
</div>
```

---

## Animation & Motion

### Philosophy

Animations should be **purposeful**, **subtle**, and **respectful** of user preferences.

### Duration

```css
.duration-100  /* 100ms - Instant feedback (buttons) */
.duration-200  /* 200ms - Quick transitions (hover) */
.duration-300  /* 300ms - Standard transitions (most UI) */
.duration-500  /* 500ms - Deliberate transitions (page loads) */
.duration-700  /* 700ms - Slow, luxurious (images) */
```

### Easing

```css
.ease-out       /* Default - Natural deceleration */
.ease-in-out    /* Smooth start and end */
.ease-linear    /* Mechanical, progress bars */
```

### Common Patterns

#### Hover Lift

```tsx
<div className="
  transition-all duration-300
  hover:-translate-y-1
  hover:shadow-2xl
  hover:border-dubai-gold-300
">
  Card content
</div>
```

#### Dubai Gold Accent Line

```tsx
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
```

#### Fade In

```tsx
<div className="
  opacity-0
  animate-in fade-in
  duration-500
">
  Content
</div>
```

#### Image Zoom on Hover

```tsx
<img className="
  w-full h-full object-cover
  transition-transform duration-700
  group-hover:scale-105
" />
```

### Accessibility

Always respect user motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-* {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## AI Transparency

### Display Requirements

All AI-generated content MUST display:

1. **AI Badge** - Clear "AI Generated" indicator
2. **Confidence Score** - 0-100% visible to users
3. **Source Count** - Number of sources analyzed
4. **Human Review Status** - Whether reviewed by humans

### Confidence Thresholds

```tsx
if (confidenceScore >= 90) {
  // High Confidence - Green badge, prominent display
  return <Badge variant="outline" className="border-green-200 text-green-700">
    High Confidence
  </Badge>
}

if (confidenceScore >= 75) {
  // Medium Confidence - Amber badge, standard display
  return <Badge variant="outline" className="border-amber-200 text-amber-700">
    Medium Confidence
  </Badge>
}

// Low Confidence (<75%) - Red badge, warning display
return <Badge variant="outline" className="border-red-200 text-red-700">
  Low Confidence
</Badge>
```

### Publishing Threshold

**Minimum 85% confidence** required to publish AI-generated content.

### Visual Indicators

```tsx
{/* Compact badge in card corner */}
{aiGenerated && confidenceScore && (
  <Badge className="bg-purple-600/90 text-white backdrop-blur-md">
    <Sparkles className="h-3 w-3 mr-1" />
    {confidenceScore}%
  </Badge>
)}

{/* Metadata bar in card footer */}
{aiGenerated && sourcesAnalyzed && (
  <div className="flex items-center gap-1 text-xs text-gray-500">
    <Sparkles className="h-3 w-3 text-purple-600" />
    <span>{sourcesAnalyzed} sources</span>
  </div>
)}
```

---

## Accessibility

### Keyboard Navigation

```tsx
{/* Visible focus rings */}
className="
  focus:outline-none
  focus:ring-2
  focus:ring-dubai-gold-500
  focus:ring-offset-2
"

{/* Skip links */}
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Color Contrast

All text must meet **WCAA AA standards**:

- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Interactive elements: 3:1 minimum

**Dubai Gold on White:** ✅ 3.2:1 (Large text only)
**Dubai Gold 700 on White:** ✅ 4.8:1 (All text)
**Midnight Black on White:** ✅ 18.5:1 (Perfect)

### ARIA Labels

```tsx
<button
  aria-label="Share article"
  aria-describedby="share-tooltip"
>
  <Share2 className="h-4 w-4" />
</button>

<div role="article" aria-labelledby="article-title">
  <h2 id="article-title">Article Title</h2>
  ...
</div>
```

### RTL Support

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
```

---

## Usage Examples

### Homepage Hero Article

```tsx
<IntelligenceCard
  variant="featured"
  title="Dubai Announces New AI Strategy for 2026"
  description="The emirate has unveiled a comprehensive artificial intelligence strategy..."
  image="https://example.com/ai-strategy.jpg"
  category="Technology"
  date="2 hours ago"
  author="Sarah Al Mazrouei"
  readTime={5}
  aiGenerated={true}
  confidenceScore={94}
  sourcesAnalyzed={47}
  viewCount={12453}
  trending={true}
  href="/news/ai-strategy-2026"
/>
```

### Section Header with Dubai Gold Accent

```tsx
<div className="mb-12 relative">
  {/* Dubai Gold accent line */}
  <div className="absolute -left-6 top-0 h-full w-1 bg-gradient-to-b from-dubai-gold-500 to-dubai-gold-300" />

  <h2 className="mb-2 text-2xl font-light tracking-tight text-midnight-black">
    Today in Dubai
  </h2>
  <p className="text-base text-gray-500">
    Latest news and updates from across the emirate
  </p>
</div>
```

### Asymmetric Article Grid

```tsx
<div className="space-y-12">
  {/* Featured */}
  <IntelligenceCard variant="featured" {...articles[0]} />

  {/* 2:1 Asymmetric */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
    <div className="lg:col-span-2">
      <IntelligenceCard variant="default" {...articles[1]} />
    </div>
    <div className="lg:col-span-1">
      <IntelligenceCard variant="minimal" {...articles[2]} />
    </div>
  </div>

  {/* 3-column with luxury */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
    <IntelligenceCard variant="luxury" {...articles[3]} />
    <IntelligenceCard variant="default" {...articles[4]} />
    <IntelligenceCard variant="default" {...articles[5]} />
  </div>
</div>
```

### Button with Dubai Gold

```tsx
<Button className="
  bg-dubai-gold-500
  hover:bg-dubai-gold-600
  text-white
  transition-colors duration-200
">
  Read More
  <ArrowRight className="ml-2 h-4 w-4" />
</Button>
```

---

## Resources

### Documentation

- **Dubai Gold Guidelines:** `/src/design-system/DUBAI_GOLD_GUIDELINES.md`
- **Intelligence Card:** `/src/shared/components/ui/intelligence-card.tsx`
- **Storybook:** Run `npm run storybook`

### References

- [Jony Ive Design Philosophy](https://www.youtube.com/watch?v=4YY3MSaUqMg)
- [Dubai Brand Guidelines](https://www.dubai.ae/en/about-dubai/brand)
- [UAE AI Strategy 2031](https://u.ae/en/about-the-uae/strategies-initiatives-and-awards/strategies-plans-and-visions/innovation-and-technology/uae-strategy-for-artificial-intelligence)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated:** January 2026
**Maintained by:** mydub.ai Design Team
**Feedback:** Please submit issues or suggestions via GitHub
