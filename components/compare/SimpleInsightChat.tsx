"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, X } from "lucide-react";
import { AIOrchestrator } from "@/lib/ai/AIOrchestrator";

type Message = {
    role: "user" | "assistant";
    content: string;
};

interface SimpleInsightChatProps {
    initialMessage?: string;
    systemContext?: string;
    repoName?: string;
}

export default function SimpleInsightChat({
    initialMessage,
    systemContext,
    repoName
}: SimpleInsightChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize with the insight
    useEffect(() => {
        if (initialMessage && messages.length === 0) {
            setMessages([{
                role: "assistant",
                content: initialMessage
            }]);
        }
    }, [initialMessage]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        const prompt = systemContext || `You are a helpful AI assistant analyzing the repository "${repoName || 'Current'}". Be concise.`;

        try {
            setMessages(prev => [...prev, { role: "assistant", content: "" }]);

            let fullMessage = "";
            let chunkCount = 0;

            // Prune history for context window
            const prunnedMessages = messages.slice(-6);

            const stream = AIOrchestrator.chatStream({
                messages: [
                    ...prunnedMessages.map(m => ({ role: m.role, content: m.content })),
                    { role: "user", content: userMessage }
                ],
                systemPrompt: prompt
            });

            for await (const chunk of stream) {
                fullMessage += chunk;
                chunkCount++;
                if (chunkCount % 5 === 0) {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1].content = fullMessage;
                        return newMessages;
                    });
                }
            }
            // Final update
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = fullMessage;
                return newMessages;
            });

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages[newMessages.length - 1].content === "") {
                    newMessages.pop();
                }
                return [...newMessages, { role: "assistant", content: "Sorry, I encountered an error responding to that." }];
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0c0c0c]">
            {/* Header */}
            <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-[#0e0e0e]">
                <Bot className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-gray-200">AI Comparison Insights</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700 text-gray-300'
                            }`}>
                            {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        </div>
                        <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                            ? 'bg-purple-600/10 border border-purple-500/20 text-gray-200'
                            : 'bg-white/5 border border-white/10 text-gray-300'
                            }`}>
                            <FormattedMessage content={msg.content} />
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mt-1">
                            <Bot className="w-3 h-3 text-gray-300 animate-pulse" />
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75" />
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10 bg-[#0e0e0e]">
                <div className="flex gap-2">
                    <input
                        className="flex-1 bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500 text-white placeholder-gray-600"
                        placeholder="Ask a follow-up question..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
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
            .replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-purple-300 px-1 rounded font-mono text-xs">$1</code>');
    };

    return (
        <div className="space-y-2 text-sm">
            {content.split('\n').map((line, i) => {
                const trimmed = line.trim();
                // Headers (supports #, ##, ###)
                if (line.startsWith('#')) {
                    const level = line.match(/^#+/)?.[0].length || 1;
                    const text = line.replace(/^#+\s/, '');
                    const sizes = {
                        1: "text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mt-4 mb-2",
                        2: "text-base font-bold text-white mt-3 mb-1",
                        3: "text-sm font-bold text-purple-300 mt-2 mb-1"
                    };
                    // @ts-ignore
                    return <div key={i} className={sizes[Math.min(level, 3)]}>{text}</div>;
                }

                // Blockquotes
                if (line.startsWith('> ')) {
                    return (
                        <blockquote key={i} className="border-l-2 border-purple-500 pl-3 italic text-gray-400 my-2 text-xs">
                            {processInline(line.replace(/^> /, ''))}
                        </blockquote>
                    );
                }

                // List Items
                if (line.match(/^[\*\-]\s/)) {
                    return (
                        <div key={i} className="flex gap-2 ml-1">
                            <span className="text-purple-400/70 mt-1.5">•</span>
                            <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: processInline(line.replace(/^[\*\-]\s/, '')) }} />
                        </div>
                    );
                }

                if (!trimmed) return <div key={i} className="h-1" />;

                // Standard Text
                return (
                    <div key={i} className="leading-relaxed text-gray-300" dangerouslySetInnerHTML={{
                        __html: processInline(line)
                    }} />
                );
            })}
        </div>
    );
}
