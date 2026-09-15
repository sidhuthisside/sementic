# Supabase Storage Setup Guide

Since I cannot directly create Storage buckets via the code, you need to manually set this up in your Supabase project.

## 1. Create the Bucket

1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project.
3.  In the left sidebar, click on **Storage**.
4.  Click **New Bucket**.
5.  Enter the name: `reports`
6.  Ensure **Public bucket** is **CHECKED** (if you want these files to be publicly accessible via URL, which is usually easier for reports).
    *   *If you need them private, uncheck it, but you'll need to use signed URLs in the code.*
7.  Click **Save**.

## 2. Set Storage Policies (RLS)

By default, even public buckets might not allow uploads. You need to set Row Level Security (RLS) policies.

1.  Go to the **Configuration** tab in the Storage bucket you just created (`reports`), or click **Policies** in the Storage sidebar.
2.  Under **Bucket "reports"**, click **New Policy**.
3.  Choose **"For full customization"**.

### Policy for Uploads (Allow authenticated users to upload)
*   **Policy Name**: `Allow Authenticated Uploads`
*   **Allowed Operation**: `INSERT`
*   **Target Roles**: `authenticated` (or `anon` if you want to allow anyone without login)
*   **WITH CHECK expression**: `bucket_id = 'reports'`
*   Click **Review** -> **Save**.

### Policy for Public Read Access (If public)
*   *If you made the bucket public, this is usually handled automatically, but you can explicitly add:*
*   **Policy Name**: `Allow Public Read`
*   **Allowed Operation**: `SELECT`
*   **Target Roles**: `public`
*   **USING expression**: `bucket_id = 'reports'`

## 3. Usage in App

Now you can use the `uploadFile` function in `lib/storage.ts`.
