// Centralized thresholds and helpers for content quality

export const QUALITY_THRESHOLDS = {
  bannerThreshold: 80, // show alert banner if score < 80
  warningMin: 70,      // 70-79 => warning
  criticalMax: 69,     // <= 69 => critical
}

export type QualitySeverity = 'ok' | 'warning' | 'critical'

export function getQualitySeverity(score: number): QualitySeverity {
  if (score <= QUALITY_THRESHOLDS.criticalMax) return 'critical'
  if (score < QUALITY_THRESHOLDS.bannerThreshold && score >= QUALITY_THRESHOLDS.warningMin) return 'warning'
  return 'ok'
}
