/**
 * Source Attribution Card Component
 * Displays source attribution and citations for news articles
 */

import { useState, useEffect } from 'react'
import { ExternalLink, BookOpen, Shield, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import {
  SourceAttributionService,
  type AttributionReport,
  type SourceAttribution,
  type Citation,
} from '../services/source-attribution.service'

interface SourceAttributionCardProps {
  articleId: string
  className?: string
}

export function SourceAttributionCard({ articleId, className }: SourceAttributionCardProps) {
  const [report, setReport] = useState<AttributionReport | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [citationStyle, setCitationStyle] = useState<'apa' | 'mla' | 'chicago'>('apa')

  useEffect(() => {
    loadAttributionReport()
  }, [articleId])

  async function loadAttributionReport() {
    try {
      setIsLoading(true)
      const attributionReport = await SourceAttributionService.getAttributionReport(articleId)
      setReport(attributionReport)
    } catch (error) {
      console.error('Failed to load attribution report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Sources & Citations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading attribution data...</p>
        </CardContent>
      </Card>
    )
  }

  if (!report || report.attributions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            Sources & Citations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No source attribution available for this article.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <CardTitle className="text-sm">Sources & Citations</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription className="text-xs">
          {report.totalSources} {report.totalSources === 1 ? 'source' : 'sources'} • Transparency score:{' '}
          {report.transparencyScore}%
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Source Summary */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {report.primarySources} Primary
            </Badge>
            <Badge variant="outline" className="text-xs">
              {report.supplementarySources} Supplementary
            </Badge>
            <Badge
              variant={report.transparencyScore >= 80 ? 'default' : 'secondary'}
              className="text-xs"
            >
              <Shield className="mr-1 h-3 w-3" />
              {report.transparencyScore >= 90
                ? 'Excellent'
                : report.transparencyScore >= 80
                ? 'Good'
                : report.transparencyScore >= 60
                ? 'Fair'
                : 'Low'}{' '}
              Transparency
            </Badge>
          </div>

          {/* Source Attributions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Source Attribution</h4>
            <div className="space-y-2">
              {report.attributions.map((attribution, index) => (
                <SourceAttributionItem key={index} attribution={attribution} />
              ))}
            </div>
          </div>

          {/* Citations */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Formal Citations</h4>
            <Tabs value={citationStyle} onValueChange={(v) => setCitationStyle(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="apa" className="text-xs">
                  APA
                </TabsTrigger>
                <TabsTrigger value="mla" className="text-xs">
                  MLA
                </TabsTrigger>
                <TabsTrigger value="chicago" className="text-xs">
                  Chicago
                </TabsTrigger>
              </TabsList>
              <TabsContent value="apa" className="space-y-2 mt-3">
                {report.citations.map((citation, index) => (
                  <CitationItem key={index} citation={citation} style="apa" />
                ))}
              </TabsContent>
              <TabsContent value="mla" className="space-y-2 mt-3">
                {report.citations.map((citation, index) => (
                  <CitationItem key={index} citation={citation} style="mla" />
                ))}
              </TabsContent>
              <TabsContent value="chicago" className="space-y-2 mt-3">
                {report.citations.map((citation, index) => (
                  <CitationItem key={index} citation={citation} style="chicago" />
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Bibliography */}
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                const bibliography = SourceAttributionService.generateBibliography(
                  report.citations,
                  citationStyle
                )
                navigator.clipboard.writeText(bibliography)
                alert('Bibliography copied to clipboard!')
              }}
            >
              Copy Bibliography ({citationStyle.toUpperCase()})
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

/**
 * Individual Source Attribution Item
 */
function SourceAttributionItem({ attribution }: { attribution: SourceAttribution }) {
  const typeColors = {
    primary: 'bg-primary text-primary-foreground',
    supplementary: 'bg-secondary text-secondary-foreground',
    verification: 'bg-muted text-muted-foreground',
    quote: 'bg-accent text-accent-foreground',
  }

  const typeLabels = {
    primary: 'Primary Source',
    supplementary: 'Supplementary',
    verification: 'Verification',
    quote: 'Quoted',
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 text-sm">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{attribution.sourceName}</p>
          <Badge className={`text-xs ${typeColors[attribution.contributionType]}`}>
            {typeLabels[attribution.contributionType]}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{attribution.contributionPercentage}% contribution</span>
          <span>•</span>
          <span>Credibility: {attribution.credibilityScore}%</span>
        </div>
        {attribution.sourceUrl && (
          <a
            href={attribution.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View source
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  )
}

/**
 * Individual Citation Item
 */
function CitationItem({
  citation,
  style,
}: {
  citation: Citation
  style: 'apa' | 'mla' | 'chicago'
}) {
  const getCitationText = () => {
    switch (style) {
      case 'apa':
        return citation.citationAPA
      case 'mla':
        return citation.citationMLA
      case 'chicago':
        return citation.citationChicago
    }
  }

  return (
    <div className="rounded-lg border bg-muted/50 p-3">
      <p className="text-xs leading-relaxed">{getCitationText()}</p>
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 h-7 text-xs"
        onClick={() => {
          navigator.clipboard.writeText(getCitationText())
          alert('Citation copied!')
        }}
      >
        Copy Citation
      </Button>
    </div>
  )
}
