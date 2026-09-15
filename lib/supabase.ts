// DEMO MODE: Supabase is fully stubbed — no real Supabase project needed.
// All methods return safe no-op results so the app runs without crashing.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noopQuery: any = {
    select: () => noopQuery,
    insert: () => noopQuery,
    update: () => noopQuery,
    delete: () => noopQuery,
    upsert: () => noopQuery,
    order: () => noopQuery,
    limit: () => noopQuery,
    eq: () => noopQuery,
    neq: () => noopQuery,
    gt: () => noopQuery,
    gte: () => noopQuery,
    lt: () => noopQuery,
    lte: () => noopQuery,
    like: () => noopQuery,
    ilike: () => noopQuery,
    in: () => noopQuery,
    contains: () => noopQuery,
    filter: () => noopQuery,
    match: () => noopQuery,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: (v: { data: never[]; error: null }) => void) =>
        Promise.resolve({ data: [], error: null }).then(resolve),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noopChannel: any = {
    on: () => noopChannel,
    subscribe: () => noopChannel,
    unsubscribe: () => noopChannel,
};

export const supabase = {
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: (_event: unknown, _cb: unknown) => ({
            data: { subscription: { unsubscribe: () => {} } },
        }),
        signOut: async () => ({ error: null }),
        signInWithOAuth: async () => ({ data: null, error: null }),
        signInWithPassword: async () => ({ data: { session: null, user: null }, error: null }),
        signUp: async () => ({ data: { session: null, user: null }, error: null }),
        updateUser: async () => ({ data: { user: null }, error: null }),
        resetPasswordForEmail: async () => ({ data: null, error: null }),
    },
    from: (_table: string) => noopQuery,
    channel: (_name: string) => noopChannel,
    removeChannel: (_channel: unknown) => Promise.resolve(),
    storage: {
        from: (_bucket: string) => ({
            upload: async () => ({ data: null, error: new Error('Demo mode — storage disabled') }),
            download: async () => ({ data: null, error: new Error('Demo mode — storage disabled') }),
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
            remove: async () => ({ data: null, error: null }),
            list: async () => ({ data: [], error: null }),
        }),
    },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as unknown as import('@supabase/supabase-js').SupabaseClient;
