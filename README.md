# Gym Membership Tracker

A modern web application for tracking gym memberships, built with Next.js, Supabase, and Tailwind CSS.

## Features

- Member dashboard with profile management
- Subscription tracking and status management
- Profile image handling with Supabase storage
- Responsive design with modern UI components

## Deployment on Vercel

### Prerequisites

1. A [Vercel](https://vercel.com) account
2. A [Supabase](https://supabase.com) project

### Environment Variables

Set up the following environment variables in your Vercel project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Deployment Steps

1. Push your code to a GitHub repository
2. Log in to your Vercel account
3. Click "New Project"
4. Import your GitHub repository
5. Configure the environment variables
6. Deploy!

### Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with the required environment variables
4. Run the development server:
   ```bash
   npm run dev
   ```

## Tech Stack

- Next.js 14
- Supabase
- Tailwind CSS
- TypeScript
- Shadcn UI
