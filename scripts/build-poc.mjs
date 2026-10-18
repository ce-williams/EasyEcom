import { cp, mkdir, readFile, rm, symlink, writeFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const staging = join(root, '.poc-build');
const output = join(root, 'out');
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'EasyEcom';
const basePath = process.env.POC_BASE_PATH ?? `/${repository}`;
if (basePath !== '' && !/^\/[A-Za-z0-9_.-]+$/.test(basePath)) throw new Error('Use an empty POC_BASE_PATH or a single repository path segment.');

// Build an isolated static source tree. Do not rename/delete the live app's
// routes or copy any .env file, private operations data, or runtime output.
await rm(staging, { recursive: true, force: true });
await rm(output, { recursive: true, force: true });
await mkdir(staging, { recursive: true });
for (const name of ['src', 'public', 'package.json', 'tsconfig.json']) {
  await cp(join(root, name), join(staging, name), { recursive: true });
}
await symlink(join(root, 'node_modules'), join(staging, 'node_modules'), 'dir');
await rm(join(staging, 'src/app/api'), { recursive: true, force: true });
await rm(join(staging, 'src/app/checkout/return'), { recursive: true, force: true });
for (const name of ['src/app/layout.tsx', 'src/app/pages/[slug]/page.tsx']) {
  const path = join(staging, name);
  const source = await readFile(path, 'utf8');
  if (!source.includes("export const dynamic = 'force-dynamic';")) throw new Error(`Review static prerendering for ${name}.`);
  await writeFile(path, source.replace("export const dynamic = 'force-dynamic';", "export const dynamic = 'force-static';"));
}
await writeFile(join(staging, 'next.config.mjs'), `export default ${JSON.stringify({
  output: 'export', trailingSlash: true, basePath,
  poweredByHeader: false, devIndicators: false,
  turbopack: { root },
})};\n`);

// Override inherited live settings, including any CI settings. No Stripe
// account or payment configuration is required or used in this build.
const env = { ...process.env, NEXT_PUBLIC_POC_MODE: 'true', PILOT_MODE: 'off', PILOT_ACCEPTING_ORDERS: 'false', NEXT_TELEMETRY_DISABLED: '1' };
for (const key of Object.keys(env)) {
  if (key.startsWith('STRIPE_') || (key.startsWith('PILOT_') && !['PILOT_MODE', 'PILOT_ACCEPTING_ORDERS'].includes(key))) delete env[key];
}
delete env.STOREFRONT_BUILD_DIR;
const result = spawnSync(process.execPath, [join(root, 'node_modules/next/dist/bin/next'), 'build', staging], { cwd: root, env, stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
await cp(join(staging, 'out'), output, { recursive: true });
await writeFile(join(output, '.nojekyll'), '');

// Verify the actual artifact: all paths exist, assets use the repository base,
// and no executable payment API, credentials or payment gateway can ship.
for (const name of ['index.html', 'checkout/index.html', 'cart/index.html', 'products/i-survived-i70/index.html', 'pages/shipping/index.html', '404.html']) await readFile(join(output, name));
const html = await readFile(join(output, 'index.html'), 'utf8');
if (!html.includes(`${basePath}/_next/`) || !html.includes('POC PREVIEW')) throw new Error('POC assets or preview label are missing.');
const checkout = await readFile(join(output, 'checkout/index.html'), 'utf8');
if (!checkout.includes('Checkout')) throw new Error('Checkout preview is missing.');
async function scan(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) {
      if (path === join(output, 'api')) throw new Error('Payment API was exported.');
      await scan(path);
    } else if (/\.(js|html|json|txt)$/.test(item.name)) {
      const text = await readFile(path, 'utf8');
      if (/api\.stripe\.com|checkout\.stripe\.com|STRIPE_SECRET_KEY|sk_live_[A-Za-z0-9]{20,}|rk_live_[A-Za-z0-9]{20,}/.test(text)) throw new Error(`Payment code or credentials found in ${path}.`);
    }
  }
}
await scan(output);
console.log(`Static POC ready in out/ at ${basePath || '/'}. Payment endpoints and gateway calls are absent.`);
