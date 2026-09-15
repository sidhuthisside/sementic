import { DependencyGraph, DependencyNode } from './DependencyBuilder';

/**
 * Centrality Metrics for a module
 * Measures the architectural importance and influence of modules
 */
export type CentralityMetrics = {
    module: string;
    degreeCentrality: number;      // Number of direct connections (in + out)
    betweenness: number;            // How often module appears in dependency paths
    pageRank: number;               // Importance based on dependency network
    overallScore: number;           // Weighted combination of all metrics
};

/**
 * Change in centrality between two versions
 */
export type CentralityChange = {
    module: string;
    oldScore: number;
    newScore: number;
    change: number;                 // Delta (positive = gained importance)
    changePercent: number;          // Percentage change
    rank: number;                   // Ranking by significance (1 = most significant)
};

/**
 * Analyzes module centrality to identify architecturally important modules
 */
export class CentralityAnalyzer {
    
    /**
     * Calculate centrality metrics for all modules in a dependency graph
     */
    calculateCentrality(graph: DependencyGraph): Map<string, CentralityMetrics> {
        const metrics = new Map<string, CentralityMetrics>();
        
        // Build adjacency maps for easier calculation
        const incomingEdges = new Map<string, Set<string>>();
        const outgoingEdges = new Map<string, Set<string>>();
        
        // Initialize all nodes
        graph.nodes.forEach(node => {
            incomingEdges.set(node.id, new Set());
            outgoingEdges.set(node.id, new Set());
        });
        
        // Populate edge maps
        graph.edges.forEach(edge => {
            outgoingEdges.get(edge.source)?.add(edge.target);
            incomingEdges.get(edge.target)?.add(edge.source);
        });
        
        // Calculate metrics for each node
        graph.nodes.forEach(node => {
            const degree = this.calculateDegreeCentrality(node.id, incomingEdges, outgoingEdges);
            const betweenness = this.calculateBetweenness(node.id, graph, incomingEdges, outgoingEdges);
            const pageRank = this.calculatePageRank(node.id, graph, incomingEdges, outgoingEdges);
            
            // Overall score: weighted average
            const overallScore = (degree * 0.3) + (betweenness * 0.4) + (pageRank * 0.3);
            
            metrics.set(node.id, {
                module: node.id,
                degreeCentrality: degree,
                betweenness,
                pageRank,
                overallScore
            });
        });
        
        return metrics;
    }
    
    /**
     * Compare centrality between two versions and identify significant changes
     */
    compareCentrality(
        metricsA: Map<string, CentralityMetrics>,
        metricsB: Map<string, CentralityMetrics>
    ): CentralityChange[] {
        const changes: CentralityChange[] = [];
        
        // Get all unique modules from both versions
        const allModules = new Set<string>([
            ...metricsA.keys(),
            ...metricsB.keys()
        ]);
        
        allModules.forEach(module => {
            const oldMetrics = metricsA.get(module);
            const newMetrics = metricsB.get(module);
            
            const oldScore = oldMetrics?.overallScore || 0;
            const newScore = newMetrics?.overallScore || 0;
            const change = newScore - oldScore;
            const changePercent = oldScore > 0 ? (change / oldScore) * 100 : (newScore > 0 ? 100 : 0);
            
            // Only track if there's a meaningful change
            if (Math.abs(change) > 0.01) {
                changes.push({
                    module,
                    oldScore,
                    newScore,
                    change,
                    changePercent,
                    rank: 0 // Will be set after sorting
                });
            }
        });
        
        // Sort by absolute change (most significant first) and assign ranks
        changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
        changes.forEach((change, index) => {
            change.rank = index + 1;
        });
        
        return changes;
    }
    
    /**
     * Identify the top N most central modules
     */
    identifyTopCentralModules(metrics: Map<string, CentralityMetrics>, count: number = 5): string[] {
        const sorted = Array.from(metrics.values())
            .sort((a, b) => b.overallScore - a.overallScore);
        
        return sorted.slice(0, count).map(m => m.module);
    }
    
    /**
     * Calculate degree centrality (normalized)
     * Measures direct connectivity
     */
    private calculateDegreeCentrality(
        nodeId: string,
        incomingEdges: Map<string, Set<string>>,
        outgoingEdges: Map<string, Set<string>>
    ): number {
        const inDegree = incomingEdges.get(nodeId)?.size || 0;
        const outDegree = outgoingEdges.get(nodeId)?.size || 0;
        const totalDegree = inDegree + outDegree;
        
        // Normalize by total possible connections
        const totalNodes = incomingEdges.size;
        const maxPossible = (totalNodes - 1) * 2; // Can connect to all other nodes (in and out)
        
        return maxPossible > 0 ? totalDegree / maxPossible : 0;
    }
    
    /**
     * Calculate betweenness centrality (simplified version)
     * Measures how often a node appears in shortest paths between other nodes
     */
    private calculateBetweenness(
        nodeId: string,
        graph: DependencyGraph,
        incomingEdges: Map<string, Set<string>>,
        outgoingEdges: Map<string, Set<string>>
    ): number {
        let betweenness = 0;
        const nodes = graph.nodes.map(n => n.id);
        
        // For each pair of nodes, check if nodeId is on the path
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const source = nodes[i];
                const target = nodes[j];
                
                if (source === nodeId || target === nodeId) continue;
                
                // Check if there's a path from source to target through nodeId
                if (this.hasPathThrough(source, target, nodeId, outgoingEdges)) {
                    betweenness++;
                }
            }
        }
        
        // Normalize
        const n = nodes.length;
        const maxPossible = ((n - 1) * (n - 2)) / 2;
        
        return maxPossible > 0 ? betweenness / maxPossible : 0;
    }
    
    /**
     * Check if there's a path from source to target that goes through intermediate node
     */
    private hasPathThrough(
        source: string,
        target: string,
        through: string,
        outgoingEdges: Map<string, Set<string>>
    ): boolean {
        // Simple BFS to find if path exists through the intermediate node
        const pathToThrough = this.hasPath(source, through, outgoingEdges);
        const pathFromThrough = this.hasPath(through, target, outgoingEdges);
        
        return pathToThrough && pathFromThrough;
    }
    
    /**
     * Check if there's any path from source to target using BFS
     */
    private hasPath(
        source: string,
        target: string,
        outgoingEdges: Map<string, Set<string>>
    ): boolean {
        if (source === target) return true;
        
        const visited = new Set<string>();
        const queue = [source];
        
        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current === target) return true;
            
            if (visited.has(current)) continue;
            visited.add(current);
            
            const neighbors = outgoingEdges.get(current) || new Set();
            neighbors.forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    queue.push(neighbor);
                }
            });
        }
        
        return false;
    }
    
    /**
     * Calculate PageRank (simplified version)
     * Measures importance based on incoming connections and their importance
     */
    private calculatePageRank(
        nodeId: string,
        graph: DependencyGraph,
        incomingEdges: Map<string, Set<string>>,
        outgoingEdges: Map<string, Set<string>>
    ): number {
        const dampingFactor = 0.85;
        const iterations = 10;
        const n = graph.nodes.length;
        
        // Initialize all nodes with equal rank
        const ranks = new Map<string, number>();
        graph.nodes.forEach(node => {
            ranks.set(node.id, 1 / n);
        });
        
        // Iterate to converge
        for (let iter = 0; iter < iterations; iter++) {
            const newRanks = new Map<string, number>();
            
            graph.nodes.forEach(node => {
                let rank = (1 - dampingFactor) / n;
                
                // Add contributions from incoming edges
                const incoming = incomingEdges.get(node.id) || new Set();
                incoming.forEach(sourceNode => {
                    const sourceRank = ranks.get(sourceNode) || 0;
                    const sourceOutDegree = outgoingEdges.get(sourceNode)?.size || 1;
                    rank += dampingFactor * (sourceRank / sourceOutDegree);
                });
                
                newRanks.set(node.id, rank);
            });
            
            // Update ranks
            newRanks.forEach((rank, id) => ranks.set(id, rank));
        }
        
        return ranks.get(nodeId) || 0;
    }
}
