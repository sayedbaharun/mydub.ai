# mydub.ai Typography System

> Signature typography inspired by Jony Ive's minimalist philosophy - clean, purposeful, and elegant.

**Version:** 1.0.0
**Last Updated:** January 2026

---

## Philosophy

**"Simplicity is the ultimate sophistication."** - Leonardo da Vinci

Our typography system embodies three core principles:

1. **Light & Airy** - Generous line heights, light font weights
2. **Readable** - Optimized for long-form content, careful letter spacing
3. **Hierarchical** - Clear visual distinction between content levels

---

## Table of Contents

1. [Font Families](#font-families)
2. [Type Scale](#type-scale)
3. [Display Typography](#display-typography)
4. [Editorial Typography](#editorial-typography)
5. [Body Text](#body-text)
6. [UI Typography](#ui-typography)
7. [Utility Classes](#utility-classes)
8. [Responsive Typography](#responsive-typography)
9. [Accessibility](#accessibility)
10. [Best Practices](#best-practices)
11. [Examples](#examples)

---

## Font Families

### System Font Stack

We use the native system font stack for optimal performance and familiar reading experience.

```css
/* Default sans-serif */
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display',
             'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif;
```

### Specialized Stacks

#### Display (Headlines)
For large, impactful headlines with perfect letter spacing.

```tsx
className="font-display"
// SF Pro Display, -apple-system, BlinkMacSystemFont, Helvetica Neue, sans-serif
```

#### Body (Reading)
Optimized for long-form reading with better legibility.

```tsx
className="font-body"
// SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif
```

---

## Type Scale

Our type scale uses precise sizing with integrated line heights and letter spacing.

### Scale Reference

| Class | Size | Line Height | Letter Spacing | Use Case |
|-------|------|-------------|----------------|----------|
| `text-xs` | 12px | 16px | 0.01em | Labels, metadata |
| `text-sm` | 14px | 20px | 0.005em | Secondary text, captions |
| `text-base` | 16px | 26px | 0 | Body text (default) |
| `text-lg` | 18px | 28px | 0 | Large body, intro paragraphs |
| `text-xl` | 20px | 30px | -0.01em | Subheadings |
| `text-2xl` | 24px | 32px | -0.015em | Section headers |
| `text-3xl` | 30px | 38px | -0.02em | Page headers |
| `text-4xl` | 36px | 44px | -0.025em | Featured headers |
| `text-5xl` | 48px | 56px | -0.03em | Hero headlines |
| `text-6xl` | 60px | 68px | -0.035em | Display headlines |
| `text-7xl` | 72px | 80px | -0.04em | Hero display |

### Key Insights

- **Tighter tracking for large text** - Negative letter spacing above 20px
- **Relaxed line height** - 1.625 for body text (optimal readability)
- **Integrated sizing** - Line height and spacing included in each class

---

## Display Typography

### Hero Display

The largest, most impactful text on the page.

```tsx
<h1 className="text-display-hero">
  MYDUB.AI
</h1>

// Compiled: text-7xl font-light tracking-tighter leading-none
// 72px, font-weight: 300, letter-spacing: -0.04em, line-height: 1
```

**When to use:**
- Landing page hero sections
- Brand statements
- Major announcements

**Don't use for:**
- Regular page titles
- Body content
- UI elements

### Display Levels

```tsx
// Display 1 - Large page headers
<h1 className="text-display-1">Dubai Announces AI Strategy</h1>
// 60px, font-weight: 300, tight tracking

// Display 2 - Section headers
<h2 className="text-display-2">Featured Stories</h2>
// 48px, font-weight: 300, tight tracking

// Display 3 - Subsection headers
<h3 className="text-display-3">Breaking News</h3>
// 36px, font-weight: 300, tight tracking
```

---

## Editorial Typography

### Headlines

Optimized for article titles and editorial content.

```tsx
// Headline 1 - Main article title
<h1 className="text-headline-1">
  Dubai's New AI Charter Sets Global Standard
</h1>
// 30px, font-weight: 300, tight tracking, midnight-black

// Headline 2 - Section titles
<h2 className="text-headline-2">
  What This Means for Businesses
</h2>
// 24px, font-weight: 300, tight tracking, midnight-black

// Headline 3 - Subsection titles
<h3 className="text-headline-3">
  Key Takeaways
</h3>
// 20px, font-weight: 500, tight tracking, midnight-black
```

### Usage Guidelines

**Headline 1:**
- Article page titles
- Featured card titles
- One per page maximum

**Headline 2:**
- Section headers within articles
- Card titles in featured layouts
- Multiple allowed per page

**Headline 3:**
- Subsection headers
- Card titles in standard layouts
- List section headers

---

## Body Text

### Body Variants

```tsx
// Large Body - Introduction paragraphs
<p className="text-body-large">
  Dubai has unveiled its comprehensive AI strategy...
</p>
// 18px, font-weight: 400, relaxed line-height, gray-800

// Standard Body - Default content
<p className="text-body">
  The strategy outlines 12 key principles that will guide...
</p>
// 16px, font-weight: 400, relaxed line-height (1.625), gray-800

// Small Body - Secondary content
<p className="text-body-small">
  Published on January 15, 2026
</p>
// 14px, font-weight: 400, normal line-height, gray-600
```

### Long-Form Article Content

Use the `prose-mydub` class for automatic article styling:

```tsx
<article className="prose-mydub max-w-4xl mx-auto">
  <h1>Article Title</h1>
  <p>First paragraph with proper spacing...</p>
  <h2>Section Header</h2>
  <p>More content with <strong>emphasis</strong> and <a href="#">links</a>.</p>
</article>
```

**Automatically styled:**
- ✅ Headings (h1, h2, h3)
- ✅ Paragraphs with mb-4 spacing
- ✅ Links with hover effects
- ✅ Strong and emphasis tags
- ✅ Proper vertical rhythm

---

## UI Typography

### UI Text Variants

```tsx
// Large UI - Primary buttons, important UI
<button className="text-ui-large">
  Get Started
</button>
// 16px, font-weight: 500, tracking: 0.025em

// Standard UI - Buttons, tabs, navigation
<button className="text-ui">
  Learn More
</button>
// 14px, font-weight: 500, tracking: 0.025em

// Small UI - Labels, badges, metadata
<span className="text-ui-small">
  NEW
</span>
// 12px, font-weight: 500, uppercase, tracking: 0.05em
```

### Captions & Labels

```tsx
// Caption - Image captions, footnotes
<figcaption className="text-caption">
  Dubai skyline at sunset, January 2026
</figcaption>
// 12px, font-weight: 400, gray-500

// Bold Caption - Section labels, metadata headers
<label className="text-caption-bold">
  PUBLISHED
</label>
// 12px, font-weight: 600, uppercase, tracking: 0.025em, gray-700
```

---

## Utility Classes

### Emphasis

```tsx
// Medium emphasis with Dubai Gold
<span className="text-emphasis">
  Premium content
</span>
// font-weight: 500, color: dubai-gold-700

// Strong emphasis
<span className="text-emphasis-strong">
  Featured article
</span>
// font-weight: 600, color: dubai-gold-800
```

### Links

```tsx
// Standard link with hover transition
<a href="#" className="text-link">
  Read more
</a>
// color: ai-blue, hover: dubai-gold-600, transition: 200ms
```

### Font Weights

```tsx
.font-light      // 300 - Headlines, large text
.font-normal     // 400 - Body text, default
.font-medium     // 500 - Subheadings, emphasis
.font-semibold   // 600 - Strong emphasis, buttons
.font-bold       // 700 - Very rare use
```

### Letter Spacing

```tsx
.tracking-tighter  // -0.04em - Hero text (72px+)
.tracking-tight    // -0.025em - Display text (36-60px)
.tracking-normal   // 0 - Body text (16-20px)
.tracking-wide     // 0.025em - UI elements, buttons
.tracking-wider    // 0.05em - Small caps, labels
```

### Line Heights

```tsx
.leading-tight     // 1.25 - Headlines, tight layouts
.leading-snug      // 1.375 - Subheadings
.leading-normal    // 1.5 - UI text
.leading-relaxed   // 1.625 - Body text (optimal for reading)
.leading-loose     // 2 - Spaced out content
```

---

## Responsive Typography

### Mobile Adaptations

Large display text automatically scales down on mobile:

```css
/* Desktop */
.text-display-hero { font-size: 4.5rem; }  /* 72px */

/* Mobile (<640px) */
.text-display-hero { font-size: 3rem; }    /* 48px */
```

### Best Practices

```tsx
// ✅ GOOD - Responsive scale
<h1 className="text-4xl md:text-5xl lg:text-6xl">
  Scalable Headline
</h1>

// ✅ GOOD - Mobile-first with custom sizes
<p className="text-base md:text-lg">
  Paragraph that grows on larger screens
</p>

// ❌ AVOID - Fixed large sizes on mobile
<h1 className="text-6xl">
  Too Large on Mobile
</h1>
```

### Breakpoint Strategy

```tsx
// Mobile first approach
className="
  text-2xl          // Mobile (0-640px): 24px
  sm:text-3xl       // Small (640px+): 30px
  md:text-4xl       // Medium (768px+): 36px
  lg:text-5xl       // Large (1024px+): 48px
"
```

---

## Accessibility

### Color Contrast

All text must meet **WCAG AA standards**:

- **Normal text (16px):** 4.5:1 minimum
- **Large text (18px+):** 3:1 minimum

**Our Compliance:**
- ✅ Midnight Black on White: 21:1 (Perfect)
- ✅ Gray-800 on White: 7:1 (Excellent)
- ✅ Gray-600 on White: 4.6:1 (AA compliant)
- ✅ Dubai Gold 700 on White: 4.8:1 (AA compliant)

### Font Size Minimums

```tsx
// ✅ GOOD - Readable minimum size
.text-sm  // 14px - Still readable

// ⚠️ CAUTION - Use sparingly
.text-xs  // 12px - Only for metadata/labels

// ❌ AVOID - Too small
font-size: 10px  // Not accessible
```

### Line Length

Optimal reading: **60-80 characters per line**

```tsx
// ✅ GOOD - Constrained width
<article className="max-w-4xl">
  <p className="text-body">
    Proper line length ensures comfortable reading...
  </p>
</article>

// ❌ AVOID - Full width on large screens
<p className="w-full text-body">
  This line is way too long on desktop and hurts readability...
</p>
```

### Focus States

```tsx
// Always provide visible focus for keyboard navigation
<a href="#" className="text-link focus:ring-2 focus:ring-dubai-gold-500">
  Accessible link
</a>
```

---

## Best Practices

### DO:

✅ **Use light font weights for large text**
```tsx
<h1 className="text-6xl font-light">Hero Headline</h1>
```

✅ **Apply tight letter spacing to headlines**
```tsx
<h2 className="text-4xl tracking-tight">Article Title</h2>
```

✅ **Use relaxed line height for body text**
```tsx
<p className="text-base leading-relaxed">Body content...</p>
```

✅ **Limit line length for readability**
```tsx
<div className="max-w-4xl">
  <p className="text-body">Article content...</p>
</div>
```

✅ **Use semantic HTML**
```tsx
<h1>Page Title</h1>
<h2>Section Title</h2>
<p>Paragraph text</p>
```

### DON'T:

❌ **Use bold weights for large headlines**
```tsx
// Too heavy
<h1 className="text-6xl font-bold">Heavy Headline</h1>
```

❌ **Cram text together**
```tsx
// Too tight
<p className="leading-tight">Cramped paragraph...</p>
```

❌ **Mix too many font sizes**
```tsx
// Visual chaos
<div>
  <span className="text-4xl">Big</span>
  <span className="text-sm">Small</span>
  <span className="text-2xl">Medium</span>
</div>
```

❌ **Use all caps excessively**
```tsx
// Hard to read
<p className="uppercase">ENTIRE PARAGRAPH IN CAPS IS DIFFICULT TO READ</p>
```

❌ **Ignore mobile scaling**
```tsx
// Too large on mobile
<h1 className="text-7xl">Not Responsive</h1>
```

---

## Examples

### Homepage Hero

```tsx
<section className="bg-gradient-to-br from-midnight-black to-gray-900 text-white py-20">
  <div className="max-w-6xl mx-auto px-6">
    <h1 className="text-display-hero mb-4 bg-gradient-to-r from-dubai-gold-500 to-dubai-gold-300 bg-clip-text text-transparent">
      MYDUB.AI
    </h1>
    <p className="text-body-large text-pearl-white/90 max-w-2xl">
      Dubai's first AI-powered news channel, delivering intelligent insights with radical transparency.
    </p>
  </div>
</section>
```

### Article Header

```tsx
<article className="max-w-4xl mx-auto px-6 py-12">
  <div className="mb-8">
    <span className="text-caption-bold text-dubai-gold-700">
      TECHNOLOGY
    </span>
    <h1 className="text-headline-1 mt-2 mb-4">
      Dubai Announces Comprehensive AI Strategy for 2026
    </h1>
    <p className="text-body-large text-gray-600">
      The emirate unveils 12 key principles that will guide AI development across government and private sectors.
    </p>
  </div>

  <div className="flex items-center gap-4 text-caption border-t border-gray-200 pt-4">
    <span>By Sarah Al Mazrouei</span>
    <span>•</span>
    <time>2 hours ago</time>
    <span>•</span>
    <span>5 min read</span>
  </div>
</article>
```

### Intelligence Card Title

```tsx
<div className="p-6">
  <span className="text-ui-small text-dubai-gold-600 mb-2 block">
    BREAKING
  </span>
  <h3 className="text-headline-2 mb-3">
    New Metro Line Opens Connecting Business Bay to Dubai Marina
  </h3>
  <p className="text-body-small text-gray-500">
    The expansion adds 15 new stations and reduces commute times by 40%...
  </p>
</div>
```

### Button Typography

```tsx
<button className="bg-dubai-gold-500 hover:bg-dubai-gold-600 px-6 py-3 rounded-xl transition-colors">
  <span className="text-ui-large text-white">
    Read More
  </span>
</button>

<button className="border border-gray-300 hover:border-dubai-gold-500 px-4 py-2 rounded-lg transition-colors">
  <span className="text-ui text-gray-700">
    Share Article
  </span>
</button>
```

### Long-Form Article

```tsx
<article className="prose-mydub max-w-4xl mx-auto px-6 py-12">
  <h1>The Future of AI in Dubai</h1>

  <p>
    Dubai has long been at the forefront of technological innovation in the Middle East.
    The emirate's latest AI strategy continues this tradition, setting ambitious goals
    for 2026 and beyond.
  </p>

  <h2>Key Objectives</h2>

  <p>
    The strategy focuses on three main pillars: <strong>transparency</strong>,
    <strong>innovation</strong>, and <strong>sustainability</strong>. Each pillar
    addresses specific challenges while maintaining alignment with
    <a href="/uae-vision-2031">UAE Vision 2031</a>.
  </p>

  <h3>1. Radical Transparency</h3>

  <p>
    AI systems must be explainable and accountable. The new charter requires all
    AI-generated content to display confidence scores and source attribution.
  </p>
</article>
```

### Metadata Display

```tsx
<div className="flex items-center gap-3 text-caption">
  <div className="flex items-center gap-1">
    <Eye className="h-3 w-3" />
    <span>12,453 views</span>
  </div>
  <span>•</span>
  <div className="flex items-center gap-1">
    <Sparkles className="h-3 w-3 text-purple-600" />
    <span>47 sources</span>
  </div>
  <span>•</span>
  <div className="flex items-center gap-1">
    <Badge className="text-caption-bold bg-green-100 text-green-700">
      94% CONFIDENCE
    </Badge>
  </div>
</div>
```

---

## Typography Checklist

Before publishing, ensure:

- [ ] Headlines use light font weights (300-400)
- [ ] Body text has relaxed line height (1.625)
- [ ] Large text has tight letter spacing (negative)
- [ ] Line length is 60-80 characters
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Minimum font size is 14px (12px for labels only)
- [ ] Semantic HTML is used (h1, h2, p)
- [ ] Responsive scaling applied to large text
- [ ] Focus states visible for keyboard navigation
- [ ] Text hierarchy is clear and logical

---

## Resources

- **Tailwind Config:** `/tailwind.config.js`
- **CSS Classes:** `/src/app/styles/index.css`
- **Design System:** `/src/design-system/DESIGN_SYSTEM.md`
- **Storybook:** Run `npm run storybook`

---

**Last Updated:** January 2026
**Maintained by:** mydub.ai Design Team
**Questions:** design-system@mydub.ai
