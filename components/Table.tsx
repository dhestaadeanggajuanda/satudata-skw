import React, { useEffect, useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type FilterFn,
  type PaginationState,
} from '@tanstack/react-table'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid'
import DebouncedInput from './ui/DebouncedInput'
import LoadingSpinner from './ui/LoadingSpinner'
import { parseCsv } from './ui/parseCsv'
import { proxyUrl } from '../lib/proxy'

type Row = Record<string, string | number>
type Col = { key: string; name: string }

export interface TableProps {
  data?: Row[]
  cols?: Col[]
  csv?: string
  url?: string
  format?: string
  fullWidth?: boolean
}

// Convert an array-of-arrays (SheetJS `sheet_to_json` with header:1) into the
// Row/Col shape the table uses. The first non-empty row is the header; header
// keys are made unique (blank/duplicate → col_<i>).
function sheetToTable(aoa: unknown[][]): { rows: Row[]; fields: Col[] } {
  const headerIdx = aoa.findIndex((r) => Array.isArray(r) && r.some((c) => String(c ?? '').trim() !== ''))
  if (headerIdx === -1) return { rows: [], fields: [] }
  const header = aoa[headerIdx]
  const seen = new Set<string>()
  const fields: Col[] = header.map((h, i) => {
    let name = String(h ?? '').trim()
    let key = name || `col_${i}`
    while (seen.has(key)) key = `${key}_${i}`
    seen.add(key)
    return { key, name: name || `Kolom ${i + 1}` }
  })
  const rows: Row[] = aoa.slice(headerIdx + 1)
    .filter((r) => Array.isArray(r) && r.some((c) => String(c ?? '').trim() !== ''))
    .map((r) => {
      const obj: Row = {}
      fields.forEach((f, i) => { obj[f.key] = (r[i] ?? '') as string | number })
      return obj
    })
  return { rows, fields }
}

const globalFilterFn: FilterFn<Row> = (row, columnId, filterValue: string) => {
  const value = String(row.getValue(columnId) ?? '').toLowerCase()
  return value.includes(filterValue.toLowerCase())
}

export function Table({ data: initialData = [], cols: initialCols = [], csv = '', url = '', format = '', fullWidth = false }: TableProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const [data, setData] = useState<Row[]>(() => {
    if (csv) return parseCsv(csv).rows
    return initialData
  })
  const [columns, setColumns] = useState<Col[]>(() => {
    if (csv) return parseCsv(csv).fields
    return initialCols
  })

  // Keep state in sync when non-URL props change
  useEffect(() => {
    if (url) return
    if (csv) {
      const parsed = parseCsv(csv)
      setData(parsed.rows)
      setColumns(parsed.fields)
    } else {
      setData(initialData)
      setColumns(initialCols)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csv, url, JSON.stringify(initialData), JSON.stringify(initialCols)])

  useEffect(() => {
    if (!url) return
    let cancelled = false
    setIsLoading(true)
    setError(null)
    const fmt = (format || '').toLowerCase()
    ;(async () => {
      try {
        const res = await fetch(proxyUrl(url))
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`)
        let parsed: { rows: Row[]; fields: Col[] }
        if (fmt === 'xlsx' || fmt === 'xls') {
          const XLSX = await import('xlsx')
          const wb = XLSX.read(await res.arrayBuffer(), { type: 'array' })
          const sheet = wb.Sheets[wb.SheetNames[0]]
          const aoa = sheet
            ? (XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false }) as unknown[][])
            : []
          parsed = sheetToTable(aoa)
        } else {
          parsed = parseCsv(await res.text())
        }
        if (cancelled) return
        setData(parsed.rows)
        setColumns(parsed.fields)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [url, format])

  const columnHelper = createColumnHelper<Row>()
  const tableCols = useMemo(
    () => columns.map((c) => columnHelper.accessor(c.key, { header: () => c.name, cell: (i) => i.getValue() })),
    [columns]
  )

  const table = useReactTable({
    data,
    columns: tableCols,
    state: { globalFilter, pagination: { pageIndex, pageSize } },
    globalFilterFn,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-700 bg-red-50 rounded-md dark:text-red-300 dark:bg-red-900/30">
        Failed to load data: {error}
      </div>
    )
  }

  return (
    <div className={fullWidth ? 'w-full overflow-x-auto md:w-[90vw] md:ml-[calc(50%-45vw)]' : 'w-full overflow-x-auto'}>
      <DebouncedInput
        value={globalFilter}
        onChange={(v) => setGlobalFilter(String(v))}
        className="mb-4 w-full max-w-sm px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        placeholder="Search all columns..."
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left border-b border-gray-300 dark:border-gray-700">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="pr-4 pb-2 font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap dark:text-gray-200"
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getIsSorted() === 'asc' && <ArrowUpIcon className="inline ml-1 h-3 w-3" />}
                    {h.column.getIsSorted() === 'desc' && <ArrowDownIcon className="inline ml-1 h-3 w-3" />}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                {r.getVisibleCells().map((c) => (
                  <td key={c.id} className="pr-4 py-2 text-gray-800 dark:text-gray-200">
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-center gap-2 mt-6">
        {[
          { Icon: ChevronDoubleLeftIcon, action: () => table.setPageIndex(0), disabled: !table.getCanPreviousPage() },
          { Icon: ChevronLeftIcon, action: () => table.previousPage(), disabled: !table.getCanPreviousPage() },
          { Icon: ChevronRightIcon, action: () => table.nextPage(), disabled: !table.getCanNextPage() },
          { Icon: ChevronDoubleRightIcon, action: () => table.setPageIndex(table.getPageCount() - 1), disabled: !table.getCanNextPage() },
        ].map(({ Icon, action, disabled }, i) => (
          <button key={i} onClick={action} disabled={disabled} className={`w-5 h-5 ${disabled ? 'opacity-25' : 'opacity-100'}`}>
            <Icon />
          </button>
        ))}
        <span className="text-sm text-gray-600 ml-2 dark:text-gray-300">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
      </div>
    </div>
  )
}
