import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { EnhancedSearchBar } from '../components/EnhancedSearchBar';
import { SearchFilters } from '../components/SearchFilters';
import { SearchResults } from '../components/SearchResults';
import { useSearch, usePopularSearches } from '../hooks/useSearch';
import type { SearchFilters as SearchFiltersType, SearchResult } from '@/shared/types/database';
import { cn } from '@/shared/lib/utils';

export function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Get initial query from URL
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'all';
  const initialCategory = searchParams.get('category') || undefined;

  const {
    filters,
    results,
    total,
    page,
    totalPages,
    isLoading,
    error,
    updateFilters,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage
  } = useSearch({
    initialFilters: {
      query: initialQuery,
      type: initialType as SearchFiltersType['type'],
      category: initialCategory
    }
  });

  const { searches: popularSearches } = usePopularSearches(5);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.type && filters.type !== 'all') params.set('type', filters.type);
    if (filters.category) params.set('category', filters.category);
    if (page > 1) params.set('page', page.toString());
    
    setSearchParams(params, { replace: true });
  }, [filters, page, setSearchParams]);

  const handleSearchSubmit = () => {
    // Search is automatically triggered by the hook
  };

  const handleResultClick = (result: SearchResult) => {
    // Navigate based on result type
    switch (result.type) {
      case 'news':
        navigate(`/news/${result.id}`);
        break;
      case 'government':
        navigate(`/government/services/${result.id}`);
        break;
      case 'tourism':
        navigate(`/tourism/attractions/${result.id}`);
        break;
      case 'event':
        navigate(`/tourism/events/${result.id}`);
        break;
    }
  };

  const handlePopularSearchClick = (search: string) => {
    updateFilters({ query: search });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <EnhancedSearchBar
              value={filters.query}
              onChange={(query) => updateFilters({ query })}
              onSubmit={handleSearchSubmit}
              autoFocus
              showSuggestions={true}
              size="lg"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-8">
            {/* Filters Sidebar - Desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <h2 className="text-lg font-semibold mb-4">{t('search.filters.title')}</h2>
                <SearchFilters
                  filters={filters}
                  onFiltersChange={updateFilters}
                />
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {/* Mobile Filter Toggle */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <Search className="h-4 w-4" />
                  {t('search.filters.toggle')}
                </button>
              </div>

              {/* Mobile Filters */}
              {showFilters && (
                <div className="lg:hidden mb-6 p-4 bg-white rounded-lg shadow-sm">
                  <SearchFilters
                    filters={filters}
                    onFiltersChange={updateFilters}
                  />
                </div>
              )}

              {/* Search Results Header */}
              {!isLoading && results.length > 0 && (
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {t('search.resultsCount', { count: total })}
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800">{t('search.error')}</p>
                </div>
              )}

              {/* No Query State */}
              {!filters.query && !isLoading && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('search.startSearching')}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {t('search.startSearchingDescription')}
                  </p>
                  
                  {/* Popular Searches */}
                  {popularSearches.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-3">
                        {t('search.popularSearches')}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {popularSearches.map((search) => (
                          <button
                            key={search}
                            onClick={() => handlePopularSearchClick(search)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Search Results */}
              {filters.query && (
                <>
                  <SearchResults
                    results={results}
                    isLoading={isLoading}
                    onResultClick={handleResultClick}
                  />

                  {/* Pagination */}
                  {!isLoading && totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <button
                        onClick={previousPage}
                        disabled={!hasPreviousPage}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                          hasPreviousPage
                            ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        )}
                      >
                        {t('common.previous')}
                      </button>
                      
                      <span className="px-4 py-2 text-sm text-gray-600">
                        {t('common.pageOf', { current: page, total: totalPages })}
                      </span>
                      
                      <button
                        onClick={nextPage}
                        disabled={!hasNextPage}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                          hasNextPage
                            ? 'bg-primary text-white hover:bg-primary-dark'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        )}
                      >
                        {t('common.next')}
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}