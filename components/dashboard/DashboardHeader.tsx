"use client";

import { Share2, Download, GitMerge, Github, ChevronDown, Bell, Home, Save, X, Trash2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRepoStore } from "@/lib/RepoStore";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";

export default function DashboardHeader({
    repoName,
    onSettingsClick,
    onRefresh,
    onSave,
    githubStats,
    hideLiveAnalysis
}: {
    repoName: string,
    onSettingsClick?: () => void,
    onRefresh?: () => void,
    onSave?: () => void,
    githubStats?: { issues: number, stars: number, forks: number } | null,
    hideLiveAnalysis?: boolean

}) {
    const router = useRouter();
    const { user } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Clear all caches and go home
    const { clearData } = useRepoStore();

    const handleExit = () => {
        clearData(); // Clear global memory state
        if (typeof window !== 'undefined') {
            // Clear all repo-related caches
            const keysToRemove: string[] = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.includes('repo_cache') || key.includes('ai_architect') || key.includes('explorer_cache') || key.includes('unified_repo'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => sessionStorage.removeItem(key));
            console.log('🧹 Cleared all repo caches');
        }
        router.push('/');
    };

    // Notifications state
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (!error && data) {
                setNotifications(data);
            }
        };

        fetchNotifications();

        // Subscribe to changes
        const channel = supabase
            .channel('notifications_changes')
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
    }, [user]);

    const markAsRead = async (id?: string) => {
        if (!user) return;

        const query = supabase.from('notifications').update({ read: true });
        if (id) {
            await query.eq('id', id);
        } else {
            await query.eq('user_id', user.id);
        }
    };

    const deleteNotification = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!user) return;
        await supabase.from('notifications').delete().eq('id', id);
    };



    return (
        <header className="fixed top-0 left-0 right-0 z-40 h-16 glass border-b border-white/10 grid grid-cols-[auto_1fr_auto] items-center px-4 sm:px-6 gap-2 sm:gap-4">
            <div className="flex items-center gap-4">
                {/* Exit Button */}
                <button
                    onClick={handleExit}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/30 group"
                    title="Exit to Home"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="relative">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <Github className="w-5 h-5 text-black" />
                    </div>
                </div>
                <div className="hidden md:block">
                    <h1 className="font-bold text-sm sm:text-lg tracking-tight truncate max-w-[120px] sm:max-w-[200px]">{repoName}</h1>
                    <div className="flex items-center text-xs text-gray-400 gap-3">
                        <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                            <GitMerge className="w-3 h-3" />
                            <span>main</span>
                            <ChevronDown className="w-3 h-3" />
                        </div>
                        {githubStats && (
                            <div className="flex items-center gap-1 text-neon-cyan/80 bg-neon-cyan/5 px-2 py-0.5 rounded border border-neon-cyan/10">
                                <AlertCircle className="w-2.5 h-2.5" />
                                <span>{githubStats.issues} Issues</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs - Centered */}
            <div className="flex justify-center min-w-0">
                {/* Navigation Removed */}
            </div>

            <div className="flex items-center gap-1 sm:gap-3 justify-end">
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`p-2 rounded-lg transition-colors relative ${showNotifications ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-gray-300'}`}
                    >
                        <Bell className="w-5 h-5" />
                        {notifications.some(n => !n.read) && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-neon-pink rounded-full animate-pulse" />
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute top-12 right-0 w-80 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                            <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h3 className="font-bold text-sm">Notifications</h3>
                                {notifications.some(n => !n.read) && (
                                    <button
                                        onClick={() => markAsRead()}
                                        className="text-[10px] text-neon-cyan hover:underline"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            onClick={() => markAsRead(notification.id)}
                                            className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-3 group/item ${!notification.read ? 'bg-white/[0.02]' : ''}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notification.read ? 'bg-neon-pink' : 'bg-transparent'}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className={`text-sm truncate ${!notification.read ? 'font-semibold text-white' : 'text-gray-400'}`}>{notification.title}</h4>
                                                    <button
                                                        onClick={(e) => deleteNotification(e, notification.id)}
                                                        className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded transition-all"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                                                <span className="text-[10px] text-gray-600 mt-1 block">{new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        No notifications
                                    </div>
                                )}
                            </div>
                            <div className="p-2 text-center border-t border-white/10 bg-white/5">
                                <Link href="/notifications" className="text-xs text-neon-cyan hover:text-white transition-colors">View all updates</Link>
                            </div>
                        </div>
                    )}
                </div>




                {onSave && (
                    <button
                        onClick={onSave}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
                    >
                        <Save className="w-4 h-4" />
                        <span className="text-sm font-medium">Save</span>
                    </button>
                )}

                <button
                    onClick={() => {
                        const url = typeof window !== 'undefined' ? window.location.href : '';
                        navigator.clipboard.writeText(url).then(() => {
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        });
                    }}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
                >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm font-medium">{copied ? "Copied!" : "Share"}</span>
                </button>

                <Link href={`/report/${encodeURIComponent(repoName)}`} className="hidden lg:block">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan border border-neon-cyan/50 transition-all shadow-[0_0_15px_rgba(0,243,255,0.2)]">
                        <Download className="w-4 h-4" />
                        <span className="text-sm font-bold">Export Report</span>
                    </button>
                </Link>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-gray-400 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
            </div>
            {/* Mobile Nav Dropdown */}
            <div className={`col-span-3 md:hidden overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <nav className="flex flex-col gap-2 bg-white/5 p-4 rounded-xl border border-white/10">


                    <Link href="/tutorial" className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 rounded-md flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-neon-pink rounded-full" /> Tutorial
                    </Link>
                    <Link href="/profile" className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 rounded-md">Profile</Link>
                    <Link href="/settings" className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 rounded-md">Settings</Link>
                </nav>
            </div>
        </header>
    );
}
