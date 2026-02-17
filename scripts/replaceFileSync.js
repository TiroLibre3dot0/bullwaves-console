'use strict'

const fs = require('fs')

function sleepSync(ms) {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
  } catch (e) {
    // no-op
  }
}

function replaceFileSync(tmpPath, destPath) {
  const isWin = process.platform === 'win32'

  try {
    fs.renameSync(tmpPath, destPath)
    return
  } catch (e) {
    if (!e || typeof e !== 'object') throw e
    const code = e.code

    if (code === 'EXDEV') {
      fs.copyFileSync(tmpPath, destPath)
      fs.unlinkSync(tmpPath)
      return
    }

    if (isWin && (code === 'EPERM' || code === 'EACCES' || code === 'EEXIST')) {
      const maxRetries = 6
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath)
          fs.renameSync(tmpPath, destPath)
          return
        } catch (e2) {
          const code2 = e2 && e2.code
          if (attempt < maxRetries - 1 && (code2 === 'EPERM' || code2 === 'EACCES')) {
            sleepSync(150)
            continue
          }
          throw e2
        }
      }
    }

    throw e
  }
}

module.exports = { replaceFileSync }
