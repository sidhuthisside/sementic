
import { DependencyBuilder } from '../lib/analyzer/DependencyBuilder';
import * as fs from 'fs';
import * as path from 'path';

async function scanProject() {
    const projectRoot = process.cwd();
    const builder = new DependencyBuilder(projectRoot);

    // Find some entry points or just scan everything in lib
    const libDir = path.join(projectRoot, 'lib');
    const files: { name: string; content: string }[] = [];

    function walk(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name !== 'node_modules' && entry.name !== '.next') {
                    walk(fullPath);
                }
            } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
                const relativePath = path.relative(projectRoot, fullPath).replace(/\\/g, '/');
                files.push({
                    name: relativePath,
                    content: fs.readFileSync(fullPath, 'utf-8')
                });
            }
        }
    }

    if (fs.existsSync(libDir)) walk(libDir);

    console.log(`Scanning ${files.length} files...`);
    const graph = await builder.buildGraph(files);

    console.log("\n--- Scan Results ---");
    console.log(`Nodes: ${graph.nodes.length}`);
    console.log(`Edges: ${graph.edges.length}`);
    console.log(`Circular Dependencies Found: ${graph.circular.length}`);

    if (graph.circular.length > 0) {
        graph.circular.forEach((cycle, i) => {
            console.log(`Cycle ${i + 1}: ${cycle.join(' -> ')}`);
        });
    } else {
        console.log("No circular dependencies found in lib/ directory.");
    }
}

scanProject().catch(console.error);
