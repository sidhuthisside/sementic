"use client";

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import HeaderAuth from './HeaderAuth';

interface MobileMenuProps {
    links?: Array<{ href: string; label: string; }>;
}

export default function MobileMenu({ links = [] }: MobileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    const defaultLinks = [
        { href: '/', label: 'Home' },
        { href: '/analyze-code', label: 'Live Analysis' },
        { href: '/tutorial', label: 'Tutorial' },
    ];

    const menuLinks = links.length > 0 ? links : defaultLinks;

    return (
        <>
            {/* Hamburger Button - Only visible on mobile */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                aria-label="Toggle menu"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-[280px] bg-[#0a0a0a] border-l border-white/10 z-50 md:hidden"
                        >
                            <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b border-white/10">
                                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                                        Architect AI
                                    </span>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Menu Links */}
                                <nav className="flex-1 overflow-y-auto p-4">
                                    <div className="space-y-2">
                                        {menuLinks.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.href}
                                                onClick={() => setIsOpen(false)}
                                                className="block px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors font-medium"
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                </nav>

                                {/* Auth Footer */}
                                <div className="p-4 border-t border-white/10">
                                    <HeaderAuth openDirection="up" />
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
