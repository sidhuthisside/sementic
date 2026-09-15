
import { DependencyBuilder } from '../lib/analyzer/DependencyBuilder';

async function runTest() {
    const builder = new DependencyBuilder();

    console.log("--- Test 1: Simple Cycle (A -> B -> A) ---");
    const files1 = [
        { name: 'a.ts', content: 'import { b } from "./b";' },
        { name: 'b.ts', content: 'import { a } from "./a";' }
    ];
    const graph1 = await builder.buildGraph(files1);
    console.log("Circular dependencies found:", JSON.stringify(graph1.circular));
    if (graph1.circular.length > 0 && graph1.circular[0].length === 2) {
        console.log("PASS: Detected simple cycle");
    } else {
        console.error("FAIL: Did not detect simple cycle correctly");
    }

    console.log("\n--- Test 2: Self Loop (A -> A) ---");
    const files2 = [
        { name: 'self.ts', content: 'import { self } from "./self";' }
    ];
    const graph2 = await builder.buildGraph(files2);
    console.log("Circular dependencies found:", JSON.stringify(graph2.circular));
    if (graph2.circular.length > 0) {
        console.log("PASS: Detected self loop");
    } else {
        console.error("FAIL: Did not detect self loop");
    }

    console.log("\n--- Test 3: Complex Cycle (A -> B -> C -> A) ---");
    const files3 = [
        { name: 'a.ts', content: 'import { b } from "./b";' },
        { name: 'b.ts', content: 'import { c } from "./c";' },
        { name: 'c.ts', content: 'import { a } from "./a";' }
    ];
    const graph3 = await builder.buildGraph(files3);
    console.log("Circular dependencies found:", JSON.stringify(graph3.circular));
    if (graph3.circular.length > 0 && graph3.circular[0].length === 3) {
        console.log("PASS: Detected complex cycle");
    } else {
        console.error("FAIL: Did not detect complex cycle");
    }

    console.log("\n--- Test 4: No Cycle (A -> B -> C) ---");
    const files4 = [
        { name: 'a.ts', content: 'import { b } from "./b";' },
        { name: 'b.ts', content: 'import { c } from "./c";' },
        { name: 'c.ts', content: 'export const c = 1;' }
    ];
    const graph4 = await builder.buildGraph(files4);
    console.log("Circular dependencies found:", JSON.stringify(graph4.circular));
    if (graph4.circular.length === 0) {
        console.log("PASS: Correctly found no cycles");
    } else {
        console.error("FAIL: False positive detected");
    }
}

runTest().catch(console.error);
