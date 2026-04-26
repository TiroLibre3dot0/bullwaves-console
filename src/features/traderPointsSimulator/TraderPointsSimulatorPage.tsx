
import { useState, useEffect } from 'react';
import CsvUploader from './components/CsvUploader';
import ScenarioControls from './components/ScenarioControls';
import KpiCards from './components/KpiCards';
import ImpactBreakdownCard from './components/ImpactBreakdownCard';
import RegressionSummary from './components/RegressionSummary';
import Tables from './components/Tables';
import ExportSnapshot from './components/ExportSnapshot';
import WorkingSetCards, { type WorkingSetStats } from './components/WorkingSetCards';
import PpdGaussianChart, { type PpdGaussianChartData } from './components/PpdGaussianChart';
import InfoTooltip from './components/InfoTooltip';
import { getUsersData, loadUsersDataFromSupportUserCheck, type UserData } from './data/getUsersData';
import { computeTraderPoints } from './engine/computeTraderPoints';
import { buildUserFeatures } from './engine/buildUserFeatures';
import { runRegressions } from './engine/regressions';
import { simulateScenario } from './engine/simulateScenario';
import { computeClassicBonusBaseline } from './engine/classicBonusBaseline';
import { buildFeatures } from './engine/buildFeatures';
import type { ModelId } from './engine/buildTargets';
import { useI18n } from '../../i18n/I18nContext.ts';


const defaultScenario = {
  points_multiplier: 1.0,
  // Goal-based incentive: goal is linked to real economic value.
  // 1 Trader Point ≈ 1 unit of commission (≈ € / $)
  bonus_amount: 200,
  required_points_to_unlock: 200,
  unlock_rate_pct: 40,
  risk_guardrail_enabled: true,
  risk_threshold: 0.5,
};


export default function TraderPointsSimulatorPage() {
  const { t } = useI18n()
  // Data source: 'console' (default) or 'csv' (debug)
  const [dataSource, setDataSource] = useState<'console' | 'csv'>('console');
  const [parseInfo, setParseInfo] = useState<{parsed: number, skipped: number}>({parsed: 0, skipped: 0});
  const [scenario, setScenario] = useState(defaultScenario);

  // Behavioral comparison baseline (UI layer only)
  const [compareBaseline, setCompareBaseline] = useState<'no_incentive' | 'classic_bonus' | 'trader_points_default'>('classic_bonus');

  const [usersAll, setUsersAll] = useState<UserData[]>([]);
  const [consoleSource, setConsoleSource] = useState<'support' | 'mock' | null>(null);
  const [consoleLoadError, setConsoleLoadError] = useState<string | null>(null);
  const [consoleLoading, setConsoleLoading] = useState(false);

  const [userFeatures, setUserFeatures] = useState<any[]>([]);
  const [workingSetStats, setWorkingSetStats] = useState<WorkingSetStats | null>(null);
  const [ppdChart, setPpdChart] = useState<PpdGaussianChartData | null>(null);
  const [regression, setRegression] = useState<any>(null);
  const [simulation, setSimulation] = useState<any>(null);
  const [tpDefaultSimulation, setTpDefaultSimulation] = useState<any>(null);

  // Load base dataset (console source) only when dataSource changes
  useEffect(() => {
    let cancelled = false;

    async function loadConsole() {
      setConsoleLoading(true);
      setConsoleLoadError(null);

      try {
        const users = await loadUsersDataFromSupportUserCheck();
        if (cancelled) return;
        setUsersAll(users);
        setConsoleSource('support');
      } catch (e: any) {
        if (cancelled) return;
        setUsersAll(getUsersData());
        setConsoleSource('mock');
        setConsoleLoadError(String(e?.message || e || t('traderPoints.console.loadErrorFallback')));
      } finally {
        if (!cancelled) setConsoleLoading(false);
      }
    }

    if (dataSource === 'console') {
      loadConsole();
    } else {
      setUsersAll([]);
      setConsoleSource(null);
      setConsoleLoadError(null);
      setConsoleLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [dataSource]);

  // Process data when dataset or scenario changes
  useEffect(() => {
    if (dataSource === 'console') {
      if (!usersAll.length) {
        setUserFeatures([]);
        setWorkingSetStats(null);
        setPpdChart(null);
        setRegression(null);
        setSimulation(null);
        setTpDefaultSimulation(null);
        return;
      }
      // Active-user selection (working set):
      // - deposits > 0
      // - position_count > 0
      // - account_age_days > 1
      const users = usersAll.filter((u) => (u.total_deposits ?? 0) > 0 && (u.position_count ?? 0) > 0 && (u.account_age_days ?? 0) > 1);

      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
      const median = (arr: number[]) => {
        const xs = arr.filter(Number.isFinite).sort((a, b) => a - b);
        if (!xs.length) return 0;
        const mid = Math.floor(xs.length / 2);
        return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
      };

      const madSigma = (arr: number[]) => {
        // Robust sigma estimate for an approximately-normal distribution.
        // sigma ≈ 1.4826 * median(|x - median(x)|)
        const m = median(arr);
        const absDev = arr.map((x) => Math.abs((Number.isFinite(x) ? x : 0) - m));
        const mad = median(absDev);
        return 1.4826 * mad;
      };

      const percentile = (sorted: number[], p: number) => {
        if (!sorted.length) return 0;
        const idx = (sorted.length - 1) * p;
        const lo = Math.floor(idx);
        const hi = Math.ceil(idx);
        if (lo === hi) return sorted[lo];
        const w = idx - lo;
        return sorted[lo] * (1 - w) + sorted[hi] * w;
      };

      const totalPositions = users.reduce((s, u) => s + (u.position_count ?? 0), 0);
      const totalAgeDays = users.reduce((s, u) => s + Math.max(1, u.account_age_days ?? 0), 0);
      const positionsPerDayGlobal = totalAgeDays > 0 ? totalPositions / totalAgeDays : 0;
      const ppdList = users.map((u) => u.positions_per_day ?? 0);

      const positionsCountList = users.map((u) => u.position_count ?? 0);
      const avgPositionsCount = avg(positionsCountList);
      const medianPositionsCount = median(positionsCountList);

      const traderLifetimeList = users
        .map((u: any) => (typeof u.qualified_age_days === 'number' ? u.qualified_age_days : null))
        .filter((x: any) => typeof x === 'number' && Number.isFinite(x) && x > 0) as number[];
      const avgTraderLifetimeDays = avg(traderLifetimeList);
      const traderLifetimeAvailablePct = users.length ? (traderLifetimeList.length / users.length) * 100 : 0;

      // “Gaussian median zone”: keep only values near the median using a robust normal model.
      // This reduces the impact of heavy-tail outliers while staying interpretable.
      const ppdMedian = median(ppdList);
      const sigma = madSigma(ppdList);
      const zCut = 1.0; // ~68% kept for a true normal; tweak later if needed
      const ppdMedianZone = sigma > 0
        ? ppdList.filter((x) => Math.abs(x - ppdMedian) <= zCut * sigma)
        : ppdList;
      const positionsPerDayMedianZoneMean = avg(ppdMedianZone);
      const positionsPerDayMedianZoneKeptPct = ppdList.length ? (ppdMedianZone.length / ppdList.length) * 100 : 0;

      // Chart (histogram + gaussian curve)
      const ppdFinite = ppdList.filter((x) => Number.isFinite(x) && x >= 0).sort((a, b) => a - b);
      const n = ppdFinite.length;
      if (n >= 5) {
        const q01 = percentile(ppdFinite, 0.01);
        const q99 = percentile(ppdFinite, 0.99);
        const rangeMin = Math.max(0, Math.min(q01, ppdMedian - 4 * (sigma || 0)));
        const rangeMax = Math.max(rangeMin + 1e-6, Math.max(q99, ppdMedian + 4 * (sigma || 0)));
        const bins = 40;
        const binW = (rangeMax - rangeMin) / bins;
        const counts = new Array(bins).fill(0);
        for (const x of ppdFinite) {
          const idx = Math.floor((x - rangeMin) / binW);
          if (idx < 0) continue;
          if (idx >= bins) continue;
          counts[idx] += 1;
        }
        const centers = new Array(bins).fill(0).map((_, i) => rangeMin + (i + 0.5) * binW);
        const curveCounts = sigma > 0
          ? centers.map((x) => {
              const z = (x - ppdMedian) / sigma;
              const pdf = Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
              // Scale density to histogram counts
              return pdf * n * binW;
            })
          : centers.map(() => 0);

        setPpdChart({
          rangeMin,
          rangeMax,
          binCenters: centers,
          histogramCounts: counts,
          curveCounts,
          mu: ppdMedian,
          sigma,
          n,
        });
      } else {
        setPpdChart(null);
      }

      setWorkingSetStats({
        totalUsers: usersAll.length,
        activeUsers: users.length,
        avgPositionsCount,
        medianPositionsCount,
        avgPositionsPerDayUserMean: avg(ppdList),
        positionsPerDayGlobal,
        positionsPerDayMedian: median(ppdList),
        positionsPerDayMedianZoneMean,
        positionsPerDayMedianZoneKeptPct,
        avgAccountAgeDays: avg(users.map((u) => u.account_age_days ?? 0)),
        avgTraderLifetimeDays,
        traderLifetimeAvailablePct,
      });

      const usersWithPoints = computeTraderPoints(users as any, { w1: 0.35, w2: 0.25, w3: 0.2, w4: 0.2, w5: 0.5, scale: 5000 });
      const features = buildUserFeatures(usersWithPoints);
      setUserFeatures(features);
      const reg = runRegressions(features);
      setRegression(reg);
      setSimulation(simulateScenario(features, scenario, reg));
      setTpDefaultSimulation(simulateScenario(features, defaultScenario, reg));

      // Keep full rows (with dates/ppd denominators) available for export.
      ;(window as any).__tp_rawUsers = usersWithPoints;
    } else if (dataSource === 'csv') {
      // Legacy CSV debug mode
      // ...existing code for CSV pipeline (optional, or show warning if not implemented)...
      setUserFeatures([]);
      setWorkingSetStats(null);
      setPpdChart(null);
      setRegression(null);
      setSimulation(null);
      setTpDefaultSimulation(null);
    }
  }, [dataSource, scenario, usersAll]);

  // Handle scenario change
  const handleScenario = (sc: typeof defaultScenario) => {
    setScenario(sc);
  };

  // Handle CSV upload (debug mode only)
  const handleCsv = (_rows: any[], info: {parsed: number, skipped: number}) => {
    setParseInfo(info);
    // Optionally implement CSV debug pipeline
  };

  const baselineLabel = (() => {
    if (compareBaseline === 'no_incentive') return t('traderPoints.baseline.noIncentive')
    if (compareBaseline === 'classic_bonus') return t('traderPoints.baseline.classicBonus')
    return t('traderPoints.baseline.tpDefault')
  })()

  const baselineOneLiner = (() => {
    if (compareBaseline === 'classic_bonus') return t('traderPoints.baseline.oneLiner.classicBonus')
    if (compareBaseline === 'no_incentive') return t('traderPoints.baseline.oneLiner.noIncentive')
    return t('traderPoints.baseline.oneLiner.tpDefault')
  })()

  const whyDynamicLine = (() => {
    const pm = Number(scenario?.points_multiplier ?? 1)
    const rp = Number(scenario?.required_points_to_unlock ?? defaultScenario.required_points_to_unlock)
    const ur = Number(scenario?.unlock_rate_pct ?? defaultScenario.unlock_rate_pct)
    const ba = Number(scenario?.bonus_amount ?? defaultScenario.bonus_amount)
    const guardrail = !!scenario?.risk_guardrail_enabled

    if (guardrail) return t('traderPoints.whyDynamic.guardrail')
    if (Number.isFinite(pm) && pm > 1.05) {
      const mult = pm.toFixed(2).replace(/\.00$/, '')
      return t('traderPoints.whyDynamic.faster', { mult })
    }
    if (Number.isFinite(pm) && pm < 0.95) {
      const mult = pm.toFixed(2).replace(/\.00$/, '')
      return t('traderPoints.whyDynamic.slower', { mult })
    }
    if (Number.isFinite(rp) && rp < defaultScenario.required_points_to_unlock) return t('traderPoints.whyDynamic.targetCloser')
    if (Number.isFinite(rp) && rp > defaultScenario.required_points_to_unlock) return t('traderPoints.whyDynamic.targetFarther')
    if (Number.isFinite(ur) && ur !== defaultScenario.unlock_rate_pct) return t('traderPoints.whyDynamic.unlockRate', { pct: Math.round(ur) })
    if (Number.isFinite(ba) && ba !== defaultScenario.bonus_amount) return t('traderPoints.whyDynamic.bonusValue', { amount: Math.round(ba).toLocaleString() })
    return t('traderPoints.whyDynamic.default')
  })()

  const reachabilityChanged = (() => {
    const pm = Number(scenario?.points_multiplier ?? defaultScenario.points_multiplier)
    return Number.isFinite(pm) && Math.abs(pm - defaultScenario.points_multiplier) > 0.01
  })()

  const simulationView = (() => {
    if (!simulation || Array.isArray(simulation) || !simulation.baseline || !simulation.sim) return simulation

    const safe = (v: any, fb = 0) => {
      const n = Number(v)
      return Number.isFinite(n) ? n : fb
    }

    const observed = simulation.baseline
    const current = simulation.sim

    const epsilon = 1e-9
    const riskProxyObserved = (u: any) => Math.abs(u?.pnl_total ?? 0) / Math.max(u?.total_volume ?? 0, epsilon)

    const predictAvgFromRegression = (model: ModelId, usersForX: any[]): number => {
      const reg = regression?.[model]
      if (!reg?.ok || !reg.weights || !reg.featureNames || !reg.xStats || !reg.yStats) {
        // Fallback to simple observed aggregates (same intent as simulateScenario fallback)
        if (model === 'activity') return usersForX.reduce((a, u) => a + (u?.positions_per_day ?? 0), 0) / (usersForX.length || 1)
        if (model === 'risk') return usersForX.reduce((a, u) => a + riskProxyObserved(u), 0) / (usersForX.length || 1)
        return usersForX.reduce((a, u) => a + (u?.account_age_days ?? 0), 0) / (usersForX.length || 1)
      }

      const built = buildFeatures(model, usersForX as any)
      const Xraw = built.X
      const rawFeatureNames = built.featureNames
      const rawIndexByName = new Map<string, number>()
      for (let j = 0; j < rawFeatureNames.length; j++) rawIndexByName.set(rawFeatureNames[j], j)

      const yPred = Xraw.map((row: number[]) => {
        const xNorm = reg.featureNames.map((fname: string, k: number) => {
          const rawIdx = rawIndexByName.get(fname)
          const xj = rawIdx === undefined ? 0 : row[rawIdx]
          const s = reg.xStats[k]
          return s && s.std ? (xj - s.mean) / s.std : 0
        })
        const yNorm = reg.intercept + xNorm.reduce((s: number, xk: number, k: number) => s + xk * (reg.weights[k] ?? 0), 0)
        return yNorm * (reg.yStats.std || 0) + reg.yStats.mean
      })

      return yPred.reduce((a: number, b: number) => a + b, 0) / (yPred.length || 1)
    }

    // “No incentive” baseline: predict outcomes with trader_points forced to 0.
    // This is UI-layer only (does not change regressions or scenario simulation).
    const noIncentiveBaseline = (() => {
      if (!userFeatures?.length) return observed
      const usersNoTp = userFeatures.map((u: any) => ({ ...u, trader_points: 0 }))
      return {
        activity: predictAvgFromRegression('activity', usersNoTp),
        risk: predictAvgFromRegression('risk', usersNoTp),
        retention: predictAvgFromRegression('retention', usersNoTp),
      }
    })()

    const classic = computeClassicBonusBaseline({
      observed: {
        activity: safe(observed.activity),
        risk: safe(observed.risk),
        retention: safe(observed.retention),
      },
      scenario: {
        bonus_amount: safe(scenario?.bonus_amount),
        unlock_rate_pct: safe(scenario?.unlock_rate_pct),
        risk_guardrail_enabled: !!scenario?.risk_guardrail_enabled,
      },
    })

    const tpDefault = tpDefaultSimulation && !Array.isArray(tpDefaultSimulation) && tpDefaultSimulation.sim
      ? tpDefaultSimulation.sim
      : null

    const base = compareBaseline === 'no_incentive'
      ? noIncentiveBaseline
      : compareBaseline === 'classic_bonus'
        ? classic.baseline
        : (tpDefault || observed)

    const delta = {
      activity: safe(current.activity) - safe(base.activity),
      risk: safe(current.risk) - safe(base.risk),
      retention: safe(current.retention) - safe(base.retention),
    }

    return {
      ...simulation,
      baseline: base,
      sim: current,
      delta,
      baselineLabel,
      baselineMode: compareBaseline,
      // ensure guardrail context is available for UI copy
      guardrailEnabled: !!scenario?.risk_guardrail_enabled,
      // classic bonus: explicit, parameterized assumption model
      classicBaselineIsRuleBased: compareBaseline === 'classic_bonus',
      classicBonusAssumptions: compareBaseline === 'classic_bonus' ? classic.assumptions : null,
    }
  })()

  const pointsMultiplierReachabilityDeltaPct = (() => {
    // UI-only: compares goal-threshold reachability at current multiplier vs ×1
    if (!userFeatures?.length) return null

    const epsilon = 1e-9
    const riskProxy = (u: any) => Math.abs(u?.pnl_total ?? 0) / Math.max(u?.total_volume ?? 0, epsilon)

    const guardrailOn = !!scenario?.risk_guardrail_enabled
    const riskThreshold = Number.isFinite(Number(scenario?.risk_threshold)) ? Number(scenario?.risk_threshold) : defaultScenario.risk_threshold
    const requiredPoints = Number.isFinite(Number(scenario?.required_points_to_unlock))
      ? Number(scenario?.required_points_to_unlock)
      : defaultScenario.required_points_to_unlock

    const eligiblePool = guardrailOn
      ? userFeatures.filter((u: any) => riskProxy(u) <= riskThreshold)
      : userFeatures

    const eligibleCount = (mult: number) => {
      const m = Number.isFinite(Number(mult)) ? Number(mult) : 1
      let c = 0
      for (const u of eligiblePool) {
        const tp = Number(u?.trader_points ?? 0)
        if (Number.isFinite(tp) && tp * m >= requiredPoints) c += 1
      }
      return c
    }

    const base = eligibleCount(1)
    if (base <= 0) return null

    const cur = eligibleCount(Number(scenario?.points_multiplier ?? 1))
    return ((cur - base) / base) * 100
  })()

  const execRetentionDeltaDays = (() => {
    // Executive Board View: fixed comparison
    // Baseline: classic bonus (rule-based)
    // Scenario: current goal-based incentive (Trader Points)
    if (!simulation || Array.isArray(simulation) || !simulation.baseline || !simulation.sim) return null

    const safe = (v: any, fb = 0) => {
      const n = Number(v)
      return Number.isFinite(n) ? n : fb
    }

    const observed = simulation.baseline
    const current = simulation.sim

    const classic = computeClassicBonusBaseline({
      observed: {
        activity: safe(observed.activity),
        risk: safe(observed.risk),
        retention: safe(observed.retention),
      },
      scenario: {
        bonus_amount: safe(scenario?.bonus_amount),
        unlock_rate_pct: safe(scenario?.unlock_rate_pct),
        risk_guardrail_enabled: !!scenario?.risk_guardrail_enabled,
      },
    })

    return safe(current.retention) - safe(classic.baseline.retention)
  })()

  const execRetentionDeltaDaysRounded = (() => {
    if (typeof execRetentionDeltaDays !== 'number' || !Number.isFinite(execRetentionDeltaDays)) return null
    return Math.round(execRetentionDeltaDays)
  })()

  const fmtSignedInt = (n: number | null) => {
    if (typeof n !== 'number' || !Number.isFinite(n)) return '—'
    if (n > 0) return `+${n}`
    return String(n)
  }

  return (
    <div className="w-full">
      <header className="px-4 py-6 border-b border-white/5 bg-gray-700/20 backdrop-blur">
        <div className="w-full flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-100">{t('traderPoints.page.title')}</h1>
            <div className="text-sm md:text-base text-gray-300 mt-1">{t('traderPoints.page.subtitle')}</div>
          </div>

          <div className="md:text-right">
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <label className="text-sm font-semibold text-gray-200">{t('traderPoints.dataSource.label')}</label>
              <select
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value as 'console' | 'csv')}
                className="bg-gray-700/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-cyan-400/50"
              >
                <option value="console">{t('traderPoints.dataSource.console')}</option>
                <option value="csv">{t('traderPoints.dataSource.csv')}</option>
              </select>
            </div>

            {dataSource === 'console' && (
              <div className="mt-1 flex flex-wrap items-center gap-2 md:justify-end">
                <span className="text-xs text-gray-400">
                  {consoleLoading
                    ? t('traderPoints.console.loading')
                    : consoleSource === 'support'
                      ? t('traderPoints.console.supportSource', { count: usersAll.length.toLocaleString() })
                      : consoleSource === 'mock'
                        ? t('traderPoints.console.mockSource', { count: usersAll.length.toLocaleString() })
                        : ''}
                </span>
                {consoleLoadError && (
                  <span className="text-xs text-amber-200 bg-amber-500/10 border border-amber-400/20 rounded-lg px-2.5 py-1">
                    {t('traderPoints.console.mockBadge')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="w-full mt-3 flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full border border-white/10 bg-gray-700/60 text-gray-200 text-xs font-semibold shadow-sm">{t('traderPoints.chips.spread')}</span>
          <span className="px-3 py-1 rounded-full border border-white/10 bg-gray-700/60 text-gray-200 text-xs font-semibold shadow-sm">{t('traderPoints.chips.leverage')}</span>
        </div>

        {/* Data source moved to top-right */}
      </header>
      <main className="w-full py-5 px-0 flex flex-col gap-4">
        {/* STEP 1–4 — Executive Board View (always visible, no controls) */}
        <section className="rounded-2xl border border-white/10 bg-gray-700/70 p-4 shadow-sm">
          <div className="text-sm font-semibold text-gray-200">{t('traderPoints.exec.title')}</div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-gray-700/60 p-5 shadow-sm">
              <div className="text-xs font-extrabold tracking-wide uppercase text-emerald-200/90">{t('traderPoints.exec.retention.label')}</div>
              <div className="mt-2 text-4xl md:text-5xl font-black tracking-tight text-gray-100">
                {fmtSignedInt(execRetentionDeltaDaysRounded)}
                <span className="ml-2 text-base md:text-lg font-semibold text-gray-300">{t('traderPoints.exec.retention.unitDays')}</span>
              </div>
              <div className="mt-2 text-sm text-gray-200">{t('traderPoints.exec.retention.caption')}</div>
              <div className="mt-3 h-0.5 w-10 rounded-full bg-emerald-400/60" />
            </div>

            <div className="rounded-2xl border border-white/10 bg-gray-700/60 p-5 shadow-sm">
              <div className="text-xs font-extrabold tracking-wide uppercase text-blue-200/90">{t('traderPoints.exec.activity.label')}</div>
              <div className="mt-2 text-4xl md:text-5xl font-black tracking-tight text-gray-100">{t('traderPoints.exec.activity.value')}</div>
              <div className="mt-2 text-sm text-gray-200">{t('traderPoints.exec.activity.caption')}</div>
              <div className="mt-3 h-0.5 w-10 rounded-full bg-blue-400/60" />
            </div>

            <div className="rounded-2xl border border-white/10 bg-gray-700/60 p-5 shadow-sm">
              <div className="text-xs font-extrabold tracking-wide uppercase text-amber-200/90">{t('traderPoints.exec.risk.label')}</div>
              <div className="mt-2 text-4xl md:text-5xl font-black tracking-tight text-gray-100">{t('traderPoints.exec.risk.value')}</div>
              <div className="mt-2 text-sm text-gray-200">{t('traderPoints.exec.risk.caption')}</div>
              <div className="mt-3 h-0.5 w-10 rounded-full bg-amber-400/70" />
            </div>
          </div>

          {/* STEP 2 — Single causal statement */}
          <div className="mt-4 text-center text-sm md:text-base font-semibold text-gray-100">
            <div>{t('traderPoints.exec.causal.line1')}</div>
            <div className="text-gray-200">{t('traderPoints.exec.causal.line2')}</div>
          </div>

          {/* STEP 3 — Value mechanics */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-gray-700/50 p-3 text-[12px] text-gray-200">
              {t('traderPoints.exec.mechanics.1')}
            </div>
            <div className="rounded-xl border border-white/10 bg-gray-700/50 p-3 text-[12px] text-gray-200">
              {t('traderPoints.exec.mechanics.2')}
            </div>
            <div className="rounded-xl border border-white/10 bg-gray-700/50 p-3 text-[12px] text-gray-200">
              {t('traderPoints.exec.mechanics.3')}
            </div>
          </div>

          {/* STEP 4 — Executive takeaway */}
          <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 shadow-sm">
            <div className="text-sm font-semibold text-cyan-100">{t('traderPoints.exec.takeaway.title')}</div>
            <div className="mt-2 text-[12px] text-gray-100">{t('traderPoints.exec.takeaway.text')}</div>
          </div>
        </section>

        {/* STEP 5 — Deep dive (collapsed by default) */}
        <details className="rounded-2xl border border-white/10 bg-gray-700/50 p-3 shadow-sm">
          <summary className="cursor-pointer select-none text-sm font-semibold text-gray-200">{t('traderPoints.deepDive.title')}</summary>
          <div className="mt-4 flex flex-col gap-4">
            {/* Section A — What changes */}
            <section className="rounded-2xl border border-white/10 bg-gray-700/70 p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-200">{t('traderPoints.section.whatChanges')}</div>
                  <div className="mt-1 text-[11px] text-gray-400">{t('traderPoints.deltaVs', { baseline: baselineLabel, oneLiner: baselineOneLiner })}</div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-300">{t('traderPoints.baseline.label')}</label>
                  <select
                    value={compareBaseline}
                    onChange={(e) => setCompareBaseline(e.target.value as any)}
                    className="bg-gray-700/70 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-gray-100 focus:outline-none focus:border-cyan-400/50"
                  >
                    <option value="no_incentive">{t('traderPoints.baseline.noIncentive')}</option>
                    <option value="classic_bonus">{t('traderPoints.baseline.classicBonus')}</option>
                    <option value="trader_points_default">{t('traderPoints.baseline.tpDefault')}</option>
                  </select>
                  <InfoTooltip
                    label={t('traderPoints.baseline.tooltip.label')}
                    content={
                      <div>
                        <div className="font-semibold text-gray-100">{t('traderPoints.baseline.tooltip.title')}</div>
                        <div className="mt-2">
                          <div className="font-semibold text-gray-100">{t('traderPoints.baseline.tooltip.noIncentive.title')}</div>
                          <div className="mt-1">{t('traderPoints.baseline.tooltip.noIncentive.desc')}</div>
                        </div>
                        <div className="mt-2">
                          <div className="font-semibold text-gray-100">{t('traderPoints.baseline.tooltip.classicBonus.title')}</div>
                          <div className="mt-1">{t('traderPoints.baseline.tooltip.classicBonus.desc')}</div>
                        </div>
                        <div className="mt-2">
                          <div className="font-semibold text-gray-100">{t('traderPoints.baseline.tooltip.tp.title')}</div>
                          <div className="mt-1">{t('traderPoints.baseline.tooltip.tp.desc')}</div>
                        </div>
                      </div>
                    }
                  />
                </div>
              </div>

              <div className="mt-4">
                <KpiCards userAgg={userFeatures} simulation={simulationView} />
              </div>

              {/* Narrative bridge: why points jump when daily activity barely moves (UI-only) */}
              <div className="mt-4 rounded-2xl border border-white/10 bg-gray-700/60 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-200">{t('traderPoints.narrativeBridge.title')}</div>
                  </div>
                </div>

                <div className="mt-3 text-[12px] leading-relaxed text-gray-300">
                  <div>{t('traderPoints.narrativeBridge.line1')}</div>
                  <div>{t('traderPoints.narrativeBridge.line2')}</div>
                  <div>{t('traderPoints.narrativeBridge.line3')}</div>
                </div>

                <div className="mt-3 text-[12px] font-semibold text-gray-200">
                  {t('traderPoints.narrativeBridge.formula.totalPoints')} ≈ {t('traderPoints.narrativeBridge.formula.dailyActivity')} × {t('traderPoints.narrativeBridge.formula.activeDays')}
                </div>
              </div>

              <div className="mt-4">
                <ImpactBreakdownCard users={userFeatures} scenario={scenario} simulation={simulation} />
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-7 flex flex-col gap-4">
                {/* Scenario controls (kept, but visually secondary) */}
                <div className="rounded-2xl border border-white/10 bg-gray-700/60 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-gray-200">{t('traderPoints.scenarioControls.title')}</div>
                    <div className="text-[11px] text-gray-400">{t('traderPoints.scenarioControls.subtitle')}</div>
                  </div>
                  <div className="mt-3">
                    {dataSource === 'csv' && <CsvUploader onData={handleCsv} parseInfo={parseInfo} />}
                    <ScenarioControls
                      scenario={scenario}
                      onChange={handleScenario}
                      pointsMultiplierReachabilityDeltaPct={pointsMultiplierReachabilityDeltaPct}
                    />
                  </div>
                </div>

                {/* Keep only one distribution chart */}
                <PpdGaussianChart data={ppdChart} title={t('traderPoints.chart.ppdTitle')} />
              </div>

              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Business-only sidebar card */}
                <section className="rounded-2xl border border-white/10 bg-gray-700/70 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-gray-200">{t('traderPoints.economicLogic.title')}</div>
                  <ul className="mt-3 space-y-1 text-[12px] text-gray-300">
                    <li>• {t('traderPoints.economicLogic.bullet1')}</li>
                    <li>• {t('traderPoints.economicLogic.bullet2')}</li>
                    <li>• {t('traderPoints.economicLogic.bullet3')}</li>
                  </ul>
                </section>

                <section className="rounded-2xl border border-white/10 bg-gray-700/70 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-gray-200">{t('traderPoints.why.title')}</div>
                    <InfoTooltip
                      label={t('traderPoints.why.tooltip.label')}
                      content={
                        <div>
                          <div className="font-semibold text-gray-100">{t('traderPoints.why.tooltip.title')}</div>
                          <div className="mt-1">{t('traderPoints.why.tooltip.desc')}</div>
                        </div>
                      }
                    />
                  </div>

                  <div className="mt-2 text-sm font-semibold text-gray-100">{t('traderPoints.why.heading')}</div>
                  <ul className="mt-2 space-y-1 text-[12px] text-gray-300">
                    <li>• {t('traderPoints.why.bullet1')}</li>
                    <li>• {t('traderPoints.why.bullet2')}</li>
                    <li>• {t('traderPoints.why.bullet3')}</li>
                  </ul>
                  <div className="mt-3 rounded-lg border border-white/10 bg-gray-700/40 p-2.5 text-[12px] text-gray-200">
                    {reachabilityChanged && (
                      <div className="mb-1 text-[11px] text-gray-400">{t('traderPoints.reachability.micro')}</div>
                    )}
                    {whyDynamicLine}
                  </div>
                </section>

                {/* Section C — Model confidence (optional) */}
                <details className="rounded-2xl border border-white/10 bg-gray-700/60 p-4 shadow-sm">
                  <summary className="cursor-pointer select-none text-sm font-semibold text-gray-200">{t('traderPoints.optional.reliability')}</summary>
                  <div className="mt-3">
                    <RegressionSummary regression={regression} />
                  </div>
                </details>

                {/* Advanced metrics hidden by default */}
                <details className="rounded-2xl border border-white/10 bg-gray-700/60 p-4 shadow-sm">
                  <summary className="cursor-pointer select-none text-sm font-semibold text-gray-200">{t('traderPoints.optional.datasetOverview')}</summary>
                  <div className="mt-3">
                    <WorkingSetCards stats={workingSetStats} />
                  </div>
                </details>
              </div>
            </div>

            <details className="rounded-2xl border border-white/10 bg-gray-700/60 p-3 shadow-sm">
              <summary className="cursor-pointer select-none text-sm font-semibold text-gray-200">{t('traderPoints.optional.tables')}</summary>
              <div className="mt-3">
                <Tables userAgg={userFeatures} simulation={simulation} />
              </div>
            </details>

            <details className="rounded-2xl border border-white/10 bg-gray-700/60 p-3 shadow-sm">
              <summary className="cursor-pointer select-none text-sm font-semibold text-gray-200">
                {t('traderPoints.optional.export')}
              </summary>
              <div className="mt-3">
                <ExportSnapshot
                  userAgg={userFeatures}
                  simulation={simulationView}
                  regression={regression}
                  scenario={scenario}
                  baselineMode={compareBaseline}
                  baselineLabel={baselineLabel}
                />
              </div>
            </details>
          </div>
        </details>
      </main>
    </div>
  );
}
