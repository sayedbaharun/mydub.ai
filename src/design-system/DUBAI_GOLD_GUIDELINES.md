# Dubai Gold Color System

## Brand Philosophy

Dubai Gold (#D4AF37) is our primary brand accent, inspired by Dubai's rich heritage of gold souks, luxury, and excellence. It represents:
- **Premium quality** - Every article meets high standards
- **Trustworthiness** - Like gold, our content is valuable and reliable
- **Dubai's identity** - Connected to the city's golden reputation

## Color Palette

### Dubai Gold Scale

```css
dubai-gold-50:  #FDFBF7  /* Lightest tint */
dubai-gold-100: #FAF6ED  /* Very light */
dubai-gold-200: #F5EDD9  /* Light */
dubai-gold-300: #EBD9B3  /* Medium light */
dubai-gold-400: #DFC58D  /* Medium */
dubai-gold-500: #D4AF37  /* PRIMARY - Default Dubai Gold */
dubai-gold-600: #C09E2F  /* Medium dark */
dubai-gold-700: #A68628  /* Dark */
dubai-gold-800: #8C6E21  /* Darker */
dubai-gold-900: #6B541A  /* Darkest */
dubai-gold-950: #4D3C12  /* Ultra dark */
```

### Semantic Aliases

```css
gold:       #D4AF37  /* Same as dubai-gold-500 */
gold-light: #EBD9B3  /* Same as dubai-gold-300 */
gold-dark:  #A68628  /* Same as dubai-gold-700 */
```

## Usage Guidelines

### ✅ DO Use Dubai Gold For:

1. **Call-to-Action Buttons**
   ```jsx
   <Button className="bg-dubai-gold-500 hover:bg-dubai-gold-600 text-white">
     Subscribe Now
   </Button>
   ```

2. **Premium Features & Badges**
   ```jsx
   <Badge className="bg-dubai-gold-500 text-white">
     Premium
   </Badge>
   ```

3. **Accent Borders & Highlights**
   ```jsx
   <div className="border-l-4 border-dubai-gold-500 pl-4">
     Featured Article
   </div>
   ```

4. **Icons & Interactive Elements**
   ```jsx
   <Star className="text-dubai-gold-500 fill-dubai-gold-500" />
   ```

5. **Hover States on Cards**
   ```jsx
   <Card className="hover:border-dubai-gold-400 transition-colors">
     Content
   </Card>
   ```

6. **Active Navigation Items**
   ```jsx
   <Link className={isActive ? "text-dubai-gold-600" : "text-gray-600"}>
     News
   </Link>
   ```

### ❌ DON'T Use Dubai Gold For:

1. **Body Text** - Use gray/black instead
   ```jsx
   {/* ❌ Bad */}
   <p className="text-dubai-gold-500">Long paragraph...</p>

   {/* ✅ Good */}
   <p className="text-gray-800">Long paragraph...</p>
   ```

2. **Large Background Areas** - Too overpowering
   ```jsx
   {/* ❌ Bad */}
   <div className="bg-dubai-gold-500 min-h-screen">

   {/* ✅ Good */}
   <div className="bg-dubai-gold-50 min-h-screen">
   ```

3. **Error States** - Use red instead
   ```jsx
   {/* ❌ Bad */}
   <Alert className="bg-dubai-gold-100 border-dubai-gold-500">

   {/* ✅ Good */}
   <Alert variant="destructive">
   ```

## Component-Specific Guidelines

### Buttons

```jsx
// Primary CTA
<Button className="bg-dubai-gold-500 hover:bg-dubai-gold-600 text-white">
  Get Started
</Button>

// Secondary with outline
<Button variant="outline" className="border-dubai-gold-500 text-dubai-gold-700 hover:bg-dubai-gold-50">
  Learn More
</Button>

// Ghost variant
<Button variant="ghost" className="text-dubai-gold-600 hover:text-dubai-gold-700 hover:bg-dubai-gold-50">
  View All
</Button>
```

### Cards

```jsx
// Subtle accent
<Card className="border-dubai-gold-200 hover:border-dubai-gold-400 transition-colors">
  Content
</Card>

// Featured/Premium card
<Card className="border-2 border-dubai-gold-500 shadow-lg">
  <div className="bg-dubai-gold-50 p-4">
    Premium Content
  </div>
</Card>
```

### Badges

```jsx
// Premium badge
<Badge className="bg-dubai-gold-500 text-white">
  Premium
</Badge>

// Subtle badge
<Badge variant="outline" className="border-dubai-gold-400 text-dubai-gold-700">
  Featured
</Badge>

// Light background badge
<Badge className="bg-dubai-gold-100 text-dubai-gold-800">
  New
</Badge>
```

### Typography Accents

```jsx
// Headings with gold accent
<h2 className="text-3xl font-bold">
  <span className="text-dubai-gold-600">Dubai's</span> Latest News
</h2>

// Links
<a className="text-dubai-gold-600 hover:text-dubai-gold-700 underline">
  Read more
</a>

// Quote borders
<blockquote className="border-l-4 border-dubai-gold-500 pl-4 italic">
  Quote text
</blockquote>
```

## Accessibility

### Contrast Ratios

Always ensure sufficient contrast for text:

- **White text on Dubai Gold 500**: ✅ WCAG AA (4.6:1)
- **Dubai Gold 800 text on white**: ✅ WCAG AAA (7.2:1)
- **Dubai Gold 500 text on white**: ⚠️ AA Large only (3.1:1)

### Recommended Pairings

```css
/* Text on backgrounds */
bg-white text-dubai-gold-800      /* Best */
bg-dubai-gold-50 text-dubai-gold-900  /* Good */
bg-dubai-gold-500 text-white      /* Good */
bg-dubai-gold-700 text-white      /* Best */

/* Borders and accents */
border-dubai-gold-300             /* Subtle */
border-dubai-gold-500             /* Prominent */
border-dubai-gold-700             /* Strong */
```

## Common Patterns

### Hero Section with Gold Accent

```jsx
<section className="bg-gradient-to-br from-white via-dubai-gold-50 to-white">
  <div className="border-b-4 border-dubai-gold-500">
    <h1 className="text-5xl font-bold">
      Welcome to <span className="text-dubai-gold-600">mydub.ai</span>
    </h1>
  </div>
</section>
```

### Premium Content Indicator

```jsx
<div className="relative">
  <div className="absolute top-0 right-0">
    <Badge className="bg-dubai-gold-500 text-white">
      <Crown className="h-3 w-3 mr-1" />
      Premium
    </Badge>
  </div>
  {content}
</div>
```

### Loading States

```jsx
<div className="animate-pulse">
  <div className="h-4 bg-dubai-gold-200 rounded"></div>
  <div className="h-4 bg-dubai-gold-100 rounded mt-2"></div>
</div>
```

### Focus States

```jsx
<input className="
  border-gray-300
  focus:border-dubai-gold-500
  focus:ring-2
  focus:ring-dubai-gold-200
  focus:ring-offset-2
" />
```

## Migration Guide

### Updating Existing Components

```jsx
// Before
<Button className="bg-yellow-500 hover:bg-yellow-600">

// After
<Button className="bg-dubai-gold-500 hover:bg-dubai-gold-600">

// Before
<Card className="border-amber-300">

// After
<Card className="border-dubai-gold-300">

// Before
<Badge className="bg-gold">

// After
<Badge className="bg-dubai-gold-500">  // More specific
```

## Dark Mode Considerations

Dubai Gold works well in dark mode with adjusted shades:

```jsx
<div className="
  bg-white dark:bg-gray-900
  border-dubai-gold-300 dark:border-dubai-gold-700
  text-dubai-gold-800 dark:text-dubai-gold-200
">
  Content
</div>
```

## Testing Checklist

- [ ] Gold accents are visible but not overwhelming
- [ ] Text contrast meets WCAG AA minimum
- [ ] Hover states are clearly distinguishable
- [ ] Components work in both light and dark modes
- [ ] Gold is used consistently across similar elements
- [ ] Premium features are clearly highlighted with gold
- [ ] CTA buttons stand out with gold background

## Related Documentation

- [Design System Overview](./DESIGN_SYSTEM.md)
- [Color Theory](./COLOR_THEORY.md)
- [Component Library](../shared/components/README.md)
- [Accessibility Guidelines](./ACCESSIBILITY.md)
