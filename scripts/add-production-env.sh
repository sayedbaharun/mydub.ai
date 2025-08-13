#!/bin/bash

# Script to add missing production environment variables to Vercel

echo "Adding missing production environment variables..."

# Optional but recommended for production
vercel env add VITE_SENTRY_DSN production
vercel env add VITE_GA_MEASUREMENT_ID production

# Email service (optional)
vercel env add SENDGRID_API_KEY production
vercel env add SENDGRID_FROM_EMAIL production

# Optional external APIs
vercel env add VITE_NEWS_API_KEY production
vercel env add VITE_GOOGLE_MAPS_API_KEY production
vercel env add VITE_OPENWEATHER_API_KEY production

echo "Environment variables added. Please fill in the values in the Vercel dashboard."