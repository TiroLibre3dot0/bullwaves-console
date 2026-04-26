/**
 * ConvrsDiagnosticPanel — pannello diagnostico per verificare e testare
 * la connessione Convrs webhook + flusso register-send → callback.
 *
 * Utile in fase di setup per:
 * - Verificare la configurazione (token, webhook secret, URL endpoint)
 * - Registrare un invio manuale di test (register-send)
 * - Simulare un callback ACK (test-callback) — solo in locale/dev
 * - Vedere i messaggi recenti tracciati (debug-state)
 */
import { useState } from 'react'

const ACK_LABELS = {
  1: 'Inviato',
  2: 'Consegnato',
  3: 'Letto',
  10: 'Risposta ricevuta',
  '-1': 'Fallito',
}

function StatusDot({ ok }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full mr-1.5 ${ok ? 'bg-emerald-400' : 'bg-red-400'}`}
    />
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
      {children}
    </h3>
  )
}

export default function ConvrsDiagnosticPanel({ livePayload }) {
  const status = livePayload?.status || {}
  const tracking = livePayload?.live?.tracking || null
  const configured = Boolean(status.configured)
  const hasSecret = Boolean(status.hasWebhookSecret)

  // --- register-send ---
  const [sendMid, setSendMid] = useState('')
  const [sendTemplate, setSendTemplate] = useState('')
  const [sendResult, setSendResult] = useState(null)
  const [sendLoading, setSendLoading] = useState(false)

  const handleRegisterSend = async () => {
    if (!sendMid.trim() || !sendTemplate.trim()) return
    setSendLoading(true)
    setSendResult(null)
    try {
      const resp = await fetch('/api/convrs/register-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mid: sendMid.trim(), templateName: sendTemplate.trim() }),
      })
      const data = await resp.json()
      setSendResult({ ok: resp.ok && data.ok, data })
    } catch (e) {
      setSendResult({ ok: false, data: { error: e.message } })
    } finally {
      setSendLoading(false)
    }
  }

  // --- test-callback ---
  const [cbMid, setCbMid] = useState('')
  const [cbAck, setCbAck] = useState('2')
  const [cbResult, setCbResult] = useState(null)
  const [cbLoading, setCbLoading] = useState(false)

  const handleTestCallback = async () => {
    if (!cbMid.trim()) return
    setCbLoading(true)
    setCbResult(null)
    try {
      const resp = await fetch('/api/convrs/test-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mid: cbMid.trim(), ack: Number(cbAck) }),
      })
      const data = await resp.json()
      setCbResult({ ok: resp.ok && data.ok, data })
    } catch (e) {
      setCbResult({ ok: false, data: { error: e.message } })
    } finally {
      setCbLoading(false)
    }
  }

  // --- debug-state ---
  const [debugData, setDebugData] = useState(null)
  const [debugLoading, setDebugLoading] = useState(false)

  const handleLoadDebug = async () => {
    setDebugLoading(true)
    try {
      const resp = await fetch('/api/convrs/debug-state?limit=20')
      const data = await resp.json()
      setDebugData(data)
    } catch (e) {
      setDebugData({ error: e.message })
    } finally {
      setDebugLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Configurazione */}
      <section className="rounded-2xl border border-gray-600 bg-gray-700/75 p-5">
        <SectionTitle>Configurazione</SectionTitle>
        <div className="space-y-1.5 text-xs">
          <p>
            <StatusDot ok={configured} />
            API Token:{' '}
            <span className={configured ? 'text-emerald-300' : 'text-red-300'}>
              {configured
                ? 'configurato'
                : 'mancante — imposta CONVRS_API_TOKEN in .env.server.local'}
            </span>
          </p>
          <p>
            <StatusDot ok={hasSecret} />
            Webhook Secret:{' '}
            <span className={hasSecret ? 'text-emerald-300' : 'text-amber-300'}>
              {hasSecret ? 'configurato' : 'non impostato — i callback non vengono verificati'}
            </span>
          </p>
          <p className="text-slate-500">
            Persistence: <span className="text-gray-400">{status.persistence || '—'}</span>
            {' · '}API URL: <span className="text-gray-400">{status.apiUrl || '—'}</span>
          </p>
          {tracking ? (
            <p className="text-slate-500 mt-2">
              Messaggi tracciati: <span className="text-gray-300">{tracking.trackedMessages}</span>
              {' · '}Attribuiti:{' '}
              <span className="text-gray-300">{tracking.attributedMessages}</span>
              {' · '}Template distinti:{' '}
              <span className="text-gray-300">{tracking.trackedTemplates}</span>
            </p>
          ) : null}
        </div>

        <div className="mt-4 rounded-xl border border-gray-600 bg-gray-700/40 p-3 text-xs text-gray-400">
          <p className="font-semibold text-gray-300 mb-1.5">
            URL endpoint webhook da configurare su Convrs
          </p>
          <div className="space-y-1">
            <p>
              <span className="text-sky-400">Callback ACK:</span>{' '}
              <code className="text-gray-300">
                https://[tuo-dominio]/api/convrs/whatsapp-callback?secret=BWconvrsSecret_2026_3515055023_ok
              </code>
            </p>
            <p>
              <span className="text-sky-400">Webhook eventi:</span>{' '}
              <code className="text-gray-300">
                https://[tuo-dominio]/api/convrs/webhook?secret=BWconvrsSecret_2026_3515055023_ok
              </code>
            </p>
          </div>
          <p className="mt-2 text-slate-500">
            In locale usa <code>http://localhost:4000</code> come base. In produzione sostituisci
            con il dominio del server.
          </p>
        </div>
      </section>

      {/* Register Send */}
      <section className="rounded-2xl border border-gray-600 bg-gray-700/75 p-5">
        <SectionTitle>Registra invio template</SectionTitle>
        <p className="text-xs text-gray-400 mb-3">
          Dopo ogni invio template via Convrs API, chiama questo endpoint per tracciare il{' '}
          <code className="text-gray-300">mid</code> restituito. Senza questo passaggio i callback
          successivi non possono essere attribuiti al template corretto.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
              Message ID (mid)
            </label>
            <input
              type="text"
              value={sendMid}
              onChange={(e) => setSendMid(e.target.value)}
              placeholder="es. 987654321"
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-xs text-gray-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
              Nome template (Convrs)
            </label>
            <input
              type="text"
              value={sendTemplate}
              onChange={(e) => setSendTemplate(e.target.value)}
              placeholder="es. dormant_account"
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-xs text-gray-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleRegisterSend}
            disabled={sendLoading || !sendMid.trim() || !sendTemplate.trim()}
            className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sendLoading ? 'Registrando...' : 'Registra invio'}
          </button>
        </div>
        {sendResult ? (
          <div
            className={`mt-3 rounded-lg border p-3 text-xs font-mono ${sendResult.ok ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200' : 'border-red-500/30 bg-red-500/5 text-red-200'}`}
          >
            {JSON.stringify(sendResult.data, null, 2)}
          </div>
        ) : null}
      </section>

      {/* Test Callback (solo dev) */}
      <section className="rounded-2xl border border-gray-600/60 bg-gray-700/40 p-5">
        <SectionTitle>Simula callback ACK (solo dev)</SectionTitle>
        <p className="text-xs text-gray-400 mb-3">
          Simula un callback di cambiamento stato da Convrs su un mid già registrato. Non
          disponibile in produzione.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
              Message ID (mid)
            </label>
            <input
              type="text"
              value={cbMid}
              onChange={(e) => setCbMid(e.target.value)}
              placeholder="es. 987654321"
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-xs text-gray-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
              ACK
            </label>
            <select
              value={cbAck}
              onChange={(e) => setCbAck(e.target.value)}
              className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-xs text-gray-200 focus:border-sky-500 focus:outline-none"
            >
              {Object.entries(ACK_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {val} — {label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleTestCallback}
            disabled={cbLoading || !cbMid.trim()}
            className="rounded-lg border border-amber-500/40 bg-amber-500/8 px-4 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {cbLoading ? 'Simulando...' : 'Simula callback'}
          </button>
        </div>
        {cbResult ? (
          <div
            className={`mt-3 rounded-lg border p-3 text-xs font-mono overflow-x-auto ${cbResult.ok ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200' : 'border-red-500/30 bg-red-500/5 text-red-200'}`}
          >
            {JSON.stringify(cbResult.data, null, 2)}
          </div>
        ) : null}
      </section>

      {/* Debug State */}
      <section className="rounded-2xl border border-gray-600 bg-gray-700/75 p-5">
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Messaggi recenti tracciati</SectionTitle>
          <button
            type="button"
            onClick={handleLoadDebug}
            disabled={debugLoading}
            className="rounded-lg border border-gray-600 bg-gray-700/60 px-3 py-1.5 text-[10px] font-medium text-gray-300 transition hover:border-slate-500 disabled:opacity-40"
          >
            {debugLoading ? 'Caricamento...' : 'Carica debug'}
          </button>
        </div>

        {debugData ? (
          debugData.error ? (
            <p className="text-xs text-red-400">{debugData.error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-600 text-left text-slate-500 uppercase tracking-wider">
                    <th className="pb-2 pr-4 font-medium">mid</th>
                    <th className="pb-2 pr-4 font-medium">ack</th>
                    <th className="pb-2 pr-4 font-medium">Template</th>
                    <th className="pb-2 pr-4 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/40">
                  {(debugData.debug?.recentMessages || []).map((msg) => (
                    <tr key={msg.mid} className="text-gray-400">
                      <td className="py-1.5 pr-4 font-mono text-gray-300">{msg.mid}</td>
                      <td className="py-1.5 pr-4">
                        <span
                          className={`${msg.ack >= 3 ? 'text-emerald-400' : msg.ack >= 2 ? 'text-sky-400' : msg.ack < 0 ? 'text-red-400' : 'text-gray-400'}`}
                        >
                          {msg.ack} — {ACK_LABELS[String(msg.ack)] || '?'}
                        </span>
                      </td>
                      <td className="py-1.5 pr-4 text-gray-300">
                        {msg.templateName || msg.templateId || (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-1.5 text-slate-500">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleString('it-IT') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(debugData.debug?.recentMessages || []).length === 0 ? (
                <p className="text-xs text-slate-500 mt-2">Nessun messaggio tracciato ancora.</p>
              ) : null}
            </div>
          )
        ) : (
          <p className="text-xs text-slate-600">
            Clicca &ldquo;Carica debug&rdquo; per vedere i messaggi tracciati.
          </p>
        )}
      </section>
    </div>
  )
}
