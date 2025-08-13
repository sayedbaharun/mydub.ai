// Main Quality Control Services
export { qualityAssessmentService } from './qualityAssessment.service'
export { duplicateDetectionService } from './duplicateDetection.service'
export { factVerificationService } from './factVerification.service'
export { contentModerationService } from './contentModeration.service'
export { qualityRulesEngine } from './qualityRules'
export { learningSystemService } from './learningSystem.service'
export { culturalContextService } from './culturalContext.service'

// Type exports for external use
export type {
  QualityAssessmentResult,
  ContentInput,
  QualityThresholds
} from './qualityAssessment.service'

export type {
  DuplicateDetectionResult,
  DuplicateMatch,
  ContentFingerprint,
  SimilarityThresholds
} from './duplicateDetection.service'

export type {
  FactVerificationResult,
  FactClaim,
  VerificationSource,
  TrustedSource,
  ExtractedEntity
} from './factVerification.service'

export type {
  ContentModerationResult,
  ModerationIssue,
  BiasAnalysis,
  LegalCompliance,
  ModerationRule,
  DetectedBias,
  DemographicAnalysis,
  LanguageBias,
  CulturalBias
} from './contentModeration.service'

export type {
  QualityRule,
  QualityDecision,
  RuleEvaluationResult,
  QualityRuleSet,
  RuleCondition,
  RuleAction
} from './qualityRules'

export type {
  FeedbackRecord,
  LearningPattern,
  ImprovementSuggestion,
  PerformanceMetrics,
  QualityRuleAdjustment,
  ContentAnalysisReport
} from './learningSystem.service'

export type {
  CulturalContext,
  CulturalAssessment,
  CulturalIssue
} from './culturalContext.service'

// Utility functions for quality control
export const QualityControlUtils = {
  // Initialize all quality services
  async initializeServices() {
    await qualityRulesEngine.initialize()
  },

  // Get comprehensive quality assessment
  async getComprehensiveAssessment(content: ContentInput) {
    const [assessment, moderation, duplicate, factCheck, cultural] = await Promise.all([
      qualityAssessmentService.assessContent(content),
      contentModerationService.moderateContent(content),
      duplicateDetectionService.detectDuplicates(content),
      factVerificationService.verifyContent(content),
      culturalContextService.assessCulturalSensitivity({
        title: content.title,
        content: content.content,
        content_type: content.content_type
      })
    ])

    return {
      assessment,
      moderation,
      duplicate,
      fact_check: factCheck,
      cultural
    }
  },

  // Get quality decision
  async getQualityDecision(content: ContentInput) {
    await qualityRulesEngine.initialize()
    return qualityRulesEngine.evaluateContent(content)
  },

  // Process learning feedback
  async processFeedback(feedback: Partial<FeedbackRecord>) {
    return learningSystemService.recordFeedback(feedback as any)
  },

  // Get cultural guidelines for content type
  getCulturalGuidelines(contentType: string) {
    return culturalContextService.getCulturalGuidelines(contentType)
  },

  // Get UAE cultural context
  getCulturalContext() {
    return culturalContextService.getCulturalContext()
  }
}

// Export the main services for direct use
import { qualityAssessmentService } from './qualityAssessment.service'
import { duplicateDetectionService } from './duplicateDetection.service'
import { factVerificationService } from './factVerification.service'
import { contentModerationService } from './contentModeration.service'
import { qualityRulesEngine } from './qualityRules'
import { learningSystemService } from './learningSystem.service'
import { culturalContextService } from './culturalContext.service'
import type { ContentInput } from './qualityAssessment.service'
import type { FeedbackRecord } from './learningSystem.service'