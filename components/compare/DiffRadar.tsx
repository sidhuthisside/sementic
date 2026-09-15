"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

export default function DiffRadar({ source, target }: { source: any, target: any }) {
    // Use fixed core metrics keys
    const metricsKeys = ['maintainability', 'complexity', 'coverage', 'performance', 'security'];

    const data = metricsKeys.map(key => {
        // Normalize complexity if needed, but for now assuming comparable scales or handled by user understanding
        // For visualization, if complexity is huge, we might want to log scale it or cap it, 
        // but let's stick to raw values first as requested "just compare core metrics"

        let valA = source.metrics[key] || 0;
        let valB = target.metrics[key] || 0;

        // Special handling for complexity to fit 0-100 scale roughly if it's not a score?
        // If complexity is > 100, we might want to scale it down or just let it blow out the chart if it acts as a score.
        // Assuming current metrics are somewhat normalized or standardized scores. 
        // If 'complexity' is Cyclomatic, it can be high. 
        // Let's cap visual at 100 for graph but show tooltips? Radar chart domains can be dynamic.
        // Let's use a max domain based on data.

        return {
            subject: key.charAt(0).toUpperCase() + key.slice(1),
            A: valA,
            B: valB,
            fullMark: 100, // This is just for scaling relative to each other
        };
    });

    // Calculate max value to set domain dynamically so complexity doesn't break the chart if it's 500
    const maxValue = Math.max(
        ...data.map(d => Math.max(d.A, d.B)),
        100 // Minimum 100 scale
    );

    return (
        <div className="w-full h-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, maxValue]} tick={false} axisLine={false} />
                    <Radar
                        name={source.name}
                        dataKey="A"
                        stroke="#00f3ff"
                        strokeWidth={2}
                        fill="#00f3ff"
                        fillOpacity={0.3}
                    />
                    <Radar
                        name={target.name}
                        dataKey="B"
                        stroke="#bc13fe"
                        strokeWidth={2}
                        fill="#bc13fe"
                        fillOpacity={0.3}
                    />
                    <Legend />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
