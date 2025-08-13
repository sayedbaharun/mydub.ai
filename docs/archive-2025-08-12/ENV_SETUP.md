# Environment Variables Setup for MyDub.AI

## Required Environment Variables

To ensure all features work properly, you need to set the following environment variables in your Vercel dashboard:

### Core APIs

1. **Weather API** (Choose one):
   - `VITE_WEATHERAPI_KEY` - Get from [weatherapi.com](https://www.weatherapi.com/signup.aspx)
   - OR `VITE_OPENWEATHER_API_KEY` - Get from [OpenWeatherMap](https://openweathermap.org/api)

2. **Exchange Rates API**:
   - `VITE_FIXER_API_KEY` - Get from [fixer.io](https://fixer.io/signup/free)

3. **News API**:
   - `VITE_NEWS_API_KEY` - Get from [newsapi.org](https://newsapi.org/register)

### Supabase Configuration

4. **Database**:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for server-side operations)

### AI Services (Optional)

5. **OpenAI**:
   - `VITE_OPENAI_API_KEY` - For AI chat features

6. **OpenRouter**:
   - `VITE_OPENROUTER_API_KEY` - Alternative AI provider

### Analytics (Optional)

7. **Google Analytics**:
   - `VITE_GA_MEASUREMENT_ID` - Google Analytics tracking ID

8. **Sentry**:
   - `VITE_SENTRY_DSN` - For error tracking

## Setting Up in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with its corresponding value
4. Make sure to add them for both Production and Preview environments
5. Redeploy your application after adding the variables

## Fallback Behavior

The application is designed to work even without these API keys:

- **Weather**: Shows realistic Dubai weather data
- **Exchange Rates**: Shows approximate AED exchange rates
- **News**: Shows sample news articles

However, for production use, it's recommended to configure all API keys for real-time data.

## Testing Locally

Create a `.env.local` file in your project root:

```env
VITE_WEATHERAPI_KEY=your_key_here
VITE_FIXER_API_KEY=your_key_here
VITE_NEWS_API_KEY=your_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Never commit this file to version control!