const KPI_ITEMS = [
  {
    label: 'FTD conversion',
    detail: 'Target KPI of the journey',
  },
  {
    label: 'Time to first deposit',
    detail: 'Speed from segment entry to first deposit',
  },
  {
    label: 'First-trade activation',
    detail: 'Post-FTD activation quality',
  },
]

const TIMELINE_ROWS = [
  {
    phase: 'Entry',
    timing: 'T0',
    fromEntry: '0d / 0h',
    note: 'Profile enters new_unfunded segment',
  },
  {
    phase: 'Step 1 - Welcome + Value',
    timing: 'D0',
    fromEntry: '0d / 0h',
    note: 'Immediate send at segment entry',
  },
  {
    phase: 'Step 2A - +48hr Deposit + Trade',
    timing: '+48h',
    fromEntry: '2d / 48h',
    note: 'Positive branch after quick activation',
  },
  {
    phase: 'Step 2B - +48hr No Deposit',
    timing: '+48h',
    fromEntry: '2d / 48h',
    note: 'No-deposit branch reminder',
  },
  {
    phase: 'Step 3A - Deposit Intent Recovery',
    timing: '+3d from Step 2B',
    fromEntry: '5d / 120h',
    note: 'No funding-path activity detected',
  },
  {
    phase: 'Step 3B - First Deposit Push',
    timing: '+3d from Step 2B',
    fromEntry: '5d / 120h',
    note: 'Funding-path activity detected',
  },
  {
    phase: 'Positive Follow-up - First Trade Onboarding',
    timing: 'FTD +0d',
    fromEntry: 'Event based',
    note: 'Immediate after successful first deposit',
  },
  {
    phase: 'Non-converted Follow-up - Re-entry Nurture',
    timing: 'D21 after last non-converted touch',
    fromEntry: 'Standard path: D26 / 624h',
    note: 'Recovery loop for warm non-converted users',
  },
]

const DECISION_POINTS = [
  {
    checkpoint: 'Deposit + trade within 48h?',
    window: '48h after Step 1',
    signal: 'Successful first deposit + at least one trade',
  },
  {
    checkpoint: 'Funding-path activity within 3d?',
    window: '72h after +48hr No deposit touch',
    signal: 'Deposit page open, verification progress, payment method select',
  },
  {
    checkpoint: 'First deposit completed?',
    window: 'Within D14 from segment entry',
    signal: 'Successful deposit / FTD event',
  },
]

const OUTCOMES = ['FTD converted', 'Warm but not converted', 'Cold drop-off']

function KpiCard({ label, detail }) {
  return (
    <article className="solitics-report__kpiCard">
      <div className="solitics-report__kpiLabel">{label}</div>
      <div className="solitics-report__kpiDetail">{detail}</div>
    </article>
  )
}

export default function SoliticsReportPage() {
  return (
    <div className="page-shell solitics-report">
      <header className="page-header">
        <div>
          <p className="page-label">SOLITICS</p>
          <h1 className="page-title">Solitics Journey Report</h1>
          <p className="page-subtitle">
            Vista operativa del report per il segmento Unfunded Newcomers, con timeline, checkpoint
            decisionali e outcome logici.
          </p>
        </div>
      </header>

      <section className="card-block">
        <div className="card-block-header">
          <div>
            <p className="eyebrow">Journey Scope</p>
            <h3>Unfunded Newcomers</h3>
            <p className="muted">
              Segment key: <strong>new_unfunded</strong> - Goal: convert newly registered users into
              first-time depositors quickly.
            </p>
          </div>
        </div>

        <div className="solitics-report__kpiGrid">
          {KPI_ITEMS.map((item) => (
            <KpiCard key={item.label} label={item.label} detail={item.detail} />
          ))}
        </div>
      </section>

      <section className="card-block table-card">
        <div className="card-block-header">
          <div>
            <p className="eyebrow">Timeline</p>
            <h3>Journey Timeline</h3>
            <p className="muted">Ordine temporale completo con offset da ingresso segmento.</p>
          </div>
        </div>

        <table className="simple-table">
          <thead>
            <tr>
              <th>Phase</th>
              <th>Timing</th>
              <th>From Entry</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {TIMELINE_ROWS.map((row) => (
              <tr key={row.phase}>
                <td>{row.phase}</td>
                <td>{row.timing}</td>
                <td>{row.fromEntry}</td>
                <td>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="solitics-report__splitGrid">
        <section className="card-block table-card">
          <div className="card-block-header">
            <div>
              <p className="eyebrow">Decision Logic</p>
              <h3>Checkpoints</h3>
            </div>
          </div>
          <table className="simple-table">
            <thead>
              <tr>
                <th>Checkpoint</th>
                <th>Observation Window</th>
                <th>Operational Signal</th>
              </tr>
            </thead>
            <tbody>
              {DECISION_POINTS.map((item) => (
                <tr key={item.checkpoint}>
                  <td>{item.checkpoint}</td>
                  <td>{item.window}</td>
                  <td>{item.signal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card-block">
          <div className="card-block-header">
            <div>
              <p className="eyebrow">Flow End States</p>
              <h3>Outcome Buckets</h3>
              <p className="muted">
                Classificazione finale del path in base al comportamento utente.
              </p>
            </div>
          </div>

          <div className="solitics-report__outcomeList">
            {OUTCOMES.map((outcome) => (
              <div key={outcome} className="solitics-report__outcomeItem">
                {outcome}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
