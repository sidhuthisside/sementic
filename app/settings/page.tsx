'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getRedirectUrl } from '@/lib/auth-helpers';
import {
    User,
    Settings,
    Github,
    Bell,
    Mail,
    Save,
    Loader2,
    Check,
    AlertCircle,
    CheckCircle2,
    LogOut
} from 'lucide-react';

export default function SettingsPage() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile State
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    // Notification State
    const [notifPreferences, setNotifPreferences] = useState({
        analysis: true,
        updates: true,
        security: true,
        email: false
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, username, avatar_url')
                .eq('id', user?.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data) {
                setName(data.full_name || '');
                setUsername(data.username || '');
                setAvatarUrl(data.avatar_url || '');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const updateProfile = async () => {
        try {
            setSaving(true);
            setMessage(null);
            const updates = {
                id: user?.id,
                full_name: name,
                username,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            };

            const { error: profileError } = await supabase.from('profiles').upsert(updates);
            if (profileError) throw profileError;

            // Also update Auth metadata to keep everything in sync
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    full_name: name,
                    username: username,
                    avatar_url: avatarUrl
                }
            });
            if (authError) throw authError;

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setSaving(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${user?.id}/${Math.random()}.${fileExt}`; // Use folder for RLS

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);

            // Allow user to save manually or auto-save here if preferred. 
            // For now, update state and let user click save.
            const updates = {
                id: user?.id,
                avatar_url: data.publicUrl,
                updated_at: new Date().toISOString(),
            };
            await supabase.from('profiles').upsert(updates);
            setMessage({ type: 'success', text: 'Avatar updated!' });

        } catch (error) {
            console.error('Error uploading avatar:', error);
            setMessage({ type: 'error', text: 'Error uploading avatar.' });
        } finally {
            setSaving(false);
        }
    };

    const handleGithubConnect = async () => {
        try {
            localStorage.setItem('return_to', '/settings');

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    scopes: 'repo read:user',
                    redirectTo: getRedirectUrl('settings')
                }
            });
            if (error) throw error;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            setMessage({ type: 'error', text: errorMessage });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-24 px-6 relative overflow-hidden text-white flex flex-col items-center">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

            <div className="w-full max-w-4xl">
                <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <Settings className="w-8 h-8 text-blue-500" />
                    Settings
                </h1>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <aside className="w-full md:w-64 space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            <User size={18} />
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('account')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'account' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            <Github size={18} />
                            Connections & Account
                        </button>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 min-h-[500px]">
                        {message && (
                            <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                                {message.text}
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h2 className="text-xl font-bold border-b border-white/10 pb-4">Public Profile</h2>

                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-bold shadow-lg">
                                            {avatarUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                user?.email?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-500 transition-colors shadow-lg">
                                            <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={saving} />
                                            <div className="w-4 h-4 text-white">
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings size={14} />}
                                            </div>
                                        </label>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-lg text-white">Profile Photo</h3>
                                        <p className="text-sm text-gray-400">Click the icon to upload a new one.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-400 uppercase">Full Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-400 uppercase">Username</label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                                            placeholder="@johndoe"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={updateProfile}
                                        disabled={saving}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Changes
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'account' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                <h2 className="text-xl font-bold border-b border-white/10 pb-4">Connections & Account</h2>

                                {/* GitHub Connection */}
                                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                                            <Github className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">GitHub</h3>
                                            <p className="text-sm text-gray-400">Connect your GitHub account to analyze private repositories.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleGithubConnect}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        {user?.app_metadata?.provider === 'github' ? 'Connected' : 'Connect GitHub'}
                                    </button>
                                </div>

                                {/* Notification Preferences */}
                                <div className="space-y-6">
                                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                                <Bell className="w-6 h-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">Notification Preferences</h3>
                                                <p className="text-sm text-gray-400">Control how and when you receive updates.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {[
                                                { id: 'analysis', label: 'Analysis Reports', desc: 'When a repository analysis finishes or discovers insights.' },
                                                { id: 'updates', label: 'System Updates', desc: 'New feature announcements and platform updates.' },
                                                { id: 'security', label: 'Security Alerts', desc: 'Alerts regarding account security and connections.' }
                                            ].map((pref) => (
                                                <div key={pref.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                                    <div>
                                                        <p className="font-medium text-white">{pref.label}</p>
                                                        <p className="text-xs text-gray-500">{pref.desc}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setNotifPreferences(prev => ({ ...prev, [pref.id]: !prev[pref.id as keyof typeof prev] }))}
                                                        className={`w-12 h-6 rounded-full transition-all relative ${notifPreferences[pref.id as keyof typeof notifPreferences] ? 'bg-blue-600' : 'bg-white/10'}`}
                                                    >
                                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifPreferences[pref.id as keyof typeof notifPreferences] ? 'left-7' : 'left-1'}`} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-white/10">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Mail className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="font-medium text-white">Email Daily Digest</p>
                                                        <p className="text-xs text-gray-500">Get a summary of all notifications in your inbox.</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setNotifPreferences(prev => ({ ...prev, email: !prev.email }))}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${notifPreferences.email ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}
                                                >
                                                    {notifPreferences.email ? 'Enabled' : 'Disable'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                                                <CheckCircle2 size={20} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white">Manage History</h4>
                                                <p className="text-sm text-gray-400">View and clear your entire notification history.</p>
                                            </div>
                                        </div>
                                        <Link
                                            href="/notifications"
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
                                        >
                                            Open Inbox
                                        </Link>
                                    </div>
                                </div>


                                {/* Sign Out */}
                                <div className="pt-8 border-t border-white/10">
                                    <button
                                        onClick={() => signOut()}
                                        className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <LogOut size={16} />
                                        Sign out of all devices
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
