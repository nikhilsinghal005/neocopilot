const esbuild = require('esbuild');

// Build configuration for the extension part
esbuild.build({
  entryPoints: ['src/extension.ts'], // Path to your extension's main TypeScript file
  bundle: true,
  platform: 'node', // Specifies that the code runs in Node.js
  target: ['node14'], // Target version of Node.js
  outfile: 'out/extension.js',
  external: ['vscode'], // Mark 'vscode' as an external module (not to be bundled)
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production'
}).catch(() => process.exit(1));

// Build configuration for the webview part
esbuild.build({
  entryPoints: ['src/webview/main.ts'], // Path to your webview's main TypeScript file
  bundle: true,
  platform: 'browser', // Specifies that the code runs in a browser-like environment
  target: ['chrome80'], // Target version of Chrome (Electron's version)
  outfile: 'out/webview/main.js',
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
  loader: {
    '.css': 'css' // Add loader for CSS files
  }
}).catch(() => process.exit(1));
