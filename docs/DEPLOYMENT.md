# Deployment Guide

This guide details the steps required to deploy Semantic Intel to a production environment.

## 1. Vercel Deployment

Semantic Intel is optimized for deployment on [Vercel](https://vercel.com).

1.  Connect your GitHub repository to Vercel.
2.  Configure the Following **Environment Variables**:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `OLLAMA_BASE_URL`
    - `OLLAMA_MODEL_CODE`
    - `OLLAMA_MODEL_VL`
    - `SUPABASE_SERVICE_ROLE_KEY` (if applicable for batch jobs)
3.  Click **Deploy**.

## 2. Supabase Configuration

### Authentication
1.  Enable **GitHub OAuth** in the Supabase Auth settings.
2.  Configure the GitHub Client ID and Secret obtained from your GitHub Developer Settings.

### Database
Ensure your database schema is up-to-date. Semantic Intel uses Supabase for:
- User profiles.
- Analysis history persistence.
- Caching of AST data.

### Storage
Create a bucket named `avatars` (public) if you intend to support user profile pictures.

## 3. AI Service (Ollama)

Ensure your `OLLAMA_BASE_URL` is accessible from your deployment environment. If you are using a local Ollama instance with a cloud deployment (like Vercel), you must use a tunneling service like **ngrok** to expose your local Ollama port to the internet and set that URL in your Vercel environment variables.

## 4. Performance Tuning

- **Edge Runtime**: Certain API routes can be configured to use the Edge Runtime for reduced latency.
- **Caching**: Stale-while-revalidate (SWR) patterns are used in the frontend to ensure a snappy user experience.
