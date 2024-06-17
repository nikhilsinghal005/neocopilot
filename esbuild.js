const esbuild = require('esbuild');

// Common build options
const commonOptions = {
  bundle: true,
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
};

// Build configuration for the extension part
esbuild.build({
  ...commonOptions,
  entryPoints: ['src/extension.ts'], // Path to your extension's main TypeScript file
  platform: 'node', // Specifies that the code runs in Node.js
  target: ['node14'], // Target version of Node.js
  outfile: 'out/extension.js',
  external: ['vscode'], // Mark 'vscode' as an external module (not to be bundled)
}).catch(() => process.exit(1));

// Build configuration for the webview part
esbuild.build({
  ...commonOptions,
  entryPoints: ['src/webview/main.ts'], // Path to your webview's main TypeScript file
  platform: 'browser', // Specifies that the code runs in a browser-like environment
  target: ['chrome80'], // Target version of Chrome (Electron's version)
  outfile: 'out/webview/main.js',
  loader: {
    '.css': 'css', // Add loader for CSS files
    '.png': 'file', // Add loader for image files
    '.jpg': 'file', // Add loader for image files
    '.svg': 'file'  // Add loader for SVG files
  }
}).catch(() => process.exit(1));
