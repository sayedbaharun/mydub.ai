export { default as QualityDashboard } from './QualityDashboard'
export { default as QualityMetricsChart } from './QualityMetricsChart'
export { default as QualityRulesManager } from './QualityRulesManager'
export { default as ContentModerationPanel } from './ContentModerationPanel'
export { default as LearningSystemPanel } from './LearningSystemPanel'

// Re-export types for convenience
export type {
  QualityAssessmentResult,
  ContentInput,
  QualityThresholds
} from '../../services/quality-control/qualityAssessment.service'

export type {
  DuplicateDetectionResult,
  DuplicateMatch,
  ContentFingerprint
} from '../../services/quality-control/duplicateDetection.service'

export type {
  FactVerificationResult,
  FactClaim,
  VerificationSource
} from '../../services/quality-control/factVerification.service'

export type {
  ContentModerationResult,
  ModerationIssue,
  BiasAnalysis
} from '../../services/quality-control/contentModeration.service'

export type {
  QualityRule,
  QualityDecision,
  RuleEvaluationResult
} from '../../services/quality-control/qualityRules'

export type {
  FeedbackRecord,
  LearningPattern,
  ImprovementSuggestion,
  PerformanceMetrics
} from '../../services/quality-control/learningSystem.service'