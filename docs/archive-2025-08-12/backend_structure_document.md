# Implementation Plan for MyDub.AI

This step-by-step plan will guide you from project setup through to production launch. We’ve broken the work into clear milestones so the team knows what to do and when.

---

## Milestone 1: Project Setup & Infrastructure

1. **Clone the Starter Kit**
   - Clone the React + Supabase starter repo: `https://github.com/codeGuide-dev/codeguide-vite-supabase`
   - Install dependencies (`npm install` or `yarn install`).
   - Verify the dev server runs (`npm run dev`).

2. **Provision Supabase Project**
   - Create a new Supabase project in the Middle East region for UAE data residency.
   - Obtain API keys and update `.env` with:
     • `SUPABASE_URL`  
     • `SUPABASE_ANON_KEY`  
     • `SUPABASE_SERVICE_ROLE_KEY` (securely)

3. **Configure Authentication**
   - Enable email/password sign-up.
   - Enable social logins (Google, Apple) if desired.
   - Set up role-based access: `user`, `subscriber`, `editor`, `admin`.

4. **Set Up Frontend Hosting**
   - Decide on AWS S3 + CloudFront or AWS Amplify for static hosting.  
   - Prepare CloudFront distribution with HTTPS and custom domain.
   - Configure CI/CD (GitHub Actions) to automatically deploy on push to `main`.

---

## Milestone 2: Database Schema & Real-Time Data

1. **Design and Create Database Tables**
   - **Users**: id, email, name, role, language, onboardingComplete flag
   - **Preferences**: user_id, user_type, categories[], language, tourist_options, resident_options, business_options
   - **Content**: id, title, body, category, source, published_at, language, approved_by
   - **ChatSessions**: id, user_id, persona, created_at
   - **Messages**: id, session_id, sender (user/AI), content, timestamp
   - **RealTimeData**: id, data_type (weather, traffic, government), payload (JSON), updated_at
   - **Logs**: id, user_id, action, details, timestamp

   Implement these tables in Supabase SQL editor or via migration scripts.

2. **Integrate External Data Sources**
   - Create Supabase Edge Functions for:
     • Dubai Government Open Data Portal  
     • Gulf News API  
     • Khaleej Times API
   - Each function should fetch, transform, and upsert data into the `RealTimeData` and `Content` tables on a schedule (cron jobs).

3. **Realtime Subscriptions**
   - Use Supabase’s real-time feature to push government and news updates to connected clients.

---

## Milestone 3: Core Backend Logic & AI Integration

1. **AI Chatbot Endpoints**
   - Build Edge Functions to handle chat requests:  
     • Receive user message, chat persona  
     • Call OpenAI GPT-4, Anthropic Claude, or Gemini APIs with persona-specific prompts  
     • Return AI response and log the message

2. **Content Recommendation Engine**
   - Implement a simple hybrid recommendation:  
     • Fetch user preferences  
     • Score available `Content` records based on category, popularity, recency  
     • Return top-N personalized items

3. **Search & Discovery**
   - Leverage PostgreSQL full-text search on the `Content` table.  
   - Create an API endpoint (Edge Function) to accept search queries and return paginated results.

4. **Localization & Translation**
   - Add i18n to the frontend using `react-i18next`.  
   - Store translation files for English, Arabic (RTL), Hindi, Urdu.  
   - Optionally integrate a translation API for on-the-fly content translation.

---

## Milestone 4: Frontend Features & Admin Dashboard

1. **User Onboarding Flow**
   - Language selection screen.  
   - Sign-up / Login (email or social).  
   - Ask user type (resident, tourist, business).  
   - Show preference questionnaire (categories, transport, budget, etc.).  
   - Save preferences to Supabase.

2. **Main App Screens**
   - **Home Feed**: personalized content cards with infinite scroll.  
   - **Real-Time Updates**: government bulletins, news tickers.  
   - **Chatbot**: chat interface with persona selector.  
   - **Search**: global search bar with filters.

3. **Admin Dashboard**
   - **Curator View**: list incoming content, mark for review.  
   - **Editor View**: edit content, correct metadata, approve/reject.  
   - **Admin View**: manage users, roles, system settings.
   - Use Shadcn UI components for tables, forms, modals.

---

## Milestone 5: Security, Monitoring & Deployment

1. **Security & Compliance**
   - Enforce Row-Level Security (RLS) in Supabase:  
     • Only allow users to read their own data  
     • Only allow editors/admins to modify content
   - Ensure all communication is HTTPS.  
   - Encrypt sensitive fields at rest if needed.
   - Add user consent banner for data collection.

2. **Testing Strategy**
   - Unit tests for Edge Functions and React components.  
   - Integration tests for signup, chat, data fetch flows.
   - Use GitHub Actions to run tests on every pull request.

3. **Performance Monitoring**
   - Enable Supabase logs and alerts for function errors.  
   - Integrate Sentry for frontend error tracking.  
   - Use AWS CloudWatch for CDN and hosting metrics.

4. **Final Deployment**
   - Deploy Edge Functions to Supabase production.  
   - Deploy frontend to AWS (Amplify or S3+CloudFront).  
   - Point DNS to your CloudFront distribution.  
   - Do a soft launch with internal users, gather feedback.

5. **Post-Launch Maintenance**
   - Schedule regular data sync jobs and database backups.  
   - Review logs weekly for errors or slow queries.  
   - Plan periodic security audits and dependency updates.

---

## Timeline & Next Steps

- Week 1–2: Milestone 1 & 2 complete (setup, schema, data integration).
- Week 3–4: Milestone 3 complete (AI chat, recs, search).
- Week 5–6: Milestone 4 complete (UI, admin).
- Week 7: Security hardening, testing.
- Week 8: Deployment, monitoring, soft launch.

With this plan, you’ll build a solid foundation, iterate quickly on features, and ensure a smooth, secure launch of MyDub.AI. Good luck!