# Setting Up Supabase MCP Server

## Step 1: Get Your Supabase Access Token

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Give it a name: "MCP Server Access"
4. Select these scopes:
   - ✅ `content.read`
   - ✅ `content.write`
   - ✅ `auth.read`
   - ✅ `auth.write`
   - ✅ `realtime.read`
   - ✅ `storage.read`
   - ✅ `storage.write`
5. Click "Generate token"
6. Copy the token (you won't see it again!)

## Step 2: Configure Environment Variable

Create or update `.env.mcp` file:

```bash
# Create the file
touch .env.mcp

# Add your token
echo "SUPABASE_ACCESS_TOKEN=your_token_here" >> .env.mcp
```

## Step 3: Update MCP Configuration

Your `mcp.json` already has the Supabase server configured, but let's update it to use your project:

```json
"supabase": {
  "command": "npx",
  "args": [
    "-y",
    "@supabase/mcp-server-supabase@latest",
    "--access-token",
    "${SUPABASE_ACCESS_TOKEN}",
    "--project-ref",
    "pltutlpmamxozailzffm"
  ],
  "env": {
    "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
  }
}
```

## Step 4: Test the Connection

After setting up, restart Claude Desktop and I'll be able to:
- Execute SQL queries directly
- Manage storage buckets
- Update user permissions
- Apply database migrations
- And more!

## Alternative: Use Service Role Key

If you prefer, you can use your existing service role key:

```json
"supabase": {
  "command": "npx",
  "args": [
    "-y",
    "@supabase/mcp-server-supabase@latest",
    "--service-role-key",
    "${SUPABASE_SERVICE_ROLE_KEY}",
    "--project-url",
    "${VITE_SUPABASE_URL}"
  ],
  "env": {
    "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}",
    "VITE_SUPABASE_URL": "${VITE_SUPABASE_URL}"
  }
}
```

Then in `.env.mcp`:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://pltutlpmamxozailzffm.supabase.co
```

## Step 5: Restart Claude Desktop

1. Quit Claude Desktop completely
2. Start it again
3. The MCP server should connect automatically

## Troubleshooting

If it doesn't work:
1. Check the logs in Claude Desktop
2. Verify your token has the correct permissions
3. Make sure `.env.mcp` is in the right location
4. Try using the service role key method instead