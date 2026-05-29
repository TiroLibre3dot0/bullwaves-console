#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

const DEV_COMMAND = 'npm'
const DEV_ARGS = ['run', 'dev']
const RESTART_DELAY_MS = 2000
const MAX_RAPID_RESTARTS = 5
const RAPID_RESTART_WINDOW_MS = 30000

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString('it-IT')
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`)
}

let childProcess = null
let restartCount = 0
let startTime = Date.now()
let isShuttingDown = false
let restartTimestamps = []

function getUptime() {
  const uptimeMs = Date.now() - startTime
  const seconds = Math.floor(uptimeMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

function isRapidRestart() {
  const now = Date.now()
  restartTimestamps = restartTimestamps.filter((ts) => now - ts < RAPID_RESTART_WINDOW_MS)
  restartTimestamps.push(now)
  return restartTimestamps.length >= MAX_RAPID_RESTARTS
}

function startDevServer() {
  if (isShuttingDown) return

  log(`Starting dev server (restart #${restartCount})...`, 'cyan')

  childProcess = spawn(DEV_COMMAND, DEV_ARGS, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      FORCE_COLOR: '1',
    },
  })

  startTime = Date.now()

  childProcess.on('exit', (code, signal) => {
    if (isShuttingDown) {
      log('Dev server stopped cleanly.', 'dim')
      process.exit(0)
      return
    }

    const uptime = getUptime()

    if (code === 0) {
      log(`Dev server exited cleanly after ${uptime}.`, 'green')
      log('Shutting down wrapper (clean exit).', 'dim')
      process.exit(0)
      return
    }

    if (signal) {
      log(`Dev server killed by signal: ${signal} (uptime: ${uptime})`, 'yellow')
    } else {
      log(`Dev server crashed with exit code ${code} (uptime: ${uptime})`, 'red')
    }

    if (isRapidRestart()) {
      log(
        `Too many rapid restarts (${MAX_RAPID_RESTARTS} in ${RAPID_RESTART_WINDOW_MS / 1000}s).`,
        'red'
      )
      log('Fix the issue and run npm run dev:stable again.', 'yellow')
      process.exit(1)
      return
    }

    restartCount++
    log(`Restarting in ${RESTART_DELAY_MS / 1000}s...`, 'yellow')

    setTimeout(() => {
      startDevServer()
    }, RESTART_DELAY_MS)
  })

  childProcess.on('error', (err) => {
    log(`Failed to start dev server: ${err.message}`, 'red')
    process.exit(1)
  })
}

function shutdown(signal) {
  if (isShuttingDown) return
  isShuttingDown = true

  log(`Received ${signal}. Shutting down gracefully...`, 'yellow')

  if (childProcess) {
    childProcess.kill('SIGTERM')

    setTimeout(() => {
      if (childProcess) {
        log('Dev server not responding. Force killing...', 'red')
        childProcess.kill('SIGKILL')
        process.exit(1)
      }
    }, 5000)
  } else {
    process.exit(0)
  }
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

console.log(
  `${colors.bright}${colors.cyan}Bullwaves Console - Stable Dev Mode${colors.reset}\n${colors.dim}Auto-restart enabled. Press Ctrl+C to stop.${colors.reset}`
)

startDevServer()
