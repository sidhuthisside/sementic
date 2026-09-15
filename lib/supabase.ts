// DEMO MODE: Supabase is stubbed out for the frontend-only demo deployment.
// All auth operations return no-op results so the app renders without a real Supabase project.

export const supabase = {
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: (_event: unknown, _cb: unknown) => ({
            data: { subscription: { unsubscribe: () => {} } },
        }),
        signOut: async () => ({ error: null }),
        signInWithOAuth: async () => ({ error: null }),
        signInWithPassword: async () => ({ data: { session: null, user: null }, error: null }),
    },
    from: (_table: string) => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null }),
    }),
    storage: {
        from: (_bucket: string) => ({
            upload: async () => ({ data: null, error: null }),
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
    },
} as unknown as import('@supabase/supabase-js').SupabaseClient;
