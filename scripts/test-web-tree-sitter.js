const Parser = require('web-tree-sitter');

console.log('Require success');

Parser.init().then(() => console.log('Init success')).catch(e => console.error('Init failed:', e));
