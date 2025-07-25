# Production Authentication Troubleshooting Guide

## Current Issues & Solutions

### ❌ Problem: "Something went wrong" during login

**Root Causes:**
1. Missing `NEXT_PUBLIC_BETTER_AUTH_URL` environment variable
2. Missing `NEXT_PUBLIC_TWITTER_CLIENT_ID` environment variable  
3. Twitter OAuth callback URL mismatch
4. Base URL resolution issues

### ✅ Solution Steps

#### 1. Vercel Environment Variables
Add these variables in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_BETTER_AUTH_URL=https://tweethunter-chi.vercel.app
NEXT_PUBLIC_TWITTER_CLIENT_ID=[your_twitter_client_id_here]
```

**Important:** Keep your existing variables, just ADD these new ones.

#### 2. Twitter Developer Portal
Verify these settings in your Twitter App:
- **Callback URLs**: `https://tweethunter-chi.vercel.app/api/auth/callback/twitter`
- **Website URL**: `https://tweethunter-chi.vercel.app`
- **App Type**: Web App (not Native)
- **Permissions**: Read and Write (if posting is needed)

#### 3. Debug Endpoints
After deployment, test these URLs:

1. **Config Check**: `https://tweethunter-chi.vercel.app/api/debug/production-config`
   - Should show all environment variables as "SET"
   - calculatedBaseURL should be your domain

2. **Auth Check**: `https://tweethunter-chi.vercel.app/api/debug/user-auth`
   - Test after attempting login
   - Shows session and account data

#### 4. Environment Variables Checklist

**Required Server Variables:**
- [x] `DATABASE_URL`
- [x] `BETTER_AUTH_SECRET` (32+ characters)
- [x] `TWITTER_CLIENT_ID`
- [x] `TWITTER_CLIENT_SECRET`
- [x] `OPENAI_API_KEY`
- [x] `TWITTERAPI_IO_API_KEY`
- [x] `GROK_API_KEY`

**Required Client Variables (NEXT_PUBLIC_):**
- [ ] `NEXT_PUBLIC_BETTER_AUTH_URL` ← **YOU'RE MISSING THIS**
- [ ] `NEXT_PUBLIC_TWITTER_CLIENT_ID` ← **YOU'RE MISSING THIS**

#### 5. Common Error Messages & Fixes

**"Configuration Error"**: Missing NEXT_PUBLIC_BETTER_AUTH_URL
**"OAuth Error"**: Check Twitter Developer Portal settings
**"Network Error"**: Base URL mismatch between client/server
**"Session Error"**: Database connection or Better Auth secret issue

#### 6. Verification Steps

1. Deploy with new environment variables
2. Visit `/api/debug/production-config` to verify config
3. Try login flow
4. If issues persist, check `/api/debug/user-auth` after login attempt
5. Check Vercel Function logs for detailed errors

#### 7. Emergency Rollback

If issues persist:
1. Verify locally with same environment variables
2. Check Vercel Function logs for specific errors
3. Ensure all environment variables are set to "Production" environment
4. Redeploy after making environment variable changes

## Success Indicators

✅ Config endpoint shows all variables as "SET"
✅ Login redirects to Twitter OAuth properly  
✅ Callback returns to your app successfully
✅ User session is created in database
✅ Dashboard loads with user data

## Still Having Issues?

1. Check Vercel Function logs during login attempt
2. Verify environment variables are set for "Production" environment
3. Test the same setup locally with production URLs
4. Ensure Twitter App has correct OAuth 2.0 settings 