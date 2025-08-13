import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Filter, RefreshCw, Search } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Tabs,  TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { DepartmentFilter, DepartmentBadges } from '../components/DepartmentFilter'
import { DateRangePicker } from '../components/DateRangePicker'
import { GovernmentUpdateCard } from '../components/GovernmentUpdateCard'
import { EssentialServiceCard } from '../components/EssentialServiceCard'
import { GovernmentService } from '../services/government.service'
import { GovernmentUpdate, GovernmentFilters } from '../types'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useInView } from 'react-intersection-observer'

const ITEMS_PER_PAGE = 10

export function GovernmentPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, i18n } = useTranslation('government')
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  // State
  const [updates, setUpdates] = useState<GovernmentUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [filters, setFilters] = useState<GovernmentFilters>({
    departments: searchParams.get('departments')?.split(',').filter(Boolean) || [],
    categories: searchParams.get('category') ? [searchParams.get('category')!] : [],
    dateRange: {
      start: null,
      end: null,
    },
    priority: searchParams.get('priority') || undefined,
    search: searchParams.get('search') || '',
  })

  // Infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  // Load updates
  const loadUpdates = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
        setPage(1)
        setHasMore(true)
      } else {
        setLoading(true)
      }

      const data = await GovernmentService.getUpdates(filters)
      
      if (isRefresh || page === 1) {
        setUpdates(data)
      } else {
        setUpdates(prev => [...prev, ...data])
      }

      setHasMore(data.length === ITEMS_PER_PAGE)
    } catch (error) {
      toast.error(t('loadError'))
      console.error('Error loading updates:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (filters.departments.length > 0) {
      params.set('departments', filters.departments.join(','))
    }
    if (filters.categories.length > 0) {
      params.set('category', filters.categories[0])
    }
    if (filters.priority) {
      params.set('priority', filters.priority)
    }
    if (filters.search) {
      params.set('search', filters.search)
    }

    setSearchParams(params)
  }, [filters, setSearchParams])

  // Load data on mount and filter change
  useEffect(() => {
    loadUpdates()
  }, [filters])

  // Load more on scroll
  useEffect(() => {
    if (inView && hasMore && !loading) {
      setPage(prev => prev + 1)
    }
  }, [inView, hasMore, loading])

  // Subscribe to real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const setupSubscription = async () => {
      unsubscribe = await GovernmentService.subscribeToUpdates((update) => {
        setUpdates(prev => [update, ...prev])
        toast.info(t('newUpdate', {
          department: isRTL ? update.department.nameAr : update.department.name
        }))
      })
    }

    setupSubscription()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [t, isRTL])

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: category === 'all' ? [] : [category],
    }))
  }

  const handlePriorityChange = (priority: string) => {
    setFilters(prev => ({
      ...prev,
      priority: priority === 'all' ? undefined : priority,
    }))
  }

  const handleSearch = (value: string) => {
    setFilters(prev => ({
      ...prev,
      search: value,
    }))
  }

  const removeDepartment = (departmentId: string) => {
    setFilters(prev => ({
      ...prev,
      departments: prev.departments.filter(id => id !== departmentId),
    }))
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Clean Header */}
        <div className="mb-12">
          <h1 className={cn(
            "text-2xl sm:text-3xl lg:text-4xl font-light text-midnight-black tracking-tight mb-2",
            isRTL && "text-right"
          )}>
            {t('title')}
          </h1>
          <p className={cn(
            "text-base text-gray-500",
            isRTL && "text-right"
          )}>
            {t('subtitle')}
          </p>
        </div>

        {/* Simple Search */}
        <div className={cn(
          "mb-8",
          isRTL && "text-right"
        )}>
          <div className="relative max-w-md">
            <Search className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400",
              isRTL && "left-auto right-4"
            )} />
            <Input
              placeholder={t('searchPlaceholder')}
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className={cn(
                "pl-12 h-12 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:border-gray-300 shadow-sm",
                isRTL && "pl-4 pr-12"
              )}
            />
          </div>
        </div>


        {/* Simple Category Filters */}
        <div className={cn(
          "flex flex-wrap gap-2 mb-12",
          isRTL && "flex-row-reverse justify-end"
        )}>
          {[
            { value: 'all', label: t('all') },
            { value: 'documents', label: 'Documents' },
            { value: 'visa', label: 'Visa & Residency' },
            { value: 'transport', label: 'Transport' },
            { value: 'housing', label: 'Housing' },
            { value: 'utilities', label: 'Utilities' },
            { value: 'emergency', label: 'Emergency' }
          ].map((category) => (
            <button
              key={category.value}
              onClick={() => handleCategoryChange(category.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200',
                (filters.categories[0] || 'all') === category.value
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Clean Updates List */}
        <div className="space-y-8">
          {loading && page === 1 ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : updates.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">{t('noUpdates')}</p>
            </div>
          ) : (
            <>
              {updates.map((update) => (
                <EssentialServiceCard
                  key={update.id}
                  service={update}
                  onClick={() => {
                    // Navigate to detail page or open modal
                    if (update.official_url) {
                      window.open(update.official_url, '_blank')
                    }
                  }}
                />
              ))}
              {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-8">
                  {loading && <LoadingSpinner />}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}