import { BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export default function MetricsSection({ data }: { data: { analysisResults?: { metrics?: Record<string, number> }; metrics?: Record<string, number> } }) {
    const metrics = data?.analysisResults?.metrics || data?.metrics || {};

    const rows = [
        { metric: "Complexity", value: metrics.complexity?.toFixed(2) || "0.00", status: metrics.complexity > 20 ? "High" : "Good", trend: "stable" },
        { metric: "Maintainability", value: metrics.maintainability?.toFixed(2) || "0.00", status: metrics.maintainability > 80 ? "Excellent" : "Average", trend: "up" },
        { metric: "Lines of Code", value: metrics.linesOfCode?.toString() || "0", status: "N/A", trend: "up" },
        { metric: "Function Count", value: metrics.functionCount?.toString() || "0", status: "N/A", trend: "up" },
        { metric: "Class Count", value: metrics.classCount?.toString() || "0", status: "N/A", trend: "up" },
    ];

    const chartData = [
        { name: 'Functions', value: metrics.functionCount || 0 },
        { name: 'Classes', value: metrics.classCount || 0 },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="p-8 bg-white text-black">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-neon-purple" />
                Key Metrics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Table */}
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="py-3 font-bold text-gray-600">Metric</th>
                            <th className="py-3 font-bold text-gray-600">Value</th>
                            <th className="py-3 font-bold text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                <td className="py-3 font-medium border-b border-gray-100">{row.metric}</td>
                                <td className="py-3 font-mono border-b border-gray-100">{row.value}</td>
                                <td className="py-3 border-b border-gray-100">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.status === "Excellent" || row.status === "Good" ? "bg-green-100 text-green-700" :
                                        row.status === "Average" ? "bg-blue-100 text-blue-700" :
                                            row.status === "N/A" ? "bg-gray-100 text-gray-700" :
                                                "bg-yellow-100 text-yellow-700"
                                        }`}>
                                        {row.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Charts */}
                <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">Code Structure Distribution</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
