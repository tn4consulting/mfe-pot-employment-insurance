// Dev server for the React employment-insurance remote -- port 4204,
// matching the Angular dev-server it replaces exactly. See build.mjs and
// job-bank's own apps/job-bank/build/serve.mjs for the full story.
import { runEsBuildBuilder } from '@softarc/native-federation-esbuild';
import * as esbuild from 'esbuild';
import { createServer } from 'node:http';
import { readFile, mkdir, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';

const require = createRequire(import.meta.url);
const outputPath = 'dist/apps/employment-insurance-mfe/browser';
const port = Number(process.env.EMPLOYMENT_INSURANCE_MFE_DEV_PORT ?? 4204);

await rm(outputPath, { recursive: true, force: true });
await mkdir(outputPath, { recursive: true });
await cp('apps/employment-insurance-mfe/public', outputPath, { recursive: true });
await cp('apps/employment-insurance-mfe/src/index.html', join(outputPath, 'index.html'));
await cp(require.resolve('es-module-shims'), join(outputPath, 'es-module-shims.js'));

await runEsBuildBuilder('apps/employment-insurance-mfe/federation.config.mjs', {
  workspaceRoot: process.cwd(),
  outputPath,
  tsConfig: 'apps/employment-insurance-mfe/tsconfig.federation.json',
  packageJson: 'package.json',
  dev: true,
  watch: true,
  adapterConfig: {
    plugins: [],
    frameworks: [{ needsCommonJsPlugin: true }],
  },
});

const mainCtx = await esbuild.context({
  entryPoints: ['apps/employment-insurance-mfe/src/main.tsx'],
  outfile: join(outputPath, 'main.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  target: 'es2022',
  sourcemap: true,
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
});
await mainCtx.watch();

const CONTENT_TYPES = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);
  let filePath = join(outputPath, decodeURIComponent(url.pathname));
  if (!existsSync(filePath) || url.pathname.endsWith('/')) {
    filePath = join(outputPath, 'index.html');
  }
  try {
    const body = await readFile(filePath);
    res.setHeader('Content-Type', CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
}).listen(port, () => {
  console.log(`employment-insurance-mfe dev server listening on http://localhost:${port}`);
});
