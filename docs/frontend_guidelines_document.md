# Frontend Guideline Document

This document lays out the frontend architecture, design principles, and technologies for the MyDub.AI platform. It’s written in everyday language so that anyone—technical or not—can understand how the frontend is built, why we chose certain tools, and how everything fits together.

---

## 1. Frontend Architecture

**Overview**
- We’re building a Single Page Application (SPA) using **React**. This means users navigate within one web page while React dynamically swaps in new content.
- **Vite** handles our build tooling. It starts up almost instantly and supports modern JavaScript features out of the box.
- All code is written in **TypeScript**, giving us type safety and clearer contracts in our code.
- **Tailwind CSS** provides utility‐first styling. We avoid large, custom CSS files and instead compose styles with small, reusable classes.
- **shadcn/ui** is our component library on top of Tailwind. It gives us ready‐made, accessible UI building blocks.
- We’ll eventually wrap this in **Expo** to create a Progressive Web App (PWA) and, if needed, native mobile apps.
- For data and auth, we talk to **Supabase** (PostgreSQL, Auth, Realtime) via its JavaScript client.
- Serverless Edge Functions will power any custom backend logic we need, keeping everything fast and geographically close to our users.

**Scalability, Maintainability & Performance**
- Modular folder structure (features, components, utils) keeps code organized as the app grows.
- Vite’s hot‐module replacement and fast rebuilds let developers iterate quickly.
- Code splitting and lazy loading ensure users only download what they need when they need it.
- Tailwind’s “purge” step strips out unused CSS, keeping our final bundle small.

---

## 2. Design Principles

1. **Usability**
   - Clear, predictable interactions. Buttons, links, and forms behave consistently.
   - Simple language and icons that match user expectations.

2. **Accessibility**
   - Built to WCAG guidelines: proper labels, keyboard‐navigable components, high color contrast.
   - All custom components use semantic HTML and ARIA attributes where needed.

3. **Responsiveness**
   - Mobile‐first approach: start designing for small screens and scale up.
   - Flexible layouts using CSS grid and Flexbox.

4. **Localization & RTL Support**
   - Full multi‐language support (English, Arabic, Hindi, Urdu).
   - Right‐to‐Left (RTL) styling automatically applied when Arabic is active.

5. **Personalization**
   - Layout and content adapt based on user role (Regular, Subscriber, Editor, Admin) and preferences.
   - Clear UI paths for subscribing, managing content, or editing.

---

## 3. Styling and Theming

**Approach**
- We use **Tailwind CSS** in a utility‐first manner. Our `tailwind.config.js` defines key design tokens (colors, spacing, typography).
- No separate CSS‐in‐JS or SCSS—just Tailwind classes and the shadcn/ui variants.

**Visual Style**
- A modern, flat design with subtle **glassmorphism** on select cards and overlays.
- Clean, spacious layouts that feel futuristic yet familiar.

**Color Palette**
- **Obsidian**: #0F0F0F (Primary dark background)
- **Gold Accent**: #D4AF37 (Buttons, highlights)
- **Pearl White**: #F8F8F8 (Backgrounds, cards)
- **Royal Violet**: #8F2D56 (Secondary buttons, links)

**Typography**
- Headings: **Playfair Display** (elegant serif)
- Body Text: **Inter** or **Neue Haas Grotesk** (legible sans‐serif)
- Buttons & CTAs: **Sora** or **Space Grotesk** (friendly, modern)

---

## 4. Component Structure

**Folder Layout** (example)
```
src/
  components/       # Reusable UI pieces (buttons, modals)
  features/         # Feature‐specific logic & views
    chatbot/
    dashboard/
    settings/
  hooks/            # Custom React hooks
  layouts/          # Page scaffolds (PublicLayout, ProtectedLayout)
  utils/            # Helper functions
  i18n/             # Localization setup
  App.tsx           # Root component
  main.tsx          # Entry point
```

- We follow a **component‐based** architecture: small “atoms” (Button), combined into “molecules” (SearchBar), up to “organisms” (Header).
- **shadcn/ui** provides base components. We wrap or extend them to match our brand.
- Every component has its own folder with `.tsx`, `.stub.tsx` for tests, and any styles inlined via Tailwind.

---

## 5. State Management

- **React Query (TanStack Query)** handles server state: fetching, caching, and updating data from Supabase and other APIs.
- **React Context** stores global UI state: theme (light/dark), current language, user session info.
- Supabase’s client library handles authentication state and real‐time subscriptions for live data.
- This hybrid approach keeps our UI snappy and our data layer organized.

---

## 6. Routing and Navigation

- **React Router** manages in‐app navigation.
  - Public routes (home, touristic info, news feed).
  - Protected routes under `/dashboard` for Subscribers, Editors, Admins.
  - Route guards (`<PrivateRoute>`) check user roles before rendering.
- URLs are prefixed by locale codes: `/en/home`, `/ar/home`.
- A top‐level `<NavBar>` and optional `<Sidebar>` guide users through core sections.

---

## 7. Performance Optimization

1. **Code Splitting & Lazy Loading**
   - Dynamic `import()` for heavy modules (chatbot, admin dashboard).
   - `<Suspense>` fallback spinners keep users informed.

2. **Asset Optimization**
   - SVG icons loaded as React components; raster images optimized via build pipeline.
   - Tailwind CSS purge removes unused styles.

3. **Caching & PWA**
   - Service Worker (via Expo) caches static assets and API responses for offline support.

4. **Fast Builds & HMR**
   - Vite gives near‐instant feedback during development.

---

## 8. Testing and Quality Assurance

- **Unit Tests**: Jest + React Testing Library for component logic and edge cases.
- **Integration Tests**: ensure components work together (forms, navigation flows).
- **End-to-End Tests**: Cypress simulates real user journeys (sign‐up, content submission).
- **Visual Regression**: (Optional) tools like Percy or Chromatic to catch UI changes.
- **Linting & Formatting**: ESLint with TypeScript rules, Prettier for consistent style.
- **Type Checking**: Strict TypeScript settings prevent many runtime errors.
- **CI/CD**: GitHub Actions runs tests, linting, and type checks on every pull request.

---

## 9. Conclusion and Overall Frontend Summary

MyDub.AI’s frontend blends modern tools—React, Vite, TypeScript, Tailwind, and shadcn/ui—with clear design principles around usability, accessibility, and performance. Our component‐based structure, combined with React Query and Context, ensures scalable state management. We support multiple languages (including RTL), real‐time updates via Supabase, and a roadmap toward PWA/native apps with Expo.

Together, these guidelines make sure any developer (or even a non‐technical stakeholder) can understand:
- **How** the UI is constructed
- **Why** we chose each tool
- **What** best practices keep our code clean, fast, and reliable

Following this document will help everyone build new features, fix bugs, and maintain a consistent, high‐quality user experience across the MyDub.AI platform.
