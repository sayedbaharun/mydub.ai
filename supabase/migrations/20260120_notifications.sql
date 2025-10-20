-- ============================================================================
-- Phase 3.4.1: Notification System
-- Real-time notifications for breaking news, comments, and updates
-- ============================================================================

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) CHECK (type IN (
    'breaking_news',
    'comment_reply',
    'mention',
    'upvote',
    'article_update',
    'welcome',
    'weekly_digest',
    'milestone'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  data JSONB, -- Additional metadata
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  breaking_news_push BOOLEAN DEFAULT true,
  comment_replies_push BOOLEAN DEFAULT true,
  mentions_push BOOLEAN DEFAULT true,
  upvotes_push BOOLEAN DEFAULT false, -- Off by default to avoid spam
  weekly_digest_email BOOLEAN DEFAULT true,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can view own preferences
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update own preferences
CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert own preferences
CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to create default notification preferences
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences on user signup
DROP TRIGGER IF EXISTS on_user_created_notification_prefs ON auth.users;
CREATE TRIGGER on_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Function to send welcome notification
CREATE OR REPLACE FUNCTION send_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    NEW.id,
    'welcome',
    'Welcome to MyDub.AI! 👋',
    'Discover the best of Dubai with AI-powered news and recommendations. Start by exploring personalized articles or asking Ayyan for help!'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for welcome notification
DROP TRIGGER IF EXISTS on_user_created_welcome ON auth.users;
CREATE TRIGGER on_user_created_welcome
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_notification();

-- Function to notify on comment reply
CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
  parent_user_id UUID;
  article_title TEXT;
  commenter_name TEXT;
BEGIN
  -- Only notify for replies (comments with parent_id)
  IF NEW.parent_id IS NOT NULL THEN
    -- Get the parent comment's user
    SELECT user_id INTO parent_user_id
    FROM comments
    WHERE id = NEW.parent_id;

    -- Don't notify if replying to own comment
    IF parent_user_id != NEW.user_id THEN
      -- Get article title
      SELECT title INTO article_title
      FROM news_articles
      WHERE id = NEW.article_id;

      -- Get commenter name
      SELECT display_name INTO commenter_name
      FROM user_profiles
      WHERE user_id = NEW.user_id;

      -- Create notification
      INSERT INTO notifications (user_id, type, title, message, link_url, data)
      VALUES (
        parent_user_id,
        'comment_reply',
        'New reply to your comment',
        commenter_name || ' replied to your comment on "' || article_title || '"',
        '/news/' || NEW.article_id,
        jsonb_build_object(
          'comment_id', NEW.id,
          'article_id', NEW.article_id
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment replies
DROP TRIGGER IF EXISTS on_comment_reply ON comments;
CREATE TRIGGER on_comment_reply
  AFTER INSERT ON comments
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION notify_comment_reply();

-- Function to notify on upvote milestones
CREATE OR REPLACE FUNCTION notify_upvote_milestone()
RETURNS TRIGGER AS $$
DECLARE
  comment_owner_id UUID;
  article_title TEXT;
BEGIN
  -- Check for milestone upvotes (10, 50, 100)
  IF NEW.upvotes IN (10, 50, 100) THEN
    SELECT user_id INTO comment_owner_id
    FROM comments
    WHERE id = NEW.id;

    SELECT title INTO article_title
    FROM news_articles
    WHERE id = NEW.article_id;

    INSERT INTO notifications (user_id, type, title, message, link_url, data)
    VALUES (
      comment_owner_id,
      'milestone',
      '🎉 Your comment reached ' || NEW.upvotes || ' upvotes!',
      'Your comment on "' || article_title || '" is popular with the community',
      '/news/' || NEW.article_id,
      jsonb_build_object(
        'comment_id', NEW.id,
        'upvotes', NEW.upvotes
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for upvote milestones
DROP TRIGGER IF EXISTS on_upvote_milestone ON comments;
CREATE TRIGGER on_upvote_milestone
  AFTER UPDATE OF upvotes ON comments
  FOR EACH ROW
  WHEN (NEW.upvotes > OLD.upvotes)
  EXECUTE FUNCTION notify_upvote_milestone();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET read = true
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET read = true
  WHERE user_id = p_user_id AND read = false;
END;
$$ LANGUAGE plpgsql;

-- Get unread count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM notifications
  WHERE user_id = p_user_id AND read = false;

  RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE notifications IS 'User notifications for breaking news, comments, updates';
COMMENT ON TABLE notification_preferences IS 'User notification preferences and quiet hours';
COMMENT ON COLUMN notifications.type IS 'breaking_news, comment_reply, mention, upvote, article_update, welcome, weekly_digest, milestone';
COMMENT ON COLUMN notification_preferences.quiet_hours_start IS 'Do not send notifications during quiet hours';
