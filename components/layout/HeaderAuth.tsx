'use client';

// DEMO MODE: HeaderAuth shows a static demo user — no real GitHub OAuth.

import React, { useState } from 'react';
import { LogOut } from 'lucide-react';

interface HeaderAuthProps {
    openDirection?: 'up' | 'down';
}

const DEMO_USER = {
    email: 'demo@semanticintel.dev',
    name: 'Demo User',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=semanticintel',
};

export default function HeaderAuth({ openDirection = 'down' }: HeaderAuthProps) {
    const [showDropdown, setShowDropdown] = useState(false);

    // In demo mode, always show as "logged in"
    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
                    {DEMO_USER.email?.charAt(0).toUpperCase() || 'D'}
                </div>
            </button>

            {showDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                    />
                    <div className={`absolute right-0 w-56 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-xl z-50 py-1 ${openDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                        <div className="px-4 py-2 border-b border-white/5">
                            <p className="text-xs text-gray-500 mb-0.5">Signed in as</p>
                            <p className="text-sm text-white truncate">{DEMO_USER.email}</p>
                            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">Demo Mode</span>
                        </div>
                        <button
                            onClick={() => setShowDropdown(false)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 text-left"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
