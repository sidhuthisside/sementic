const fs = require('fs');
const https = require('https');
const path = require('path');

const files = [
    { url: 'https://github.com/tree-sitter/tree-sitter/releases/download/v0.20.0/tree-sitter.wasm', dest: 'public/tree-sitter.wasm' },
    { url: 'https://github.com/tree-sitter/tree-sitter-javascript/releases/download/v0.20.0/tree-sitter-javascript.wasm', dest: 'public/tree-sitter-javascript.wasm' },
    { url: 'https://github.com/tree-sitter/tree-sitter-typescript/releases/download/v0.20.0/tree-sitter-typescript.wasm', dest: 'public/tree-sitter-typescript.wasm' },
    { url: 'https://github.com/tree-sitter/tree-sitter-python/releases/download/v0.20.0/tree-sitter-python.wasm', dest: 'public/tree-sitter-python.wasm' },
    { url: 'https://github.com/tree-sitter/tree-sitter-go/releases/download/v0.20.0/tree-sitter-go.wasm', dest: 'public/tree-sitter-go.wasm' }
];

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                download(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${dest}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
};

(async () => {
    if (!fs.existsSync('public')) {
        fs.mkdirSync('public');
    }
    for (const f of files) {
        try {
            console.log(`Downloading ${f.url}...`);
            await download(f.url, f.dest);
        } catch (e) {
            console.error(`Failed to download ${f.url}:`, e);
        }
    }
})();
