export interface LegalDocument {
  id: string;
  type: 'privacy_policy' | 'terms_of_service' | 'cookie_policy' | 'data_processing_agreement';
  version: string;
  content: string;
  effective_date: Date;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  language: string;
}

export interface UserConsent {
  id: string;
  user_id: string;
  consent_type: 'privacy_policy' | 'terms_of_service' | 'cookie_policy' | 'marketing' | 'data_processing';
  consent_given: boolean;
  consent_date: Date;
  document_version: string;
  ip_address: string;
  user_agent: string;
  withdrawal_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  performance: boolean;
  functional: boolean;
}

export interface DataSubjectRequest {
  id: string;
  user_id: string;
  request_type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  request_date: Date;
  completion_date?: Date;
  description: string;
  response?: string;
  attachments?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface DataProcessingRecord {
  id: string;
  user_id: string;
  processing_purpose: string;
  data_categories: string[];
  legal_basis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  retention_period: string;
  third_party_sharing: boolean;
  processing_date: Date;
  created_at: Date;
}

export interface ComplianceAuditLog {
  id: string;
  event_type: 'consent_given' | 'consent_withdrawn' | 'data_accessed' | 'data_exported' | 'data_deleted' | 'policy_updated';
  user_id?: string;
  admin_id?: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
  created_at: Date;
}

export interface PrivacySettings {
  user_id: string;
  data_sharing_enabled: boolean;
  marketing_emails_enabled: boolean;
  analytics_tracking_enabled: boolean;
  third_party_sharing_enabled: boolean;
  profile_visibility: 'public' | 'private' | 'friends_only';
  data_retention_period: '1_year' | '2_years' | '5_years' | 'indefinite';
  cookie_consent: CookieConsent;
  updated_at: Date;
}

export interface LegalNotification {
  id: string;
  type: 'policy_update' | 'consent_required' | 'data_breach' | 'rights_reminder';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  target_users: 'all' | 'specific' | 'role_based';
  user_ids?: string[];
  roles?: string[];
  expires_at?: Date;
  created_at: Date;
  read_by: string[];
}

export interface DataExportRequest {
  id: string;
  user_id: string;
  export_format: 'json' | 'csv' | 'pdf';
  data_categories: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  expires_at?: Date;
  request_date: Date;
  completion_date?: Date;
  created_at: Date;
}

export interface LegalCompliance {
  gdpr_compliant: boolean;
  ccpa_compliant: boolean;
  last_audit_date: Date;
  next_audit_date: Date;
  compliance_score: number;
  pending_requests: number;
  active_consents: number;
  data_breaches: number;
}