/**
 * Cross-Cutting Concerns Analyzer
 * Detects concerns that span multiple modules: authentication, logging, state management, etc.
 * Part of PS 10: Semantic Codebase Synthesis and Architectural Recovery
 */

export type ConcernCategory =
    | 'authentication'
    | 'logging'
    | 'stateManagement'
    | 'errorHandling'
    | 'validation'
    | 'caching'
    | 'analytics'
    | 'security';

export type ConcernEvidence = {
    file: string;
    line?: number;
    snippet: string;
    confidence: number;
};

export type CrossCuttingConcern = {
    category: ConcernCategory;
    files: string[];
    evidence: ConcernEvidence[];
    description: string;
    spanCount: number;  // Number of modules this concern spans
};

export type CrossCuttingResult = {
    concerns: CrossCuttingConcern[];
    summary: {
        totalConcerns: number;
        mostPervasive: ConcernCategory | null;
        coveragePercentage: number;
    };
};

// Pattern definitions for each concern category
const CONCERN_PATTERNS: Record<ConcernCategory, { patterns: RegExp[]; keywords: string[] }> = {
    authentication: {
        patterns: [
            /\b(auth|authenticate|login|logout|signIn|signOut|jwt|token|session|passport)\b/gi,
            /\b(isAuthenticated|isLoggedIn|requireAuth|withAuth|useAuth)\b/gi,
            /\b(bearer|oauth|credentials|password|username)\b/gi,
        ],
        keywords: ['auth', 'login', 'token', 'jwt', 'session', 'passport', 'oauth'],
    },
    logging: {
        patterns: [
            /\b(console\.(log|warn|error|info|debug)|logger\.|log\.|trace\.|debug\.)/gi,
            /\b(winston|bunyan|pino|log4js|morgan)\b/gi,
            /\b(logLevel|logMessage|writeLog|appendLog)\b/gi,
        ],
        keywords: ['logger', 'logging', 'log', 'trace', 'winston', 'pino'],
    },
    stateManagement: {
        patterns: [
            /\b(redux|mobx|zustand|recoil|jotai|vuex|pinia)\b/gi,
            /\b(useStore|useSelector|useDispatch|createStore|configureStore)\b/gi,
            /\b(createContext|useContext|Provider|Consumer|createSlice)\b/gi,
            /\b(useState|useReducer|observable|action|computed)\b/gi,
        ],
        keywords: ['store', 'redux', 'state', 'context', 'provider', 'dispatch'],
    },
    errorHandling: {
        patterns: [
            /\b(try\s*{|catch\s*\(|finally\s*{|throw\s+new)\b/gi,
            /\b(ErrorBoundary|handleError|onError|errorHandler)\b/gi,
            /\b(Error|Exception|reject|\.catch\()\b/gi,
        ],
        keywords: ['error', 'exception', 'catch', 'throw', 'boundary'],
    },
    validation: {
        patterns: [
            /\b(validate|validator|sanitize|sanitizer|isValid|checkValid)\b/gi,
            /\b(yup|joi|zod|ajv|express-validator)\b/gi,
            /\b(schema\.|\.validate\(|\.check\(|assertValid)\b/gi,
        ],
        keywords: ['validate', 'validation', 'schema', 'sanitize', 'yup', 'zod', 'joi'],
    },
    caching: {
        patterns: [
            /\b(cache|memoize|useMemo|useCallback|memo\()\b/gi,
            /\b(redis|memcached|lru-cache|node-cache)\b/gi,
            /\b(getFromCache|setCache|invalidateCache|cacheKey)\b/gi,
        ],
        keywords: ['cache', 'memoize', 'redis', 'memo', 'lru'],
    },
    analytics: {
        patterns: [
            /\b(analytics|tracking|gtag|ga\(|mixpanel|segment|amplitude)\b/gi,
            /\b(trackEvent|trackPage|logEvent|identify|setUser)\b/gi,
            /\b(pageview|conversion|funnel|metric)\b/gi,
        ],
        keywords: ['analytics', 'tracking', 'gtag', 'mixpanel', 'segment'],
    },
    security: {
        patterns: [
            /\b(helmet|csrf|xss|cors|sanitize|escape|encrypt|decrypt)\b/gi,
            /\b(cryptography|hash|bcrypt|argon2|scrypt)\b/gi,
            /\b(rateLimit|rateLimiter|bruteForce|injection)\b/gi,
        ],
        keywords: ['security', 'csrf', 'xss', 'cors', 'encrypt', 'hash', 'helmet'],
    },
};

export class CrossCuttingAnalyzer {
    /**
     * Analyze files for cross-cutting concerns
     */
    analyze(files: Record<string, string>): CrossCuttingResult {
        const concerns: Map<ConcernCategory, CrossCuttingConcern> = new Map();
        const allFiles = Object.keys(files);

        // Initialize concerns
        for (const category of Object.keys(CONCERN_PATTERNS) as ConcernCategory[]) {
            concerns.set(category, {
                category,
                files: [],
                evidence: [],
                description: this.getConcernDescription(category),
                spanCount: 0,
            });
        }

        // Analyze each file
        for (const [filePath, content] of Object.entries(files)) {
            const lines = content.split('\n');

            for (const [category, config] of Object.entries(CONCERN_PATTERNS)) {
                const concernCategory = category as ConcernCategory;
                const concern = concerns.get(concernCategory)!;

                let fileHasConcern = false;

                // Check each pattern
                for (const pattern of config.patterns) {
                    // Reset regex lastIndex
                    pattern.lastIndex = 0;

                    // Find all matches
                    let match;
                    const contentCopy = content;
                    const patternCopy = new RegExp(pattern.source, pattern.flags);

                    while ((match = patternCopy.exec(contentCopy)) !== null) {
                        fileHasConcern = true;

                        // Find line number
                        const lineNumber = this.getLineNumber(content, match.index);
                        const snippetLine = lines[lineNumber - 1] || '';

                        // Add evidence (limit per file to avoid spam)
                        if (concern.evidence.filter(e => e.file === filePath).length < 3) {
                            concern.evidence.push({
                                file: filePath,
                                line: lineNumber,
                                snippet: snippetLine.trim().substring(0, 100),
                                confidence: this.calculateConfidence(match[0], config.keywords),
                            });
                        }
                    }
                }

                // Track file if it has this concern
                if (fileHasConcern && !concern.files.includes(filePath)) {
                    concern.files.push(filePath);
                }
            }
        }

        // Calculate span counts and filter empty concerns
        const resultConcerns: CrossCuttingConcern[] = [];
        for (const concern of concerns.values()) {
            concern.spanCount = this.calculateModuleSpan(concern.files);
            if (concern.files.length > 0) {
                resultConcerns.push(concern);
            }
        }

        // Sort by pervasiveness
        resultConcerns.sort((a, b) => b.spanCount - a.spanCount);

        // Calculate summary
        const totalFiles = allFiles.length;
        const filesWithConcerns = new Set(resultConcerns.flatMap(c => c.files)).size;

        return {
            concerns: resultConcerns,
            summary: {
                totalConcerns: resultConcerns.length,
                mostPervasive: resultConcerns[0]?.category || null,
                coveragePercentage: totalFiles > 0 ? Math.round((filesWithConcerns / totalFiles) * 100) : 0,
            },
        };
    }

    /**
     * Calculate which module/directory a file belongs to and count unique modules
     */
    private calculateModuleSpan(files: string[]): number {
        const modules = new Set<string>();

        for (const file of files) {
            // Extract directory as module
            const parts = file.split(/[/\\]/);
            if (parts.length > 1) {
                modules.add(parts[parts.length - 2]); // Parent directory
            } else {
                modules.add('root');
            }
        }

        return modules.size;
    }

    /**
     * Get line number from character index
     */
    private getLineNumber(content: string, index: number): number {
        const upToIndex = content.substring(0, index);
        return (upToIndex.match(/\n/g) || []).length + 1;
    }

    /**
     * Calculate confidence based on keyword matches
     */
    private calculateConfidence(match: string, keywords: string[]): number {
        const matchLower = match.toLowerCase();
        let score = 0.5; // Base confidence

        for (const keyword of keywords) {
            if (matchLower.includes(keyword.toLowerCase())) {
                score += 0.1;
            }
        }

        return Math.min(1, score);
    }

    /**
     * Get human-readable description for each concern category
     */
    private getConcernDescription(category: ConcernCategory): string {
        const descriptions: Record<ConcernCategory, string> = {
            authentication: 'User authentication and authorization logic that spans multiple components',
            logging: 'Logging and debugging instrumentation distributed across the codebase',
            stateManagement: 'Global or shared state management patterns (Redux, Context, etc.)',
            errorHandling: 'Error handling and exception management patterns',
            validation: 'Input validation and data sanitization logic',
            caching: 'Caching strategies and memoization patterns',
            analytics: 'Analytics, tracking, and telemetry instrumentation',
            security: 'Security measures including CSRF, XSS prevention, and encryption',
        };

        return descriptions[category];
    }

    /**
     * Get files related to a specific concern
     */
    getFilesForConcern(result: CrossCuttingResult, category: ConcernCategory): string[] {
        const concern = result.concerns.find(c => c.category === category);
        return concern?.files || [];
    }

    /**
     * Check if a file has any cross-cutting concerns
     */
    getFileConCerns(result: CrossCuttingResult, filePath: string): ConcernCategory[] {
        return result.concerns
            .filter(c => c.files.includes(filePath))
            .map(c => c.category);
    }
}
