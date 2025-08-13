import { LanguageOption } from '@/shared/types'

export const APP_NAME = 'MyDub.AI'
export const APP_VERSION = '1.0.0'

// Language configurations
export const LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    rtl: false,
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇦🇪',
    rtl: true,
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    rtl: false,
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    flag: '🇵🇰',
    rtl: true,
  },
]

// Default language
export const DEFAULT_LANGUAGE = 'en'

// API endpoints (to be configured later)
export const API_ENDPOINTS = {
  DUBAI_OPEN_DATA: process.env.VITE_DUBAI_OPEN_DATA_API || '',
  GULF_NEWS: process.env.VITE_GULF_NEWS_API || '',
  KHALEEJ_TIMES: process.env.VITE_KHALEEJ_TIMES_API || '',
}

// Content categories
export const CONTENT_CATEGORIES = {
  government: {
    label: 'Government Updates',
    icon: 'Building',
    color: 'violet',
  },
  news: {
    label: 'News',
    icon: 'Newspaper',
    color: 'blue',
  },
  tourism: {
    label: 'Tourism',
    icon: 'MapPin',
    color: 'green',
  },
  events: {
    label: 'Events',
    icon: 'Calendar',
    color: 'orange',
  },
  traffic: {
    label: 'Traffic',
    icon: 'Car',
    color: 'red',
  },
  weather: {
    label: 'Weather',
    icon: 'Cloud',
    color: 'sky',
  },
}

// User types
export const USER_TYPES = [
  { value: 'resident', label: 'Dubai Resident' },
  { value: 'tourist', label: 'Tourist' },
  { value: 'business', label: 'Business Visitor' },
]

// Interest categories for onboarding
export const INTEREST_CATEGORIES = [
  { id: 'government', label: 'Government Services', icon: 'Building' },
  { id: 'news', label: 'Local News', icon: 'Newspaper' },
  { id: 'events', label: 'Events & Activities', icon: 'Calendar' },
  { id: 'dining', label: 'Dining & Restaurants', icon: 'Utensils' },
  { id: 'shopping', label: 'Shopping', icon: 'ShoppingBag' },
  { id: 'attractions', label: 'Tourist Attractions', icon: 'Camera' },
  { id: 'transport', label: 'Transportation', icon: 'Train' },
  { id: 'business', label: 'Business & Trade', icon: 'Briefcase' },
]

// Dubai districts for preferences
export const DUBAI_DISTRICTS = [
  'Downtown Dubai',
  'Dubai Marina',
  'Jumeirah',
  'Business Bay',
  'Deira',
  'Bur Dubai',
  'Al Barsha',
  'Dubai Silicon Oasis',
  'Dubai Sports City',
  'JBR (Jumeirah Beach Residence)',
  'Palm Jumeirah',
  'Dubai Creek Harbour',
]

// Chatbot personas
export const CHATBOT_PERSONAS = [
  {
    id: 'guide',
    name: 'Friendly Guide',
    avatar: '/avatars/guide.png',
    description: 'Your helpful companion for general queries',
    personality: 'friendly, helpful, informative',
  },
  {
    id: 'culture',
    name: 'Culture Expert',
    avatar: '/avatars/culture.png',
    description: 'Expert in Dubai traditions and etiquette',
    personality: 'knowledgeable, respectful, cultural',
  },
  {
    id: 'business',
    name: 'Business Advisor',
    avatar: '/avatars/business.png',
    description: 'Professional guidance for business matters',
    personality: 'professional, efficient, detailed',
  },
  {
    id: 'tourist',
    name: 'Tourist Buddy',
    avatar: '/avatars/tourist.png',
    description: 'Your fun guide to Dubai attractions',
    personality: 'enthusiastic, fun, adventurous',
  },
]