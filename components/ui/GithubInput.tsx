"use client";

import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Loader2, CheckCircle2, XCircle, Github } from "lucide-react";
import RepoBrowserModal from "@/components/dashboard/RepoBrowserModal";

export default function GithubInput() {
    const [url, setUrl] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [placeholder, setPlaceholder] = useState("");
    const [showRepoBrowser, setShowRepoBrowser] = useState(false);
    const fullPlaceholder = "Paste GitHub URL...";

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setPlaceholder(fullPlaceholder.slice(0, i));
            i++;
            if (i > fullPlaceholder.length) i = 0;
        }, 200);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedUrl = url.trim();
        if (!trimmedUrl) return;

        setStatus("loading");

        // Simulate API check or small delay
        setTimeout(() => {
            setStatus("success");
            setTimeout(() => {
                let encodedPath = "";

                if (trimmedUrl.includes("github.com/")) {
                    encodedPath = encodeURIComponent(trimmedUrl.replace(/https?:\/\/github\.com\//, ""));
                } else if (trimmedUrl.includes("/")) {
                    // Handle "user/repo" format
                    encodedPath = encodeURIComponent(trimmedUrl);
                } else {
                    // Handle single word as potential repo name or search
                    encodedPath = encodeURIComponent(trimmedUrl);
                }

                window.location.href = `/analyze/${encodedPath}`;
            }, 500);
        }, 800);
    };

    return (
        <div className="w-full max-w-2xl px-2 sm:px-4 relative z-50">
            {showRepoBrowser && <RepoBrowserModal onClose={() => setShowRepoBrowser(false)} />}

            <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative glass rounded-xl flex items-center p-1 px-2 sm:px-4 gap-1 sm:gap-2">
                    <Search className="text-gray-400 mr-1 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder={placeholder}
                        className="bg-transparent border-none focus:ring-0 text-white w-full py-3 sm:py-4 text-sm sm:text-lg outline-none placeholder-gray-500"
                    />

                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            type="button"
                            onClick={() => setShowRepoBrowser(true)}
                            className="bg-white/10 hover:bg-white/20 text-gray-300 p-1.5 sm:p-2 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 group/browse"
                            title="Browse Your Repositories"
                        >
                            <Github className="w-4 h-4 sm:w-5 sm:h-5 group-hover/browse:text-white transition-colors" />
                            <span className="text-xs font-medium hidden sm:inline">Browse</span>
                        </button>

                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="bg-white text-black p-1.5 sm:p-2 rounded-lg hover:bg-neon-cyan transition-colors disabled:opacity-50"
                        >
                            {status === "loading" ? (
                                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                            ) : status === "success" ? (
                                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                            ) : status === "error" ? (
                                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                            ) : (
                                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
