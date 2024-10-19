// esbuild.js
const esbuild = require('esbuild');
const { execSync, spawn } = require('child_process');
const path = require('path');

// Common build options
const commonOptions = {
  bundle: true,
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
};

// Function to build the React app using Vite
function buildReactApp() {
  try {
    console.log('Building React app...');
    execSync('npx vite build', {
      cwd: path.resolve(__dirname, 'webview-chat'),
      stdio: 'inherit',
    });
    console.log('React app build complete.');
  } catch (error) {
    console.error('Error building React app:', error.message);
    console.error('stdout:', error.stdout?.toString());
    console.error('stderr:', error.stderr?.toString());
    process.exit(1);
  }
}

// Function to build the VS Code Extension
async function buildExtension() {
  try {
    console.log('Building VS Code Extension...');
    await esbuild.build({
      ...commonOptions,
      entryPoints: ['src/extension.ts'],
      platform: 'node',
      target: ['node14'],
      outfile: 'out/extension.js',
      external: ['vscode'],
    });
    console.log('Extension build complete.');
  } catch (error) {
    console.error('Error building Extension:', error);
    process.exit(1);
  }
}

// Function to build the Language Server
// async function buildLanguageServer() {
//   try {
//     console.log('Building Language Server...');
//     await esbuild.build({
//       ...commonOptions,
//       entryPoints: ['src/languageServer/server.ts'],
//       platform: 'node',
//       target: ['node14'],
//       outfile: 'out/server/server.js',
//       external: ['vscode'],
//     });
//     console.log('Language Server build complete.');
//   } catch (error) {
//     console.error('Error building Language Server:', error);
//     process.exit(1);
//   }
// }

// Function to build both Extension and Language Server
async function buildExtensionAndServer() {
  await buildExtension();
  // await buildLanguageServer();
}

// Function to watch for changes and build accordingly
function watchMode() {
  // Start React app in watch (dev) mode
  console.log('Starting React app in watch mode...');
  const reactProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.resolve(__dirname, 'webview-chat'),
    stdio: 'inherit',
    shell: true,
  });

  // Watch the extension code
  esbuild.build({
    ...commonOptions,
    entryPoints: ['src/extension.ts'],
    platform: 'node',
    target: ['node14'],
    outfile: 'out/extension.js',
    external: ['vscode'],
    watch: {
      onRebuild(error, result) {
        if (error) {
          console.error('Extension build failed:', error);
        } else {
          console.log('Extension build succeeded.');
        }
      },
    },
  }).catch(() => process.exit(1));

  // Watch the language server code
  // esbuild.build({
  //   ...commonOptions,
  //   entryPoints: ['src/languageServer/server.ts'],
  //   platform: 'node',
  //   target: ['node14'],
  //   outfile: 'out/server/server.js',
  //   external: ['vscode'],
  //   watch: {
  //     onRebuild(error, result) {
  //       if (error) {
  //         console.error('Language server build failed:', error);
  //       } else {
  //         console.log('Language server build succeeded.');
  //       }
  //     },
  //   },
  // }).catch(() => process.exit(1));
}

// Main Execution Flow
(async () => {
  const args = process.argv.slice(2);
  const watch = args.includes('--watch');

  if (watch) {
    watchMode();
  } else {
    buildReactApp();
    await buildExtensionAndServer();
    console.log('All build processes completed successfully.');
  }
})();
