// DEMO MODE: Supabase is fully stubbed out for frontend-only deployment.
// All auth and storage operations return safe no-op results.

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
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
        upsert: () => Promise.resolve({ data: null, error: null }),
    }),
    storage: {
        from: (_bucket: string) => ({
            upload: async () => ({ data: null, error: new Error('Demo mode — storage disabled') }),
            download: async () => ({ data: null, error: new Error('Demo mode — storage disabled') }),
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
    },
} as unknown as import('@supabase/supabase-js').SupabaseClient;
