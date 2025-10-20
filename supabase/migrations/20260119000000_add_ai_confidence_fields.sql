-- Migration: Add AI Confidence Scoring Fields to news_articles
-- Date: 2026-01-19
-- Purpose: Support AI transparency and confidence scoring for AI-generated content
-- Related: Task 1.1.3 - AI Confidence Score Service

-- Add AI confidence scoring columns to news_articles table
ALTER TABLE news_articles
ADD COLUMN IF NOT EXISTS ai_confidence_score INTEGER CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 100);

ALTER TABLE news_articles
ADD COLUMN IF NOT EXISTS ai_confidence_breakdown JSONB;

ALTER TABLE news_articles
ADD COLUMN IF NOT EXISTS ai_sources_analyzed INTEGER CHECK (ai_sources_analyzed >= 0);

-- Add helpful comments to document the columns
COMMENT ON COLUMN news_articles.ai_confidence_score IS
  'Overall AI confidence score (0-100). Scores >= 85 meet publishing threshold. Calculated by ai-confidence.service.ts';

COMMENT ON COLUMN news_articles.ai_confidence_breakdown IS
  'Detailed breakdown of confidence metrics: sourceAgreement, modelConfidence, factCheckScore, sentimentConsistency, nerAccuracy';

COMMENT ON COLUMN news_articles.ai_sources_analyzed IS
  'Number of sources analyzed during AI generation and fact-checking process';

-- Create index for filtering by confidence score
CREATE INDEX IF NOT EXISTS idx_news_articles_ai_confidence_score
ON news_articles(ai_confidence_score)
WHERE ai_confidence_score IS NOT NULL;

-- Create index for finding high-confidence articles
CREATE INDEX IF NOT EXISTS idx_news_articles_high_confidence
ON news_articles(ai_confidence_score, published_at)
WHERE ai_confidence_score >= 85 AND status = 'published';

-- Grant permissions (assuming standard RLS policies are in place)
-- No additional grants needed as these columns inherit table permissions
