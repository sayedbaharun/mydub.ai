/**
 * Category Formatter Utility
 * Provides fallback formatting for category names when translations are missing
 */

import { TFunction } from 'i18next'

/**
 * Format a category slug into a readable name
 * Converts "real_estate" → "Real Estate", "government" → "Government"
 */
export function formatCategorySlug(category: string): string {
  if (!category) return 'Uncategorized'

  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get category display name with fallback
 * First tries i18n translation, then falls back to formatted slug
 *
 * @param category - Category slug (e.g., "real_estate", "government")
 * @param t - i18next translation function
 * @returns Translated or formatted category name
 *
 * @example
 * getCategoryName('real_estate', t) → "Real Estate & Property" (if translated)
 * getCategoryName('unknown_category', t) → "Unknown Category" (fallback)
 */
export function getCategoryName(category: string | undefined, t: TFunction): string {
  if (!category) return t('news.category.uncategorized', 'Uncategorized')

  // Normalize category to lowercase and replace spaces with underscores
  const normalizedCategory = category.toLowerCase().trim().replace(/\s+/g, '_')

  // Try to get translation
  const translationKey = `news.category.${normalizedCategory}`
  const translated = t(translationKey)

  // If translation key is returned as-is, it means translation doesn't exist
  // Fall back to formatted version
  if (translated === translationKey) {
    return formatCategorySlug(normalizedCategory)
  }

  return translated
}

/**
 * Get category slug from display name
 * Converts "Real Estate & Property" → "real_estate"
 * Useful for reverse lookups
 */
export function getCategorySlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[&\/]/g, '')
    .replace(/\s+/g, '_')
    .trim()
}

/**
 * Common category mappings for quick reference
 * Maps various input formats to standardized category slugs
 */
export const CATEGORY_MAPPINGS: Record<string, string> = {
  // Standard slugs
  'government': 'government',
  'real_estate': 'real_estate',
  'tourism': 'tourism',
  'business': 'business',
  'lifestyle': 'lifestyle',
  'transportation': 'transportation',
  'weather': 'weather',
  'news': 'news',
  'technology': 'technology',
  'sports': 'sports',
  'entertainment': 'entertainment',

  // Alternative formats
  'real estate': 'real_estate',
  'realestate': 'real_estate',
  'govt': 'government',
  'gov': 'government',
  'transport': 'transportation',
  'tech': 'technology',
  'biz': 'business',

  // With descriptors
  'government & policy': 'government',
  'real estate & property': 'real_estate',
  'tourism & events': 'tourism',
  'business & economy': 'business',
  'lifestyle & culture': 'lifestyle',
  'weather & environment': 'weather',
}

/**
 * Normalize category input to standard slug
 * Handles various input formats and returns standardized slug
 */
export function normalizeCategoryInput(input: string): string {
  const normalized = input.toLowerCase().trim()
  return CATEGORY_MAPPINGS[normalized] || getCategorySlug(input)
}
