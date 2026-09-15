
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GitBranch, Calendar, ArrowRight, Trash2, Settings } from 'lucide-react';
import Link from 'next/link';

interface SavedRepo {
    id: string;
    repo_name: string;
    repo_url: string;
    searched_at: string;
}

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [repos, setRepos] = useState<SavedRepo[]>([]);
    const [fetching, setFetching] = useState(true);

    // Profile State
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchSavedRepos();
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



    const fetchSavedRepos = async () => {
        try {
            const { data, error } = await supabase
                .from('searched_repos')
                .select('*')
                .order('searched_at', { ascending: false });

            if (error) throw error;
            setRepos(data || []);
        } catch (error) {
            console.error('Error fetching repos:', error);
        } finally {
            setFetching(false);
        }
    };

    const deleteRepo = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation
        if (!confirm('Are you sure you want to delete this saved analysis?')) return;

        try {
            const { error } = await supabase
                .from('searched_repos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setRepos(repos.filter(repo => repo.id !== id));
        } catch (error) {
            console.error('Error deleting repo:', error);
        }
    }

    if (loading || fetching) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-24 px-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

            <div className="max-w-6xl mx-auto space-y-12">
                {/* Profile Header & Edit Form */}
                <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-white/10 items-center md:items-start text-center md:text-left">
                    <div className="relative group">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-blue-500/20 border-4 border-[#0a0a0a]">
                            {avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                user?.email?.charAt(0).toUpperCase()
                            )}
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-1">{name || 'User Profile'}</h1>
                                <p className="text-gray-400">{user?.email}</p>
                                {username && <p className="text-blue-400 text-sm mt-1">@{username}</p>}
                            </div>
                            <Link
                                href="/settings"
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <Settings size={16} />
                                Edit Profile
                            </Link>
                        </div>

                        <div className="flex items-center gap-6 pt-4">
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-white">{repos.length}</span>
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Saved Analyses</span>
                            </div>
                            {/* We can add more stats here later */}
                        </div>
                    </div>
                </div>

                {/* Saved Repositories - kept as is */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <GitBranch className="text-blue-500" />
                        Saved Analyses
                    </h2>

                    {repos.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-gray-400 mb-4">No saved analyses yet.</p>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                            >
                                Analyze a Repository
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {repos.map((repo) => (
                                <motion.div
                                    key={repo.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group relative bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10"
                                >
                                    <Link href={`/analyze/${encodeURIComponent(repo.repo_name)}`}> {/* Use repo_name for consistent ID normalization */}
                                        <div className="flex justify-between items-start mb-4 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 z-10">
                                            <button
                                                onClick={(e) => deleteRepo(repo.id, e)}
                                                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <h3 className="text-xl font-semibold text-white mb-2 truncate pr-8">
                                            {repo.repo_name}
                                        </h3>
                                        <p className="text-sm text-gray-400 mb-4 truncate">
                                            {repo.repo_url}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Calendar size={14} />
                                                {new Date(repo.searched_at).toLocaleDateString()}
                                            </div>
                                            <span className="text-blue-400 group-hover:translate-x-1 transition-transform">
                                                <ArrowRight size={18} />
                                            </span>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
