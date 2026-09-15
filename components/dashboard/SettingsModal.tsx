import { X, Check, AlertCircle, Cpu, Server } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsModal({ onClose }: { onClose: () => void }) {
    const [pythonHfEnabled, setPythonHfEnabled] = useState(true);
    const [pythonHfUrl, setPythonHfUrl] = useState("http://localhost:8000");
    const [saved, setSaved] = useState(false);
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    useEffect(() => {
        const storedEnabled = localStorage.getItem("python_hf_enabled") !== 'false';
        const storedUrl = localStorage.getItem("python_hf_url") || "http://localhost:8000";

        setPythonHfEnabled(storedEnabled);
        setPythonHfUrl(storedUrl);

        // Check backend health
        checkBackendHealth(storedUrl);
    }, []);

    const checkBackendHealth = async (url: string) => {
        setBackendStatus('checking');
        try {
            const response = await fetch(`${url}/docs`, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
            setBackendStatus(response.ok ? 'online' : 'offline');
        } catch {
            setBackendStatus('offline');
        }
    };

    const handleSave = () => {
        localStorage.setItem("python_hf_enabled", pythonHfEnabled.toString());
        localStorage.setItem("python_hf_url", pythonHfUrl.trim());

        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            onClose();
            // Force reload to apply settings
            window.location.reload();
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/30">
                        <Cpu className="w-5 h-5 text-neon-cyan" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">AI Configuration</h2>
                        <p className="text-xs text-gray-400">Python HuggingFace Backend</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Python HF Backend Section */}
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                                    <Server className="w-4 h-4 text-green-400" />
                                    Python AI Backend
                                </label>
                                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${backendStatus === 'online'
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                    : backendStatus === 'offline'
                                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                    }`}>
                                    {backendStatus === 'checking' ? '...' : backendStatus}
                                </span>
                            </div>
                            <button
                                onClick={() => setPythonHfEnabled(!pythonHfEnabled)}
                                className={`w-10 h-6 rounded-full transition-colors relative flex items-center px-1 ${pythonHfEnabled ? 'bg-neon-cyan' : 'bg-white/10'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${pythonHfEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs text-gray-500 flex items-center gap-2 mb-2">
                                <AlertCircle className="w-3 h-3" /> Requires Python backend running at the specified URL
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={pythonHfUrl}
                                    onChange={(e) => setPythonHfUrl(e.target.value)}
                                    onBlur={() => checkBackendHealth(pythonHfUrl)}
                                    placeholder="Backend URL (e.g., http://localhost:8000)"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm font-mono"
                                />
                            </div>
                            <div className="bg-neon-cyan/5 border border-neon-cyan/10 p-3 rounded-lg">
                                <p className="text-[11px] text-gray-400 leading-relaxed">
                                    <span className="text-neon-cyan font-bold uppercase block mb-1">Local AI Model:</span>
                                    The backend uses <code className="text-white italic">Qwen2.5-Coder-3B-Instruct</code> for architectural analysis.
                                    Start the backend with: <code className="text-neon-cyan">python server/main.py</code>
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="text-[10px] text-gray-500 flex items-center gap-1 px-1">
                        <AlertCircle className="w-3 h-3" />
                        Settings are stored locally in your browser.
                    </p>

                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 rounded-lg bg-neon-cyan hover:bg-neon-cyan/80 text-white text-sm font-semibold transition-all flex items-center gap-2"
                        >
                            {saved ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Saved
                                </>
                            ) : (
                                "Apply Changes"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

