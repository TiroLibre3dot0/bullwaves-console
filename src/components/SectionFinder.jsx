import { useEffect, useRef, useState } from 'react'
import { SECTION_REGISTRY } from '../config/sectionRegistry'

const RECENT_KEY = 'bw-section-finder-recent'
const MAX_RECENT = 5
const MAX_RESULTS = 8

function readRecent() {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeRecent(id) {
  try {
    const prev = readRecent()
    const next = [id, ...prev.filter((item) => item !== id)].slice(0, MAX_RECENT)
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export default function SectionFinder({ navigate }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  const trimmed = query.trim().toLowerCase()

  const results = trimmed
    ? SECTION_REGISTRY.filter((item) => {
        const haystack =
          `${item.title} ${item.category} ${item.description} ${item.keywords.join(' ')}`.toLowerCase()
        return haystack.includes(trimmed)
      }).slice(0, MAX_RESULTS)
    : readRecent()
        .map((id) => SECTION_REGISTRY.find((entry) => entry.id === id))
        .filter(Boolean)

  const showDropdown = isOpen && results.length > 0
  const showEmpty = isOpen && trimmed && results.length === 0

  const handleSelect = (item) => {
    navigate(item.id)
    writeRecent(item.id)
    setQuery('')
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [query])

  useEffect(() => {
    const onMouseDown = (e) => {
      if (!wrapRef.current || !wrapRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [])

  const handleKeyDown = (e) => {
    if (!isOpen && !showEmpty) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((index) => (results.length ? (index + 1) % results.length : -1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((index) =>
        results.length ? (index <= 0 ? results.length - 1 : index - 1) : -1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = highlightedIndex >= 0 ? results[highlightedIndex] : results[0]
      if (target) handleSelect(target)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      setQuery('')
      setHighlightedIndex(-1)
      inputRef.current?.blur()
    }
  }

  const borderColor = isOpen ? 'rgba(16,185,129,0.42)' : 'rgba(255,255,255,0.10)'

  const boxShadow = isOpen
    ? '0 0 0 1px rgba(16,185,129,0.16), 0 16px 34px rgba(2,6,23,0.22)'
    : '0 14px 32px rgba(2,6,23,0.16)'

  return (
    <div
      ref={wrapRef}
      className="topbar-section-finder"
      style={{ position: 'relative', flex: '0 1 172px', minWidth: 0 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 42,
          padding: '0 12px',
          borderRadius: 12,
          border: `1px solid ${borderColor}`,
          background: 'rgba(15,23,42,0.84)',
          boxShadow,
          transition: 'border-color .16s ease, box-shadow .16s ease',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isOpen ? 'rgba(52,211,153,0.92)' : 'rgba(148,163,184,0.92)',
            flexShrink: 0,
            transition: 'color .16s ease',
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
            <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 16l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path
              d="M8 11h6M11 8v6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Go to section..."
          aria-label="Section finder"
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text-primary, #f8fafc)',
            fontSize: 13,
            fontWeight: 700,
          }}
        />
      </div>

      {(showDropdown || showEmpty) && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            left: 0,
            zIndex: 90,
            display: 'grid',
            gap: 4,
            padding: 8,
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(11,18,32,0.98)',
            boxShadow: '0 18px 42px rgba(2,6,23,0.34)',
            maxHeight: 'min(380px, calc(100vh - 110px))',
            overflowY: 'auto',
            minWidth: 260,
          }}
        >
          {!trimmed && results.length > 0 && (
            <div
              style={{
                color: '#64748b',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px 4px',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}
            >
              Recent
            </div>
          )}

          {results.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={() => handleSelect(item)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                flexDirection: 'column',
                gap: 2,
                padding: '8px 10px',
                border: 'none',
                borderRadius: 10,
                background: highlightedIndex === index ? 'rgba(16,185,129,0.10)' : 'transparent',
                boxShadow:
                  highlightedIndex === index ? 'inset 0 0 0 1px rgba(16,185,129,0.24)' : 'none',
                color: 'var(--text-primary, #f8fafc)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background .14s ease, box-shadow .14s ease',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.title}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 999,
                    background: 'rgba(52,211,153,0.10)',
                    border: '1px solid rgba(52,211,153,0.22)',
                    color: '#6ee7b7',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.category}
                </span>
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {item.description}
              </span>
            </button>
          ))}

          {showEmpty && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(148,163,184,0.08)',
                color: '#94a3b8',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              No matching section found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
