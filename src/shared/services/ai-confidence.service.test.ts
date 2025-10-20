import { describe, it, expect, beforeEach, vi } from 'vitest'
import { aiConfidenceService, type ArticleDraft } from './ai-confidence.service'

// Mock Supabase
vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            not: vi.fn(() => ({
              order: vi.fn(() => ({
                data: [],
                error: null,
              })),
            })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null,
        })),
      })),
    })),
  },
}))

describe('AIConfidenceService', () => {
  let mockDraft: ArticleDraft

  beforeEach(() => {
    mockDraft = {
      title: 'Dubai Announces New AI Strategy',
      content:
        'Dubai has unveiled its comprehensive AI strategy for 2026.\n\nThe strategy focuses on implementing AI across government services and smart city initiatives.',
      sources: [
        {
          url: 'https://example.com/source1',
          text: 'Dubai AI strategy focuses on government services',
          credibility: 85,
        },
        {
          url: 'https://example.com/source2',
          text: 'New smart city AI initiatives announced',
          credibility: 90,
        },
        {
          url: 'https://example.com/source3',
          text: 'Comprehensive AI implementation plan unveiled',
          credibility: 88,
        },
      ],
      entities: [
        { text: 'Dubai', type: 'LOCATION', confidence: 0.98 },
        { text: 'AI Strategy', type: 'CONCEPT', confidence: 0.95 },
        { text: '2026', type: 'DATE', confidence: 0.99 },
      ],
      sentiment: 'positive',
    }
  })

  describe('calculateConfidence', () => {
    it('should calculate overall confidence score with proper weighting', async () => {
      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      expect(result.overall).toBeGreaterThan(0)
      expect(result.overall).toBeLessThanOrEqual(100)
      expect(result.breakdown).toBeDefined()
      expect(result.reasons).toBeInstanceOf(Array)
      expect(result.threshold).toBe(85)
    })

    it('should meet threshold for high-quality articles', async () => {
      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      expect(result.meetsThreshold).toBe(result.overall >= 85)
    })

    it('should include all breakdown metrics', async () => {
      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      expect(result.breakdown).toHaveProperty('sourceAgreement')
      expect(result.breakdown).toHaveProperty('modelConfidence')
      expect(result.breakdown).toHaveProperty('factCheckScore')
      expect(result.breakdown).toHaveProperty('sentimentConsistency')
      expect(result.breakdown).toHaveProperty('nerAccuracy')
    })

    it('should handle single source gracefully', async () => {
      mockDraft.sources = [mockDraft.sources[0]]

      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      expect(result.breakdown.sourceAgreement).toBe(60) // Single source gets moderate score
    })

    it('should penalize articles with no sources', async () => {
      mockDraft.sources = []

      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      expect(result.breakdown.sourceAgreement).toBe(0)
    })

    it('should detect red flags in content', async () => {
      mockDraft.content = 'BREAKING: EXCLUSIVE!!! allegedly unconfirmed reports'

      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      // Should have lower fact check score due to red flags
      expect(result.breakdown.factCheckScore).toBeLessThan(80)
    })

    it('should reward high-credibility sources', async () => {
      mockDraft.sources = mockDraft.sources.map((s) => ({
        ...s,
        credibility: 95,
      }))

      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      expect(result.breakdown.sourceAgreement).toBeGreaterThan(85)
    })

    it('should calculate higher confidence for well-structured content', async () => {
      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      expect(result.breakdown.modelConfidence).toBeGreaterThan(70)
    })

    it('should handle missing sentiment gracefully', async () => {
      delete mockDraft.sentiment

      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      expect(result.breakdown.sentimentConsistency).toBe(75) // Neutral default
    })

    it('should calculate NER accuracy from entity confidence', async () => {
      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      const expectedAvg =
        (0.98 + 0.95 + 0.99) / 3 // Average of entity confidences
      expect(result.breakdown.nerAccuracy).toBeCloseTo(expectedAvg * 100, 1)
    })

    it('should provide meaningful reasons', async () => {
      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      expect(result.reasons.length).toBeGreaterThan(0)
      expect(result.reasons.some((r) => r.includes('Overall:'))).toBe(true)
    })
  })

  describe('meetsThreshold', () => {
    it('should return true for scores >= 85', async () => {
      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      if (result.overall >= 85) {
        expect(aiConfidenceService.meetsThreshold(result)).toBe(true)
      }
    })

    it('should return false for scores < 85', async () => {
      // Create low-quality draft
      const lowQualityDraft: ArticleDraft = {
        title: 'Short',
        content: 'Brief content without structure',
        sources: [
          {
            url: 'http://example.com',
            text: 'Low credibility source',
            credibility: 40,
          },
        ],
        entities: [{ text: 'Test', type: 'OTHER', confidence: 0.5 }],
      }

      const result = await aiConfidenceService.calculateConfidence(lowQualityDraft)

      expect(result.overall).toBeLessThan(85)
      expect(aiConfidenceService.meetsThreshold(result)).toBe(false)
    })
  })

  describe('getConfidenceTrend', () => {
    it('should return empty array when no data', async () => {
      const start = new Date('2026-01-01')
      const end = new Date('2026-01-31')

      const trend = await aiConfidenceService.getConfidenceTrend(start, end)

      expect(trend).toEqual([])
    })

    it('should group data by day', async () => {
      // This test would require mocking Supabase responses
      // Skipping detailed implementation as it depends on actual data
      const start = new Date('2026-01-01')
      const end = new Date('2026-01-31')

      const trend = await aiConfidenceService.getConfidenceTrend(start, end)

      expect(Array.isArray(trend)).toBe(true)
    })
  })

  describe('storeConfidenceScore', () => {
    it('should store score without throwing', async () => {
      const score = await aiConfidenceService.calculateConfidence(mockDraft)

      await expect(
        aiConfidenceService.storeConfidenceScore('test-article-id', score)
      ).resolves.not.toThrow()
    })

    it('should throw error when database update fails', async () => {
      // Mock Supabase to return error
      const { supabase } = await import('@/shared/lib/supabase')
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: new Error('Database error'),
          })),
        })),
      } as any)

      const score = await aiConfidenceService.calculateConfidence(mockDraft)

      await expect(
        aiConfidenceService.storeConfidenceScore('test-article-id', score)
      ).rejects.toThrow('Failed to store confidence score')
    })
  })

  describe('Edge cases', () => {
    it('should handle articles with no entities', async () => {
      mockDraft.entities = []

      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      expect(result.breakdown.nerAccuracy).toBe(70) // Base score
    })

    it('should handle very long content', async () => {
      mockDraft.content = 'A'.repeat(10000)

      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      expect(result.overall).toBeGreaterThan(0)
    })

    it('should handle special characters in content', async () => {
      mockDraft.content = 'Content with émojis 🎉 and spëcial çharacters'

      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      expect(result.overall).toBeGreaterThan(0)
    })

    it('should cap source agreement at 100', async () => {
      // Add many high-credibility sources
      mockDraft.sources = Array(20)
        .fill(null)
        .map((_, i) => ({
          url: `https://example.com/source${i}`,
          text: `High credibility source ${i}`,
          credibility: 95,
        }))

      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      expect(result.breakdown.sourceAgreement).toBeLessThanOrEqual(100)
    })

    it('should generate appropriate reasons for low scores', async () => {
      const lowQualityDraft: ArticleDraft = {
        title: 'Short',
        content: 'Brief',
        sources: [
          {
            url: 'http://example.com',
            text: 'Low credibility',
            credibility: 30,
          },
        ],
        entities: [{ text: 'Test', type: 'OTHER', confidence: 0.4 }],
      }

      const result = await aiConfidenceService.calculateConfidence(lowQualityDraft)

      expect(result.reasons.some((r) => r.includes('low') || r.includes('Low'))).toBe(
        true
      )
    })
  })

  describe('Weighted scoring', () => {
    it('should apply correct weights to breakdown metrics', async () => {
      const result = await aiConfidenceService.calculateConfidence(mockDraft)

      const manualCalculation =
        result.breakdown.sourceAgreement * 0.3 +
        result.breakdown.modelConfidence * 0.25 +
        result.breakdown.factCheckScore * 0.25 +
        result.breakdown.sentimentConsistency * 0.1 +
        result.breakdown.nerAccuracy * 0.1

      expect(result.overall).toBeCloseTo(manualCalculation, 1)
    })
  })
})
