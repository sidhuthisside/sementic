/**
 * Pattern Evidence type - provides source traceability for detected patterns
 */
export type PatternEvidence = {
    file: string;
    line?: number;
    snippet?: string;
    confidence: number;
};

/**
 * Enhanced Pattern type with evidence traceability
 */
export type Pattern = {
    name: string;
    confidence: number;
    description: string;
    locations: string[];
    evidence?: PatternEvidence[];
    category: 'creational' | 'structural' | 'behavioral' | 'architectural';
};

/**
 * Architectural Pattern Inference from file structure
 */
export type ArchitecturalInference = {
    pattern: string;
    confidence: number;
    indicators: string[];
    violations: string[];
};

/**
 * Enhanced PatternDetector with comprehensive pattern detection
 * Supports: Singleton, Factory, Observer, MVC, Hexagonal, CQRS, Event-Driven,
 * Repository, Service Layer, Microservices, Dependency Injection, Strategy
 */
export class PatternDetector {

    /**
     * Detect patterns in a single file's code
     */
    detectPatterns(code: string, filename: string): Pattern[] {
        const patterns: Pattern[] = [];

        // Creational Patterns
        if (this.detectSingleton(code)) {
            patterns.push({
                name: "Singleton",
                confidence: 85,
                description: "Private constructor with static instance detected",
                locations: [filename],
                category: 'creational',
                evidence: this.extractEvidence(code, filename, /private\s+(static\s+)?instance|getInstance/gi)
            });
        }

        if (this.detectFactory(code)) {
            patterns.push({
                name: "Factory",
                confidence: 78,
                description: "Factory method pattern for object creation",
                locations: [filename],
                category: 'creational',
                evidence: this.extractEvidence(code, filename, /create[A-Z]\w+|factory|build[A-Z]\w+/gi)
            });
        }

        if (this.detectBuilder(code)) {
            patterns.push({
                name: "Builder",
                confidence: 80,
                description: "Step-by-step object construction pattern",
                locations: [filename],
                category: 'creational',
                evidence: this.extractEvidence(code, filename, /\.build\(\)|Builder|\.set\w+\(\).*\.set\w+\(\)/gi)
            });
        }

        // Behavioral Patterns
        if (this.detectObserver(code)) {
            patterns.push({
                name: "Observer",
                confidence: 82,
                description: "Event subscription/notification mechanism found",
                locations: [filename],
                category: 'behavioral',
                evidence: this.extractEvidence(code, filename, /subscribe|addEventListener|on\(|emit\(/gi)
            });
        }

        if (this.detectStrategy(code)) {
            patterns.push({
                name: "Strategy",
                confidence: 75,
                description: "Interchangeable algorithm/strategy pattern detected",
                locations: [filename],
                category: 'behavioral',
                evidence: this.extractEvidence(code, filename, /Strategy|setStrategy|executeStrategy/gi)
            });
        }

        if (this.detectCommand(code)) {
            patterns.push({
                name: "Command",
                confidence: 76,
                description: "Command pattern for encapsulating requests",
                locations: [filename],
                category: 'behavioral',
                evidence: this.extractEvidence(code, filename, /Command|execute\(\)|undo\(\)|CommandHandler/gi)
            });
        }

        // Structural Patterns
        if (this.detectMVC(code)) {
            patterns.push({
                name: "MVC",
                confidence: 90,
                description: "Model-View-Controller separation detected",
                locations: [filename],
                category: 'structural'
            });
        }

        if (this.detectDecorator(code)) {
            patterns.push({
                name: "Decorator",
                confidence: 72,
                description: "Wrapper pattern for extending functionality",
                locations: [filename],
                category: 'structural',
                evidence: this.extractEvidence(code, filename, /Decorator|@\w+|wrapped|decorate/gi)
            });
        }

        if (this.detectAdapter(code)) {
            patterns.push({
                name: "Adapter",
                confidence: 74,
                description: "Interface adaptation pattern detected",
                locations: [filename],
                category: 'structural',
                evidence: this.extractEvidence(code, filename, /Adapter|adapt|adaptee|wrapper/gi)
            });
        }

        // Architectural Patterns
        if (this.detectRepository(code)) {
            patterns.push({
                name: "Repository",
                confidence: 88,
                description: "Data access abstraction layer detected",
                locations: [filename],
                category: 'architectural',
                evidence: this.extractEvidence(code, filename, /Repository|findById|findAll|save|delete|getAll/gi)
            });
        }

        if (this.detectServiceLayer(code)) {
            patterns.push({
                name: "Service Layer",
                confidence: 84,
                description: "Business logic service abstraction detected",
                locations: [filename],
                category: 'architectural',
                evidence: this.extractEvidence(code, filename, /Service|@Injectable|@Service|Provider/gi)
            });
        }

        if (this.detectDependencyInjection(code)) {
            patterns.push({
                name: "Dependency Injection",
                confidence: 86,
                description: "Constructor/setter injection pattern detected",
                locations: [filename],
                category: 'architectural',
                evidence: this.extractEvidence(code, filename, /@Inject|@Autowired|constructor\s*\([^)]*private/gi)
            });
        }

        if (this.detectEventDriven(code)) {
            patterns.push({
                name: "Event-Driven",
                confidence: 80,
                description: "Event sourcing or pub/sub architecture detected",
                locations: [filename],
                category: 'architectural',
                evidence: this.extractEvidence(code, filename, /EventEmitter|publish|subscribe|EventBus|dispatch/gi)
            });
        }

        if (this.detectCQRS(code)) {
            patterns.push({
                name: "CQRS",
                confidence: 77,
                description: "Command Query Responsibility Segregation pattern detected",
                locations: [filename],
                category: 'architectural',
                evidence: this.extractEvidence(code, filename, /Command|Query|CommandHandler|QueryHandler|ReadModel|WriteModel/gi)
            });
        }

        return patterns;
    }

    /**
     * Infer architectural patterns from file structure
     */
    inferArchitectureFromStructure(filePaths: string[]): ArchitecturalInference[] {
        const inferences: ArchitecturalInference[] = [];

        // Hexagonal / Ports & Adapters
        const hasAdapters = filePaths.some(f => /adapters?[/\\]/i.test(f));
        const hasPorts = filePaths.some(f => /ports?[/\\]/i.test(f));
        const hasDomain = filePaths.some(f => /domain[/\\]/i.test(f));
        // const hasApplication = filePaths.some(f => /application[/\\]/i.test(f));

        if ((hasAdapters || hasPorts) && hasDomain) {
            inferences.push({
                pattern: "Hexagonal / Ports & Adapters",
                confidence: hasAdapters && hasPorts ? 90 : 75,
                indicators: [
                    hasAdapters ? "adapters/ directory found" : "",
                    hasPorts ? "ports/ directory found" : "",
                    hasDomain ? "domain/ directory found" : ""
                ].filter(Boolean),
                violations: []
            });
        }

        // Layered Architecture
        const hasControllers = filePaths.some(f => /controllers?[/\\]/i.test(f));
        const hasServices = filePaths.some(f => /services?[/\\]/i.test(f));
        const hasModels = filePaths.some(f => /models?[/\\]/i.test(f));
        const hasRepositories = filePaths.some(f => /repositor(y|ies)[/\\]/i.test(f));

        if (hasControllers && hasServices && (hasModels || hasRepositories)) {
            inferences.push({
                pattern: "Layered Architecture",
                confidence: 85,
                indicators: [
                    "controllers/ directory detected",
                    "services/ directory detected",
                    hasModels ? "models/ directory detected" : "",
                    hasRepositories ? "repositories/ directory detected" : ""
                ].filter(Boolean),
                violations: []
            });
        }

        // Microservices
        const hasMultipleApps = filePaths.filter(f => /apps?[/\\][^/\\]+[/\\]/i.test(f)).length > 1;
        const hasPackages = filePaths.filter(f => /packages?[/\\][^/\\]+[/\\]/i.test(f)).length > 1;
        const hasDocker = filePaths.some(f => /dockerfile|docker-compose/i.test(f));

        if (hasMultipleApps || (hasPackages && hasDocker)) {
            inferences.push({
                pattern: "Microservices / Monorepo",
                confidence: hasMultipleApps ? 88 : 70,
                indicators: [
                    hasMultipleApps ? "Multiple apps/ subdirectories detected" : "",
                    hasPackages ? "Multiple packages/ detected" : "",
                    hasDocker ? "Docker configuration found" : ""
                ].filter(Boolean),
                violations: []
            });
        }

        // Event-Driven Architecture
        const hasEvents = filePaths.some(f => /events?[/\\]/i.test(f));
        const hasHandlers = filePaths.some(f => /handlers?[/\\]/i.test(f));
        const hasListeners = filePaths.some(f => /listeners?[/\\]/i.test(f));

        if (hasEvents && (hasHandlers || hasListeners)) {
            inferences.push({
                pattern: "Event-Driven Architecture",
                confidence: 82,
                indicators: [
                    "events/ directory detected",
                    hasHandlers ? "handlers/ directory detected" : "",
                    hasListeners ? "listeners/ directory detected" : ""
                ].filter(Boolean),
                violations: []
            });
        }

        // Clean Architecture
        const hasUseCases = filePaths.some(f => /use[-_]?cases?[/\\]/i.test(f));
        const hasEntities = filePaths.some(f => /entities[/\\]/i.test(f));
        const hasInterfaces = filePaths.some(f => /interfaces[/\\]/i.test(f));

        if (hasUseCases && hasEntities) {
            inferences.push({
                pattern: "Clean Architecture",
                confidence: 85,
                indicators: [
                    "use-cases/ directory detected",
                    "entities/ directory detected",
                    hasInterfaces ? "interfaces/ directory detected" : ""
                ].filter(Boolean),
                violations: []
            });
        }

        // Feature-Sliced / Module-based
        const hasFeatures = filePaths.some(f => /features?[/\\]/i.test(f));
        const hasModules = filePaths.some(f => /modules?[/\\]/i.test(f));

        if (hasFeatures || hasModules) {
            inferences.push({
                pattern: "Feature-Sliced / Modular",
                confidence: 78,
                indicators: [
                    hasFeatures ? "features/ directory detected" : "",
                    hasModules ? "modules/ directory detected" : ""
                ].filter(Boolean),
                violations: []
            });
        }

        return inferences;
    }

    /**
     * Extract evidence snippets for pattern detection
     */
    private extractEvidence(code: string, filename: string, pattern: RegExp): PatternEvidence[] {
        const evidence: PatternEvidence[] = [];
        const lines = code.split('\n');

        lines.forEach((line, index) => {
            if (pattern.test(line)) {
                evidence.push({
                    file: filename,
                    line: index + 1,
                    snippet: line.trim().substring(0, 100),
                    confidence: 80
                });
            }
        });

        return evidence.slice(0, 5); // Limit to 5 evidence items
    }

    // Creational Pattern Detectors
    private detectSingleton(code: string): boolean {
        const hasPrivateConstructor = /private\s+constructor|private\s+static\s+instance/i.test(code);
        const hasGetInstance = /getInstance\s*\(|static\s+instance/i.test(code);
        return hasPrivateConstructor && hasGetInstance;
    }

    private detectFactory(code: string): boolean {
        const hasCreateMethod = /create[A-Z]\w+|factory|build[A-Z]\w+/i.test(code);
        const hasNewKeyword = /new\s+[A-Z]\w+/g.test(code);
        return hasCreateMethod && hasNewKeyword;
    }

    private detectBuilder(code: string): boolean {
        const hasBuilder = /class\s+\w+Builder|Builder\s*{/i.test(code);
        const hasChainedMethods = /return\s+this;/i.test(code);
        const hasBuildMethod = /\.build\s*\(\)/i.test(code);
        return hasBuilder || (hasChainedMethods && hasBuildMethod);
    }

    // Behavioral Pattern Detectors
    private detectObserver(code: string): boolean {
        const hasSubscribe = /subscribe|addEventListener|on\(|emit\(/i.test(code);
        const hasNotify = /notify|trigger|dispatch|emit/i.test(code);
        return hasSubscribe || hasNotify;
    }

    private detectStrategy(code: string): boolean {
        const hasStrategy = /Strategy|setStrategy|setAlgorithm/i.test(code);
        const hasInterface = /interface\s+\w+Strategy|implements\s+\w+Strategy/i.test(code);
        return hasStrategy || hasInterface;
    }

    private detectCommand(code: string): boolean {
        const hasCommand = /class\s+\w+Command|CommandHandler|execute\s*\(\s*\)/i.test(code);
        const hasUndo = /undo\s*\(\)|redo\s*\(\)/i.test(code);
        return hasCommand || hasUndo;
    }

    // Structural Pattern Detectors
    private detectMVC(code: string): boolean {
        const hasModel = /class\s+\w+Model|interface\s+\w+Model/i.test(code);
        const hasView = /class\s+\w+View|\.view\.|render\(/i.test(code);
        const hasController = /class\s+\w+Controller|\.controller\./i.test(code);
        return (hasModel && hasView) || (hasModel && hasController) || (hasView && hasController);
    }

    private detectDecorator(code: string): boolean {
        const hasDecorator = /@\w+\s*\(|class\s+\w+Decorator/i.test(code);
        const hasWrapped = /wrapped|decorate|decorator/i.test(code);
        return hasDecorator || hasWrapped;
    }

    private detectAdapter(code: string): boolean {
        const hasAdapter = /class\s+\w+Adapter|Adapter\s*{/i.test(code);
        const hasAdaptee = /adaptee|adapt\(/i.test(code);
        return hasAdapter || hasAdaptee;
    }

    // Architectural Pattern Detectors
    private detectRepository(code: string): boolean {
        const hasRepository = /class\s+\w+Repository|Repository\s*{/i.test(code);
        const hasDataMethods = /findById|findAll|findOne|save|delete|getAll|create/i.test(code);
        return hasRepository || (hasDataMethods && /class/i.test(code));
    }

    private detectServiceLayer(code: string): boolean {
        const hasService = /class\s+\w+Service|Service\s*{|@Injectable|@Service/i.test(code);
        const hasProvider = /Provider|provide|inject/i.test(code);
        return hasService || hasProvider;
    }

    private detectDependencyInjection(code: string): boolean {
        const hasInjection = /@Inject|@Autowired|@Injectable/i.test(code);
        const hasConstructorInjection = /constructor\s*\([^)]*private\s+\w+:/i.test(code);
        return hasInjection || hasConstructorInjection;
    }

    private detectEventDriven(code: string): boolean {
        const hasEventEmitter = /EventEmitter|EventBus|MessageBus/i.test(code);
        const hasPubSub = /publish|subscribe|dispatch|broadcast/i.test(code);
        return hasEventEmitter || hasPubSub;
    }

    private detectCQRS(code: string): boolean {
        const hasCommand = /CommandHandler|CommandBus/i.test(code);
        const hasQuery = /QueryHandler|QueryBus/i.test(code);
        const hasReadWriteModels = /ReadModel|WriteModel|ReadRepository|WriteRepository/i.test(code);
        return (hasCommand && hasQuery) || hasReadWriteModels;
    }
}
