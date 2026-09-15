import { useState, useEffect } from "react";
import { X, Search, Github, Lock, Globe, Loader2, LogOut, ExternalLink } from "lucide-react";
import { fetchUserRepos, GithubRepo } from "@/lib/githubFetcher";
import { useRouter } from "next/navigation";

// DEMO MODE: next-auth replaced with static demo session
const useSession = () => ({ data: { user: { email: 'demo@semanticintel.dev', name: 'Demo User' }, accessToken: null } });
const signIn = () => {};
const signOut = () => {};

interface RepoBrowserModalProps {
    onClose: () => void;
}

export default function RepoBrowserModal({ onClose }: RepoBrowserModalProps) {
    const { data: session } = useSession();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessToken = (session as any)?.accessToken;

    const [repos, setRepos] = useState<GithubRepo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (accessToken) {
            loadRepos(accessToken);
        }
    }, [accessToken]);

    const loadRepos = async (authToken: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchUserRepos(authToken);
            if (Array.isArray(data)) {
                setRepos(data);
            } else {
                setError("Failed to fetch repositories. You may need to grant access.");
            }
        } catch {
            setError("Network error or invalid token.");
        } finally {
            setLoading(false);
        }
    };

    const handleGithubConnect = () => {
        signIn('github');
    };

    const handleSignOut = () => {
        signOut();
        setRepos([]);
    };

    const handleSelectRepo = (repo: GithubRepo) => {
        const repoPath = repo.full_name;
        router.push(`/analyze/${encodeURIComponent(repoPath)}`);
        onClose();
    };

    const filteredRepos = repos.filter(repo =>
        repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <Github className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">GitHub Repositories</h2>
                            <p className="text-xs text-gray-400">Browse and analyze your repositories</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {!accessToken ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                            <div className="max-w-md space-y-6">
                                <h3 className="text-lg font-semibold text-white">Connect to GitHub</h3>
                                <p className="text-sm text-gray-400">
                                    Sign in with GitHub to access your private repositories and bypass rate limits.
                                </p>

                                <button
                                    onClick={handleGithubConnect}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#24292F] hover:bg-[#24292F]/90 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02]"
                                >
                                    <Github className="w-5 h-5" />
                                    <span>Sign in with GitHub</span>
                                </button>

                                <p className="text-[10px] text-gray-500">
                                    We will request <code>repo</code> and <code>read:user</code> scopes.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Toolbar */}
                            <div className="p-4 border-b border-white/5 flex gap-4 items-center">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search repositories..."
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    {session?.user?.image && (
                                        <img src={session.user.image} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10" />
                                    )}
                                    <button
                                        onClick={handleSignOut}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Sign Out"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Repo List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                {loading ? (
                                    <div className="flex items-center justify-center h-40">
                                        <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
                                    </div>
                                ) : error ? (
                                    <div className="text-center p-8 text-red-400 bg-red-500/5 m-4 rounded-xl border border-red-500/10">
                                        <p>{error}</p>
                                        <button onClick={() => accessToken && loadRepos(accessToken)} className="mt-4 text-xs underline hover:text-white">Retry</button>
                                    </div>
                                ) : filteredRepos.length === 0 ? (
                                    <div className="text-center p-12 text-gray-500">
                                        No repositories found matching your search.
                                    </div>
                                ) : (
                                    filteredRepos.map((repo) => (
                                        <div
                                            key={repo.id}
                                            onClick={() => handleSelectRepo(repo)}
                                            className="group flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/10 transition-all active:scale-[0.99]"
                                        >
                                            <div className={`mt-1 w-2 h-2 rounded-full ${repo.language === 'TypeScript' ? 'bg-blue-500' : repo.language === 'JavaScript' ? 'bg-yellow-400' : repo.language === 'Python' ? 'bg-green-500' : 'bg-gray-500'}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-semibold text-white truncate group-hover:text-neon-cyan transition-colors">
                                                        {repo.full_name}
                                                    </h3>
                                                    {repo.private ? (
                                                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-yellow-500/80 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                                            <Lock className="w-3 h-3" /> Private
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                                                            <Globe className="w-3 h-3" /> Public
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-400 line-clamp-1 mb-2">
                                                    {repo.description || "No description provided."}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    {repo.language && <span>{repo.language}</span>}
                                                    <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                                <ExternalLink className="w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
