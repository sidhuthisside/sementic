"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const ForceGraph3D = dynamic(() => import("./ForceGraph3DInner"), {
    ssr: false,
    loading: () => <div className="text-white">Loading 3D Engine...</div>
});

export default function DependencyGraph({ data, onStabilize, width, height, onNodeSelect }: { data: any, onStabilize?: (nodes: any[]) => void, width?: number, height?: number, onNodeSelect?: (node: any) => void }) {
    const fgRef = useRef<any>();
    const [dimensions, setDimensions] = useState({ width: width || 800, height: height || 600 });

    useEffect(() => {
        if (width && height) {
            setDimensions({ width, height });
            return;
        }
        setDimensions({ width: window.innerWidth, height: window.innerHeight - 80 });
        const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight - 80 });
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [width, height]);

    // Performance: Limit graph data to prevent overwhelming low-end hardware
    const optimizedData = useMemo(() => {
        if (!data) return { nodes: [], links: [] };

        // DEEP CLONE: unexpected mutation from ForceGraph3D corrupts the store
        // We use JSON parse/stringify for a cheap deep clone of simple data structures
        const cleanData = JSON.parse(JSON.stringify(data));

        const maxNodes = 100; // Cap nodes for performance
        const nodes = cleanData.nodes?.slice(0, maxNodes) || [];
        const nodeIds = new Set(nodes.map((n: any) => n.id));
        const links = (cleanData.links || []).filter((l: any) =>
            nodeIds.has(l.source?.id || l.source) && nodeIds.has(l.target?.id || l.target)
        ).slice(0, 200); // Cap links
        return { nodes, links };
    }, [data]);

    // Custom node rendering for performance - simple spheres
    const nodeThreeObject = useCallback((node: any) => {
        return undefined; // Use default simple spheres instead of custom objects
    }, []);

    return (
        <div className="w-full h-full relative overflow-hidden bg-[#050505]">
            <ForceGraph3D
                graphRef={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={optimizedData}
                nodeLabel="name"
                nodeColor={(node: any) => {
                    // Dynamic color mapping based on extension
                    const ext = node.group;
                    // Standard colors for common types
                    const colorMap: Record<string, string> = {
                        // Logic
                        '.ts': '#3b82f6', '.tsx': '#60a5fa',
                        '.js': '#f59e0b', '.jsx': '#fbbf24',
                        '.py': '#3776ab', '.rs': '#dea584',
                        '.go': '#00add8', '.java': '#b07219',
                        '.c': '#555555', '.cpp': '#f34b7d',
                        '.php': '#4F5D95', '.rb': '#701516',

                        // Config/Data
                        '.json': '#fcd34d', '.yaml': '#fcd34d', '.yml': '#fcd34d',
                        '.xml': '#fcd34d', '.toml': '#9c4221',
                        '.md': '#ffffff', '.txt': '#9ca3af',

                        // Styles
                        '.css': '#264de4', '.scss': '#c6538c', '.less': '#1d365d',
                        '.html': '#e34c26',

                        // System
                        'folder': '#64748b', 'unknown': '#475569'
                    };

                    if (typeof ext === 'string') {
                        if (colorMap[ext]) return colorMap[ext];
                        // Hash-based color for unknown extensions
                        let hash = 0;
                        for (let i = 0; i < ext.length; i++) {
                            hash = ext.charCodeAt(i) + ((hash << 5) - hash);
                        }
                        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
                        return '#' + "00000".substring(0, 6 - c.length) + c;
                    }

                    // Fallback for numbered groups (if any remain)
                    return "#9ca3af";
                }}
                nodeResolution={4}
                nodeOpacity={0.9}
                linkOpacity={0.4}
                linkWidth={0.5}
                // PERFORMANCE: Disable expensive particles
                linkDirectionalParticles={0}
                // PERFORMANCE: Reduce simulation intensity
                d3AlphaDecay={0.05}
                d3VelocityDecay={0.3}
                warmupTicks={20}
                cooldownTicks={50}
                // PERFORMANCE: Disable nav info overlay
                backgroundColor="#050505"
                showNavInfo={false}
                // PERFORMANCE: Simplified click handler
                onNodeClick={(node: any) => {
                    if (onNodeSelect) onNodeSelect(node);

                    const x = node.x ?? 0;
                    const y = node.y ?? 0;
                    const z = node.z ?? 0;
                    const distance = 40;
                    const distRatio = 1 + distance / Math.hypot(x, y, z);
                    fgRef.current?.cameraPosition(
                        { x: x * distRatio, y: y * distRatio, z: z * distRatio },
                        node,
                        1500 // Faster transition
                    );
                }}
                // PERFORMANCE: Pause simulation after stabilization
                onEngineStop={() => {
                    fgRef.current?.pauseAnimation();
                    if (onStabilize && optimizedData.nodes.length > 0) {
                        // Sanitize nodes: only pass back id, x, y, z
                        // This prevents circular references or massive objects from being saved
                        const positions = optimizedData.nodes.map((n: any) => ({
                            id: n.id,
                            x: n.x,
                            y: n.y,
                            z: n.z
                        }));
                        onStabilize(positions);
                    }
                }}
            />
            <div className="absolute top-4 left-4 glass p-4 rounded-lg pointer-events-none border border-white/10 bg-black/50 backdrop-blur-md max-h-[80vh] overflow-y-auto custom-scrollbar">
                <h3 className="text-white font-bold mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-neon-cyan/50 animate-pulse" />
                    File Types
                </h3>
                <div className="flex flex-col gap-2">
                    {Array.from(new Set(optimizedData.nodes.map((n: any) => n.group)))
                        .filter(g => typeof g === 'string')
                        .sort()
                        .map((ext: any) => {
                            const colorMap: Record<string, string> = {
                                '.ts': '#3b82f6', '.tsx': '#60a5fa',
                                '.js': '#f59e0b', '.jsx': '#fbbf24',
                                '.py': '#3776ab', '.rs': '#dea584',
                                '.go': '#00add8', '.java': '#b07219',
                                '.c': '#555555', '.cpp': '#f34b7d',
                                '.php': '#4F5D95', '.rb': '#701516',
                                '.json': '#fcd34d', '.yaml': '#fcd34d', '.yml': '#fcd34d',
                                '.xml': '#fcd34d', '.toml': '#9c4221',
                                '.md': '#ffffff', '.txt': '#9ca3af',
                                '.css': '#264de4', '.scss': '#c6538c', '.less': '#1d365d',
                                '.html': '#e34c26',
                                'folder': '#64748b', 'unknown': '#475569'
                            };

                            let color = colorMap[ext] || "#9ca3af";
                            if (!colorMap[ext]) {
                                let hash = 0;
                                for (let i = 0; i < ext.length; i++) {
                                    hash = ext.charCodeAt(i) + ((hash << 5) - hash);
                                }
                                const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
                                color = '#' + "00000".substring(0, 6 - c.length) + c;
                            }

                            return (
                                <div key={ext} className="flex items-center gap-2 text-xs text-gray-300">
                                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                                    {ext === '0' || ext === 0 ? 'Folder' : ext}
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
