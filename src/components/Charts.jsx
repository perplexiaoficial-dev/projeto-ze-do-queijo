import React from 'react'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function polarToCartesian(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
function describeArc(cx, cy, r, start, end) {
  const s = polarToCartesian(cx, cy, r, end)
  const e = polarToCartesian(cx, cy, r, start)
  const large = end - start <= 180 ? '0' : '1'
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`
}

// ─── BarChart ─────────────────────────────────────────────────────────────────
export function BarChart({ data = [], height = 160, color = '#10b981', accentColor = '#0284c7' }) {
  if (!data.length) return null
  const w = 600
  const max = Math.max(...data.map(d => d.value), 1)
  const barW = Math.max(12, (w - (data.length + 1) * 8) / data.length)
  const pad = 8

  return (
    <svg viewBox={`0 0 ${w} ${height + 28}`} style={{ width: '100%', height: height + 28 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const bh = Math.max(2, (d.value / max) * height)
        const x = pad + i * (barW + pad)
        const y = height - bh
        return (
          <g key={i}>
            <rect x={x} y={height} width={barW} height={0} rx={4} fill="url(#barGrad)" opacity="0.9">
              <animate attributeName="height" from="0" to={bh} dur="0.6s" begin={`${i * 0.06}s`} fill="freeze" />
              <animate attributeName="y" from={height} to={y} dur="0.6s" begin={`${i * 0.06}s`} fill="freeze" />
            </rect>
            <text x={x + barW / 2} y={height + 18} textAnchor="middle" fontSize="9" fill="#52525b" fontFamily="Inter">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── LineAreaChart ────────────────────────────────────────────────────────────
export function LineAreaChart({ data = [], height = 140, color = '#10b981' }) {
  if (data.length < 2) return null
  const w = 600
  const max = Math.max(...data.map(d => d.value), 1)
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * w,
    y: height - (d.value / max) * (height - 10)
  }))
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `M 0,${height} L 0,${pts[0].y} ` + pts.map(p => `L ${p.x},${p.y}`).join(' ') + ` L ${w},${height} Z`

  return (
    <svg viewBox={`0 0 ${w} ${height + 24}`} style={{ width: '100%', height: height + 24 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((v, i) => (
        <line key={i} x1={0} y1={height - v * (height - 10)} x2={w} y2={height - v * (height - 10)}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#areaGrad)" />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} stroke="#09090b" strokeWidth="2">
          <animate attributeName="r" from="0" to="3.5" dur="0.4s" begin={`${i * 0.05 + 0.3}s`} fill="freeze" />
        </circle>
      ))}
      {data.map((d, i) => (
        <text key={i} x={pts[i].x} y={height + 18} textAnchor="middle" fontSize="9" fill="#52525b" fontFamily="Inter">
          {d.label}
        </text>
      ))}
    </svg>
  )
}

// ─── DonutChart ───────────────────────────────────────────────────────────────
export function DonutChart({ data = [], size = 140 }) {
  if (!data.length) return null
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null
  const cx = size / 2, cy = size / 2
  const outerR = size / 2 - 6, innerR = outerR - 22
  let currentAngle = 0
  const segments = data.map(d => {
    const angle = (d.value / total) * 360
    const path = angle >= 360
      ? `M ${cx} ${cy - outerR} A ${outerR} ${outerR} 0 1 1 ${cx - 0.01} ${cy - outerR} Z`
      : describeArc(cx, cy, outerR, currentAngle, currentAngle + angle)
    const seg = { ...d, path, startAngle: currentAngle, angle }
    currentAngle += angle
    return seg
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={22} />
        {segments.map((s, i) => (
          <path key={i} d={s.path} fill="none" stroke={s.color} strokeWidth={22}
            strokeLinecap="round" opacity="0.9" />
        ))}
        <circle cx={cx} cy={cy} r={innerR} fill="#09090b" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="800" fill="#f4f4f5" fontFamily="Inter">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#71717a" fontFamily="Inter">total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#a1a1aa' }}>{d.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f4f4f5', marginLeft: 'auto', paddingLeft: 12 }}>
              {d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MiniSparkLine ────────────────────────────────────────────────────────────
export function SparkLine({ data = [], color = '#10b981', width = 80, height = 30 }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * height}`)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width, height }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
    </svg>
  )
}
