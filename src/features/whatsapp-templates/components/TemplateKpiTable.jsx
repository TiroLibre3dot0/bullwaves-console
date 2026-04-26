/**
 * TemplateKpiTable — tabella principale KPI template WhatsApp.
 * Mostra dati reali da stato Convrs: inviati / consegnati / letti / risposte / reply rate.
 * Nessun dato sintetico o simulato. Se i dati sono a zero, è esplicitato il motivo.
 */
export default function TemplateKpiTable({ livePayload }) {
  const templateList = livePayload?.live?.templates?.list || []
  const tracking = livePayload?.live?.tracking || null
  const configured = Boolean(livePayload?.status?.configured)
  const updatedAt = livePayload?.live?.updatedAt || null

  // Classifica performance in base al reply rate
  function performanceBadge(replyRate, sent) {
    if (sent === 0) return null
    if (replyRate >= 25)
      return {
        label: 'Ottimo',
        cls: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      }
    if (replyRate >= 15)
      return { label: 'Buono', cls: 'bg-sky-500/15 text-sky-300 border border-sky-500/30' }
    if (replyRate >= 7)
      return {
        label: 'Da migliorare',
        cls: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      }
    return { label: 'Basso', cls: 'bg-red-500/15 text-red-300 border border-red-500/30' }
  }

  function fmt(n) {
    return Number.isFinite(Number(n)) ? Number(n).toLocaleString('it-IT') : '—'
  }

  function fmtRate(n) {
    if (!Number.isFinite(Number(n))) return '—'
    return `${Number(n).toFixed(1)}%`
  }

  // Nessun dato — stato vuoto con istruzioni chiare
  if (!configured) {
    return (
      <section className="rounded-2xl border border-gray-600 bg-gray-700/75 p-6">
        <h2 className="text-sm font-semibold text-gray-200">Performance template</h2>
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/8 p-4 text-xs text-amber-100">
          <p className="font-semibold">API Convrs non configurata</p>
          <p className="mt-1 opacity-85">
            Imposta <code className="text-amber-200">CONVRS_API_TOKEN</code> nel file{' '}
            <code className="text-amber-200">.env.server.local</code> e riavvia il server.
          </p>
        </div>
      </section>
    )
  }

  if (templateList.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-600 bg-gray-700/75 p-6">
        <h2 className="text-sm font-semibold text-gray-200">Performance template</h2>
        <div className="mt-3 text-xs text-gray-400">
          {tracking ? (
            <>
              <p>Nessun template tracciato ancora.</p>
              <p className="mt-1">
                Messaggi tracciati:{' '}
                <span className="text-gray-300">{tracking.trackedMessages}</span>
                {' · '}Attribuiti a template:{' '}
                <span className="text-gray-300">{tracking.attributedMessages}</span>
              </p>
            </>
          ) : (
            <p>
              Nessun dato disponibile. Invia il primo template e registra il mid con{' '}
              <code>/api/convrs/register-send</code>.
            </p>
          )}
        </div>
        <div className="mt-4 rounded-xl border border-gray-600 bg-gray-700/50 p-4 text-xs text-gray-300">
          <p className="font-semibold text-gray-200 mb-2">Come far apparire i dati</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-400">
            <li>
              Invia un template WhatsApp via API Convrs (salva il{' '}
              <code className="text-gray-300">mid</code> restituito)
            </li>
            <li>
              Chiama{' '}
              <code className="text-gray-300 bg-gray-600 px-1 rounded">
                POST /api/convrs/register-send {'{ mid, templateName }'}
              </code>
            </li>
            <li>
              Convrs invierà i callback ACK al webhook — i KPI vengono aggiornati automaticamente
            </li>
          </ol>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-gray-600 bg-gray-700/75 overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h2 className="text-sm font-semibold text-gray-200">Performance template</h2>
        <div className="flex items-center gap-3">
          {tracking ? (
            <span className="text-xs text-slate-500">
              {tracking.trackedMessages} messaggi · {tracking.trackedTemplates} template
            </span>
          ) : null}
          {updatedAt ? (
            <span className="text-xs text-slate-500">
              Aggiornato {new Date(updatedAt).toLocaleString('it-IT')}
            </span>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-y border-gray-600 bg-gray-900/50 text-left text-slate-500 uppercase tracking-widest">
              <th className="px-5 py-2.5 font-medium">Template</th>
              <th className="px-3 py-2.5 font-medium text-right">Inviati</th>
              <th className="px-3 py-2.5 font-medium text-right">Consegnati</th>
              <th className="px-3 py-2.5 font-medium text-right">Del. Rate</th>
              <th className="px-3 py-2.5 font-medium text-right">Letti</th>
              <th className="px-3 py-2.5 font-medium text-right">Read Rate</th>
              <th className="px-3 py-2.5 font-medium text-right">Risposte</th>
              <th className="px-3 py-2.5 font-medium text-right">Reply Rate</th>
              <th className="px-3 py-2.5 font-medium text-right">Falliti</th>
              <th className="px-3 py-2.5 font-medium">Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/60">
            {templateList.map((row) => {
              const badge = performanceBadge(row.replyRate, row.sent)
              const displayName = row.templateName || row.templateId || row.key || '—'
              return (
                <tr key={row.key} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-200">{displayName}</span>
                    {row.lastEventAt ? (
                      <span className="block text-slate-500 mt-0.5">
                        Ultimo evento: {new Date(row.lastEventAt).toLocaleString('it-IT')}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-300">{fmt(row.sent)}</td>
                  <td className="px-3 py-3 text-right text-gray-300">{fmt(row.delivered)}</td>
                  <td className="px-3 py-3 text-right text-gray-400">
                    {fmtRate(row.deliveryRate)}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-300">{fmt(row.read)}</td>
                  <td className="px-3 py-3 text-right text-gray-400">{fmtRate(row.readRate)}</td>
                  <td className="px-3 py-3 text-right text-gray-300">{fmt(row.replies)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-gray-200">
                    {fmtRate(row.replyRate)}
                  </td>
                  <td className="px-3 py-3 text-right text-red-400/70">
                    {row.failed > 0 ? fmt(row.failed) : '—'}
                  </td>
                  <td className="px-3 py-3">
                    {badge ? (
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="px-5 py-2.5 text-[10px] text-slate-600 border-t border-gray-600">
        Dati basati su callback Convrs e messaggi tracciati per mid. Nessun dato storico disponibile
        via API pubblica.
      </p>
    </section>
  )
}
