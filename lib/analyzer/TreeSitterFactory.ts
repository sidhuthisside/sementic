let fs: any;
let path: any;
if (typeof window === 'undefined') {
    fs = require('fs');
    path = require('path');
}

let Parser: any;
try {
    Parser = require('web-tree-sitter');
} catch (e) {
    console.warn("web-tree-sitter not available");
}

function logToFile(msg: string) {
    if (typeof window === 'undefined' && fs) {
        try {
            fs.appendFileSync('debug-log.txt', msg + '\n');
        } catch (e) { }
    }
}

console.log("TreeSitterFactory: Module loaded");

export class TreeSitterFactory {
    private static initialized = false;
    private static languages: Map<string, any> = new Map();

    static async init() {
        if (this.initialized) return;

        logToFile("TreeSitterFactory: init start");
        console.log("FORCE LOG: init start");
        console.log("TreeSitterFactory: initializing...");
        try {
            await Parser.init({
                locateFile(scriptName: string, scriptDirectory: string) {
                    if (typeof window !== 'undefined') {
                        return `/${scriptName}`;
                    }
                    // On server, use absolute path to public folder
                    return path.resolve(process.cwd(), 'public', scriptName);
                }
            });
            this.initialized = true;
            logToFile("TreeSitterFactory: init success");
            console.log("Tree-sitter initialized successfully");
        } catch (e) {
            logToFile(`TreeSitterFactory: init failed ${e}`);
            console.log("Failed to initialize Tree-sitter:", e);
            throw e;
        }
    }

    static async getLanguage(extension: string): Promise<any | null> {
        if (!this.initialized) await this.init();

        const langKey = this.getLanguageKey(extension);
        logToFile(`getLanguage: extension='${extension}', langKey='${langKey}'`);
        console.log(`getLanguage: extension='${extension}', langKey='${langKey}'`);
        if (!langKey) return null;

        if (this.languages.has(langKey)) {
            return this.languages.get(langKey)!;
        }

        try {
            const wasmPath = path.resolve(process.cwd(), 'public', `tree-sitter-${langKey}.wasm`);
            console.log(`Loading grammar from ${wasmPath}`);
            const lang = await Parser.Language.load(wasmPath);
            this.languages.set(langKey, lang);
            return lang;
        } catch (e) {
            logToFile(`Failed to load grammar for ${langKey}: ${e}`);
            console.log(`Failed to load grammar for ${langKey}:`, e);
            return null;
        }
    }

    static async getParser(extension: string): Promise<any | null> {
        const lang = await this.getLanguage(extension);
        if (!lang) return null;

        const parser = new Parser();
        parser.setLanguage(lang);
        return parser;
    }

    private static getLanguageKey(extension: string): string | null {
        switch (extension.toLowerCase()) {
            case '.js':
            case '.jsx':
            case '.mjs':
            case '.cjs':
                return 'javascript';
            case '.ts':
                return 'typescript';
            case '.tsx':
                return 'tsx';
            case '.py':
                return 'python';
            case '.go':
                return 'go';
            default:
                return null;
        }
    }
}
