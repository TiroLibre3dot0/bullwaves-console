(function () {
  const DEFAULTS = {
    theme: 'dark',
    limit: 10,
    title: 'Prime Challenge Leaderboard',
    subtitle: 'Monthly payout ranking',
    ctaLabel: 'Start the challenge',
    ctaUrl: 'https://prime.bullwaves.com/',
    accent: '#16a34a',
  }

  function money(value) {
    const amount = Number(value || 0)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function resolveTarget(target) {
    if (target instanceof Element) return target
    if (typeof target === 'string') return document.querySelector(target)
    return null
  }

  function getScriptBase() {
    const current = document.currentScript
    if (current && current.src) return new URL('.', current.src).href

    const scripts = Array.from(document.querySelectorAll('script[src]'))
    const own = scripts.find((node) => /prime-contest\.js(?:\?|$)/.test(String(node.src || '')))
    return own ? new URL('.', own.src).href : ''
  }

  async function fetchPayload(baseUrl) {
    const href = new URL('prime-contest.json', baseUrl).href
    const response = await fetch(href, { cache: 'no-store' })
    if (!response.ok) throw new Error('Unable to load contest feed.')
    return response.json()
  }

  function render(target, payload, options) {
    const root = target.shadowRoot || target.attachShadow({ mode: 'open' })
    const rows = Array.isArray(payload.rows) ? payload.rows.slice(0, Math.max(1, Number(options.limit || 10))) : []
    const accent = String(options.accent || DEFAULTS.accent)

    root.innerHTML = `
      <style>
        :host { all: initial; }
        .bw-wrap {
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          color: #e5edf7;
          background:
            radial-gradient(circle at top right, rgba(22, 163, 74, 0.20), transparent 28%),
            linear-gradient(180deg, #07111f 0%, #0d1727 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          box-shadow: 0 24px 80px rgba(2, 6, 23, 0.45);
          overflow: hidden;
        }
        .bw-head {
          padding: 24px 24px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .bw-kicker {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8fb4ff;
          font-weight: 800;
          margin-bottom: 10px;
        }
        .bw-title-row {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .bw-title {
          margin: 0;
          font-size: 32px;
          line-height: 1.02;
          font-weight: 900;
          color: #f8fafc;
        }
        .bw-subtitle {
          margin: 10px 0 0;
          color: #9db0c7;
          font-size: 14px;
          line-height: 1.5;
          max-width: 720px;
        }
        .bw-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: #d8e2f0;
          padding: 10px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }
        .bw-body {
          padding: 18px 24px 24px;
        }
        .bw-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }
        .bw-stat {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 14px 16px;
        }
        .bw-stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #8da1ba;
          font-weight: 800;
        }
        .bw-stat-value {
          margin-top: 10px;
          font-size: 28px;
          line-height: 1;
          font-weight: 900;
          color: #f8fafc;
        }
        .bw-table {
          width: 100%;
          border-collapse: collapse;
        }
        .bw-table thead th {
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #7f93ac;
          font-weight: 900;
          padding: 0 0 12px;
        }
        .bw-table tbody td {
          padding: 14px 0;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 14px;
          color: #dbe6f3;
        }
        .bw-rank {
          width: 56px;
          font-weight: 900;
          color: #f8fafc;
        }
        .bw-name {
          font-weight: 800;
          color: #f8fafc;
        }
        .bw-country {
          color: #94a7bf;
        }
        .bw-payout {
          text-align: right;
          font-weight: 900;
          color: ${accent};
        }
        .bw-foot {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .bw-note {
          color: #8fa3bc;
          font-size: 12px;
          font-weight: 700;
        }
        .bw-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0 18px;
          border-radius: 999px;
          background: linear-gradient(135deg, ${accent} 0%, #22c55e 100%);
          color: #f8fafc;
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 10px 30px rgba(22, 163, 74, 0.28);
        }
        .bw-empty, .bw-error {
          padding: 18px 0 0;
          color: #9db0c7;
          font-size: 14px;
          font-weight: 700;
        }
        @media (max-width: 720px) {
          .bw-head, .bw-body { padding-left: 18px; padding-right: 18px; }
          .bw-title { font-size: 26px; }
          .bw-stats { grid-template-columns: 1fr; }
          .bw-table thead { display: none; }
          .bw-table tbody tr { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; }
          .bw-table tbody td { border-top: none; padding: 10px 0; }
          .bw-table tbody tr + tr { border-top: 1px solid rgba(255,255,255,0.06); }
          .bw-country { display: none; }
        }
      </style>
      <div class="bw-wrap">
        <div class="bw-head">
          <div class="bw-kicker">Bullwaves Prime</div>
          <div class="bw-title-row">
            <div>
              <h2 class="bw-title">${options.title}</h2>
              <p class="bw-subtitle">${options.subtitle} · ${payload.periodLabel || 'Current cycle'}</p>
            </div>
            <div class="bw-chip">Updated ${payload.updatedAtLabel || ''}</div>
          </div>
        </div>
        <div class="bw-body">
          <div class="bw-stats">
            <div class="bw-stat">
              <div class="bw-stat-label">Active contestants</div>
              <div class="bw-stat-value">${Number(payload.summary?.totalContestants || 0).toLocaleString('en-US')}</div>
            </div>
            <div class="bw-stat">
              <div class="bw-stat-label">Total payouts</div>
              <div class="bw-stat-value">${money(payload.summary?.totalPayoutAmount || 0)}</div>
            </div>
          </div>
          ${
            rows.length
              ? `<table class="bw-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Trader</th>
                      <th>Country</th>
                      <th style="text-align:right;">Payout</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows
                      .map(
                        (row) => `
                        <tr>
                          <td class="bw-rank">#${row.rank}</td>
                          <td class="bw-name">${row.displayName}</td>
                          <td class="bw-country">${row.country || '—'}</td>
                          <td class="bw-payout">${money(row.payoutAmount || 0)}</td>
                        </tr>`
                      )
                      .join('')}
                  </tbody>
                </table>`
              : `<div class="bw-empty">No contest rows available.</div>`
          }
          <div class="bw-foot">
            <div class="bw-note">Masked names. Ranking ordered by positive payout volume for clients active in the last 180 days.</div>
            ${options.ctaUrl ? `<a class="bw-cta" href="${options.ctaUrl}" target="_blank" rel="noopener noreferrer">${options.ctaLabel}</a>` : ''}
          </div>
        </div>
      </div>
    `
  }

  function renderError(target, message) {
    const root = target.shadowRoot || target.attachShadow({ mode: 'open' })
    root.innerHTML = `<div style="font-family:Inter,system-ui,sans-serif;padding:16px;border-radius:18px;background:#07111f;color:#dbe6f3;border:1px solid rgba(255,255,255,.08)">${message}</div>`
  }

  async function mount(target, options) {
    const element = resolveTarget(target)
    if (!element) throw new Error('BullwavesPrimeContest target not found.')

    const config = Object.assign({}, DEFAULTS, options || {})
    const baseUrl = config.baseUrl || getScriptBase()
    if (!baseUrl) {
      renderError(element, 'Bullwaves Prime Contest: unable to resolve script base URL.')
      return
    }

    try {
      const payload = await fetchPayload(baseUrl)
      render(element, payload, config)
    } catch (error) {
      renderError(element, error && error.message ? error.message : 'Unable to load contest widget.')
    }
  }

  function autoMount() {
    const nodes = Array.from(document.querySelectorAll('[data-bw-prime-contest]'))
    for (const node of nodes) {
      mount(node, {
        limit: Number(node.getAttribute('data-limit') || DEFAULTS.limit),
        title: node.getAttribute('data-title') || DEFAULTS.title,
        subtitle: node.getAttribute('data-subtitle') || DEFAULTS.subtitle,
        ctaLabel: node.getAttribute('data-cta-label') || DEFAULTS.ctaLabel,
        ctaUrl: node.getAttribute('data-cta-url') || DEFAULTS.ctaUrl,
        accent: node.getAttribute('data-accent') || DEFAULTS.accent,
      })
    }
  }

  window.BullwavesPrimeContest = { mount, autoMount }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount, { once: true })
  } else {
    autoMount()
  }
})()