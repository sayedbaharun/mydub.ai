import React, { useState } from 'react';
import { Heart, Share2, Bookmark, MapPin, Clock, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { useRecommendations, useInteractionTracking, useTrendingRecommendations } from '@/shared/hooks/useRecommendations';
import { RecommendationResult } from '@/shared/lib/ai/recommendationEngine';
import { formatDistanceToNow } from 'date-fns';

interface RecommendationWidgetProps {
  variant?: 'compact' | 'detailed' | 'grid';
  maxItems?: number;
  showReasonings?: boolean;
  showInteractionButtons?: boolean;
  title?: string;
  className?: string;
  onItemClick?: (recommendation: RecommendationResult) => void;
}

const RECOMMENDATION_TYPE_LABELS = {
  personalized: 'For You',
  trending: 'Trending',
  location_based: 'Near You',
  similar_users: 'Others Like',
  contextual: 'Right Now'
};

const RECOMMENDATION_TYPE_ICONS = {
  personalized: Sparkles,
  trending: TrendingUp,
  location_based: MapPin,
  similar_users: Heart,
  contextual: Clock
};

export function RecommendationWidget({
  variant = 'detailed',
  maxItems = 5,
  showReasonings = true,
  showInteractionButtons = true,
  title = 'Recommended for You',
  className = '',
  onItemClick
}: RecommendationWidgetProps) {
  const { recommendations, isLoading, error } = useRecommendations({
    filters: { max_results: maxItems },
    strategy: 'diverse'
  });

  const { trackView, trackLike, trackSave, trackShare, trackClick } = useInteractionTracking();

  const handleItemClick = (recommendation: RecommendationResult) => {
    trackClick(recommendation.content.id, recommendation.content.type);
    trackView(recommendation.content.id, recommendation.content.type);
    onItemClick?.(recommendation);
  };

  const handleLike = (recommendation: RecommendationResult, e: React.MouseEvent) => {
    e.stopPropagation();
    trackLike(recommendation.content.id, recommendation.content.type);
  };

  const handleSave = (recommendation: RecommendationResult, e: React.MouseEvent) => {
    e.stopPropagation();
    trackSave(recommendation.content.id, recommendation.content.type);
  };

  const handleShare = (recommendation: RecommendationResult, e: React.MouseEvent) => {
    e.stopPropagation();
    trackShare(recommendation.content.id, recommendation.content.type);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {recommendations.slice(0, maxItems).map((rec) => (
              <div
                key={rec.content.id}
                className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
                onClick={() => handleItemClick(rec)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{rec.content.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {rec.content.category}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <RecommendationTypeBadge type={rec.recommendation_type} size="sm" />
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {recommendations.slice(0, maxItems).map((rec) => (
          <RecommendationCard
            key={rec.content.id}
            recommendation={rec}
            variant="grid"
            showReasonings={showReasonings}
            showInteractionButtons={showInteractionButtons}
            onClick={() => handleItemClick(rec)}
            onLike={(e) => handleLike(rec, e)}
            onSave={(e) => handleSave(rec, e)}
            onShare={(e) => handleShare(rec, e)}
          />
        ))}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Personalized recommendations based on your interests and activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.slice(0, maxItems).map((rec) => (
            <RecommendationCard
              key={rec.content.id}
              recommendation={rec}
              variant="detailed"
              showReasonings={showReasonings}
              showInteractionButtons={showInteractionButtons}
              onClick={() => handleItemClick(rec)}
              onLike={(e) => handleLike(rec, e)}
              onSave={(e) => handleSave(rec, e)}
              onShare={(e) => handleShare(rec, e)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface RecommendationCardProps {
  recommendation: RecommendationResult;
  variant: 'detailed' | 'grid';
  showReasonings: boolean;
  showInteractionButtons: boolean;
  onClick: () => void;
  onLike: (e: React.MouseEvent) => void;
  onSave: (e: React.MouseEvent) => void;
  onShare: (e: React.MouseEvent) => void;
}

function RecommendationCard({
  recommendation,
  variant,
  showReasonings,
  showInteractionButtons,
  onClick,
  onLike,
  onSave,
  onShare
}: RecommendationCardProps) {
  const { content, relevance_score, reasoning, recommendation_type, confidence } = recommendation;

  return (
    <div
      className={`
        border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer
        ${variant === 'grid' ? 'h-full' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate ${variant === 'grid' ? 'text-base' : 'text-lg'}`}>
            {content.title}
          </h3>
          <p className={`text-muted-foreground truncate ${variant === 'grid' ? 'text-xs' : 'text-sm'}`}>
            {content.description}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <RecommendationTypeBadge type={recommendation_type} />
          <div className="text-xs text-muted-foreground">
            {Math.round(relevance_score * 100)}%
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className="text-xs">
          {content.category}
        </Badge>
        {content.location && (
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Location
          </Badge>
        )}
        <div className="text-xs text-muted-foreground">
          {formatDistanceToNow(content.created_at, { addSuffix: true })}
        </div>
      </div>

      {showReasonings && reasoning.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {reasoning.slice(0, 2).map((reason, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {reason}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {showInteractionButtons && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onLike}>
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onSave}>
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            {confidence > 0.8 ? 'High confidence' : 
             confidence > 0.6 ? 'Medium confidence' : 
             'Low confidence'}
          </div>
        </div>
      )}
    </div>
  );
}

interface RecommendationTypeBadgeProps {
  type: RecommendationResult['recommendation_type'];
  size?: 'sm' | 'default';
}

function RecommendationTypeBadge({ type, size = 'default' }: RecommendationTypeBadgeProps) {
  const Icon = RECOMMENDATION_TYPE_ICONS[type];
  const label = RECOMMENDATION_TYPE_LABELS[type];

  const variants = {
    personalized: 'bg-purple-100 text-purple-800 border-purple-200',
    trending: 'bg-orange-100 text-orange-800 border-orange-200',
    location_based: 'bg-blue-100 text-blue-800 border-blue-200',
    similar_users: 'bg-pink-100 text-pink-800 border-pink-200',
    contextual: 'bg-green-100 text-green-800 border-green-200'
  };

  return (
    <Badge 
      variant="outline" 
      className={`
        ${variants[type]} 
        ${size === 'sm' ? 'text-xs px-1 py-0' : 'text-xs'}
        flex items-center gap-1
      `}
    >
      <Icon className={size === 'sm' ? 'h-2 w-2' : 'h-3 w-3'} />
      {label}
    </Badge>
  );
}

/**
 * Trending recommendations widget
 */
export function TrendingWidget({ 
  timeframe = '24h', 
  category,
  className = '',
  maxItems = 5 
}: {
  timeframe?: '1h' | '6h' | '24h' | '7d';
  category?: string;
  className?: string;
  maxItems?: number;
}) {
  const { trending, isLoading } = useTrendingRecommendations(timeframe, category);
  const { trackClick } = useInteractionTracking();

  if (isLoading || trending.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Now
        </CardTitle>
        <CardDescription>
          Popular content in the last {timeframe}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trending.slice(0, maxItems).map((rec, index) => (
            <div
              key={rec.content.id}
              className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
              onClick={() => trackClick(rec.content.id, rec.content.type)}
            >
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {index + 1}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{rec.content.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {rec.content.category}
                </p>
              </div>
              <div className="flex-shrink-0">
                <Badge variant="outline" className="text-xs">
                  {Math.round(rec.relevance_score * 100)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default RecommendationWidget;