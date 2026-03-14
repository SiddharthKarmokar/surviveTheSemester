import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, context } from 'esbuild';
import svgrPlugin from 'esbuild-plugin-svgr';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputFile = path.resolve(rootDir, '../backend/public/script.js');
const watch = process.argv.includes('--watch');

const commonRoot = path.resolve(rootDir, 'src/tosios-common');

const aliasPlugin = {
    name: 'tosios-common-alias',
    setup(buildApi) {
        buildApi.onResolve({ filter: /^@tosios\/common$/ }, () => ({
            path: path.join(commonRoot, 'index.ts'),
        }));

        buildApi.onResolve({ filter: /^@tosios\/common\// }, ({ path: importPath }) => ({
            path: path.join(commonRoot, importPath.replace('@tosios/common/', '')),
        }));
    },
};

const config = {
    entryPoints: [path.resolve(rootDir, 'src/index.tsx')],
    outfile: outputFile,
    bundle: true,
    format: 'iife',
    sourcemap: true,
    minify: false,
    target: ['es2020'],
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    loader: {
        '.png': 'file',
        '.ogg': 'file',
        '.svg': 'file',
        '.ico': 'file',
    },
    assetNames: 'assets/[name]-[hash]',
    plugins: [aliasPlugin, svgrPlugin()],
};

if (watch) {
    const ctx = await context(config);
    await ctx.watch();
    console.log('[twoFighter] Watching and building into apps/backend/public/script.js');
} else {
    await build(config);
    console.log('[twoFighter] Build completed at apps/backend/public/script.js');
}
