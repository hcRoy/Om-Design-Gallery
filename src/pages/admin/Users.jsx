import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import Seo from '../../components/Seo.jsx'
import Modal from '../../components/Modal.jsx'
import { fetchUsers, updateUserRole, creditUserWallet } from '../../lib/admin.js'
import PageHeader from '../../components/admin/PageHeader.jsx'
import SearchBar from '../../components/admin/SearchBar.jsx'
import Badge from '../../components/admin/Badge.jsx'
import EmptyState from '../../components/admin/EmptyState.jsx'
import Alert from '../../components/admin/Alert.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import Tooltip from '../../components/admin/Tooltip.jsx'
import { Field } from '../../components/admin/FormControls.jsx'
import { AdminTable } from '../../components/admin/AdminTable.jsx'
import { TableSkeleton } from '../../components/admin/Skeleton.jsx'
import { IconUsers, IconChevronDown } from '../../components/admin/icons.jsx'

/**
 * JUDGMENT CALL: role toggle asks for confirmation before promoting
 * someone to admin (not before demoting) — granting admin access is the
 * higher-consequence direction, so it gets the extra friction. Also
 * blocks a user from changing their own role from this table, so an
 * admin can't accidentally demote themselves out of the panel.
 */

const ROLE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'admin', label: 'Admins' },
  { value: 'customer', label: 'Customers' },
]

const tableColumns = [
  { key: 'user', label: 'User' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'wallet', label: 'Wallet' },
  { key: 'role', label: 'Role' },
  { key: 'actions', label: 'Access', align: 'right' },
]

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

function initials(u) {
  const name = u.full_name?.trim()
  if (name) {
    const parts = name.split(/\s+/)
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
  }
  return (u.phone || '?').replace(/\D/g, '').slice(-2) || '?'
}

function RoleSelect({ value, disabled, title, busy, onChange }) {
  const control = (
    <div className="relative inline-block">
      <select
        value={value}
        disabled={disabled || busy}
        onChange={(e) => onChange(e.target.value)}
        title={title}
        aria-label="Change role"
        className="appearance-none bg-white border border-ink/12 rounded-lg pl-3 pr-8 py-1.5
                   text-xs font-semibold text-ink cursor-pointer
                   transition-all duration-150
                   hover:border-ink/25 focus:outline-none focus:border-maroon/35 focus:ring-2 focus:ring-maroon/10
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <option value="customer">Customer</option>
        <option value="admin">Admin</option>
      </select>
      <IconChevronDown className="w-3.5 h-3.5 text-ink-soft pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
    </div>
  )

  if (title) {
    return <Tooltip label={title}>{control}</Tooltip>
  }
  return control
}

export default function Users() {
  const { user: currentUser, session } = useAuth()
  const { showToast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [pendingPromote, setPendingPromote] = useState(null)

  const [creditUser, setCreditUser] = useState(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditNote, setCreditNote] = useState('')
  const [crediting, setCrediting] = useState(false)

  const load = () => {
    setLoading(true)
    fetchUsers().then(({ users: u, error: err }) => {
      setUsers(u)
      setError(err ?? '')
      setLoading(false)
    })
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (!q) return true
      const hay = [u.full_name, u.phone, u.email, u.role].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [users, query, roleFilter])

  const applyRole = async (u, nextRole) => {
    setBusyId(u.id)
    const { error: err } = await updateUserRole(u.id, nextRole)
    setBusyId(null)
    if (err) {
      setError(err)
      showToast(err, { type: 'error' })
      return
    }
    showToast(`${u.full_name || u.phone} is now ${nextRole === 'admin' ? 'an admin' : 'a customer'}.`, {
      type: 'success',
    })
    load()
  }

  const handleRoleChange = (u, nextRole) => {
    if (nextRole === u.role) return
    if (nextRole === 'admin') {
      setPendingPromote(u)
      return
    }
    applyRole(u, nextRole)
  }

  const confirmPromote = async () => {
    if (!pendingPromote) return
    const u = pendingPromote
    setPendingPromote(null)
    await applyRole(u, 'admin')
  }

  const openCredit = (u) => {
    setCreditUser(u)
    setCreditAmount('')
    setCreditNote('')
  }

  const handleCreditWallet = async (e) => {
    e.preventDefault()
    if (!creditUser) return
    const amount = Number(creditAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Enter a positive credit amount.', { type: 'error' })
      return
    }
    if (!session?.access_token) {
      showToast('Please sign in again.', { type: 'error' })
      return
    }

    setCrediting(true)
    const { error: err } = await creditUserWallet(
      creditUser.id,
      amount,
      creditNote.trim() || null,
      session.access_token,
    )
    setCrediting(false)
    if (err) {
      setError(err)
      showToast(err, { type: 'error' })
      return
    }
    showToast(`Credited ${formatMoney(amount)} to ${creditUser.full_name || creditUser.phone}.`, {
      type: 'success',
    })
    setCreditUser(null)
    load()
  }

  return (
    <div>
      <Seo title="Users" noIndex />
      <PageHeader
        title="Users"
        description={`${users.length} registered account${users.length === 1 ? '' : 's'}. Promote carefully — admin access is unrestricted.`}
      />

      {error && <Alert>{error}</Alert>}

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search by name, phone, or email…"
        filters={ROLE_FILTERS}
        activeFilter={roleFilter}
        onFilter={setRoleFilter}
      />

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : users.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconUsers className="w-7 h-7" />}
            title="No users yet"
            description="Registered customers will appear here once they create an account."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconUsers className="w-7 h-7" />}
            title="No matches"
            description="Try a different search or role filter."
          />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <AdminTable columns={tableColumns} minWidth={900}>
              {filtered.map((u) => {
                const isSelf = u.id === currentUser?.id
                return (
                  <tr key={u.id} className="hover:bg-sand/40 transition-colors duration-150">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-maroon/10 text-maroon text-xs font-bold flex items-center justify-center shrink-0">
                          {initials(u)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink truncate">
                            {u.full_name || '—'}
                            {isSelf && (
                              <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                                You
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">{u.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-ink-soft truncate max-w-[200px]">{u.email || '—'}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold tabular-nums text-ink">{formatMoney(u.wallet_balance)}</p>
                      <button
                        type="button"
                        onClick={() => openCredit(u)}
                        className="mt-1 text-[11px] font-semibold text-maroon hover:underline"
                      >
                        Credit wallet
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={u.role === 'admin' ? 'admin' : 'customer'}>{u.role}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <RoleSelect
                        value={u.role === 'admin' ? 'admin' : 'customer'}
                        disabled={isSelf}
                        busy={busyId === u.id}
                        title={isSelf ? "You can't change your own role here" : undefined}
                        onChange={(role) => handleRoleChange(u, role)}
                      />
                    </td>
                  </tr>
                )
              })}
            </AdminTable>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((u) => {
              const isSelf = u.id === currentUser?.id
              return (
                <article key={u.id} className="admin-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-maroon/10 text-maroon text-xs font-bold flex items-center justify-center shrink-0">
                      {initials(u)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">
                        {u.full_name || '—'}
                        {isSelf && (
                          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-ink-soft mt-0.5">{u.phone || '—'}</p>
                      {u.email && <p className="text-xs text-ink-soft">{u.email}</p>}
                      <p className="text-sm font-semibold text-maroon tabular-nums mt-2">
                        {formatMoney(u.wallet_balance)}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                        <Badge variant={u.role === 'admin' ? 'admin' : 'customer'}>{u.role}</Badge>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openCredit(u)}
                            className="text-xs font-semibold text-maroon hover:underline"
                          >
                            Credit wallet
                          </button>
                          <RoleSelect
                            value={u.role === 'admin' ? 'admin' : 'customer'}
                            disabled={isSelf}
                            busy={busyId === u.id}
                            title={isSelf ? "You can't change your own role here" : undefined}
                            onChange={(role) => handleRoleChange(u, role)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}

      <Modal
        open={Boolean(creditUser)}
        onClose={() => !crediting && setCreditUser(null)}
        title="Credit wallet"
        description={
          creditUser
            ? `Add balance for ${creditUser.full_name || creditUser.phone || 'this user'}.`
            : ''
        }
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreditUser(null)}
              className="btn-ghost"
              disabled={crediting}
            >
              Cancel
            </button>
            <button type="submit" form="credit-wallet-form" className="btn-admin" disabled={crediting}>
              {crediting ? 'Crediting…' : 'Credit wallet'}
            </button>
          </>
        }
      >
        <form id="credit-wallet-form" onSubmit={handleCreditWallet} className="space-y-4">
          <Field label="Amount (₹)" htmlFor="credit-amount">
            <input
              id="credit-amount"
              type="number"
              min="0.01"
              step="0.01"
              className="admin-input"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              required
            />
          </Field>
          <Field label="Note (optional)" htmlFor="credit-note">
            <input
              id="credit-note"
              className="admin-input"
              value={creditNote}
              onChange={(e) => setCreditNote(e.target.value)}
              placeholder="e.g. Festival credit"
            />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingPromote)}
        onClose={() => setPendingPromote(null)}
        onConfirm={confirmPromote}
        variant="default"
        title="Grant admin access"
        description={
          pendingPromote
            ? `Make ${pendingPromote.full_name || pendingPromote.phone} an admin? They’ll be able to manage products, categories, and other users.`
            : ''
        }
        confirmLabel="Make admin"
      />
    </div>
  )
}
