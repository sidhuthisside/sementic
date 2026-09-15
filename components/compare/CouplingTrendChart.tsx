"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CouplingChange } from '@/lib/analyzer/ArchitecturalComparator';

interface CouplingTrendChartProps {
    changes: CouplingChange[];
    maxDisplay?: number;
}

export default function CouplingTrendChart({ changes, maxDisplay = 10 }: CouplingTrendChartProps) {

    // Take top changes by absolute change value
    const topChanges = changes
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
        .slice(0, maxDisplay);

    // Prepare data for chart
    const chartData = topChanges.map(change => ({
        name: change.module.split('/').pop() || change.module,
        fullName: change.module,
        before: change.oldDependencyCount,
        after: change.newDependencyCount,
        change: change.change,
        changePercent: change.changePercent,
        isSignificant: change.isSignificant
    }));

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload || !payload.length) return null;

        const data = payload[0].payload;
        const isIncrease = data.change > 0;

        return (
            <div className="bg-black/90 border border-white/20 p-3 rounded-lg shadow-xl">
                <div className="text-sm font-bold text-white mb-2">
                    {data.fullName}
                </div>
                <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-cyan-400">Before:</span>
                        <span className="text-white font-mono">{data.before} deps</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-purple-400">After:</span>
                        <span className="text-white font-mono">{data.after} deps</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/10">
                        <span className="text-gray-400">Change:</span>
                        <span className={`font-mono font-bold ${isIncrease ? 'text-red-400' : 'text-green-400'}`}>
                            {isIncrease ? '+' : ''}{data.change} ({data.changePercent.toFixed(0)}%)
                        </span>
                    </div>
                    {data.isSignificant && (
                        <div className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                            <span>⚠️</span>
                            <span>Significant change</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 bg-[#111] border border-white/10 rounded-xl">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                Coupling Trends (Top {topChanges.length})
            </h3>

            {chartData.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-8">
                    No coupling changes detected
                </div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#999', fontSize: 11 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                tick={{ fill: '#999', fontSize: 12 }}
                                label={{ value: 'Dependencies', angle: -90, position: 'insideLeft', fill: '#666' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="before" fill="#22d3ee" name="Before" />
                            <Bar dataKey="after" name="After">
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.change > 0 ? '#f87171' : '#4ade80'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-cyan-400 rounded"></div>
                            <span className="text-gray-400">Before</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-400 rounded"></div>
                            <span className="text-gray-400">After (Increased)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-400 rounded"></div>
                            <span className="text-gray-400">After (Decreased)</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
