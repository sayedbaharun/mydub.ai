import { Calendar, MapPin, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SearchFilters as SearchFiltersType } from '@/shared/types/database';
import { cn } from '@/shared/lib/utils';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: Partial<SearchFiltersType>) => void;
  className?: string;
}

const contentTypes = [
  { value: 'all', label: 'All' },
  { value: 'news', label: 'News' },
  { value: 'government', label: 'Government Services' },
  { value: 'tourism', label: 'Tourism' },
  { value: 'events', label: 'Events' }
];

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'date', label: 'Date' },
  { value: 'popularity', label: 'Popularity' }
];

const categories = {
  news: ['General News', 'Business & Economy', 'Technology & Innovation', 'Sports & Recreation', 'Entertainment & Culture'],
  government: ['Visa Services', 'Business Licensing', 'Healthcare Services', 'Education & Schools', 'Utilities & Infrastructure'],
  tourism: ['Tourist Attractions', 'Museums & Galleries', 'Parks & Recreation', 'Beaches & Waterfront', 'Heritage & Culture'],
  events: ['Cultural Events', 'Sports Events', 'Business & Networking', 'Entertainment Shows', 'Community Gatherings']
};

export function SearchFilters({ filters, onFiltersChange, className }: SearchFiltersProps) {
  const { t } = useTranslation();

  const handleTypeChange = (type: string) => {
    onFiltersChange({ 
      type: type as SearchFiltersType['type'],
      category: undefined // Reset category when type changes
    });
  };

  const handleCategoryChange = (category: string) => {
    onFiltersChange({ 
      category: filters.category === category ? undefined : category 
    });
  };

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    onFiltersChange({ [field]: value || undefined });
  };

  const handleLocationChange = (location: string) => {
    onFiltersChange({ location: location || undefined });
  };

  const handleSortChange = (sortBy: string) => {
    onFiltersChange({ sortBy: sortBy as SearchFiltersType['sortBy'] });
  };

  const clearFilters = () => {
    onFiltersChange({
      type: 'all',
      category: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      location: undefined,
      sortBy: 'relevance'
    });
  };

  const hasActiveFilters = 
    filters.type !== 'all' || 
    filters.category || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.location ||
    filters.sortBy !== 'relevance';

  const availableCategories = filters.type && filters.type !== 'all' 
    ? categories[filters.type as keyof typeof categories] || []
    : [];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Content Type Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          {t('search.filters.type')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {contentTypes.map(type => (
            <button
              key={type.value}
              onClick={() => handleTypeChange(type.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                filters.type === type.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {t(`search.types.${type.value}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      {availableCategories.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            {t('search.filters.category')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  filters.category === category
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date Range Filter */}
      {(filters.type === 'news' || filters.type === 'events' || filters.type === 'all') && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('search.filters.dateRange')}
          </h3>
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleDateChange('dateFrom', e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
              placeholder={t('search.filters.from')}
            />
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleDateChange('dateTo', e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
              placeholder={t('search.filters.to')}
            />
          </div>
        </div>
      )}

      {/* Location Filter */}
      {(filters.type === 'tourism' || filters.type === 'events' || filters.type === 'all') && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t('search.filters.location')}
          </h3>
          <input
            type="text"
            value={filters.location || ''}
            onChange={(e) => handleLocationChange(e.target.value)}
            placeholder={t('search.filters.locationPlaceholder')}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          />
        </div>
      )}

      {/* Sort Options */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          {t('search.filters.sortBy')}
        </h3>
        <select
          value={filters.sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {t(`search.sort.${option.value}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
        >
          <X className="h-4 w-4" />
          {t('search.filters.clear')}
        </button>
      )}
    </div>
  );
}