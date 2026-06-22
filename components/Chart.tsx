import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { parseCsv } from './ui/parseCsv'
import { proxyUrl } from '../lib/proxy'

const PALETTE = ['#0c2445', '#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2']

type RawRow = Record<string, string>
type ChartRow = Record<string, string | number>

export interface SeriesDef {
  match: string
  label: string
}

export interface ChartProps {
  url: string
  type?: 'line' | 'bar' | 'area'
  height?: number

  // Standard long-format: x and y column names
  x?: string
  y?: string | string[]

  // Wide-format (years as columns, rows as series)
  wideMode?: boolean
  labelColumn?: string
  seriesRows?: SeriesDef[]
}

function detectYearColumns(headers: string[]): string[] {
  return headers.filter((h) => /\b\d{4}\b/.test(h))
}

function pivotWide(
  rows: RawRow[],
  labelColumn: string,
  seriesDefs: SeriesDef[],
  yearCols: string[]
): ChartRow[] {
  const matchIndex: Record<string, string> = {}
  for (const def of seriesDefs) {
    matchIndex[def.match] = def.label
  }

  const byYear: Record<string, ChartRow> = {}
  for (const col of yearCols) {
    const yearLabel = col.replace(/^Tahun\s+/i, '').trim()
    byYear[yearLabel] = { tahun: yearLabel }
  }

  for (const row of rows) {
    const label = row[labelColumn]
    const alias = matchIndex[label]
    if (!alias) continue
    for (const col of yearCols) {
      const yearLabel = col.replace(/^Tahun\s+/i, '').trim()
      const v = Number(row[col])
      byYear[yearLabel][alias] = Number.isFinite(v) ? Math.round(v * 100) / 100 : undefined as unknown as number
    }
  }

  return Object.values(byYear).sort((a, b) =>
    String(a.tahun).localeCompare(String(b.tahun), undefined, { numeric: true })
  )
}

export function Chart({
  url,
  type = 'line',
  height = 300,
  x = '',
  y = [],
  wideMode = false,
  labelColumn = 'Uraian',
  seriesRows = [],
}: ChartProps) {
  const [raw, setRaw] = useState<RawRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(proxyUrl(url))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then((text) => {
        const { rows, fields } = parseCsv(text)
        setRaw(rows)
        setHeaders(fields.map((f) => f.key))
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [url])

  const chartData: ChartRow[] = useMemo(() => {
    if (raw.length === 0) return []
    if (wideMode) {
      const yearCols = detectYearColumns(headers)
      return pivotWide(raw, labelColumn, seriesRows, yearCols)
    }
    const yKeys = Array.isArray(y) ? y : [y]
    return raw.map((row) => {
      const out: ChartRow = { [x]: row[x] }
      for (const k of yKeys) {
        const n = Number(row[k])
        out[k] = Number.isFinite(n) ? n : undefined as unknown as number
      }
      return out
    })
  }, [raw, headers, wideMode, labelColumn, seriesRows, x, y])

  const seriesKeys: string[] = useMemo(() => {
    if (wideMode) return seriesRows.map((s) => s.label)
    return Array.isArray(y) ? y : [y]
  }, [wideMode, seriesRows, y])

  const xKey = wideMode ? 'tahun' : x

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
        Memuat chart…
      </div>
    )
  }
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
        Gagal memuat data: {error}
      </div>
    )
  }
  if (chartData.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-400">Tidak ada data.</div>
    )
  }

  const grid = <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
  const axes = (
    <>
      <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="#9ca3af" />
      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" domain={['auto', 'auto']} />
    </>
  )

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={chartData}>
            {grid}{axes}<Tooltip /><Legend />
            {seriesKeys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={PALETTE[i % PALETTE.length]} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        ) : type === 'area' ? (
          <AreaChart data={chartData}>
            {grid}{axes}<Tooltip /><Legend />
            {seriesKeys.map((k, i) => (
              <Area key={k} type="monotone" dataKey={k} stroke={PALETTE[i % PALETTE.length]} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.15} dot={{ r: 4 }} />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            {grid}{axes}<Tooltip /><Legend />
            {seriesKeys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
