import { spawnSync } from 'node:child_process'
import { copyFileSync } from 'node:fs'
import { join } from 'node:path'

const result = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

const dist = join(import.meta.dirname, '..', 'dist')
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'))
console.log('Copied index.html → 404.html for GitHub Pages SPA routing')
