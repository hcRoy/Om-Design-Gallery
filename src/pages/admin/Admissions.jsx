import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Seo from '../../components/Seo.jsx'
import PageHeader from '../../components/admin/PageHeader.jsx'
import SearchBar from '../../components/admin/SearchBar.jsx'
import Badge from '../../components/admin/Badge.jsx'
import EmptyState from '../../components/admin/EmptyState.jsx'
import Alert from '../../components/admin/Alert.jsx'
import { AdminTable } from '../../components/admin/AdminTable.jsx'
import { TableSkeleton } from '../../components/admin/Skeleton.jsx'
import { IconFile } from '../../components/admin/icons.jsx'
import { fetchAllAdmissions } from '../../lib/admin.js'

const STATUS_KEYS = ['pending', 'reviewed', 'enrolled', 'rejected']

function formatSubmitted(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function statusVariant(status) {
  if (status === 'pending') return 'pending'
  if (status === 'reviewed') return 'reviewed'
  if (status === 'enrolled') return 'enrolled'
  if (status === 'rejected') return 'rejected'
  return 'draft'
}

function StatChip({ label, value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start min-w-[100px] px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
        active
          ? 'border-maroon/30 bg-maroon/5 ring-1 ring-maroon/15'
          : 'border-ink/10 bg-white hover:border-ink/20 hover:bg-sand/30'
      }`}
    >
      <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">{label}</span>
      <span className="text-2xl font-bold text-ink tabular-nums mt-0.5">{value}</span>
    </button>
  )
}

const tableColumns = [
  { key: 'form_number', label: 'Form #' },
  { key: 'student', label: 'Student' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

export default function Admissions() {
  const [admissions, setAdmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    fetchAllAdmissions().then(({ admissions: rows, error: err }) => {
      setAdmissions(rows)
      setError(err ?? '')
      setLoading(false)
    })
  }, [])

  const statusCounts = useMemo(() => {
    const counts = { all: admissions.length }
    STATUS_KEYS.forEach((s) => {
      counts[s] = admissions.filter((a) => a.status === s).length
    })
    return counts
  }, [admissions])

  const statusFilters = useMemo(
    () => [
      { value: 'all', label: `All (${statusCounts.all})` },
      { value: 'pending', label: `Pending (${statusCounts.pending})` },
      { value: 'reviewed', label: `Reviewed (${statusCounts.reviewed})` },
      { value: 'enrolled', label: `Enrolled (${statusCounts.enrolled})` },
      { value: 'rejected', label: `Rejected (${statusCounts.rejected})` },
    ],
    [statusCounts],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return admissions.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (!q) return true
      const hay = [
        row.form_number,
        row.student_name,
        row.student_mobile,
        row.status,
        row.current_address,
        row.reference_details,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [admissions, query, statusFilter])

  const description =
    admissions.length === 0
      ? 'Applications from /apply will appear here.'
      : `${filtered.length} of ${admissions.length} application${admissions.length === 1 ? '' : 's'} shown.`

  return (
    <div>
      <Seo title="Admissions" noIndex />
      <PageHeader title="Admissions" description={description} />

      {error && <Alert>{error}</Alert>}

      {!loading && admissions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <StatChip
            label="Total"
            value={statusCounts.all}
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          />
          <StatChip
            label="Pending"
            value={statusCounts.pending}
            active={statusFilter === 'pending'}
            onClick={() => setStatusFilter('pending')}
          />
          <StatChip
            label="Enrolled"
            value={statusCounts.enrolled}
            active={statusFilter === 'enrolled'}
            onClick={() => setStatusFilter('enrolled')}
          />
          <StatChip
            label="Needs review"
            value={statusCounts.reviewed}
            active={statusFilter === 'reviewed'}
            onClick={() => setStatusFilter('reviewed')}
          />
        </div>
      )}

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search by form #, name, mobile, or address…"
        filters={statusFilters}
        activeFilter={statusFilter}
        onFilter={setStatusFilter}
      />

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : admissions.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconFile className="w-7 h-7" />}
            title="No admissions yet"
            description="When students submit the online form at /apply, their applications will show up here."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconFile className="w-7 h-7" />}
            title="No matching applications"
            description="Try a different search term or clear the status filter."
            action={
              <button
                type="button"
                className="btn-secondary !text-xs !py-2"
                onClick={() => {
                  setQuery('')
                  setStatusFilter('all')
                }}
              >
                Clear filters
              </button>
            }
          />
        </div>
      ) : (
        <AdminTable columns={tableColumns}>
          {filtered.map((row) => (
            <tr key={row.id} className="border-b border-ink/5 hover:bg-sand/40 transition-colors">
              <td className="px-4 py-3.5 text-sm font-bold tabular-nums text-maroon">
                {row.form_number ?? '—'}
              </td>
              <td className="px-4 py-3.5">
                <Link
                  to={`/admin/admissions/${row.id}`}
                  className="text-sm font-semibold text-ink hover:text-maroon transition-colors"
                >
                  {row.student_name}
                </Link>
                {row.preferred_language && (
                  <span className="block text-[11px] text-ink-soft mt-0.5 uppercase tracking-wide">
                    {row.preferred_language === 'en' ? 'English' : 'ગુજરાતી'}
                  </span>
                )}
              </td>
              <td className="px-4 py-3.5 text-sm tabular-nums">{row.student_mobile}</td>
              <td className="px-4 py-3.5 text-sm text-ink-soft">{formatSubmitted(row.submitted_at)}</td>
              <td className="px-4 py-3.5">
                <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
              </td>
              <td className="px-4 py-3.5 text-right">
                <Link
                  to={`/admin/admissions/${row.id}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-maroon hover:underline"
                >
                  Open
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path strokeWidth="2" strokeLinecap="round" d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  )
}
