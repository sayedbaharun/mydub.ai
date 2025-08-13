-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    persona_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Chat',
    title_ar TEXT NOT NULL DEFAULT 'محادثة جديدة',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON public.chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions
DO $$ BEGIN
    CREATE POLICY "Users can view their own chat sessions"
        ON public.chat_sessions FOR SELECT
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can create their own chat sessions"
        ON public.chat_sessions FOR INSERT
        WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own chat sessions"
        ON public.chat_sessions FOR UPDATE
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their own chat sessions"
        ON public.chat_sessions FOR DELETE
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- RLS Policies for chat_messages
DO $$ BEGIN
    CREATE POLICY "Users can view messages from their sessions"
        ON public.chat_messages FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.chat_sessions
                WHERE chat_sessions.id = chat_messages.session_id
                AND chat_sessions.user_id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can create messages in their sessions"
        ON public.chat_messages FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.chat_sessions
                WHERE chat_sessions.id = session_id
                AND chat_sessions.user_id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete messages from their sessions"
        ON public.chat_messages FOR DELETE
        USING (
            EXISTS (
                SELECT 1 FROM public.chat_sessions
                WHERE chat_sessions.id = chat_messages.session_id
                AND chat_sessions.user_id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.chat_sessions TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;