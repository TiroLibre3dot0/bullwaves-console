const STORAGE_KEY = 'bullwaves-tracking-events'

function safeLoad() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    return []
  }
}

function persist(events) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch (err) {
    // Swallow storage errors; best-effort only
  }
}

export function trackEvent(event = {}) {
  const now = new Date().toISOString()
  const entry = {
    type: event.type || 'UNKNOWN',
    userEmail: event.userEmail || '',
    userName: event.userName || '',
    userRole: event.userRole || '',
    section: event.section || '',
    timestamp: now,
  }
  const events = safeLoad()
  events.push(entry)
  persist(events)
  return entry
}

export function getAllEvents() {
  return safeLoad()
}

export function getUserStats() {
  const events = safeLoad()
  const map = new Map()

  events.forEach((ev) => {
    if (!ev.userEmail) return
    const key = ev.userEmail.toLowerCase()
    const current = map.get(key) || {
      email: ev.userEmail,
      name: ev.userName,
      role: ev.userRole,
      lastSeen: null,
      lastSection: null,
      sessionsCount: 0,
    }

    const ts = ev.timestamp
    if (!current.lastSeen || (ts && ts > current.lastSeen)) {
      current.lastSeen = ts
      if (ev.type === 'NAVIGATE' && ev.section) current.lastSection = ev.section
    }
    if (ev.type === 'LOGIN') {
      current.sessionsCount += 1
    }
    if (!current.name && ev.userName) current.name = ev.userName
    if (!current.role && ev.userRole) current.role = ev.userRole

    map.set(key, current)
  })

  return Array.from(map.values())
}

export function getSectionStats() {
  const events = safeLoad()
  const counts = new Map()
  events.forEach((ev) => {
    if (ev.type !== 'NAVIGATE' || !ev.section) return
    const key = ev.section
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  return Array.from(counts.entries()).map(([sectionId, count]) => ({ sectionId, count }))
}

export function getOnlineUsers(events = [], now = new Date(), onlineWindowMinutes = 5) {
  const cutoff = now.getTime() - onlineWindowMinutes * 60 * 1000
  return events
    .reduce((acc, ev) => {
      if (!ev.userEmail) return acc
      const key = ev.userEmail.toLowerCase()
      const ts = ev.timestamp ? new Date(ev.timestamp).getTime() : 0
      const current = acc.get(key) || { email: ev.userEmail, name: ev.userName, role: ev.userRole, lastSeen: null, lastSection: null }
      if (ts && (!current.lastSeen || ts > new Date(current.lastSeen).getTime())) {
        current.lastSeen = ev.timestamp
        if (ev.type === 'NAVIGATE' && ev.section) current.lastSection = ev.section
      }
      acc.set(key, current)
      return acc
    }, new Map())
    .values()
    .filter((u) => {
      if (!u.lastSeen) return false
      const ts = new Date(u.lastSeen).getTime()
      return ts >= cutoff
    })
    .map((u) => ({ ...u, online: true }))
}

export function clearEvents() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}
