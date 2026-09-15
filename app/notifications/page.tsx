'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    Trash2,
    CheckCircle2,
    Clock,

    ArrowLeft,
    Loader2,
    AlertCircle,
    Info
} from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let query = supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (filter === 'unread') {
                query = query.eq('read', false);
            } else if (filter === 'read') {
                query = query.eq('read', true);
            }

            const { data, error } = await query;
            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Subscribe to changes
        if (!user) return;
        const channel = supabase
            .channel('notifications_page_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, filter]);

    const markAsRead = async (id: string) => {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
    };

    const markAllRead = async () => {
        if (!user) return;
        await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
    };

    const deleteNotification = async (id: string) => {
        await supabase.from('notifications').delete().eq('id', id);
    };

    const clearAll = async () => {
        if (!user) return;
        if (confirm('Are you sure you want to delete all notifications?')) {
            await supabase.from('notifications').delete().eq('user_id', user.id);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'analysis': return <AlertCircle className="w-5 h-5 text-blue-400" />;
            case 'update': return <Info className="w-5 h-5 text-green-400" />;
            default: return <Bell className="w-5 h-5 text-gray-400" />;
        }
    };

    if (authLoading) return null;

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-24 px-6 relative overflow-hidden text-white flex flex-col items-center">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

            <div className="w-full max-w-4xl">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Bell className="w-8 h-8 text-blue-500" />
                            Notifications
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {notifications.some(n => !n.read) && (
                            <button
                                onClick={markAllRead}
                                className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium border border-blue-500/30 transition-all"
                            >
                                Mark all as read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAll}
                                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium border border-red-500/30 transition-all"
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 mb-6 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
                    {(['all', 'unread', 'read'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <p className="text-gray-400">Loading notifications...</p>
                        </div>
                    ) : notifications.length > 0 ? (
                        <AnimatePresence initial={false}>
                            {notifications.map((n) => (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`group p-6 rounded-2xl border transition-all flex gap-4 ${n.read ? 'bg-white/5 border-white/10 opacity-70' : 'bg-white/[0.08] border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]'}`}
                                >
                                    <div className="shrink-0 mt-1">
                                        {getTypeIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <h3 className={`font-bold text-lg mb-1 ${!n.read ? 'text-white' : 'text-gray-300'}`}>
                                                    {n.title}
                                                    {!n.read && <span className="ml-3 inline-block w-2 h-2 bg-blue-500 rounded-full" />}
                                                </h3>
                                                <p className="text-gray-400 leading-relaxed">{n.message}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {!n.read && (
                                                    <button
                                                        onClick={() => markAsRead(n.id)}
                                                        className="p-2 bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 rounded-lg transition-colors border border-transparent hover:border-blue-500/30"
                                                        title="Mark as read"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(n.id)}
                                                    className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Clock size={14} />
                                                {new Date(n.created_at).toLocaleString()}
                                            </div>
                                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                                            <span className="uppercase tracking-wider font-bold text-[10px] text-blue-500/80">{n.type}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="py-20 text-center bg-white/5 border border-white/10 rounded-3xl">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="w-8 h-8 text-gray-600" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">No notifications found</h2>
                            <p className="text-gray-400">Everything is up to date!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
