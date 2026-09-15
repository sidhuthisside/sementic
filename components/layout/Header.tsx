
'use client';

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import HeaderAuth from './HeaderAuth';
import MobileMenu from './MobileMenu';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const { scrollY } = useScroll();
    const pathname = usePathname();

    useMotionValueEvent(scrollY, "change", (latest: number) => {
        setIsScrolled(latest > 50);
    });

    // Hide header on dashboard pages that have their own header
    if (pathname.startsWith('/analyze/') ||
        pathname.startsWith('/explorer/') ||
        pathname.startsWith('/compare/') ||
        pathname.startsWith('/profile/') ||
        pathname.startsWith('/ai-architect/') ||
        pathname.startsWith('/report/')) {
        return null;
    }

    return (
        <motion.header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/50 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
                }`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    {/* You can add a logo here */}
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        Architect AI
                    </span>
                </Link>

                {/* Desktop Auth - Hidden on mobile */}
                <div className="hidden md:block">
                    <HeaderAuth />
                </div>

                {/* Mobile Menu - Only visible on mobile */}
                <MobileMenu />
            </div>
        </motion.header>
    );
}
