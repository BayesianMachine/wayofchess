import { rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const webRoot = path.resolve(import.meta.dirname, '..')

for (const release of ['a', 'b']) {
  const output = `dist-pwa-${release}`
  await rm(path.join(webRoot, output), { recursive: true, force: true })
  const result = spawnSync(
    'pnpm',
    ['exec', 'vite', 'build', '--outDir', output, '--emptyOutDir'],
    {
      cwd: webRoot,
      env: { ...process.env, VITE_APP_VERSION: `release-${release}` },
      shell: process.platform === 'win32',
      stdio: 'inherit',
    }
  )
  if (result.status !== 0) process.exit(result.status ?? 1)
}
