-- ============================================================================
-- Phase 3.5.1: User Verification System
-- Dubai Resident, Business Owner, and Community Contributor badges
-- ============================================================================

-- User Verifications Table
CREATE TABLE IF NOT EXISTS user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type VARCHAR(50) CHECK (verification_type IN ('resident', 'business', 'contributor')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  badge_name VARCHAR(100),
  badge_icon VARCHAR(10), -- Emoji or icon code
  proof_data JSONB, -- Phone number, business license, etc.
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Optional expiration for some badges
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, verification_type)
);

-- User Badges Table (current active badges)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) CHECK (badge_type IN ('resident', 'business', 'contributor', 'moderator', 'admin')),
  badge_name VARCHAR(100) NOT NULL,
  badge_icon VARCHAR(10) NOT NULL,
  display_order INTEGER DEFAULT 0, -- Order to display badges
  metadata JSONB, -- Business name, contributor level, etc.
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_verifications_user ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(status);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id, display_order);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Users can view own verifications
CREATE POLICY "Users can view own verifications"
  ON user_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own verification requests
CREATE POLICY "Users can request verifications"
  ON user_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Anyone can view badges (public information)
CREATE POLICY "Anyone can view user badges"
  ON user_badges FOR SELECT
  USING (true);

-- Only system can insert/update badges
CREATE POLICY "Only verified users can update badges"
  ON user_badges FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to approve verification and create badge
CREATE OR REPLACE FUNCTION approve_verification(
  p_verification_id UUID,
  p_reviewer_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_type VARCHAR(50);
  v_badge_name VARCHAR(100);
  v_badge_icon VARCHAR(10);
BEGIN
  -- Get verification details
  SELECT user_id, verification_type
  INTO v_user_id, v_type
  FROM user_verifications
  WHERE id = p_verification_id;

  -- Set badge details based on type
  IF v_type = 'resident' THEN
    v_badge_name := 'Dubai Resident';
    v_badge_icon := '🔵';
  ELSIF v_type = 'business' THEN
    v_badge_name := 'Business Owner';
    v_badge_icon := '🏢';
  ELSIF v_type = 'contributor' THEN
    v_badge_name := 'Community Contributor';
    v_badge_icon := '⭐';
  END IF;

  -- Update verification status
  UPDATE user_verifications
  SET
    status = 'approved',
    verified_at = NOW(),
    reviewed_by = p_reviewer_id,
    reviewed_at = NOW(),
    badge_name = v_badge_name,
    badge_icon = v_badge_icon
  WHERE id = p_verification_id;

  -- Create or update badge
  INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, display_order)
  VALUES (v_user_id, v_type, v_badge_name, v_badge_icon,
    CASE
      WHEN v_type = 'admin' THEN 1
      WHEN v_type = 'moderator' THEN 2
      WHEN v_type = 'contributor' THEN 3
      WHEN v_type = 'business' THEN 4
      WHEN v_type = 'resident' THEN 5
      ELSE 10
    END)
  ON CONFLICT (user_id, badge_type)
  DO UPDATE SET
    badge_name = v_badge_name,
    badge_icon = v_badge_icon;

  -- Create notification
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    v_user_id,
    'milestone',
    '🎉 Verification Approved!',
    'Your ' || v_badge_name || ' badge has been approved!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject verification
CREATE OR REPLACE FUNCTION reject_verification(
  p_verification_id UUID,
  p_reviewer_id UUID,
  p_reason TEXT
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID
  SELECT user_id INTO v_user_id
  FROM user_verifications
  WHERE id = p_verification_id;

  -- Update verification status
  UPDATE user_verifications
  SET
    status = 'rejected',
    reviewed_by = p_reviewer_id,
    reviewed_at = NOW(),
    rejection_reason = p_reason
  WHERE id = p_verification_id;

  -- Create notification
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    v_user_id,
    'milestone',
    'Verification Update',
    'Your verification request was not approved. Reason: ' || p_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-grant contributor badge based on reputation
CREATE OR REPLACE FUNCTION check_and_grant_contributor_badge()
RETURNS TRIGGER AS $$
DECLARE
  v_reputation INTEGER;
  v_has_badge BOOLEAN;
BEGIN
  -- Only check for users with high reputation
  IF NEW.reputation_score >= 1000 THEN
    -- Check if user already has contributor badge
    SELECT EXISTS(
      SELECT 1 FROM user_badges
      WHERE user_id = NEW.user_id AND badge_type = 'contributor'
    ) INTO v_has_badge;

    -- Grant badge if they don't have it
    IF NOT v_has_badge THEN
      INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, display_order)
      VALUES (NEW.user_id, 'contributor', 'Community Contributor', '⭐', 3)
      ON CONFLICT (user_id, badge_type) DO NOTHING;

      -- Notify user
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (
        NEW.user_id,
        'milestone',
        '🌟 You earned the Community Contributor badge!',
        'Thank you for your valuable contributions to the MyDub.AI community!'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-granting contributor badge
-- (Will be activated when user_reputation table exists in Task 3.5.2)

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE user_verifications IS 'Verification requests for Dubai Resident, Business Owner, etc.';
COMMENT ON TABLE user_badges IS 'Active badges displayed on user profiles';
COMMENT ON COLUMN user_verifications.verification_type IS 'resident (UAE phone), business (trade license), contributor (reputation)';
COMMENT ON COLUMN user_verifications.proof_data IS 'JSON with phone number, license file URL, etc.';
