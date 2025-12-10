import { useMemo } from 'react'

export function useLeaderboard(mediaRows = [], payments = []) {
  return useMemo(() => {
    const map = new Map()
    const ensure = (name) => {
      if (!map.has(name)) {
        map.set(name, {
          affiliate: name,
          netDeposits: 0,
          pl: 0,
          payments: 0,
          profit: 0,
        })
      }
      return map.get(name)
    }

    mediaRows.forEach((r) => {
      const acc = ensure(r.affiliate)
      acc.netDeposits += r.netDeposits || 0
      acc.pl += r.pl || 0
    })

    payments.forEach((p) => {
      const acc = ensure(p.affiliate)
      acc.payments += p.amount || 0
    })

    const all = Array.from(map.values())
      .map((r) => ({
        ...r,
        profit: (r.pl || 0) - (r.payments || 0),
      }))
      .sort((a, b) => (b.netDeposits || 0) - (a.netDeposits || 0))

    const top10 = all.slice(0, 10)
    const mid5 = all.slice(10, 15)
    const rest = all.slice(15)
    const othersAgg = rest.length
      ? rest.reduce(
          (acc, r) => ({
            affiliate: 'Others',
            count: acc.count + 1,
            netDeposits: acc.netDeposits + (r.netDeposits || 0),
            pl: acc.pl + (r.pl || 0),
            payments: acc.payments + (r.payments || 0),
            profit: acc.profit + (r.profit || 0),
          }),
          { affiliate: 'Others', count: 0, netDeposits: 0, pl: 0, payments: 0, profit: 0 },
        )
      : null

    return { all, top10, mid5, othersAgg }
  }, [mediaRows, payments])
}

export default useLeaderboard
