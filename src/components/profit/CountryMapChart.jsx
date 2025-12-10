import React, { useMemo } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { geoCentroid } from 'd3-geo'
import { scaleSequential, scaleSqrt } from 'd3-scale'
import { interpolateTurbo } from 'd3-scale-chromatic'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Normalize CSV country names to the names used in topojson properties.name
function normalizeCountryName(name) {
  const n = (name || '').trim()
  if (!n) return ''
  const lower = n.toLowerCase()
  const map = {
    'united states': 'United States of America',
    'united states of america': 'United States of America',
    usa: 'United States of America',
    'russia': 'Russian Federation',
    'russian federation': 'Russian Federation',
    'iran': 'Iran, Islamic Republic of',
    'iran, islamic republic of': 'Iran, Islamic Republic of',
    'hong kong': 'Hong Kong SAR China',
    'hong kong sar china': 'Hong Kong SAR China',
    'south korea': 'Republic of Korea',
    'korea, republic of': 'Republic of Korea',
    'north korea': 'Dem. Rep. Korea',
    'democratic republic of the congo': 'Democratic Republic of the Congo',
    'republic of the congo': 'Congo',
    'czech republic': 'Czechia',
    'czechia': 'Czechia',
    'macedonia': 'North Macedonia',
    'bolivia': 'Bolivia',
    'venezuela': 'Venezuela',
    'moldova': 'Moldova',
    'syria': 'Syria',
    'laos': 'Lao PDR',
    'tanzania': 'Tanzania',
    'vietnam': 'Vietnam',
  }
  if (map[lower]) return map[lower]
  // Fallback: capitalize basic form
  return n
}

export default function CountryMapChart({ data }) {
  const safeData = Array.isArray(data) ? data : []

  const maxValue = useMemo(() => {
    if (!safeData.length) return 1
    return Math.max(...safeData.map((d) => Math.abs(d.value || 0)), 1)
  }, [safeData])

  const maxNetDeposits = useMemo(() => {
    if (!safeData.length) return 1
    return Math.max(...safeData.map((d) => Math.abs(d.netDeposits || 0)), 1)
  }, [safeData])

  const colorScale = useMemo(
    () => scaleSequential(interpolateTurbo).domain([0, Math.pow(maxValue, 0.8)]),
    [maxValue],
  )

  const radiusScale = useMemo(
    () => scaleSqrt().domain([0, maxNetDeposits]).range([0, 18]),
    [maxNetDeposits],
  )

  const { valueByCountry, netByCountry, tooltipByCountry } = useMemo(() => {
    const vMap = new Map()
    const nMap = new Map()
    const tMap = new Map()
    safeData.forEach((d) => {
      const key = normalizeCountryName(d.country || d.label || '')
      if (!key) return
      vMap.set(key, d.value || 0)
      nMap.set(key, d.netDeposits || 0)
      const net = d.netDeposits ?? 0
      const val = d.value ?? 0
      tMap.set(key, `${key}: Net Deposits ${net.toLocaleString('en-GB')} €, Profit ${val.toLocaleString('en-GB')} €`)
    })
    return { valueByCountry: vMap, netByCountry: nMap, tooltipByCountry: tMap }
  }, [safeData])

  const landFill = 'rgba(15,23,42,0.22)'
  const landStroke = 'rgba(148,163,184,0.38)'
  const profitBubble = 'rgba(34,211,238,0.9)'
  const lossBubble = 'rgba(248,113,113,0.9)'

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: 'linear-gradient(180deg, #0a0f1a 0%, #070c16 100%)', borderRadius: 12 }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 150, center: [10, 20] }}
        width={800}
        height={400}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) => (
            <>
              {geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={landFill}
                  stroke={landStroke}
                  strokeWidth={0.7}
                  style={{ default: { outline: 'none' }, hover: { outline: 'none', opacity: 0.92 } }}
                />
              ))}

              {geographies.map((geo) => {
                const name = geo.properties.name
                const net = netByCountry.get(name) || 0
                const absNet = Math.abs(net)
                if (!absNet) return null
                const coords = geoCentroid(geo)
                if (!coords || coords.some((c) => Number.isNaN(c))) return null
                const radius = radiusScale(absNet)
                if (!radius) return null
                const profit = valueByCountry.get(name) || 0
                const bubbleColor = profit >= 0 ? profitBubble : lossBubble
                const title = tooltipByCountry.get(name) || name
                return (
                  <Marker key={`${geo.rsmKey}-marker`} coordinates={coords}>
                    <circle
                      r={radius}
                      fill={bubbleColor}
                      stroke="rgba(255,255,255,0.7)"
                      strokeWidth={1.6}
                      style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.55))' }}
                    >
                      <title>{title}</title>
                    </circle>
                  </Marker>
                )
              })}
            </>
          )}
        </Geographies>
      </ComposableMap>

      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          padding: '10px 12px',
          borderRadius: 12,
          background: 'rgba(15,23,42,0.85)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#e2e8f0',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 6px 22px rgba(0,0,0,0.35)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: profitBubble, display: 'inline-block' }} />
          <span style={{ color: '#cbd5e1' }}>Bubble = Net Deposits (size = |value|)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: lossBubble, display: 'inline-block' }} />
          <span style={{ color: '#cbd5e1' }}>Red bubble = PL negative</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(34,211,238,0.2)', border: '1px solid rgba(255,255,255,0.12)', display: 'inline-block' }} />
          <span style={{ color: '#cbd5e1' }}>Hover a bubble to see values</span>
        </div>
      </div>
    </div>
  )
}
