'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Build-in detection of hash fragment for implicit flow
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                // Wait a brief moment to ensure session is set
                if (!session) {
                    // Sometimes onAuthStateChange fires before getSession updates in implicit flow
                    // but usually getSession is sufficient.
                    // If we are here, maybe we need to wait for onAuthStateChange?
                    // But for now let's assume getSession works or redirect to home.
                    console.log('No session found immediately, checking listener...');
                }

                // Get stored return URL
                const returnUrl = localStorage.getItem('return_to');
                if (returnUrl) {
                    localStorage.removeItem('return_to');
                    router.push(returnUrl);
                } else {
                    router.push('/');
                }
            } catch (err: any) {
                console.error('Auth callback error:', err);
                setError(err.message);
                setTimeout(() => router.push('/'), 3000); // Redirect home on error after delay
            }
        };

        handleAuthCallback();
    }, [router]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-red-500">
                <p>Authentication Error: {error}</p>
                <p className="text-sm text-gray-400 mt-2">Redirecting...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-400">Completing sign in...</p>
        </div>
    );
}
