---
⚠️ **IMPORTANT NOTE:** This document contains feature ideas but the phase ordering has been **restructured** based on actual business priorities:
- **Phase 1:** Foundation (Trust & Compliance) - ✅ DONE
- **Phase 2:** Content Excellence - ✅ COMPLETED
- **Phase 3:** Community & Engagement - 🎯 CURRENT FOCUS (see PHASE_3_COMMUNITY_ENGAGEMENT.md)
- **Phase 4:** Differentiation Features (Voice, Mobile, Hyperlocal) - Coming after Phase 3
- **Future:** Monetization - PARKED (see FUTURE_MONETIZATION.md)

**Rationale:** Build engaged community FIRST, monetize LATER when we have proven value.
---

#### 2.1.4 Neighborhood-Specific News Clustering
- **Agent:** AI + BE
- **Status:** ⬜ Not Started
- **Priority:** P1 (High)
- **Estimated Time:** 14 hours
- **Dependencies:** Task 2.1.1

**Description:**
Automatically cluster news by Dubai neighborhood using NLP and location extraction.

**Requirements:**
1. Extract location entities from article text (Named Entity Recognition)
2. Classify articles by neighborhood:
   - Dubai Marina, Downtown Dubai, JBR, DIFC, Business Bay, Jumeirah, Deira, etc.
3. Create neighborhood-specific news feeds
4. Display "News in Your Area" section based on user location
5. Allow users to subscribe to specific neighborhoods
6. Implement geofencing: push notifications when entering subscribed neighborhood

**Technical Implementation:**
```typescript
interface LocationEntity {
  text: string // e.g., "Dubai Mall"
  type: 'landmark' | 'neighborhood' | 'district' | 'street'
  coordinates?: { lat: number, lon: number }
  neighborhood: string
  confidence: number // 0-1
}

class LocationExtractionService {
  async extractLocations(articleText: string): Promise<LocationEntity[]>
  async categorizeByNeighborhood(articleId: string): Promise<string[]>
  async getNeighborhoodFeed(neighborhood: string, limit: number): Promise<NewsArticle[]>
}
```

**NER Models:**
- Use spaCy or Google Cloud Natural Language API
- Custom Dubai location gazetteer (list of all Dubai locations)
- Train on Dubai-specific corpus for better accuracy

**Database Schema:**
```sql
CREATE TABLE article_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES news_articles(id),
  location_text VARCHAR(255),
  location_type VARCHAR(50),
  neighborhood VARCHAR(100),
  confidence DECIMAL(3, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_article_locations_neighborhood ON article_locations(neighborhood);
CREATE INDEX idx_article_locations_article_id ON article_locations(article_id);
```

**Acceptance Criteria:**
- [ ] Location extraction accuracy >85%
- [ ] Articles correctly categorized by neighborhood
- [ ] Neighborhood feeds display relevant content only
- [ ] "News in Your Area" section works based on user location
- [ ] Subscription system functional
- [ ] Geofence notifications work (mobile)

**Files to Create:**
- `src/shared/services/location-extraction.service.ts`
- `src/features/news/pages/NeighborhoodNewsPage.tsx`
- `src/features/news/components/NewsInYourArea.tsx`
- `supabase/migrations/YYYYMMDDHHMMSS_create_article_locations.sql`

---

### 2.2 Voice Experience

#### 2.2.1 Natural Voice TTS Upgrade
- **Agent:** AI + FE
- **Status:** ⬜ Not Started
- **Priority:** P0 (Critical)
- **Estimated Time:** 10 hours
- **Dependencies:** None

**Description:**
Upgrade from basic browser TTS to premium neural voices using ElevenLabs or Azure Cognitive Services.

**Requirements:**
1. Evaluate voice providers:
   - ElevenLabs (most natural, expensive)
   - Azure Cognitive Services (good quality, affordable)
   - Google Cloud TTS (good, mid-price)
2. Choose 2 voices:
   - English: Professional, warm, neutral accent (UAE/international)
   - Arabic: Native Arabic speaker, clear pronunciation
3. Implement streaming TTS (don't wait for full article)
4. Add voice speed control (0.75x, 1x, 1.25x, 1.5x)
5. Highlight current sentence being read
6. Remember user's voice preferences
7. Offline fallback to browser TTS

**Technical Implementation:**
```typescript
interface VoiceSettings {
  provider: 'elevenlabs' | 'azure' | 'google' | 'browser'
  voiceId: string
  language: 'en' | 'ar'
  speed: number // 0.5 - 2.0
  pitch?: number // Provider-specific
}

class PremiumTTSService {
  async synthesize(text: string, settings: VoiceSettings): Promise<AudioBuffer>
  async streamSynthesis(text: string, settings: VoiceSettings): AsyncGenerator<AudioChunk>
  async getAvailableVoices(language: string): Promise<Voice[]>
  estimateCost(text: string): number // Estimate API cost
}
```

**UI Components:**
```typescript
<VoicePlayer>
  <PlayPauseButton />
  <ProgressBar currentTime={time} duration={duration} />
  <SpeedControl options={[0.75, 1, 1.25, 1.5]} />
  <VoiceSelector voices={availableVoices} />
</VoicePlayer>
```

**Cost Management:**
- Cache synthesized audio (Redis/CDN)
- Limit free tier users to browser TTS
- Premium users get neural voices
- Track usage to prevent abuse

**Acceptance Criteria:**
- [ ] Voice quality is natural (user testing)
- [ ] Streaming works smoothly (no buffering)
- [ ] Speed control works accurately
- [ ] Text highlighting synced with audio
- [ ] Preferences saved and applied
- [ ] Offline fallback works
- [ ] Cost per article <$0.05

**Files to Create:**
- `src/shared/services/premium-tts.service.ts`
- `src/shared/components/accessibility/VoicePlayer.tsx`
- `src/shared/components/accessibility/VoiceSettings.tsx`
- `api/tts-synthesis.ts`

---

#### 2.2.2 Voice Command Interface
- **Agent:** AI + FE
- **Status:** ⬜ Not Started
- **Priority:** P1 (High)
- **Estimated Time:** 20 hours
- **Dependencies:** None

**Description:**
Implement hands-free voice control interface for browsing news while driving/commuting.

**Requirements:**
1. Implement Speech Recognition (Web Speech API + fallback to Whisper API)
2. Support commands:
   - "Ayyan, what's new in Dubai today?"
   - "Read me the top story"
   - "Next article"
   - "Save this for later" (bookmark)
   - "Share this"
   - "Tell me about [topic]"
   - "Play audio version"
   - "Stop reading"
3. Voice activation: "Hey Ayyan" wake word
4. Hands-free mode: all interactions voice-only
5. Visual feedback: waveform showing AI is listening
6. Context awareness: remember what article user is on

**Technical Implementation:**
```typescript
interface VoiceCommand {
  command: string
  intent: 'read' | 'navigate' | 'search' | 'bookmark' | 'share' | 'control'
  entities: Record<string, string> // Extracted parameters
  confidence: number
}

class VoiceCommandService {
  async startListening(): Promise<void>
  async stopListening(): Promise<void>
  async processCommand(transcript: string): Promise<VoiceCommand>
  async executeCommand(command: VoiceCommand): Promise<CommandResult>
  async enableWakeWord(): Promise<void> // "Hey Ayyan"
}
```

**Intent Classification:**
```typescript
// Use AI model to classify user intent
const intents = {
  read: ['read', 'play', 'listen to'],
  navigate: ['next', 'previous', 'go to', 'show me'],
  search: ['find', 'search for', 'tell me about'],
  bookmark: ['save', 'bookmark', 'remember this'],
  share: ['share', 'send'],
  control: ['stop', 'pause', 'resume', 'faster', 'slower']
}
```

**UI Components:**
```typescript
<VoiceInterface>
  <WaveformVisualizer isListening={listening} />
  <TranscriptDisplay text={currentTranscript} />
  <CommandFeedback action={lastCommand} />
</VoiceInterface>
```

**Wake Word Detection:**
- Use Picovoice Porcupine for offline wake word
- Custom wake word: "Hey Ayyan"
- Minimal battery drain
- Privacy: audio not sent to server until wake word detected

**Acceptance Criteria:**
- [ ] Voice recognition accuracy >90%
- [ ] Wake word detection works reliably
- [ ] All commands execute correctly
- [ ] Hands-free mode fully functional
- [ ] Works while phone locked (iOS/Android)
- [ ] Battery usage acceptable (<5% per hour)
- [ ] Privacy policy updated

**Files to Create:**
- `src/shared/services/voice-command.service.ts`
- `src/features/voice/components/VoiceInterface.tsx`
- `src/features/voice/components/WaveformVisualizer.tsx`
- `src/features/voice/pages/HandsFreePage.tsx`

---

#### 2.2.3 Audio-Native Article Format
- **Agent:** AI + CN
- **Status:** ⬜ Not Started
- **Priority:** P1 (High)
- **Estimated Time:** 16 hours
- **Dependencies:** Task 2.2.1

**Description:**
Create podcast-style audio versions of articles optimized for listening, not just text-to-speech.

**Requirements:**
1. AI rewrites articles for audio consumption:
   - Add conversational intro/outro
   - Simplify complex sentences
   - Add verbal context ("as we mentioned earlier...")
   - Pronounce acronyms and abbreviations
2. Generate audio versions on article publish
3. Add background music (subtle, non-intrusive)
4. Include chapter markers for long articles
5. Create "Daily Dubai Briefing" podcast (5-min news summary)
6. Distribute via RSS feed for podcast apps

**Content Agent Tasks (CN):**
1. Write audio script template:
   ```
   [Intro music]
   "Good morning, this is your Dubai update from MyDub AI.
   Today we're covering [topic].
   
   [Article content, rewritten for audio]
   
   This story was brought to you by MyDub AI.
   For more Dubai news, visit mydub.ai"
   [Outro music]
   ```
2. Create pronunciation dictionary (Dubai-specific terms)
3. Write chapter marker titles

**AI Agent Tasks (AI):**
1. Implement AI rewriting for audio:
   ```typescript
   async function rewriteForAudio(article: NewsArticle): Promise<AudioScript> {
     const prompt = `Rewrite this news article as a podcast script.
     - Add a conversational intro
     - Simplify complex sentences
     - Add verbal transitions
     - Explain acronyms
     - Keep it under 3 minutes when spoken
     
     Article: ${article.content}`
     
     const script = await openai.chat.completions.create({
       model: "gpt-4",
       messages: [{ role: "user", content: prompt }]
     })
     
     return parseScript(script)
   }
   ```
2. Generate audio with ElevenLabs/Azure
3. Add background music mixing
4. Create chapter markers

**Technical Specs:**
```typescript
interface AudioArticle {
  articleId: string
  audioUrl: string // CDN link to MP3
  duration: number // seconds
  chapters: Array<{
    title: string
    startTime: number
  }>
  transcript: string // Full text script
  generatedAt: Date
}
```

**Distribution:**
- Generate RSS feed at `/feed/daily-briefing.xml`
- Submit to Apple Podcasts, Spotify, Google Podcasts
- Embed audio player in article page

**Acceptance Criteria:**
- [ ] Audio scripts are conversational and engaging
- [ ] Pronunciation of Dubai terms is correct
- [ ] Audio quality is professional
- [ ] Background music enhances, doesn't distract
- [ ] Chapter markers work in podcast apps
- [ ] RSS feed validates
- [ ] Daily briefing publishes automatically every morning

**Files to Create:**
- `src/shared/services/audio-article.service.ts`
- `src/features/audio/components/AudioPlayer.tsx`
- `api/generate-audio.ts`
- `api/feed/daily-briefing.xml.ts` (RSS feed generator)

---

#### 2.2.4 Car Mode UI
- **Agent:** FE + MB
- **Status:** ⬜ Not Started
- **Priority:** P2 (Medium)
- **Estimated Time:** 12 hours
- **Dependencies:** Task 2.2.2

**Description:**
Create simplified, glanceable UI optimized for car displays (CarPlay/Android Auto).

**Requirements:**
1. Simplified layout:
   - Large touch targets (minimum 44x44px)
   - High contrast colors
   - Minimal text (headlines only)
   - Voice-first interactions
2. CarPlay/Android Auto integration
3. Lockscreen controls (play/pause/skip)
4. Automatic activation when connected to car Bluetooth
5. Auto-play next article in queue
6. Safety: disable text reading while driving (voice only)

**UI Design:**
```
┌─────────────────────────────┐
│  🎧 Now Playing             │
│                             │
│  Dubai Marina Tower Opens   │
│  [Large headline]           │
│                             │
│  ⏮  ⏸  ⏭  🔖              │
│  [Huge buttons]             │
│                             │
│  Up Next: Weather Update    │
└─────────────────────────────┘
```

**Technical Implementation:**
```typescript
interface CarModeSettings {
  enabled: boolean
  autoPlay: boolean
  skipIntros: boolean
  queue: string[] // Article IDs
  currentIndex: number
}

class CarModeService {
  async enableCarMode(): Promise<void>
  async disableCarMode(): Promise<void>
  async detectCarConnection(): Promise<boolean> // Bluetooth detection
  async buildQueue(preferences: UserPreferences): Promise<string[]>
}
```

**Safety Features:**
- Disable visual distractions (images hidden)
- Large, simple buttons only
- Auto-pause on phone calls
- Volume ducking for notifications
- Emergency exit button

**Acceptance Criteria:**
- [ ] UI is readable at arm's length
- [ ] All buttons easy to tap while driving
- [ ] CarPlay/Android Auto integration works
- [ ] Auto-activation on Bluetooth connect
- [ ] Queue system plays articles sequentially
- [ ] Safety features tested
- [ ] No visual distractions

**Files to Create:**
- `src/features/car-mode/pages/CarModePage.tsx`
- `src/features/car-mode/services/car-mode.service.ts`
- `src/features/car-mode/components/LargeButtonControls.tsx`

---

### 2.3 Mobile Gestures

#### 2.3.1 Swipe Navigation Implementation
- **Agent:** FE + MB
- **Status:** ⬜ Not Started
- **Priority:** P1 (High)
- **Estimated Time:** 10 hours
- **Dependencies:** None

**Description:**
Implement intuitive swipe gestures for common actions on mobile.

**Gesture Mapping:**
- **Swipe Left:** Bookmark article
- **Swipe Right:** Share article
- **Swipe Up:** Next article in feed
- **Swipe Down:** Return to feed / Refresh
- **Long Press:** Quick actions menu

**Requirements:**
1. Use Framer Motion's drag/pan gestures
2. Visual feedback: card slides with finger
3. Action icons revealed during swipe
4. Haptic feedback on action completion
5. Cancellable: swipe back to cancel
6. Threshold: 30% screen width to trigger action
7. Animation: smooth spring animation
8. Works on IntelligenceCard and article pages

**Technical Implementation:**
```typescript
import { motion, PanInfo } from 'framer-motion'

const SwipeableCard = ({ article, onBookmark, onShare }) => {
  const handleDragEnd = (event: MouseEvent | TouchEvent, info: PanInfo) => {
    const threshold = 100 // pixels
    
    if (info.offset.x < -threshold) {
      // Swipe left: bookmark
      onBookmark(article.id)
      triggerHaptic('success')
    } else if (info.offset.x > threshold) {
      // Swipe right: share
      onShare(article)
      triggerHaptic('success')
    }
  }
  
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -200, right: 200 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="swipeable-card"
    >
      {/* Card content */}
    </motion.div>
  )
}
```

**Visual Feedback:**
```typescript
// Show bookmark icon when swiping left
{offset < -50 && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="absolute right-4 top-1/2"
  >
    <Bookmark className="text-dubai-gold-500" size={32} />
  </motion.div>
)}
```

**Acceptance Criteria:**
- [ ] All gestures work smoothly (60fps)
- [ ] Visual feedback is clear
- [ ] Haptics feel satisfying
- [ ] Threshold prevents accidental actions
- [ ] Works on iOS and Android
- [ ] Doesn't interfere with scrolling
- [ ] Tutorial shown on first use

**Files to Modify:**
- `src/shared/components/ui/intelligence-card.tsx`
- `src/features/news/pages/ArticlePage.tsx`
- Create: `src/shared/hooks/useSwipeGestures.ts`

---

#### 2.3.2 Haptic Feedback System
- **Agent:** FE + MB
- **Status:** ⬜ Not Started
- **Priority:** P2 (Medium)
- **Estimated Time:** 6 hours
- **Dependencies:** Task 2.3.1

**Description:**
Implement context-aware haptic feedback throughout the app.

**Haptic Events:**
- **Bookmark added:** Success haptic (medium impact)
- **Article shared:** Success haptic
- **Swipe action triggered:** Impact haptic
- **Breaking news alert:** Notification haptic (heavy)
- **Pull to refresh:** Selection haptic
- **Button press:** Light impact
- **Error:** Error haptic (triple light impact)

**Technical Implementation:**
```typescript
type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning'

class HapticService {
  isSupported(): boolean {
    return 'vibrate' in navigator || 'VibrationActuator' in navigator
  }
  
  trigger(type: HapticType): void {
    if (!this.isSupported()) return
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [10, 50, 10, 50, 10],
      warning: [50, 100, 50]
    }
    
    navigator.vibrate(patterns[type])
  }
  
  // iOS-specific Taptic Engine (if available)
  triggerTaptic(type: HapticType): void {
    // Use Capacitor or Cordova plugin for native haptics
  }
}
```

**Usage:**
```typescript
import { useHaptic } from '@/shared/hooks/useHaptic'

const MyComponent = () => {
  const haptic = useHaptic()
  
  const handleBookmark = () => {
    bookmarkArticle()
    haptic.trigger('success')
  }
}
```

**Settings:**
- Allow users to disable haptics
- Intensity preference (light/medium/strong)
- Remember preference

**Acceptance Criteria:**
- [ ] Haptics work on iOS and Android
- [ ] Patterns feel appropriate for each event
- [ ] Not overused (max 1 haptic per 500ms)
- [ ] User can disable in settings
- [ ] Battery impact minimal
- [ ] Works with accessibility (screen readers)

**Files to Create:**
- `src/shared/services/haptic.service.ts`
- `src/shared/hooks/useHaptic.ts`
- `src/features/settings/components/HapticSettings.tsx`

---

#### 2.3.3 Thumb Zone Optimization
- **Agent:** FE + DS + MB
- **Status:** ⬜ Not Started
- **Priority:** P1 (High)
- **Estimated Time:** 8 hours
- **Dependencies:** None

**Description:**
Redesign mobile UI to place all primary actions within easy thumb reach (bottom 1/3 of screen).

**Thumb Zone Research:**
- **Easy reach:** Bottom 1/3 of screen
- **Moderate reach:** Middle 1/3
- **Hard reach:** Top 1/3 (avoid for primary actions)

**Design Changes:**
1. Move navigation bar to bottom (not top)
2. Floating action button (FAB) in bottom-right
3. Article actions at bottom of page
4. Search bar accessible from bottom
5. Swipe-down to access top menu (secondary actions)

**Redesign Layout:**
```
┌─────────────────────────────┐
│  [Content area - scrollable]│ ← Top 2/3
│                             │
│                             │
│  [Article text...]          │
│                             │
│                             │
├─────────────────────────────┤
│  [🔖 Bookmark] [🔊 Listen]  │ ← Thumb zone
│  [Share]       [Comment]    │
├─────────────────────────────┤
│  [Home] [News] [Search] [Me]│ ← Bottom nav
└─────────────────────────────┘
```

**Technical Implementation:**
```typescript
// Bottom navigation (always visible)
<BottomNav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t">
  <NavItem icon={Home} label="Home" />
  <NavItem icon={Newspaper} label="News" />
  <NavItem icon={Search} label="Search" />
  <NavItem icon={User} label="Profile" />
</BottomNav>

// Article actions (sticky bottom on article page)
<ArticleActions className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-white">
  <ActionButton icon={Bookmark}>Save</ActionButton>
  <ActionButton icon={Volume2}>Listen</ActionButton>
  <ActionButton icon={Share}>Share</ActionButton>
</ArticleActions>
```

**Accessibility:**
- Larger touch targets (min 48x48px)
- Adequate spacing between buttons (8px min)
- Clear visual feedback on tap

**Acceptance Criteria:**
- [ ] All primary actions within bottom 1/3
- [ ] One-handed operation possible
- [ ] Navigation feels natural
- [ ] No accidental taps
- [ ] Works on small phones (iPhone SE) and large (iPhone Pro Max)
- [ ] User testing confirms improved usability

**Files to Modify:**
- `src/shared/components/layout/MobileLayout.tsx`
- `src/features/news/pages/ArticlePage.tsx`
- Create: `src/shared/components/layout/BottomNav.tsx`
- Create: `src/shared/components/layout/ArticleActions.tsx`

---

#### 2.3.4 Pull-to-Refresh Implementation
- **Agent:** FE + MB
- **Status:** ⬜ Not Started
- **Priority:** P2 (Medium)
- **Estimated Time:** 4 hours
- **Dependencies:** None

**Description:**
Add native-like pull-to-refresh gesture for news feed.

**Requirements:**
1. Pull down on feed to refresh content
2. Animated refresh indicator (spinner + "Refreshing..." text)
3. Haptic feedback when threshold reached
4. Smooth spring animation
5. Works on all list views (news feed, bookmarks, search results)
6. Debounce: prevent multiple refreshes

**Technical Implementation:**
```typescript
import { motion, useMotionValue, useTransform } from 'framer-motion'

const PullToRefresh = ({ onRefresh, children }) => {
  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, 100], [0, 1])
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const handleDragEnd = async (event, info) => {
    if (info.offset.y > 100 && !isRefreshing) {
      setIsRefreshing(true)
      triggerHaptic('light')
      await onRefresh()
      setIsRefreshing(false)
    }
  }
  
  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 150 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
      style={{ y }}
    >
      <motion.div style={{ opacity }} className="refresh-indicator">
        {isRefreshing ? <Spinner /> : <ArrowDown />}
        <span>Pull to refresh</span>
      </motion.div>
      {children}
    </motion.div>
  )
}
```

**Visual States:**
1. **Idle:** Hidden
2. **Pulling:** Arrow icon appears, rotates as pulled further
3. **Threshold reached:** Arrow becomes spinner, haptic fires
4. **Refreshing:** Spinner animates, "Refreshing..." text
5. **Complete:** Success checkmark, fade out

**Acceptance Criteria:**
- [ ] Gesture feels native (like Twitter/Instagram)
- [ ] Animation is smooth (60fps)
- [ ] Haptic feedback satisfying
- [ ] Works with scroll momentum
- [ ] Doesn't interfere with normal scrolling
- [ ] Loading state prevents duplicate refreshes

**Files to Create:**
- `src/shared/components/PullToRefresh.tsx`
- `src/shared/hooks/usePullToRefresh.ts`

---

### 2.4 Predictive News Features

#### 2.4.1 Trend Detection System
- **Agent:** AI + BE
- **Status:** ⬜ Not Started
- **Priority:** P1 (High)
- **Estimated Time:** 20 hours
- **Dependencies:** None

**Description:**
Build ML pipeline to detect emerging trends in Dubai before they become mainstream news.

**Data Sources:**
1. Social media monitoring (Twitter, Instagram, Reddit)
2. Google Trends (Dubai-specific)
3. News article frequency analysis
4. Government announcement patterns
5. Event calendar signals
6. Restaurant/venue reservation spikes

**Trend Detection Algorithm:**
```typescript
interface TrendSignal {
  topic: string
  source: 'social' | 'search' | 'news' | 'government' | 'events' | 'reservations'
  strength: number // 0-100
  growthRate: number // % change week-over-week
  sentiment: 'positive' | 'neutral' | 'negative'
  firstDetected: Date
  peakPrediction?: Date
}

interface EmergingTrend {
  topic: string
  description: string
  signals: TrendSignal[]
  overallStrength: number
  confidence: number // 0-100
  category: string
  relatedTopics: string[]
  predictedPeak: Date
  actionableInsights: string[]
}

class TrendDetectionService {
  async detectTrends(timeWindow: number): Promise<EmergingTrend[]>
  async analyzeTrendSignals(topic: string): Promise<TrendSignal[]>
  async predictPeak(trend: EmergingTrend): Promise<Date>
  async generateInsights(trend: EmergingTrend): Promise<string[]>
}
```

**Detection Logic:**
1. **Social Media Spike:** Mentions increase >200% in 48 hours
2. **Search Growth:** Google Trends shows steady climb >50%
3. **News Frequency:** Topic appears in 5+ articles in 3 days
4. **Cross-Source Validation:** Trend must appear in 3+ sources
5. **Sentiment Shift:** Rapid sentiment change indicates emerging story

**Example Trends:**
- "New beach club openings in Dubai Marina" (reservations + social mentions)
- "Dubai government visa policy discussion" (government patterns + news frequency)
- "F1 weekend hotel booking surge" (event calendar + reservation data)

**Acceptance Criteria:**
- [ ] Detects trends 3-7 days before mainstream coverage
- [ ] False positive rate <15%
- [ ] Updates every 6 hours
- [ ] Generates actionable insights
- [ ] Confidence scores are calibrated
- [ ] Alerts editorial team of high-confidence trends

**Files to Create:**
- `src/shared/services/trend-detection.service.ts`
- `src/features/trends/components/TrendDashboard.tsx`
- `api/detect-trends.ts`
- `supabase/migrations/YYYYMMDDHHMMSS_create_trends_table.sql`

---

#### 2.4.2 "What's Next" Prediction Section
- **Agent:** FE + AI
- **Status:** ⬜ Not Started
- **Priority:** P1 (High)
- **Estimated Time:** 12 hours
- **Dependencies:** Task 2.4.1

**Description:**
Create dedicated section showing predictions for upcoming Dubai news and events.

**Requirements:**
1. Display on homepage: "What's Happening Next in Dubai"
2. Show predictions for next 7 days
3. For each prediction:
   - Predicted event/announcement
   - Confidence level (%, with explanation)
   - Timeline (when it's likely to happen)
   - Why we think this (show supporting signals)
4. Track accuracy: mark predictions as confirmed/refuted when outcome known
5. Learn from mistakes: improve model based on accuracy

**Prediction Categories:**
- **Government Announcements:** "Dubai may announce new visa policy this week (72% confidence)"
- **Events:** "Major restaurant likely to launch Ramadan menu in 3 days (85% confidence)"
- **Infrastructure:** "RTA might extend metro hours for weekend (60% confidence)"
- **Weather:** "Sandstorm possible next Tuesday based on seasonal patterns (55% confidence)"
- **Business:** "Real estate market likely to see Q2 report this week (90% confidence)"

**UI Design:**
```typescript
<PredictionCard>
  <h3>Dubai may announce new visa policy this week</h3>
  <ConfidenceMeter value={72} />
  <Timeline>
    <Event>Likely announcement: Thursday-Friday</Event>
  </Timeline>
  <SupportingSignals>
    <Signal strength={85}>Government meeting scheduled</Signal>
    <Signal strength={70}>Historical pattern (annual Q2 visa updates)</Signal>
    <Signal strength={60}>Social media chatter from officials</Signal>
  </SupportingSignals>
  <AccuracyTrack>
    <Badge>We'll verify this by Friday</Badge>
  </AccuracyTrack>
</PredictionCard>
```

**Accuracy Tracking:**
```typescript
interface PredictionOutcome {
  predictionId: string
  predicted: string
  confidence: number
  actualOutcome: 'confirmed' | 'partially-confirmed' | 'refuted' | 'pending'
  verifiedAt?: Date
  accuracyScore: number // How close was our prediction
  learnings: string[] // What we learned for future predictions
}
```

**Gamification:**
- Show overall prediction accuracy: "We've been right 78% of the time"
- Leaderboard: which prediction category we're best at
- User voting: "Do you think this will happen?" (crowd wisdom)

**Acceptance Criteria:**
- [ ] Predictions are interesting and relevant
- [ ] Confidence levels are calibrated (72% actually means 72% chance)
- [ ] Supporting signals explain reasoning clearly
- [ ] Accuracy tracking is honest (show misses, not just hits)
- [ ] UI is engaging and trustworthy
- [ ] Model improves over time (learns from outcomes)

**Files to Create:**
- `src/features/predictions/pages/PredictionsPage.tsx`
- `src/features/predictions/components/PredictionCard.tsx`
- `src/features/predictions/components/ConfidenceMeter.tsx`
- `src/features/predictions/services/prediction-accuracy.service.ts`

---

## Phase 3: Monetization (Months 5-6)

**Goal:** Launch revenue-generating features: Premium tier, B2B intelligence product, government partnerships.

**Success Criteria:**
- Premium subscription launched with 100+ paying users
- 3+ enterprise clients signed
- Government partnership pilot underway
- Revenue tracking dashboard operational

---

### 3.1 Premium Subscription Tier

#### 3.1.1 Subscription Infrastructure
- **Agent:** BE + FE
- **Status:** ⬜ Not Started
- **Priority:** P0 (Critical)
- **Estimated Time:** 16 hours
- **Dependencies:** None

**Description:**
Implement subscription management system using Stripe.

**Requirements:**
1. Integrate Stripe Checkout and Billing Portal
2. Create subscription plans:
   - **Free:** Basic features, ads
   - **Premium:** AED 29/month or AED 290/year (save 17%)
   - **Family:** AED 49/month (up to 5 members)
3. Implement feature gating
4. Subscription status sync with database
5. Handle subscription lifecycle (subscribe, cancel, renew, pause)
6. Prorated upgrades/downgrades
7. Invoice generation and email

**Stripe Integration:**
```typescript
interface SubscriptionPlan {
  id: string
  name: 'free' | 'premium' | 'family'
  stripePriceId: string
  price: number
  currency: 'AED'
  interval: 'month' | 'year'
  features: string[]
}

interface UserSubscription {
  userId: string
  plan: SubscriptionPlan
  stripeCustomerId: string
  stripeSubscriptionId: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
}

class SubscriptionService {
  async createCheckoutSession(userId: string, planId: string): Promise<string>
  async handleWebhook(event: Stripe.Event): Promise<void>
  async cancelSubscription(userId: string): Promise<void>
  async resumeSubscription(userId: string): Promise<void>
  async getUserSubscription(userId: string): Promise<UserSubscription | null>
}
```

**Database Schema:**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) UNIQUE,
  plan VARCHAR(50) NOT NULL,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
```

**Webhook Handling:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Acceptance Criteria:**
- [ ] Stripe integration works end-to-end
- [ ] Users can subscribe and see immediate access
- [ ] Cancellation works correctly
- [ ] Webhooks update database in real-time
- [ ] Failed payments handled gracefully
- [ ] Invoices emailed automatically
- [ ] Subscription status synced with Stripe

**Files to Create:**
- `src/features/subscription/services/subscription.service.ts`
- `src/features/subscription/pages/PricingPage.tsx`
- `src/features/subscription/components/SubscriptionStatus.tsx`
- `api/stripe-checkout.ts`
- `api/stripe-webhook.ts`
- `supabase/migrations/YYYYMMDDHHMMSS_create_subscriptions.sql`

---

#### 3.1.2 Feature Gating System
- **Agent:** BE + FE
- **Status:** ⬜ Not Started
- **Priority:** P0 (Critical)
- **Estimated Time:** 8 hours
- **Dependencies:** Task 3.1.1

**Description:**
Implement system to control feature access based on subscription tier.

**Feature Matrix:**

| Feature | Free | Premium | Family |
|---------|------|---------|--------|
| AI News Articles | ✓ | ✓ | ✓ |
| Ads | Yes | No | No |
| Neural Voice (premium TTS) | ✗ | ✓ | ✓ |
| Voice Commands | 10/day | Unlimited | Unlimited |
| Bookmarks | 20 max | Unlimited | Unlimited |
| Offline Mode | ✗ | ✓ | ✓ |
| Breaking News Alerts (early) | ✗ | ✓ (5 min early) | ✓ (5 min early) |
| Weekly Deep-Dive Reports | ✗ | ✓ | ✓ |
| AI Chat | 20 messages/day | Unlimited | Unlimited |
| Search History | 7 days | Unlimited | Unlimited |
| Family Sharing | ✗ | ✗ | ✓ (5 members) |

**Implementation:**
```typescript
enum Feature {
  AI_NEWS = 'ai_news',
  PREMIUM_TTS = 'premium_tts',
  VOICE_COMMANDS = 'voice_commands',
  UNLIMITED_BOOKMARKS = 'unlimited_bookmarks',
  OFFLINE_MODE = 'offline_mode',
  EARLY_BREAKING_NEWS = 'early_breaking_news',
  DEEP_DIVE_REPORTS = 'deep_dive_reports',
  UNLIMITED_AI_CHAT = 'unlimited_ai_chat',
  UNLIMITED_SEARCH_HISTORY = 'unlimited_search_history',
}

class FeatureGateService {
  async hasAccess(userId: string, feature: Feature): Promise<boolean>
  async getRemainingQuota(userId: string, feature: Feature): Promise<number | 'unlimited'>
  async consumeQuota(userId: string, feature: Feature): Promise<boolean>
  async resetQuota(userId: string, feature: Feature): Promise<void>
}
```

**Usage in Components:**
```typescript
const { hasAccess, checkQuota } = useFeatureGate()

const handleVoiceCommand = async () => {
  if (!await hasAccess('voice_commands')) {
    showUpgradeModal('Voice commands are unlimited on Premium')
    return
  }
  
  const remaining = await checkQuota('voice_commands')
  if (remaining === 0) {
    showLimitReached()
    return
  }
  
  // Process voice command
}
```

**Upgrade Prompts:**
- Non-intrusive banners: "You have 5 voice commands left today. Go Premium for unlimited."
- Modal after quota exceeded: "You've reached your daily limit. Upgrade to continue."
- Feature preview: "Try offline mode free for 7 days"

**Acceptance Criteria:**
- [ ] All features correctly gated
- [ ] Quota tracking accurate
- [ ] Upgrade prompts are helpful, not annoying
- [ ] Premium users see no limits
- [ ] Free tier still valuable (not crippled)
- [ ] Grace period after subscription ends (3 days)

**Files to Create:**
- `src/shared/services/feature-gate.service.ts`
- `src/shared/hooks/useFeatureGate.ts`
- `src/features/subscription/components/UpgradeModal.tsx`
- `src/features/subscription/components/QuotaIndicator.tsx`

---

Due to length constraints, I'll create a separate continuation file. Let me mark the current progress:

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create 2026 implementation roadmap document", "status": "in_progress", "activeForm": "Creating 2026 implementation roadmap document"}, {"content": "Define task structure and agent requirements", "status": "completed", "activeForm": "Defining task structure and agent requirements"}, {"content": "Break down phases into actionable mini-phases", "status": "in_progress", "activeForm": "Breaking down phases into actionable mini-phases"}, {"content": "Add completion tracking system", "status": "pending", "activeForm": "Adding completion tracking system"}, {"content": "Create Phase 3 and 4 continuation document", "status": "in_progress", "activeForm": "Creating Phase 3 and 4 continuation document"}]