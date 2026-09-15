
import { DependencyGraph } from './DependencyBuilder';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface StructuralRiskMetrics {
    moduleId: string;
    fanIn: number;
    fanOut: number;
    isCircular: boolean;
    score: number;
    level: RiskLevel;
}

export class StructuralRiskAnalyzer {

    /**
     * Calculate structural risk metrics for all modules in the graph
     */
    public analyze(graph: DependencyGraph): Map<string, StructuralRiskMetrics> {
        const riskMap = new Map<string, StructuralRiskMetrics>();
        const circularSet = new Set<string>();

        // precise circular dependency check
        graph.circular.forEach(cycle => {
            cycle.forEach(nodeId => circularSet.add(nodeId));
        });

        graph.nodes.forEach(node => {
            const metrics = this.calculateNodeRisk(node.id, graph, circularSet.has(node.id));
            riskMap.set(node.id, metrics);
        });

        return riskMap;
    }

    /**
     * Calculate risk for a single node
     */
    public calculateNodeRisk(moduleId: string, graph: DependencyGraph, isCircular: boolean): StructuralRiskMetrics {
        let fanIn = 0;
        let fanOut = 0;

        // Calculate Fan-in (incoming edges) and Fan-out (outgoing edges)
        graph.edges.forEach(edge => {
            if (edge.target === moduleId) fanIn++;
            if (edge.source === moduleId) fanOut++;
        });

        // Formula: Risk = (FanOut * 2) + (FanIn * 1) + (Circular ? 50 : 0)
        // Fan-out is weighted higher as it represents fragility (dependency on others)
        // Circular dependency is a massive penalty
        const score = (fanOut * 2) + (fanIn * 1) + (isCircular ? 50 : 0);

        return {
            moduleId,
            fanIn,
            fanOut,
            isCircular,
            score,
            level: this.getRiskLevel(score)
        };
    }

    private getRiskLevel(score: number): RiskLevel {
        if (score >= 50) return 'Critical';
        if (score >= 30) return 'High';
        if (score >= 10) return 'Medium';
        return 'Low';
    }
}
