export type CodeMetrics = {
    linesOfCode: number;
    complexity: number;
    maintainability: number;
    testCoverage: number;
    documentationDensity: number;
    functionCount: number;
    classCount: number;
};

export class MetricsCalculator {
    calculateMetrics(code: string): CodeMetrics {
        const lines = code.split('\n');
        const linesOfCode = this.countLOC(lines);
        const complexity = this.calculateComplexity(code);
        const maintainability = this.calculateMaintainability(code, linesOfCode, complexity);
        const testCoverage = this.estimateTestCoverage(code);
        const documentationDensity = this.calculateDocDensity(code, linesOfCode);
        const functionCount = this.countFunctions(code);
        const classCount = this.countClasses(code);

        return {
            linesOfCode,
            complexity,
            maintainability,
            testCoverage,
            documentationDensity,
            functionCount,
            classCount
        };
    }

    private countLOC(lines: string[]): number {
        return lines.filter(line => {
            const trimmed = line.trim();
            // Expanded comment check:
            // //, /* (C-style)
            // # (Python, Shell, Ruby)
            // -- (SQL, Lua, Haskell)
            // % (TeX/Erlang - rare but good to have constraint)
            return trimmed.length > 0 &&
                !trimmed.startsWith('//') &&
                !trimmed.startsWith('/*') &&
                !trimmed.startsWith('*') &&
                !trimmed.startsWith('#') &&
                !trimmed.startsWith('--');
        }).length;
    }

    // ... (complexity and maintainability methods unchanged) ...

    private calculateDocDensity(code: string, loc: number): number {
        // Count comment lines
        const cStyle = (code.match(/\/\/|\/\*|\*\/|^\s*\*/gm) || []).length;
        const hashStyle = (code.match(/^\s*#/gm) || []).length; // Python/Shell
        const dashStyle = (code.match(/^\s*--/gm) || []).length; // SQL/Lua

        const totalComments = cStyle + hashStyle + dashStyle;

        const density = (totalComments / Math.max(loc, 1)) * 100;
        return Number(Math.min(100, density * 3).toFixed(2)); // Scale up for visibility
    }

    private calculateComplexity(code: string): number {
        // Cyclomatic complexity estimation
        let complexity = 1; // Base complexity

        // Count decision points
        // Count decision points - Expanded for C++, Go, Rust, Python
        const decisionPoints = [
            /\bif\b/g,                  // if (generic)
            /\belse\s+if\b/g,           // else if
            /\belif\b/g,                // elif (Python)
            /\bwhile\b/g,               // while
            /\bfor\b/g,                 // for
            /\bforeach\b/g,             // foreach
            /\bcase\b/g,                // case
            /\bdefault\b/g,             // default
            /\bswitch\b/g,              // switch
            /\bcatch\b/g,               // catch
            /\bmatch\b/g,               // match (Rust/Python)
            /\bbreak\b/g,               // break (flow control)
            /\bcontinue\b/g,            // continue
            /&&|and\b/g,                // boolean AND
            /\|\||or\b/g,               // boolean OR
            /\?/g                       // ternary
        ];

        decisionPoints.forEach(regex => {
            const matches = code.match(regex);
            if (matches) complexity += matches.length;
        });

        return Math.min(complexity, 100);
    }

    private calculateMaintainability(code: string, loc: number, complexity: number): number {
        // Simplified maintainability index
        // Higher is better (0-100)
        const volumeScore = Math.max(0, 100 - (loc / 10));
        const complexityScore = Math.max(0, 100 - (complexity * 2));
        const commentScore = this.calculateDocDensity(code, loc);

        const maintainability = (volumeScore * 0.4 + complexityScore * 0.4 + commentScore * 0.2);
        return Number(Math.min(100, Math.max(0, maintainability)).toFixed(2));
    }

    private estimateTestCoverage(code: string): number {
        // Heuristic: check for test-related keywords in various languages
        const hasTests = /describe\(|it\(|test\(|expect\(|assert|Test|func Test|#[test]|assertEquals/i.test(code);
        const testDensity = (code.match(/test|it\(|expect|assert|check/gi) || []).length;

        if (!hasTests) return 0;

        // Rough estimation based on test density
        return Math.min(95, 30 + testDensity * 5);
    }

    private countFunctions(code: string): number {
        // Expanded to support: func (Go), fn (Rust), def (Python), void/type (C++), etc.
        const functionRegex = /function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|=>\s*{|func\s+\w+|fn\s+\w+|def\s+\w+|void\s+\w+\(|int\s+\w+\(|bool\s+\w+\(/g;
        return (code.match(functionRegex) || []).length;
    }

    private countClasses(code: string): number {
        // Expanded for struct (Go/Rust), interface (TS/Java)
        const classRegex = /class\s+\w+|struct\s+\w+|interface\s+\w+|type\s+\w+\s+struct/g;
        return (code.match(classRegex) || []).length;
    }
}
