const ACTIONS = ['Create Template', 'Export Stats', 'Compare Templates']

export default function WhatsAppTemplatesHeader() {
  return (
    <header className="rounded-2xl border border-gray-600 bg-linear-to-r from-gray-900/95 via-gray-700/90 to-gray-700/95 p-5 shadow-2xl shadow-black/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300/80">
            Operations Workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-100">WhatsApp Templates</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage outreach templates and monitor their performance
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              className="rounded-lg border border-gray-600 bg-gray-700/70 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:border-sky-400/50 hover:text-sky-200"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
