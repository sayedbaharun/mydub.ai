import { Calendar,  ExternalLink} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SearchResult } from '@/shared/types/database';
import { cn } from '@/shared/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  className?: string;
  onResultClick?: (result: SearchResult) => void;
}

export function SearchResults({ 
  results, 
  isLoading, 
  className,
  onResultClick 
}: SearchResultsProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="flex gap-4">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-gray-500">{t('search.noResults')}</p>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'news': return 'bg-blue-100 text-blue-800';
      case 'government': return 'bg-green-100 text-green-800';
      case 'tourism': return 'bg-purple-100 text-purple-800';
      case 'event': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'news': return '📰';
      case 'government': return '🏛️';
      case 'tourism': return '🏖️';
      case 'event': return '📅';
      default: return '📄';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {results.map((result) => (
        <article
          key={result.id}
          onClick={() => onResultClick?.(result)}
          className={cn(
            'bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow',
            'p-6 cursor-pointer group',
            isRTL && 'text-right'
          )}
        >
          <div className="flex items-start gap-4">
            {result.image_url && (
              <img
                src={result.image_url}
                alt=""
                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
              />
            )}
            
            <div className="flex-1 min-w-0">
              {/* Type Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                  getTypeColor(result.type)
                )}>
                  <span>{getTypeIcon(result.type)}</span>
                  {t(`search.types.${result.type}`)}
                </span>
                {result.category && (
                  <span className="text-xs text-gray-500">
                    {result.category}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                {isRTL && result.title_ar ? result.title_ar : result.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-3 line-clamp-2">
                {isRTL && result.description_ar ? result.description_ar : result.description}
              </p>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {result.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDistanceToNow(new Date(result.date), { addSuffix: true })}
                  </span>
                )}
                
                {result.url && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('search.viewSource')}
                  </a>
                )}

                {result.score && result.score > 0 && (
                  <span className="text-xs text-gray-400">
                    {t('search.relevance')}: {Math.round(result.score * 100)}%
                  </span>
                )}
              </div>

              {/* Highlights */}
              {result.highlights && (
                <div className="mt-3 space-y-1">
                  {result.highlights.title && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{t('search.inTitle')}:</span>{' '}
                      <span dangerouslySetInnerHTML={{ 
                        __html: result.highlights.title.join(' ... ') 
                      }} />
                    </p>
                  )}
                  {result.highlights.description && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{t('search.inDescription')}:</span>{' '}
                      <span dangerouslySetInnerHTML={{ 
                        __html: result.highlights.description.join(' ... ') 
                      }} />
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}