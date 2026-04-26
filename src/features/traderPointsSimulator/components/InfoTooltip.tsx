import type { ReactNode } from 'react'
import { useI18n } from '../../../i18n/I18nContext.ts'

export default function InfoTooltip({
  content,
  label,
  className = '',
}: {
  content: ReactNode
  label?: string
  className?: string
}) {
  const { t } = useI18n()
  const ariaLabel = label ?? t('common.info')

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <span className="group relative inline-flex">
        <span
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-gray-700/60 text-[11px] font-extrabold leading-none text-gray-200 shadow-sm transition hover:border-cyan-400/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
        >
          i
        </span>

        <span className="pointer-events-none absolute left-1/2 top-0 z-20 hidden w-[320px] -translate-x-1/2 -translate-y-[110%] rounded-lg border border-white/10 bg-gray-700/95 p-3 text-[12px] leading-snug text-gray-200 shadow-2xl backdrop-blur-md group-hover:block group-focus-within:block">
          <span className="block">{content}</span>
          <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-white/10 bg-gray-700/95" />
        </span>
      </span>
    </span>
  )
}
