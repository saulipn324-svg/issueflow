import { spawn } from 'node:child_process';

const base = process.env.ISSUEFLOW_API_BASE;
if (!base || !['http:', 'https:'].includes(new URL(base).protocol)) {
  throw new Error('ISSUEFLOW_API_BASE debe ser una URL HTTP o HTTPS.');
}
// The Sites build targets Workers. Wrangler runs that same build locally;
// this container is for a local full-stack environment, not public hosting.
const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js',
  'dev', '--local', '--config', 'dist/server/wrangler.json',
  '--ip', '0.0.0.0', '--port', '3000', '--var', `ISSUEFLOW_API_BASE:${base}`],
  { stdio: 'inherit', env: { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false' } });
for (const signal of ['SIGTERM','SIGINT']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code ?? 1));
child.on('error', error => { console.error(error.message); process.exit(1); });
