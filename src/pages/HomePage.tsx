import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { IntelligenceCard } from '@/shared/components/ui/intelligence-card'
import {
  Calendar,
  Video,
  Brain,
  Mail,
  ArrowRight,
  Search,
  Clock,
  Star,
  Thermometer,
  Wind,
  Play,
  Heart,
  MessageSquare,
  Phone,
  Send,
} from 'lucide-react'
import { NewsService } from '@/features/news/services/news.service'
import { NewsArticle } from '@/features/news/types'
import { ArabicPhrasesService, ArabicPhrase } from '@/shared/services/arabicPhrases.service'
import { ExternalAPIsService } from '@/shared/services/external-apis'
import { NewsletterService } from '@/shared/services/newsletter.service'
import { useTranslation } from 'react-i18next'
import { getCategoryName } from '@/shared/utils/categoryFormatter'
import { toast } from 'sonner'
import { useStructuredData } from '@/hooks/useStructuredData'

interface CategoryCardProps {
  title: string
  description: string
  image: string
  href: string
  emoji: string
  badge?: string
  size?: 'default' | 'large' | 'featured'
}

function CategoryCard({
  title,
  description,
  image,
  href,
  emoji,
  badge,
  size = 'default',
}: CategoryCardProps) {
  return (
    <Link to={href} className="group block">
      <Card
        className={`overflow-hidden border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:opacity-95 ${
          size === 'featured'
            ? 'md:col-span-2 md:row-span-2'
            : size === 'large'
              ? 'md:col-span-2'
              : ''
        }`}
      >
        <div className="relative">
          <div
            className={`relative overflow-hidden ${
              size === 'featured' ? 'h-64' : size === 'large' ? 'h-48' : 'h-48'
            }`}
          >
            <img src={image} alt={title} className="h-full w-full object-cover" />

            {/* Play button for video content - minimal */}
            {title.includes('Video') && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-white/90 p-3 backdrop-blur">
                  <Play className="h-6 w-6 text-gray-900" />
                </div>
              </div>
            )}
          </div>

          <CardContent className="p-6">
            <h3 className="mb-2 text-lg font-medium tracking-tight text-midnight-black">{title}</h3>
            <p className="text-sm leading-relaxed text-gray-500">{description}</p>
          </CardContent>
        </div>
      </Card>
    </Link>
  )
}

export default function HomePage() {
  const { t } = useTranslation('common')
  const [currentTime, setCurrentTime] = useState('')
  
  // Add structured data for SEO
  useStructuredData('home')
  const [featuredArticles, setFeaturedArticles] = useState<NewsArticle[]>([])
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [dailyArabicPhrase, setDailyArabicPhrase] = useState<ArabicPhrase | null>(null)
  const [weatherData, setWeatherData] = useState({
    temp: 40,  // display temp (defaults)
    tempC: 40, // raw Celsius for unit conversion
    condition: 'Sunny',
    humidity: 65,
    wind: 12, // km/h by default
    loading: true,
  })
  const [exchangeRates, setExchangeRates] = useState({
    EUR: 3.98,  // 1 EUR = AED
    GBP: 4.67,  // 1 GBP = AED
    INR: 0.044, // 1 INR = AED
    USD: 3.673, // 1 USD = AED (pegged)
    loading: true,
  })
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C')
  const [weatherUpdatedAt, setWeatherUpdatedAt] = useState<number | null>(null)
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<number | null>(null)
  
  // Newsletter form state
  const [newsletterName, setNewsletterName] = useState('')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [honeypot, setHoneypot] = useState('') // Honeypot field for spam protection

  useEffect(() => {
    const updateTime = () => {
      // Dubai timezone is GMT+4
      const dubaiTime = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Dubai',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
      })
      setCurrentTime(dubaiTime)
    }

    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  // Load real weather data
  useEffect(() => {
    const loadWeatherData = async () => {
      try {
        // Use shared service which handles fallbacks and caching
        const data = await ExternalAPIsService.fetchWeatherData()
        if (data && !data.error) {
          const tempC = Math.round(data.main?.temp ?? 0)
          setWeatherData(prev => ({
            ...prev,
            temp: tempUnit === 'C' ? tempC : Math.round((tempC * 9) / 5 + 32),
            tempC,
            condition: data.weather?.[0]?.main || 'Clear',
            humidity: data.main?.humidity ?? 50,
            wind: Math.round(((data.wind?.speed ?? 3.5) * 3.6)), // m/s -> km/h
            loading: false,
          }))
          setWeatherUpdatedAt(data.dt ? data.dt * 1000 : Date.now())
        } else {
          // Fallback to realistic Dubai weather (August)
          const currentMonth = new Date().getMonth(); // 0-11
          const isWinter = currentMonth >= 10 || currentMonth <= 2; // Nov-Feb
          const isSummer = currentMonth >= 5 && currentMonth <= 8; // Jun-Sep

          const fallbackC = isSummer ? Math.floor(Math.random() * 5) + 38 : // 38-43°C in summer
                            isWinter ? Math.floor(Math.random() * 5) + 22 : // 22-27°C in winter
                            Math.floor(Math.random() * 5) + 28 // 28-33°C in spring/fall
          setWeatherData(prev => ({
            ...prev,
            temp: tempUnit === 'C' ? fallbackC : Math.round((fallbackC * 9) / 5 + 32),
            tempC: fallbackC,
            condition: isSummer ? 'Sunny' : 'Clear',
            humidity: isSummer ? 65 : 50,
            wind: 12,
            loading: false,
          }))
          setWeatherUpdatedAt(Date.now())
        }
      } catch (error) {
        console.error('Error loading weather:', error)
        // Use realistic fallback
        const currentMonth = new Date().getMonth();
        const isSummer = currentMonth >= 5 && currentMonth <= 8;

        const fallbackC2 = isSummer ? 40 : 28
        setWeatherData(prev => ({
          ...prev,
          temp: tempUnit === 'C' ? fallbackC2 : Math.round((fallbackC2 * 9) / 5 + 32),
          tempC: fallbackC2,
          condition: 'Clear',
          humidity: isSummer ? 65 : 50,
          wind: 12,
          loading: false,
        }))
        setWeatherUpdatedAt(Date.now())
      }
    }

    loadWeatherData()
    // Update weather every 10 minutes
    const weatherInterval = setInterval(loadWeatherData, 600000)
    return () => clearInterval(weatherInterval)
  }, [])

  // Recompute displayed temperature when unit changes
  useEffect(() => {
    setWeatherData(prev => ({
      ...prev,
      temp: tempUnit === 'C' ? prev.tempC : Math.round((prev.tempC * 9) / 5 + 32),
    }))
  }, [tempUnit])

  // Load exchange rates from Fixer.io API
  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        // Get real-time exchange rates from Fixer.io API
        const rates = await ExternalAPIsService.fetchExchangeRates()
        
        if (rates && !rates.error) {
          setExchangeRates({
            EUR: rates.EUR || 3.98,
            GBP: rates.GBP || 4.67,
            INR: rates.INR || 0.044,
            USD: rates.USD || 3.673,
            loading: false,
          })
        } else {
          // Use current fallback rates if API fails (Aug 2024)
          setExchangeRates({
            EUR: 3.98,  // 1 EUR = 3.98 AED
            GBP: 4.67,  // 1 GBP = 4.67 AED
            INR: 0.044, // 1 INR = 0.044 AED
            USD: 3.673, // 1 USD = 3.673 AED (pegged)
            loading: false,
          })
        }
      } catch (error) {
        console.error('Error loading exchange rates:', error)
        // Use realistic fallback rates
        setExchangeRates({
          EUR: 3.98,
          GBP: 4.67,
          INR: 0.044,
          USD: 3.673,
          loading: false,
        })
      }
    }

    loadExchangeRates()
    // Update rates every hour
    const ratesInterval = setInterval(loadExchangeRates, 3600000)
    return () => clearInterval(ratesInterval)
  }, [])

  // Load featured articles for the homepage
  useEffect(() => {
    const loadFeaturedArticles = async () => {
      try {
        setLoadingArticles(true)
        // Get all articles without category filter to show your test articles
        const articles = await NewsService.getArticles({
          sources: [],
          categories: [], // Empty array means all categories
          dateRange: { start: null, end: null },
          search: '',
        })
        setFeaturedArticles(articles.slice(0, 6)) // Get first 6 articles
      } catch (error) {
        console.error('Error loading featured articles:', error)
      } finally {
        setLoadingArticles(false)
      }
    }

    loadFeaturedArticles()
  }, [])

  // Load daily Arabic phrase
  useEffect(() => {
    const loadDailyPhrase = async () => {
      try {
        const phrase = await ArabicPhrasesService.getDailyPhrase()
        setDailyArabicPhrase(phrase)
      } catch (error) {
        console.error('Error loading daily Arabic phrase:', error)
      }
    }

    loadDailyPhrase()
  }, [])

  const todayHighlights = [
    'Global Village Season 28 now open',
    'Dubai Shopping Festival continues',
    'New waterfront dining at Bluewaters',
    'F1 practice sessions this weekend',
  ]

  const aiPicks = [
    { type: 'Restaurant', name: 'Nobu Dubai', area: 'Atlantis' },
    { type: 'Event', name: 'Sunset Yacht Party', area: 'Marina' },
    { type: 'Secret', name: 'Hidden Speakeasy', area: 'DIFC' },
  ]
  
  // Handle newsletter signup
  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check honeypot field - if filled, it's likely a bot
    if (honeypot) {
      // Silently reject spam submissions
      toast.success('Thank you for subscribing!')
      setNewsletterName('')
      setNewsletterEmail('')
      return
    }
    
    if (!newsletterName || !newsletterEmail) {
      toast.error('Please fill in all fields')
      return
    }
    
    setNewsletterLoading(true)
    
    try {
      const result = await NewsletterService.subscribe({
        name: newsletterName,
        email: newsletterEmail,
        language: 'en'
      })
      
      if (result.success) {
        toast.success(result.message)
        setNewsletterName('')
        setNewsletterEmail('')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.')
    } finally {
      setNewsletterLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-midnight-black via-gray-900 to-midnight-black text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512632578888-169bbbc64f33')] bg-cover bg-center opacity-20"></div>

        <div className="relative w-full py-12 sm:py-16 lg:py-20">
          <div className="grid w-full grid-cols-1 items-center gap-6 px-4 sm:gap-8 sm:px-6 lg:grid-cols-3 lg:px-12 xl:px-16">
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
                <span className="font-medium text-green-400">{t('home.hero.liveInDubai')} • {currentTime}</span>
              </div>

              <h1 className="mb-4 text-3xl font-bold tracking-tight sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                <span className="bg-gradient-to-r from-desert-gold via-amber-400 to-desert-gold bg-clip-text text-transparent">
                  MYDUB.AI
                </span>
              </h1>

              <p className="mb-2 text-lg font-light text-pearl-white/90 sm:text-xl md:text-2xl">
                {t('home.hero.tagline')}
              </p>
              <p className="mb-6 max-w-2xl text-sm text-pearl-white/70 sm:mb-8 sm:text-base md:text-lg">
                {t('home.hero.description')}
              </p>

              {/* AI Search Bar */}
              <div className="relative mb-6 w-full max-w-2xl sm:mb-8">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder={t('home.hero.searchPlaceholder')}
                  className="h-12 w-full rounded-xl border-white/30 bg-white/15 pl-12 pr-20 text-sm text-white backdrop-blur-sm transition-all duration-200 placeholder:text-gray-300 focus:border-white/50 focus:bg-white/25 sm:h-14 sm:text-lg"
                />
                <Link to="/chat">
                  <Button className="absolute right-2 top-2 h-8 rounded-lg bg-ai-blue text-xs text-white transition-all duration-200 hover:bg-ai-blue/90 sm:h-10 sm:text-sm">
                    <Brain className="mr-2 h-4 w-4" />
                    {t('home.hero.askAyyan')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Smart Info Cards */}
            <div className="hidden space-y-4 lg:block">
              {/* Live Dubai Card */}
              <Card className="border-white/20 bg-white/10 backdrop-blur">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
                    <h3 className="text-sm font-medium text-white">{t('home.widgets.liveDubai')}</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">{t('home.widgets.weather')}</span>
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-3 w-3 text-desert-gold" />
                        <span className="font-medium text-white">
                          {weatherData.loading ? '...' : `${weatherData.temp}°${tempUnit}`}
                        </span>
                        <button
                          onClick={() => setTempUnit(tempUnit === 'C' ? 'F' : 'C')}
                          className="ml-2 rounded bg-white/20 px-2 py-0.5 text-xs text-white hover:bg-white/30"
                          aria-label="Toggle temperature unit"
                        >
                          °{tempUnit === 'C' ? 'F' : 'C'}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">{t('home.widgets.traffic')}</span>
                      <span className="text-sm font-medium text-green-400">{t('home.widgets.clear')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">{t('home.widgets.time')}</span>
                      <span className="font-medium text-white">{currentTime}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exchange Rates Card */}
              <Card className="border-white/20 bg-white/10 backdrop-blur">
                <CardContent className="p-4">
                  <h3 className="mb-3 text-sm font-medium text-white">{t('home.widgets.exchangeRates')}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-white/70">🇺🇸 USD</span>
                      <span className="font-medium text-white">
                        {exchangeRates.loading ? '...' : exchangeRates.USD.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-white/70">🇪🇺 EUR</span>
                      <span className="font-medium text-white">
                        {exchangeRates.loading ? '...' : exchangeRates.EUR.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-white/70">🇬🇧 GBP</span>
                      <span className="font-medium text-white">
                        {exchangeRates.loading ? '...' : exchangeRates.GBP.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-white/70">🇮🇳 INR</span>
                      <span className="font-medium text-white">
                        {exchangeRates.loading ? '...' : exchangeRates.INR.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Culture Card */}
              <Link to="/arabic-learning" className="block">
                <Card className="cursor-pointer border-white/20 bg-white/10 backdrop-blur transition-all duration-200 hover:bg-white/15">
                  <CardContent className="p-4">
                    <h3 className="mb-3 text-sm font-medium text-white">{t('home.widgets.todaysArabic')}</h3>
                    {dailyArabicPhrase ? (
                      <div className="space-y-2 text-center">
                        <div className="text-lg font-medium text-white" dir="rtl">
                          {dailyArabicPhrase.arabic_text}
                        </div>
                        <div className="text-xs text-white/80">
                          "{dailyArabicPhrase.pronunciation}" - {dailyArabicPhrase.english_text}
                        </div>
                        <div className="mt-2 text-xs text-white/60">
                          Category: {dailyArabicPhrase.category} • Level:{' '}
                          {dailyArabicPhrase.difficulty}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-center">
                        <div className="text-lg font-medium text-white" dir="rtl">
                          مرحبا
                        </div>
                        <div className="text-xs text-white/80">"Marhaba" - Hello</div>
                        <div className="mt-2 text-xs text-white/60">Basic greeting</div>
                      </div>
                    )}
                    <div className="mt-3 text-center text-xs text-white/60">
                      {t('home.widgets.clickToExplore')}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl space-y-20 px-4 py-12 sm:space-y-24 sm:px-6 sm:py-16">
        {/* Live Articles Section */}
        <section>
          <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-12 sm:flex-row sm:items-center">
            <div className="relative">
              {/* Dubai Gold accent line */}
              <div className="absolute -left-6 top-0 h-full w-1 bg-gradient-to-b from-dubai-gold-500 to-dubai-gold-300" />
              <h2 className="mb-2 text-2xl font-light tracking-tight text-midnight-black sm:text-3xl lg:text-4xl">
                {t('home.sections.todayInDubai')}
              </h2>
              <p className="text-base text-gray-500">{t('home.sections.latestArticles')}</p>
            </div>
            <Link to="/news">
              <Button
                variant="outline"
                className="self-start border-ai-blue text-sm text-ai-blue hover:bg-ai-blue hover:text-white sm:self-auto sm:text-base"
              >
                {t('home.sections.viewAllArticles')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loadingArticles ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <div className="h-48 rounded-t-lg bg-gray-200"></div>
                  <CardContent className="p-6">
                    <div className="mb-2 h-4 rounded bg-gray-200"></div>
                    <div className="mb-4 h-3 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredArticles.length > 0 ? (
            <>
              {/* Asymmetric Jony Ive-inspired layout with generous white space */}
              <div className="space-y-12">
                {/* Featured Article - Hero */}
                {featuredArticles[0] && (
                  <div className="mb-16">
                    <IntelligenceCard
                      variant="featured"
                      title={featuredArticles[0].title}
                      description={featuredArticles[0].summary}
                      image={featuredArticles[0].imageUrl || 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33'}
                      imageAlt={featuredArticles[0].title}
                      category={getCategoryName(featuredArticles[0].category, t)}
                      date={new Date(featuredArticles[0].publishedAt).toLocaleDateString()}
                      author={featuredArticles[0].author}
                      href={`/news/${featuredArticles[0].id}`}
                      readTime={featuredArticles[0].readTime}
                      viewCount={featuredArticles[0].viewCount}
                      aiGenerated={!!featuredArticles[0].aiMetadata}
                      confidenceScore={featuredArticles[0].aiMetadata?.confidenceScore}
                      sourcesAnalyzed={featuredArticles[0].aiMetadata?.sourcesAnalyzed}
                      sentiment={featuredArticles[0].sentiment}
                      trending={featuredArticles[0].isBreaking}
                    />
                  </div>
                )}

                {/* Asymmetric Grid - Articles 2-4 */}
                {featuredArticles.length > 1 && (
                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
                    {/* Second article - spans 2 columns on desktop */}
                    {featuredArticles[1] && (
                      <div className="lg:col-span-2">
                        <IntelligenceCard
                          variant="default"
                          title={featuredArticles[1].title}
                          description={featuredArticles[1].summary}
                          image={featuredArticles[1].imageUrl || 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33'}
                          imageAlt={featuredArticles[1].title}
                          category={getCategoryName(featuredArticles[1].category, t)}
                          date={new Date(featuredArticles[1].publishedAt).toLocaleDateString()}
                          author={featuredArticles[1].author}
                          href={`/news/${featuredArticles[1].id}`}
                          readTime={featuredArticles[1].readTime}
                          viewCount={featuredArticles[1].viewCount}
                          aiGenerated={!!featuredArticles[1].aiMetadata}
                          confidenceScore={featuredArticles[1].aiMetadata?.confidenceScore}
                          sourcesAnalyzed={featuredArticles[1].aiMetadata?.sourcesAnalyzed}
                          sentiment={featuredArticles[1].sentiment}
                        />
                      </div>
                    )}

                    {/* Third article - compact sidebar */}
                    {featuredArticles[2] && (
                      <div className="lg:col-span-1">
                        <IntelligenceCard
                          variant="minimal"
                          title={featuredArticles[2].title}
                          description={featuredArticles[2].summary}
                          image={featuredArticles[2].imageUrl || 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33'}
                          imageAlt={featuredArticles[2].title}
                          category={getCategoryName(featuredArticles[2].category, t)}
                          date={new Date(featuredArticles[2].publishedAt).toLocaleDateString()}
                          href={`/news/${featuredArticles[2].id}`}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Lower Grid - Articles 4-6 with luxury variant */}
                {featuredArticles.length > 3 && (
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
                    {featuredArticles.slice(3, 6).map((article, index) => (
                      <IntelligenceCard
                        key={article.id}
                        variant={index === 0 ? "luxury" : "default"}
                        title={article.title}
                        description={article.summary}
                        image={article.imageUrl || 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33'}
                        imageAlt={article.title}
                        category={getCategoryName(article.category, t)}
                        date={new Date(article.publishedAt).toLocaleDateString()}
                        author={article.author}
                        href={`/news/${article.id}`}
                        readTime={article.readTime}
                        viewCount={article.viewCount}
                        aiGenerated={!!article.aiMetadata}
                        confidenceScore={article.aiMetadata?.confidenceScore}
                        sourcesAnalyzed={article.aiMetadata?.sourcesAnalyzed}
                        sentiment={article.sentiment}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-500">{t('home.sections.noArticles')}</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                {t('app.refresh')}
              </Button>
            </div>
          )}
        </section>

        {/* Evening Experiences - Simplified */}
        <section>
          <div className="mb-8 relative">
            <div className="absolute -left-6 top-0 h-full w-1 bg-gradient-to-b from-dubai-gold-500 to-dubai-gold-300" />
            <h2 className="mb-2 text-2xl font-light tracking-tight text-midnight-black">
              {t('home.sections.whatToDoTonight')}
            </h2>
            <p className="text-base text-gray-500">{t('home.sections.aiCuratedEvening')}</p>
          </div>

          <CategoryCard
            title={t('home.categories.eveningExperiences.title')}
            description={t('home.categories.eveningExperiences.description')}
            image="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf"
            href="/today"
            emoji=""
            badge=""
            size="large"
          />
        </section>

        {/* Explore Dubai */}
        <section>
          <div className="mb-12 relative">
            <div className="absolute -left-6 top-0 h-full w-1 bg-gradient-to-b from-dubai-gold-500 to-dubai-gold-300" />
            <h2 className="mb-2 text-2xl font-light tracking-tight text-midnight-black">
              {t('home.sections.exploreDubai')}
            </h2>
            <p className="text-base text-gray-500">{t('home.sections.discoverBest')}</p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <CategoryCard
              title={t('home.categories.dining.title')}
              description={t('home.categories.dining.description')}
              image="https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
              href="/eat-drink"
              emoji=""
              badge=""
            />

            <CategoryCard
              title={t('home.categories.events.title')}
              description={t('home.categories.events.description')}
              image="https://images.unsplash.com/photo-1540575467063-178a50c2df87"
              href="/events"
              emoji=""
              badge=""
            />

            <CategoryCard
              title={t('home.categories.nightlife.title')}
              description={t('home.categories.nightlife.description')}
              image="https://images.unsplash.com/photo-1559827260-dc66d52bef19"
              href="/beach-nightlife"
              emoji=""
              badge=""
            />

            <CategoryCard
              title={t('home.categories.living.title')}
              description={t('home.categories.living.description')}
              image="https://images.unsplash.com/photo-1449824913935-59a10b8d2000"
              href="/living"
              emoji=""
              badge=""
            />

            <CategoryCard
              title={t('home.categories.luxury.title')}
              description={t('home.categories.luxury.description')}
              image="https://images.unsplash.com/photo-1571896349842-33c89424de2d"
              href="/luxury"
              emoji=""
              badge=""
            />

            <CategoryCard
              title={t('home.categories.realEstate.title')}
              description={t('home.categories.realEstate.description')}
              image="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00"
              href="/real-estate"
              emoji=""
              badge=""
            />
          </div>
        </section>

        {/* Video Content */}
        <section>
          <div className="mb-12 relative">
            <div className="absolute -left-6 top-0 h-full w-1 bg-gradient-to-b from-dubai-gold-500 to-dubai-gold-300" />
            <h2 className="mb-2 text-2xl font-light tracking-tight text-midnight-black">
              {t('home.sections.dubaiStories')}
            </h2>
            <p className="text-base text-gray-500">{t('home.sections.shortVideos')}</p>
          </div>

          <CategoryCard
            title={t('home.categories.videoStories.title')}
            description={t('home.categories.videoStories.description')}
            image="https://images.unsplash.com/photo-1611162617474-5b21e879e113"
            href="/reels"
            emoji=""
            badge=""
            size="featured"
          />
        </section>

        {/* Connect */}
        <section>
          <div className="mb-12 text-center relative">
            {/* Centered Dubai Gold accent */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 h-1 w-24 bg-gradient-to-r from-dubai-gold-500 to-dubai-gold-300 -translate-y-4" />
            <h2 className="mb-2 text-2xl font-light tracking-tight text-midnight-black">
              {t('home.sections.stayConnected')}
            </h2>
            <p className="text-base text-gray-500">{t('home.sections.getPersonalized')}</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card className="border border-gray-100 bg-white shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-ai-blue">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-4 text-xl font-medium text-midnight-black">AI Assistant</h3>
                <p className="mb-6 leading-relaxed text-gray-600">
                  {t('home.sections.personalizedRecommendations')}
                </p>
                <Link to="/ayyan">
                  <Button
                    size="lg"
                    className="rounded-xl bg-ai-blue transition-all duration-200 hover:bg-ai-blue/90"
                  >
                    <MessageSquare className="mr-2 h-5 w-5" />
                    {t('home.sections.startConversation')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 bg-white shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-desert-gold">
                  <Mail className="h-8 w-8 text-midnight-black" />
                </div>
                <h3 className="mb-4 text-xl font-medium text-midnight-black">{t('home.sections.dailyUpdates')}</h3>
                <p className="mb-6 leading-relaxed text-gray-600">
                  Get the latest info and offers straight to your email
                </p>
                
                {/* Newsletter Subscription Form */}
                <form onSubmit={handleNewsletterSignup} className="space-y-4 mb-6">
                  <Input
                    placeholder="Your name"
                    value={newsletterName}
                    onChange={(e) => setNewsletterName(e.target.value)}
                    disabled={newsletterLoading}
                    className="w-full rounded-xl border-gray-200 focus:border-gray-300"
                  />
                  <Input
                    type="email"
                    placeholder="Your email address"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    disabled={newsletterLoading}
                    className="w-full rounded-xl border-gray-200 focus:border-gray-300"
                  />
                  {/* Honeypot field - hidden from users but visible to bots */}
                  <Input
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    variant="outline"
                    disabled={newsletterLoading}
                    className="w-full rounded-xl border-gray-200 text-gray-700 transition-all duration-200 hover:bg-gray-50"
                  >
                    {newsletterLoading ? 'Subscribing...' : 'Subscribe to Newsletter'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
