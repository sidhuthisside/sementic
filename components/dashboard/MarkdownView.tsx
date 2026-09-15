import React from 'react';

export default function MarkdownView({ content }: { content: string }) {
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
                // if (!trimmed) return <div key={i} className="h-2" />;

                // Headers
                if (line.startsWith('#### ')) {
                    return <h4 key={i} className="text-xs font-bold text-white uppercase tracking-wider mt-3 mb-1">{line.replace(/^#### /, '')}</h4>;
                }
                if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-sm font-bold text-neon-cyan mt-4 mb-2">{line.replace(/^### /, '')}</h3>;
                }
                if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-base font-bold text-white mt-5 mb-2">{line.replace(/^## /, '')}</h2>;
                }
                if (line.startsWith('# ')) {
                    return <h1 key={i} className="text-lg font-bold text-white mt-6 mb-3">{line.replace(/^# /, '')}</h1>;
                }

                // Blockquotes
                if (line.startsWith('> ')) {
                    return (
                        <blockquote key={i} className="border-l-2 border-purple-500 pl-3 italic text-gray-400 my-2 text-xs">
                            <span dangerouslySetInnerHTML={{ __html: processInline(line.replace(/^> /, '')) }} />
                        </blockquote>
                    );
                }

                // Bullet points
                if (line.match(/^[\*\-]\s/)) {
                    const cleanLine = line.replace(/^[\*\-]\s/, '');
                    return (
                        <div key={i} className="flex gap-2 ml-1">
                            <span className="text-purple-400 mt-1.5 text-[8px]">•</span>
                            <span className="leading-relaxed text-gray-300" dangerouslySetInnerHTML={{ __html: processInline(cleanLine) }} />
                        </div>
                    );
                }

                // Numbered lists
                if (line.match(/^\d+\.\s/)) {
                    return (
                        <div key={i} className="flex gap-2 ml-1">
                            <span className="text-purple-400 font-mono text-xs mt-0.5">{line.match(/^\d+\./)![0]}</span>
                            <span className="leading-relaxed text-gray-300" dangerouslySetInnerHTML={{
                                __html: processInline(line.replace(/^\d+\.\s/, ''))
                            }} />
                        </div>
                    );
                }

                // Horizontal Rule
                if (line.match(/^---$/)) {
                    return <hr key={i} className="border-t border-white/10 my-4" />;
                }

                if (!trimmed) return <div key={i} className="h-2" />;

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
