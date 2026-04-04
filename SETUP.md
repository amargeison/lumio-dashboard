# SSO Setup Guide — Google Workspace & Microsoft 365

This guide walks through setting up OAuth providers so schools can sign in with their existing Google or Microsoft accounts.

---

## 1. Google Cloud Console — OAuth App Setup

### Create the OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select (or create) the project for Lumio
3. Navigate to **APIs & Services > Credentials**
4. Click **+ CREATE CREDENTIALS > OAuth client ID**
5. If prompted, configure the **OAuth consent screen** first:
   - User Type: **External**
   - App name: **Lumio for Schools**
   - User support email: your email
   - Authorised domains: `lumiocms.com`
   - Developer contact: your email
   - Scopes: add `email` and `profile` (under Google API)
   - Save and continue through all steps
6. Back on Credentials, click **+ CREATE CREDENTIALS > OAuth client ID**
7. Application type: **Web application**
8. Name: `Lumio Schools SSO`
9. Authorised redirect URIs — add:
   ```
   https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
   ```
   (Find your project ref in Supabase Dashboard > Settings > General)
10. Click **Create**
11. Copy the **Client ID** and **Client Secret**

### Notes
- For Google Workspace for Education domains, school admins may need to allow the OAuth app in their Google Admin console under **Security > API Controls > App Access Control**
- The app starts in "Testing" mode — add test users, or submit for verification when ready for production

---

## 2. Microsoft Azure — App Registration Setup

### Create the App Registration

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory > App registrations** (or search "App registrations")
3. Click **+ New registration**
4. Name: `Lumio for Schools`
5. Supported account types: **Accounts in any organizational directory (Any Azure AD directory - Multitenant)**
   - This allows any school's Microsoft 365 tenant to sign in
6. Redirect URI:
   - Platform: **Web**
   - URI:
     ```
     https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
     ```
7. Click **Register**

### Get Credentials

8. On the app overview page, copy the **Application (client) ID**
9. Go to **Certificates & secrets > + New client secret**
   - Description: `Lumio Supabase SSO`
   - Expiry: 24 months (set a calendar reminder to rotate)
   - Click **Add** and copy the **Value** (not the Secret ID)

### Set API Permissions

10. Go to **API permissions > + Add a permission**
11. Select **Microsoft Graph > Delegated permissions**
12. Add:
    - `email`
    - `openid`
    - `profile`
13. Click **Grant admin consent** (if you have admin rights) — otherwise school admins grant consent on first login

---

## 3. Supabase Dashboard — Paste Credentials

### Enable Google Provider

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication > Providers**
4. Find **Google** and toggle it **ON**
5. Paste:
   - **Client ID**: from Google Cloud Console (step 11)
   - **Client Secret**: from Google Cloud Console (step 11)
6. Save

### Enable Azure (Microsoft) Provider

1. Still in **Authentication > Providers**
2. Find **Azure** and toggle it **ON**
3. Paste:
   - **Client ID**: Application (client) ID from Azure (step 8)
   - **Client Secret**: Client secret value from Azure (step 9)
   - **Azure Tenant URL**: Leave as `https://login.microsoftonline.com/common` for multi-tenant
4. Save

### Verify Redirect URL

1. Go to **Authentication > URL Configuration**
2. Ensure your **Site URL** is set to: `https://lumiocms.com`
3. Under **Redirect URLs**, add:
   ```
   https://lumiocms.com/auth/schools-callback
   ```

---

## 4. Database Migration

Run the migration to add the `email_domain` column:

```sql
ALTER TABLE schools ADD COLUMN IF NOT EXISTS email_domain TEXT;
CREATE INDEX IF NOT EXISTS idx_schools_email_domain ON schools(email_domain) WHERE email_domain IS NOT NULL;
```

This is in `supabase/migrations/043_school_email_domain.sql`. Run it via the Supabase SQL Editor or CLI:

```bash
supabase db push
```

---

## 5. How It Works

1. User clicks "Continue with Google Workspace" or "Continue with Microsoft 365" on the schools login page
2. Supabase handles the OAuth flow via `signInWithOAuth`
3. On success, redirects to `/auth/schools-callback`
4. The callback:
   - Checks if the user already exists as a `school_user` (direct match by email)
   - If not, looks up the school by `email_domain` matching
   - If a school is found, auto-creates a `school_user` record with role `staff`
   - Redirects to `/schools/[slug]`
   - If no school matches, redirects back to login with an error message

---

## Testing Checklist

- [ ] Google OAuth: test with a personal Google account
- [ ] Google OAuth: test with a Google Workspace for Education account
- [ ] Microsoft OAuth: test with a personal Microsoft account
- [ ] Microsoft OAuth: test with a school's Microsoft 365 account
- [ ] Verify email domain matching works (register a school, then SSO with same domain)
- [ ] Verify error state when no school matches the domain
- [ ] Verify existing school_users can SSO without creating duplicate records
