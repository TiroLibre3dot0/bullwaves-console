export default function WhatsAppTemplatesLiveStatus({ liveState, onManualSync, syncing }) {
  const configured = Boolean(liveState?.status?.configured)
  const persistence = String(liveState?.status?.persistence || 'memory').toUpperCase()
  const updatedAt = liveState?.live?.updatedAt || liveState?.updatedAt
  const syncAt = liveState?.live?.lastSyncAt || liveState?.lastSyncAt
  const tracking = liveState?.live?.tracking || null
  const capabilities = liveState?.status?.capabilities || {}

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Live data source</p>
          <p className="mt-1 text-sm text-slate-200">
            Convrs API status:{' '}
            <span className={configured ? 'text-emerald-300' : 'text-amber-300'}>
              {configured ? 'connected' : 'not configured'}
            </span>
            {' · '}Persistence: <span className="text-slate-300">{persistence}</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Updated: {updatedAt ? new Date(updatedAt).toLocaleString('it-IT') : 'N/A'}
            {' · '}Last sync: {syncAt ? new Date(syncAt).toLocaleString('it-IT') : 'N/A'}
          </p>
          {tracking ? (
            <p className="mt-1 text-xs text-slate-400">
              Tracked messages: {tracking.trackedMessages}
              {' · '}Attributed: {tracking.attributedMessages}
              {' · '}Templates: {tracking.trackedTemplates}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onManualSync}
          disabled={syncing || !configured}
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-400/50 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync now'}
        </button>
      </div>

      <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/8 p-3 text-xs text-amber-100">
        <p className="font-semibold text-amber-200">Convrs public API limits</p>
        <p className="mt-1 text-amber-100/85">
          Historical template analytics, sent-template listings and template catalogs are not exposed via the public API.
          This dashboard can only build WhatsApp KPIs from callbacks and from message details for known mids.
        </p>
        <p className="mt-1 text-amber-100/75">
          {capabilities?.historicalTemplateAnalytics === false
            ? 'Historical trend and previous-period comparisons are unavailable.'
            : 'Historical trend availability is unknown.'}
          {' '}
          {capabilities?.conversationsFlatScope === 'closed-agent-conversations'
            ? 'GetConversationsFlat covers closed human conversations, not template campaign analytics.'
            : ''}
        </p>
      </div>
    </section>
  )
}
