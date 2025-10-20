import { useState } from 'react'
import { Info, MapPin, TrendingUp, History, Clock, Globe, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { useTranslation } from 'react-i18next'
import type { NewsArticle } from '@/features/news/types'
import { RecommendationExplanationService } from '../services/recommendation-explanation.service'

interface WhyAmISeeingThisProps {
  article: NewsArticle
  variant?: 'icon' | 'button'
  className?: string
}

export function WhyAmISeeingThis({ article, variant = 'icon', className = '' }: WhyAmISeeingThisProps) {
  const { t } = useTranslation()
  const [explanation, setExplanation] = useState<ReturnType<typeof RecommendationExplanationService.explainRecommendation> | null>(null)

  const handleOpen = () => {
    const result = RecommendationExplanationService.explainRecommendation(article)
    setExplanation(result)
  }

  const getFactorIcon = (factorType: string) => {
    switch (factorType) {
      case 'location': return MapPin
      case 'trending': return TrendingUp
      case 'history': return History
      case 'time': return Clock
      case 'language': return Globe
      case 'ai': return Sparkles
      default: return Info
    }
  }

  return (
    <Dialog onOpenChange={(open) => open && handleOpen()}>
      <DialogTrigger asChild>
        {variant === 'icon' ? (
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 text-gray-400 hover:text-dubai-gold-600 ${className}`}
            aria-label={t('transparency.whyAmISeeingThis')}
          >
            <Info className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={`text-sm text-gray-600 hover:text-dubai-gold-600 border-gray-200 ${className}`}
          >
            <Info className="h-4 w-4 mr-2" />
            {t('transparency.whyAmISeeingThis')}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-light tracking-tight">
            <Info className="h-6 w-6 text-dubai-gold-600" />
            {t('transparency.whyAmISeeingThisTitle')}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            {t('transparency.whyAmISeeingThisDescription')}
          </DialogDescription>
        </DialogHeader>

        {explanation && (
          <div className="space-y-6 mt-4">
            {/* Article Summary */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <h3 className="font-medium text-lg mb-2 text-midnight-black">{article.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Badge variant="outline" className="text-xs">
                  {t(`news.category.${article.category}`)}
                </Badge>
                {article.aiMetadata && (
                  <Badge variant="secondary" className="text-xs bg-violet-50 text-violet-700">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Generated
                  </Badge>
                )}
              </div>
            </div>

            {/* Primary Reason */}
            <div>
              <h4 className="font-medium text-lg mb-3 text-midnight-black flex items-center gap-2">
                <div className="h-1 w-8 bg-dubai-gold-500 rounded-full" />
                {t('transparency.primaryReason')}
              </h4>
              <div className="p-4 bg-dubai-gold-50 rounded-lg border border-dubai-gold-200">
                <div className="flex items-start gap-3">
                  {(() => {
                    const Icon = getFactorIcon(explanation.primaryReason.type)
                    return <Icon className="h-5 w-5 text-dubai-gold-700 mt-0.5" />
                  })()}
                  <div>
                    <p className="font-medium text-dubai-gold-900">{explanation.primaryReason.title}</p>
                    <p className="text-sm text-dubai-gold-700 mt-1">{explanation.primaryReason.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contributing Factors */}
            {explanation.contributingFactors.length > 0 && (
              <div>
                <h4 className="font-medium text-lg mb-3 text-midnight-black flex items-center gap-2">
                  <div className="h-1 w-8 bg-gray-300 rounded-full" />
                  {t('transparency.contributingFactors')}
                </h4>
                <div className="space-y-2">
                  {explanation.contributingFactors.map((factor, index) => {
                    const Icon = getFactorIcon(factor.type)
                    return (
                      <div
                        key={index}
                        className="p-3 bg-white rounded-lg border border-gray-200 hover:border-dubai-gold-300 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">{factor.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{factor.description}</p>
                          </div>
                          <span className="text-xs font-medium text-gray-500">{factor.weight}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Transparency Note */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-blue-900">
                    {t('transparency.transparencyCommitment')}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {t('transparency.transparencyCommitmentDescription')}
                  </p>
                </div>
              </div>
            </div>

            {/* Personalization Controls */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                {t('transparency.personalizeYourExperience')}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  {t('transparency.managePreferences')}
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  {t('transparency.viewPrivacySettings')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
