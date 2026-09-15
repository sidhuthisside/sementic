'use client';

// DEMO MODE: Auth context is stubbed with a static demo user.
// No real Supabase sessions are used — the app is always "logged in" as a demo user.

import React, { createContext, useContext } from 'react';

interface AuthContextType {
    session: null;
    user: { id: 'demo-user'; email: 'demo@semanticintel.dev'; user_metadata: { full_name: string; avatar_url: string } } | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const DEMO_USER: AuthContextType['user'] = {
    id: 'demo-user',
    email: 'demo@semanticintel.dev',
    user_metadata: {
        full_name: 'Demo User',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=semanticintel',
    },
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: DEMO_USER,
    loading: false,
    signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <AuthContext.Provider value={{ session: null, user: DEMO_USER, loading: false, signOut: async () => {} }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
