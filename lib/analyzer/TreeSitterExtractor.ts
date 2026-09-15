import { TreeSitterFactory } from './TreeSitterFactory';
const Parser = require('web-tree-sitter');


export class TreeSitterExtractor {
    private static queryCache: Map<string, any> = new Map();
    private parser: any | null = null;

    constructor() {
        console.log("TreeSitterExtractor: Constructor initialized");
    }

    async extractImports(content: string, filePath: string): Promise<string[]> {
        // Skip empty content or non-code files early
        if (!content || content.length > 200000) { // Skip massive files > 200kb to save memory
            return [];
        }

        const ext = filePath.split('.').pop() ? '.' + filePath.split('.').pop() : '';
        const language = await TreeSitterFactory.getLanguage(ext);

        if (!language) {
            return [];
        }

        if (!this.parser) {
            this.parser = new Parser();
        }

        try {
            this.parser.setLanguage(language);
        } catch (e) {
            console.warn(`Failed to set language for ${filePath}:`, e);
            return [];
        }

        let tree;
        try {
            tree = this.parser.parse(content);
        } catch (e) {
            console.error(`Failed to parse ${filePath}:`, e);
            return [];
        }

        const imports: Set<string> = new Set();
        const query = this.getQueryForExtension(language, ext);

        if (!query) {
            tree.delete();
            return [];
        }

        try {
            const matches = query.matches(tree.rootNode);

            for (const match of matches) {
                for (const capture of match.captures) {
                    if (capture.name === 'path') {
                        let importPath = capture.node.text;
                        // Remove quotes
                        importPath = importPath.replace(/^['"]|['"]$/g, '');
                        if (importPath) imports.add(importPath);
                    }
                }
            }
        } catch (e) {
            console.error(`Error executing query for ${filePath}:`, e);
        } finally {
            if (tree) tree.delete();
            // Do NOT delete the parser here, we reuse it.
            // Do NOT delete the query here, it is cached.
        }

        return Array.from(imports);
    }

    private getQueryForExtension(language: any, ext: string): any | null {
        const langKey = ext.toLowerCase();

        // Return cached query if exists
        if (TreeSitterExtractor.queryCache.has(langKey)) {
            return TreeSitterExtractor.queryCache.get(langKey);
        }

        try {
            let queryString = '';

            switch (langKey) {
                case '.js':
                case '.jsx':
                case '.ts':
                case '.tsx':
                case '.mjs':
                case '.cjs':
                    queryString = `
                        (import_statement source: (_) @path)
                        (export_statement source: (_) @path)
                        (call_expression
                            function: ((identifier) @name (#eq? @name "require"))
                            arguments: (arguments (_) @path)
                        )
                    `;
                    break;
                case '.py':
                    queryString = `
                        (import_from_statement module_name: (_) @path)
                        (import_statement name: (_) @path)
                    `;
                    break;
                case '.go':
                    queryString = `
                        (import_spec path: (_) @path)
                    `;
                    break;
                default:
                    return null;
            }

            if (!queryString) return null;

            // Compile and cache the query
            const query = language.query(queryString);
            TreeSitterExtractor.queryCache.set(langKey, query);
            return query;
        } catch (e) {
            console.error(`Failed to create query for ${ext}:`, e);
            return null;
        }
    }
}
