import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get today's date in Abu Dhabi timezone (UTC+4)
    const now = new Date()
    const abuDhabiTime = new Date(now.getTime() + (4 * 60 * 60 * 1000)) // UTC+4
    const today = abuDhabiTime.toISOString().split('T')[0]

    // Check if we already have a phrase for today
    const { data: existingPhrase } = await supabase
      .from('daily_arabic_phrase')
      .select('*')
      .eq('display_date', today)
      .single()

    if (existingPhrase) {
      return new Response(
        JSON.stringify({ 
          message: 'Daily phrase already set for today',
          date: today,
          phrase_id: existingPhrase.phrase_id 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Get all active phrases
    const { data: phrases, error: phrasesError } = await supabase
      .from('arabic_phrases')
      .select('id')
      .eq('is_active', true)

    if (phrasesError || !phrases || phrases.length === 0) {
      throw new Error('No active phrases found')
    }

    // Use date-based seeding for consistent random selection
    const dateNumber = parseInt(today.replace(/-/g, ''))
    const randomIndex = dateNumber % phrases.length
    const selectedPhraseId = phrases[randomIndex].id

    // Insert the daily phrase
    const { error: insertError } = await supabase
      .from('daily_arabic_phrase')
      .insert({
        phrase_id: selectedPhraseId,
        display_date: today
      })

    if (insertError) {
      throw insertError
    }

    return new Response(
      JSON.stringify({ 
        message: 'Daily Arabic phrase updated successfully',
        date: today,
        phrase_id: selectedPhraseId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error updating daily Arabic phrase:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

// To schedule this function to run daily at 7 AM Abu Dhabi time:
// 1. Deploy this edge function to Supabase
// 2. Set up a cron job using Supabase's pg_cron extension:
//    SELECT cron.schedule(
//      'update-daily-arabic-phrase',
//      '0 3 * * *', -- 3 AM UTC = 7 AM Abu Dhabi time (UTC+4)
//      $$
//      SELECT net.http_post(
//        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/update-daily-arabic-phrase',
//        headers := jsonb_build_object(
//          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
//          'Content-Type', 'application/json'
//        )
//      );
//      $$
//    );