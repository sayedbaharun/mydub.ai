# UAE Compliance Features Integration Guide

## Quick Start

### 1. Set Up Environment Variables

Add to your `.env.local`:
```env
# Get a new key from https://platform.openai.com/api-keys
VITE_OPENAI_API_KEY=sk-proj-your-new-secure-key-here
```

### 2. Run Database Migrations

```bash
# Run these in order
supabase migration up 20250124_content_moderation_tables
supabase migration up 20250124_ai_transparency_tables
supabase migration up 20250124_data_residency_tables
```

### 3. Add Routes

Update your `src/routes/router.tsx`:

```typescript
// Import the new pages
const ContentPolicyPage = lazy(() => import('@/pages/legal/ContentPolicyPage'))
const AIEthicsPage = lazy(() => import('@/pages/legal/AIEthicsPage'))
const ComplianceDashboard = lazy(() => import('@/features/admin/compliance/ComplianceDashboard'))

// Add to your routes
<Route path="/legal/content-policy" element={<ContentPolicyPage />} />
<Route path="/legal/ai-ethics" element={<AIEthicsPage />} />

// Admin routes (protected)
<Route path="/admin/compliance" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <ComplianceDashboard />
  </ProtectedRoute>
} />
```

### 4. Add AI Preferences to Settings

In your user settings page:

```typescript
import { AIPreferences } from '@/components/settings/AIPreferences'

// Add to settings tabs
<TabsContent value="ai">
  <AIPreferences />
</TabsContent>
```

### 5. Integrate Content Moderation

For any user-generated content (chat, comments, etc.):

```typescript
import { contentModerationService } from '@/services/content-moderation.service'

// Before saving user content
const moderationResult = await contentModerationService.moderateContent(
  content,
  userId,
  'chat' // or 'comment', 'post', etc.
)

if (moderationResult.action === 'blocked') {
  // Show error to user
  toast({
    title: 'Content Blocked',
    description: `Your content violates our policies: ${moderationResult.reason}`,
    variant: 'destructive'
  })
  return
}

if (moderationResult.action === 'warning') {
  // Show warning but allow
  toast({
    title: 'Content Warning',
    description: 'Please review our content policy',
    variant: 'warning'
  })
}
```

### 6. Add AI Decision Logging

Wrap all AI interactions:

```typescript
import { aiDisclosureService } from '@/services/ai-disclosure.service'

// When using AI
const aiResponse = await yourAICall()

// Log the decision
await aiDisclosureService.logAIDecision(
  userId,
  'chatbot', // feature name
  'gpt-4', // model used
  userInput,
  aiResponse,
  {
    confidence: 0.95,
    tokens_used: 150,
    reasoning: 'User asked about Dubai Metro timings'
  }
)
```

### 7. Update Navigation

Add links to footer:

```typescript
<Link to="/legal/content-policy">Content Policy</Link>
<Link to="/legal/ai-ethics">AI Ethics</Link>
```

Add to admin sidebar:

```typescript
{role === 'admin' && (
  <Link to="/admin/compliance">
    <Shield className="h-4 w-4" />
    Compliance Dashboard
  </Link>
)}
```

## Testing the Integration

### Content Moderation Test

Try submitting these test phrases:
- ✅ "What are the best restaurants in Dubai?" (should pass)
- ⚠️ "I hate this service" (should get warning)
- ❌ "[Insert inappropriate content]" (should be blocked)

### AI Transparency Test

1. Go to Settings → AI Preferences
2. Toggle off "Chatbot" feature
3. Try using the chatbot - it should show "AI features disabled"
4. Check usage statistics to see logged interactions

### Data Residency Test

1. As an admin, go to Compliance Dashboard
2. Check "Data Residency" tab
3. Verify all critical data shows as stored in UAE

## Production Checklist

- [ ] Add OpenAI API key to Vercel environment variables
- [ ] Run all database migrations
- [ ] Test content moderation with real content
- [ ] Verify AI opt-out works correctly
- [ ] Check compliance dashboard shows correct metrics
- [ ] Add links to new legal pages in footer
- [ ] Train moderators on the review queue
- [ ] Set up alerts for critical violations

## Monitoring

After deployment, monitor:
- Content moderation queue size
- AI opt-out rates
- Data residency violations
- User reports and appeals

Access the Compliance Dashboard at `/admin/compliance` to view all metrics.