# Environment Variables Setup

## Required Environment Variables

After the security improvements, you need to update your environment variables:

### Server-Side Only Variables (NOT exposed to client)

Add these to your `.env` or `.env.local` file:

```bash
# Brevo API Key (SERVER-SIDE ONLY - do NOT use NEXT_PUBLIC_ prefix)
BREVO_API_KEY=your_brevo_api_key_here

# Supabase Service Role Key (SERVER-SIDE ONLY - for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### Client-Side Variables (exposed to browser)

These should already be in your `.env.local`:

```bash
# Supabase URL (exposed to client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anon Key (exposed to client)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Migration Steps

1. **Remove old client-side Brevo key:**
   - Delete `NEXT_PUBLIC_BREVO_API_KEY` from your environment variables
   - Add `BREVO_API_KEY` (without `NEXT_PUBLIC_` prefix) instead

2. **Update deployment:**
   - If using Vercel: Update environment variables in Vercel dashboard
   - If using other hosting: Update environment variables in your hosting platform

3. **Run database migration:**
   ```bash
   # Apply the unique constraints migration
   supabase db push
   ```

4. **Install updated dependencies:**
   ```bash
   cd project
   npm install
   ```

5. **Restart development server:**
   ```bash
   npm run dev
   ```

## Security Notes

- **NEVER** commit `.env` files to version control
- **NEVER** use `NEXT_PUBLIC_` prefix for sensitive API keys
- Server-side variables are only accessible in server components and API routes
- Client-side variables are visible in the browser's developer tools
