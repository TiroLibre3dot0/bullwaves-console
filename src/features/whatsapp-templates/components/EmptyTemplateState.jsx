export default function EmptyTemplateState({
  title = 'Select a template to preview its content and performance',
  subtitle = 'Use filters on the left to narrow the library and select a template.',
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-linear-to-br from-slate-900/95 via-slate-900/85 to-slate-950/95 p-8 text-center shadow-xl shadow-black/25">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-sky-400/30 bg-sky-500/10 text-sky-300">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
          <path d="M4 6h16M4 12h9M4 18h13" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
    </div>
  )
}
