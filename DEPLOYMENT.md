# Vercel Deployment Guide

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/myFundtoFin)

## Manual Deployment Steps

### 1. Prepare Your Supabase Project

Before deploying to Vercel, ensure your Supabase database is set up:

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (or use existing)
3. Go to SQL Editor
4. Run the SQL from `supabase-schema.sql`
5. Note your Project URL and anon key from Settings > API

### 2. Deploy to Vercel

#### Option A: Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your account
3. Click **"Add New" > "Project"**
4. Import your repository (GitHub, GitLab, or Bitbucket)
5. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
7. Click **"Deploy"**

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
cd c:\Users\pongm\Documents\myFundtoFin
vercel

# Follow the prompts:
# - Set up and deploy: Y
# - Which scope: Select your account
# - Link to existing project: N
# - Project name: myFundtoFin (or your preferred name)
# - Directory: ./
# - Override settings: N

# Add environment variables interactively
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your Supabase anon key

# Deploy to production
vercel --prod
```

### 3. Configure Environment Variables (Post-Deployment)

If you didn't add env vars during deployment:

1. Go to your project in Vercel dashboard
2. Click **Settings**
3. Click **Environment Variables**
4. Add each variable:
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: Your Supabase project URL
   - Environment: All (Production, Preview, Development)
   - Click **Save**
5. Repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Redeploy: Go to **Deployments** > Click ⋯ on latest > **Redeploy**

### 4. Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** > **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `wealth.yourdomain.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (up to 48 hours)

### 5. Verify Deployment

1. Open your deployment URL (e.g., `https://my-fund-to-fin.vercel.app`)
2. Check browser console for errors
3. Try adding a cash account or stock to verify database connection
4. Check that prices fetch correctly

## Troubleshooting

### Build Fails

**Error**: "Module not found" or "Cannot find module"

```bash
# Locally test the build
npm run build

# If successful locally, check Vercel build logs
# Common issues:
# - Missing dependencies in package.json
# - TypeScript errors
# - Environment variable issues
```

**Error**: "NEXT_PUBLIC_SUPABASE_URL is not defined"

- Ensure environment variables are set in Vercel dashboard
- Check variable names are exactly correct (case-sensitive)
- Redeploy after adding variables

### Runtime Errors

**Error**: "Failed to fetch" or "Network error"

- Check Supabase project is active
- Verify environment variables in Vercel
- Check Supabase API keys haven't expired
- Check Supabase project URL is correct

**Error**: "Table does not exist"

- Run the SQL schema in Supabase SQL Editor
- Verify table names match exactly

### Performance Issues

**Slow page loads:**

1. Check Vercel Analytics (Dashboard > Analytics)
2. Review API routes performance
3. Consider upgrading Vercel plan for better performance
4. Optimize price caching (already set to 15 minutes)

## Production Best Practices

### 1. Enable Vercel Analytics

```bash
npm install @vercel/analytics
```

Add to `app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 2. Set Up Monitoring

- Use Vercel's built-in monitoring
- Check function logs: Dashboard > Project > Logs
- Set up error tracking (e.g., Sentry)

### 3. Database Backups

In Supabase:
- Go to Settings > Database
- Enable daily backups (Pro plan)
- Or manually export data regularly

### 4. Security

- Never commit `.env.local` to Git
- Keep Supabase keys secure
- Use Supabase RLS (Row Level Security) policies if adding auth
- Rotate API keys periodically

## Continuous Deployment

Once deployed, Vercel automatically redeploys when you push to your Git repository:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will:
1. Detect the push
2. Build the project
3. Run tests (if configured)
4. Deploy automatically

## Rollback

If something goes wrong:

1. Go to Vercel dashboard > **Deployments**
2. Find a previous working deployment
3. Click ⋯ > **Promote to Production**

## Cost

**Vercel:**
- Free tier: Unlimited hobby projects
- Pro: $20/month per user (if you need more performance)

**Supabase:**
- Free tier: Up to 500MB database, 50MB file storage
- Pro: $25/month (for production apps with more usage)

## Monitoring Your App

### Key Metrics to Watch

1. **Response Times**: Vercel Functions dashboard
2. **Error Rate**: Check Vercel Logs
3. **Database Usage**: Supabase Dashboard > Database
4. **API Limits**: Check if external APIs have rate limits

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

---

**Your app is now live! 🎉**

Access it at your Vercel URL and start tracking your wealth portfolio!
