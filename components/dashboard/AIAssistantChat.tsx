"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, BookOpen, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AIOrchestrator } from "@/lib/ai/AIOrchestrator";
import { AIAnalysisResult } from "@/lib/ai/AIClient";

type Message = {
    role: "user" | "assistant";
    content: string;
};

export default function AIAssistantChat({
    analysisData,
    repoContext,
    activeFile,
    initialMessage,
    systemContext
}: {
    analysisData: AIAnalysisResult | null,
    repoContext?: { fileTree: string[], repoName: string },
    activeFile?: { path: string, content: string },
    initialMessage?: string,
    systemContext?: string
}) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: initialMessage || "👋 Hi! I'm your AI Architecture Assistant. I've analyzed the repository and I'm ready to explain the findings. How can I help you today?"
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [hasExplained, setHasExplained] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const isExplaining = useRef(false);

    // Auto-generate explanation when analysis data is available
    // Auto-show summary when data loads (No LLM Call)
    useEffect(() => {
        if (analysisData && !hasExplained && !isExplaining.current) {
            isExplaining.current = true;
            setHasExplained(true);

            // Static summary based on data
            const summary = `### 🏗️ Analysis Complete
            
I've analyzed the ${repoContext?.repoName || 'codebase'}.
            
**Key Findings:**
- **Pattern:** ${analysisData.intent?.pattern || 'Unknown'} (${analysisData.intent?.confidence}% confidence)
- **Issues:** ${analysisData.structural?.circularDependencies?.length || 0} circular deps, ${analysisData.structural?.boundaries?.violations?.length || 0} violations.
- **Risk:** ${analysisData.impact?.blastRadius || 'Unknown'} blast radius.

I'm ready to answer your questions about the architecture!`;

            setMessages(prev => [...prev, {
                role: "assistant",
                content: summary
            }]);
        }
    }, [analysisData, hasExplained, repoContext?.repoName]);

    // Removed auto-prompting logic to prevent long initial messages

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        const systemPrompt = systemContext || `You are an AI Architecture Assistant for the project "${repoContext?.repoName || 'Current'}".
        
        CONTEXT:
        - Key Pattern: ${analysisData?.intent?.pattern || 'Unknown'} (${analysisData?.intent?.confidence}% confidence)
        - Explanation: ${analysisData?.intent?.drift?.explanation || 'None'}
        - Architecture Summary: ${analysisData?.summary || 'None'}
        - Macro Explanation: ${analysisData?.explanations?.macro || 'None'}
        
        ISSUES & INSIGHTS:
        - Circular Deps: ${analysisData?.structural?.circularDependencies?.length || 0}
        - Insights: ${analysisData?.insights?.map((i: any) => i.title).join(', ') || 'None'}
        - Key Issues: ${analysisData?.issues?.map(i => i.title).join(', ') || 'None'}
        
        ${activeFile ? `
        CURRENTLY VIEWING FILE:
        Path: ${activeFile.path}
        Content (Truncated):
        \`\`\`
        ${activeFile.content.slice(0, 2000)}${activeFile.content.length > 2000 ? '...' : ''}
        \`\`\`
        ` : ''}

        FILES:
        ${repoContext?.fileTree.slice(0, 50).join(', ')}...
        
        Answer questions about the architecture, code quality, and specific patterns found based on this context. 
        If the user asks about the "current file" or specific code, refer to the "CURRENTLY VIEWING FILE" section above.
        Be concise and professional.`;

        try {
            setMessages(prev => [...prev, { role: "assistant", content: "" }]);

            let fullMessage = "";
            let chunkCount = 0;

            // Extreme History Pruning: Last 4 messages only to minimize context processing
            const prunedMessages = messages.slice(-4).map(m => ({
                role: m.role as any,
                content: m.content
            }));

            const stream = AIOrchestrator.chatStream({
                messages: [
                    ...prunedMessages,
                    { role: "user", content: userMessage }
                ],
                systemPrompt
            });

            for await (const chunk of stream) {
                fullMessage += chunk;
                chunkCount++;
                if (chunkCount % 3 === 0) {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1].content = fullMessage;
                        return newMessages;
                    });
                }
            }
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = fullMessage;
                return newMessages;
            });
        } catch (error) {
            console.error("AI Assistant Error:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                // Remove empty message if failed
                if (newMessages[newMessages.length - 1].content === "") {
                    newMessages.pop();
                }
                return [...newMessages, {
                    role: "assistant",
                    content: `⚠️ **Connection Error**: I couldn't reach the AI backend. 
                    
Please ensure Ollama is running locally and the Next.js dev server is active.`
                }];
            });
        } finally {
            setLoading(false);
        }
    };

    const suggestedQuestions = [
        "What is a circular dependency and why is it bad?",
        "Explain the Layered architecture pattern",
        "What are cross-cutting concerns?",
        "How do I fix high coupling?",
        "What dependencies should I use for this architecture?"
    ];

    return (
        <div className="flex flex-col h-full bg-[#0A0A0A] md:border md:border-white/10 md:rounded-xl overflow-hidden">
            {/* Header */}
            <div className="border-b border-white/10 p-4 bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10">
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-neon-cyan" />
                    <h3 className="font-bold text-lg">AI Architecture Assistant</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">Ask me about architectural patterns, best practices, and analysis results</p>
            </div>

            {/* Speed Tip */}
            <div className="bg-neon-cyan/5 border-b border-white/10 p-2 px-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[10px] text-neon-cyan italic">
                    <Zap className="w-3 h-3 fill-neon-cyan" />
                    <span>Turbo Speed Active: <b>Qwen 2.5 Coder 0.5b</b></span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <AnimatePresence>
                    {messages.map((message, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} ${message.role === 'assistant' && !message.content ? 'hidden' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.role === 'user'
                                ? 'bg-neon-purple/20 text-neon-purple'
                                : 'bg-neon-cyan/20 text-neon-cyan'
                                }`}>
                                {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-block p-3 rounded-lg text-sm ${message.role === 'user'
                                    ? 'bg-neon-purple/10 border border-neon-purple/20 text-white'
                                    : 'bg-white/5 border border-white/10 text-gray-300'
                                    }`}>
                                    <FormattedMessage content={message.content} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                    >
                        <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-neon-cyan animate-pulse" />
                        </div>
                        <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {messages.length === 1 && (
                <div className="px-4 pb-2">
                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        Suggested questions:
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {suggestedQuestions.slice(0, 3).map((question, i) => (
                            <button
                                key={i}
                                onClick={() => setInput(question)}
                                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded transition-colors"
                            >
                                {question}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="border-t border-white/10 p-4 bg-white/5">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about architecture, patterns, dependencies..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="bg-gradient-to-r from-neon-cyan to-neon-purple p-2 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Enhanced Markdown Formatter Component
function FormattedMessage({ content }: { content: string }) {
    if (!content) return null;

    // Helper to process inline styles (bold, italic, code)
    const processInline = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>')
            .replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-neon-cyan px-1 rounded font-mono text-xs">$1</code>');
    };

    return (
        <div className="space-y-2 text-sm">
            {content.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-2" />;

                // Headers
                if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-base font-bold text-neon-cyan mt-4 mb-2 border-b border-neon-cyan/20 pb-1">{line.replace(/^### /, '')}</h3>;
                }
                if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-lg font-bold text-white mt-5 mb-2">{line.replace(/^## /, '')}</h2>;
                }
                if (line.startsWith('# ')) {
                    return <h1 key={i} className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple mt-6 mb-3">{line.replace(/^# /, '')}</h1>;
                }

                // Blockquotes
                if (line.startsWith('> ')) {
                    return (
                        <blockquote key={i} className="border-l-2 border-neon-purple pl-3 italic text-gray-400 my-2">
                            {processInline(line.replace(/^> /, ''))}
                        </blockquote>
                    );
                }

                // Bullet points
                if (line.match(/^[\*\-]\s/)) {
                    const cleanLine = line.replace(/^[\*\-]\s/, '');
                    return (
                        <div key={i} className="flex gap-2 ml-1">
                            <span className="text-neon-cyan/70 mt-1.5">•</span>
                            <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: processInline(cleanLine) }} />
                        </div>
                    );
                }

                // Numbered lists
                if (line.match(/^\d+\.\s/)) {
                    return (
                        <div key={i} className="flex gap-2 ml-1">
                            <span className="text-neon-purple font-mono text-xs mt-1">{line.match(/^\d+\./)![0]}</span>
                            <span className="leading-relaxed" dangerouslySetInnerHTML={{
                                __html: processInline(line.replace(/^\d+\.\s/, ''))
                            }} />
                        </div>
                    );
                }

                // Horizontal Rule
                if (line.match(/^---$/)) {
                    return <hr key={i} className="border-t border-white/10 my-4" />;
                }

                // Regular Text
                return (
                    <div key={i} className="leading-relaxed text-gray-300" dangerouslySetInnerHTML={{
                        __html: processInline(line)
                    }} />
                );
            })}
        </div>
    );
}
