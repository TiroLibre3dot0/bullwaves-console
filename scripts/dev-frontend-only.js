#!/usr/bin/env node

/**
 * Frontend-only development launcher.
 *
 * Starts:
 * - Backend upload/API server (npm run upload:server)
 * - Vite frontend (npm run dev:frontend:vite)
 *
 * Skips:
 * - predev verify/data generation chain tied to `npm run dev`
 */

const { spawn } = require('child_process')
const path = require('path')

const ROOT = path.join(__dirname, '..')

function runStep(command, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' },
    })

    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${label} exited with code ${code}`))
    })

    child.on('error', (err) => {
      reject(new Error(`${label} failed to start: ${err.message}`))
    })
  })
}

function startLongRunning(command, args, label) {
  const child = spawn(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' },
  })

  child.on('error', (err) => {
    console.error(`[${label}] failed to start: ${err.message}`)
  })

  return child
}

async function main() {
  console.log('\n=== Bullwaves Frontend-Only Dev Mode ===')
  console.log('Preparing safe placeholder artifacts (missing files only)...')
  await runStep('npm', ['run', 'dev:frontend:prepare'], 'dev:frontend:prepare')

  console.log('Starting backend (upload/API server) ...')
  const backend = startLongRunning('npm', ['run', 'dev:frontend:backend'], 'backend')

  // Give backend a short head start; keep this small to preserve fast startup.
  await new Promise((resolve) => setTimeout(resolve, 800))

  console.log('Starting Vite frontend ...')
  const frontend = startLongRunning('npm', ['run', 'dev:frontend:vite'], 'frontend')

  let shuttingDown = false
  const shutdown = () => {
    if (shuttingDown) return
    shuttingDown = true

    if (frontend && !frontend.killed) {
      try { frontend.kill('SIGTERM') } catch (_) { /* ignore */ }
    }

    if (backend && !backend.killed) {
      try { backend.kill('SIGTERM') } catch (_) { /* ignore */ }
    }

    setTimeout(() => process.exit(0), 300)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  frontend.on('exit', (code) => {
    if (!shuttingDown) {
      console.error(`Frontend exited (code=${code}). Stopping backend.`)
      shutdown()
    }
  })

  backend.on('exit', (code) => {
    if (!shuttingDown) {
      console.error(`Backend exited (code=${code}). Stopping frontend.`)
      shutdown()
    }
  })
}

main().catch((err) => {
  console.error('Failed to start frontend-only dev mode.')
  console.error(err && err.message ? err.message : err)
  process.exit(1)
})
