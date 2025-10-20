[![CodeGuide](/codeguide-backdrop.svg)](https://codeguide.dev)

# MyDub.AI - Your AI-powered Dubai Companion

A modern AI-powered information platform for Dubai residents and tourists, built with React, TypeScript, and Supabase.

**Last Updated:** January 31, 2025

## Tech Stack

- **Framework:** [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- **Database:** [Supabase](https://supabase.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Data Management:** [TanStack Query](https://tanstack.com/query)
- **Form Handling:** [React Hook Form](https://react-hook-form.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Validation:** [Zod](https://zod.dev/)

## Prerequisites

Before you begin, ensure you have the following:

- Node.js 18+ installed
- A [Supabase](https://supabase.com/) account for database
- Generated project documents from [CodeGuide](https://codeguide.dev/) for best development experience

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd codeguide-vite-supabase
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Variables Setup**

   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Fill in the environment variables in `.env` (see Configuration section below)

4. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open [http://localhost:8001](http://localhost:8001) with your browser to see the result.**

## Configuration

### Supabase Setup

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Go to Project Settings > API
4. Copy the `Project URL` as `VITE_SUPABASE_URL`
5. Copy the `anon` public key as `VITE_SUPABASE_ANON_KEY`

## Environment Variables

See `.env.example` for a complete list of environment variables with descriptions.

### Required Variables:
```env
# Supabase (Required for core functionality)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional Variables:
- **AI Services**: `VITE_OPENROUTER_API_KEY`, `VITE_OPENAI_API_KEY`
- **External APIs**: NewsAPI, Eventbrite, OpenWeather
- **Analytics**: Google Analytics, Sentry
- **Email**: SendGrid configuration

#### Sentry (for QC alerts & breadcrumbs)
```env
# Enable Sentry breadcrumbs/alerts for Quality Control review actions
VITE_SENTRY_DSN=your_sentry_dsn
```

Check `.env.example` for the complete list and setup instructions.

## Features

- 📦 Supabase Database Integration
- 🎨 Modern UI with Tailwind CSS and Radix UI
- 🚀 Fast Development with Vite
- 🔄 Data Fetching with TanStack Query
- 📱 Responsive Design
- 🎭 Beautiful Animations with Framer Motion
- 📝 Type-Safe Forms with React Hook Form and Zod

### Quality Control Reviews
- Random Review panel at `/admin/quality-control`.
- Three views: `Content`, `Reader`, `Mobile`.
- Actions: `Approve`, `Flag`, `Reject`, `Request Revision`.
- Multi-criteria scoring with weighted overall score.
- Optional toggle to apply status change to `news_articles`.
- Reviews persisted to Supabase table `quality_reviews`.
- If Sentry is configured, breadcrumbs are recorded for:
  - Low overall score (< 80): `qc.low_score`
  - Flag/Reject actions: `qc.flag_or_reject`

## Project Structure

```
codeguide-vite-supabase/
├── src/                # Source files
│   ├── components/    # React components
│   ├── lib/          # Utility functions
│   ├── hooks/        # Custom hooks
│   └── types/        # TypeScript types
├── public/            # Static assets
└── documentation/     # Generated documentation from CodeGuide
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Documentation Setup

To implement the generated documentation from CodeGuide:

1. Create a `documentation` folder in the root directory:

   ```bash
   mkdir documentation
   ```

2. Place all generated markdown files from CodeGuide in this directory:

   ```bash
   # Example structure
   documentation/
   ├── project_requirements_document.md
   ├── app_flow_document.md
   ├── frontend_guideline_document.md
   └── backend_structure_document.md
   ```

3. These documentation files will be automatically tracked by git and can be used as a reference for your project's features and implementation details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

# Deployment test - Sun Jul  6 14:28:34 CEST 2025
