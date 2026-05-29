export default function TradingCompetitionPage() {
  return (
    <section style={{ height: 'calc(100vh - 150px)' }}>
      <iframe
        title="Trading competition leaderboard preview"
        src="/trading-competition-preview.html"
        style={{ width: '100%', height: '100%', border: 0, borderRadius: 12, background: '#fff' }}
      />
    </section>
  )
}
