import React, { useEffect, useRef, useState } from 'react'

export default function RightSidebar({
  open,
  onClose,
  children,
  width = 420,
  ariaLabel = 'Sidebar',
}) {
  const [mounted, setMounted] = useState(Boolean(open))
  const rootRef = useRef(null)

  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }

    const t = window.setTimeout(() => setMounted(false), 220)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return

    const onPointerDownCapture = (e) => {
      const el = rootRef.current
      if (!el) return
      const target = e.target
      if (target && el.contains(target)) return
      onClose?.()
    }

    // Capture-phase so we reliably detect click-away.
    window.addEventListener('pointerdown', onPointerDownCapture, true)
    return () => window.removeEventListener('pointerdown', onPointerDownCapture, true)
  }, [open, onClose])

  if (!mounted) return null

  const resolvedWidth = typeof width === 'number' ? `${width}px` : String(width || '420px')

  return (
    <aside
      ref={rootRef}
      role="complementary"
      aria-label={ariaLabel}
      aria-hidden={!open}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100dvh',
        width: resolvedWidth,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, rgba(11,16,32,0.98) 0%, rgba(9,12,24,0.98) 100%)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '-14px 0 40px rgba(0,0,0,0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 220ms cubic-bezier(.2,.8,.2,1)',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          padding: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(226,232,240,0.92)',
            fontSize: 20,
            fontWeight: 900,
            cursor: 'pointer',
            lineHeight: '32px',
          }}
          aria-label="Close"
          title="Close"
        >
          ×
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>{children}</div>
      <div
        style={{
          height: 14,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 100%)',
        }}
      />
    </aside>
  )
}
