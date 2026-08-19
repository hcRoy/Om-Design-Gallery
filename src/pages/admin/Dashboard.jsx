import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDashboardStats } from '../../lib/admin.js'
import { useAuth } from '../../context/AuthContext.jsx'
import PageHeader from '../../components/admin/PageHeader.jsx'
import StatCard from '../../components/admin/StatCard.jsx'
import { StatSkeleton } from '../../components/admin/Skeleton.jsx'
import Alert from '../../components/admin/Alert.jsx'
import {
  IconPackage,
  IconFolder,
  IconUsers,
  IconOrders,
  IconPlus,
  IconSparkle,
} from '../../components/admin/icons.jsx'

const statMeta = [
  {
    key: 'designs',
    label: 'Designs',
    hint: 'Active & draft in the catalogue',
    tint: 'maroon',
    icon: <IconPackage className="w-5 h-5" />,
  },
  {
    key: 'categories',
    label: 'Categories',
    hint: 'How the store is organised',
    tint: 'gold',
    icon: <IconFolder className="w-5 h-5" />,
  },
  {
    key: 'users',
    label: 'Customers',
    hint: 'Registered accounts',
    tint: 'teal',
    icon: <IconUsers className="w-5 h-5" />,
  },
  {
    key: 'orders',
    label: 'Orders',
    hint: 'Placed through the store',
    tint: 'ink',
    icon: <IconOrders className="w-5 h-5" />,
  },
]

const shortcuts = [
  {
    to: '/admin/products',
    title: 'Add a product',
    description: 'Upload a design, set price, format, and visibility.',
    icon: <IconPlus className="w-4 h-4" />,
  },
  {
    to: '/admin/categories',
    title: 'Organise categories',
    description: 'Keep the catalogue easy to browse.',
    icon: <IconFolder className="w-4 h-4" />,
  },
  {
    to: '/admin/users',
    title: 'Manage roles',
    description: 'Promote or revoke admin access.',
    icon: <IconUsers className="w-4 h-4" />,
  },
  {
    to: '/admin/orders',
    title: 'Review orders',
    description: 'Track paid, pending, and failed payments.',
    icon: <IconOrders className="w-4 h-4" />,
  },
]

const paymentHealthMeta = [
  {
    key: 'paidCount',
    label: 'Paid orders',
    hint: 'Successful payments',
    tone: 'text-teal',
  },
  {
    key: 'pendingCount',
    label: 'Pending payments',
    hint: 'Still awaiting capture or completion',
    tone: 'text-gold-dark',
  },
  {
    key: 'failedCount',
    label: 'Failed payments',
    hint: 'Payments that did not go through',
    tone: 'text-maroon',
  },
  {
    key: 'averageOrderValue',
    label: 'Average order value',
    hint: 'Across all paid orders',
    tone: 'text-ink',
    currency: true,
  },
]

const revenueRangeFilters = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
]

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

export default function Dashboard() {
  const { configured } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revenueRange, setRevenueRange] = useState('30d')

  useEffect(() => {
    fetchDashboardStats().then(({ stats: s, error: err }) => {
      setStats(s)
      setError(err ?? '')
      setLoading(false)
    })
  }, [])

  const emptyStore =
    !loading &&
    stats &&
    stats.designs === 0 &&
    stats.categories === 0 &&
    stats.orders === 0

  const activeRevenue = useMemo(() => {
    return stats?.revenueRanges?.[revenueRange] ?? { label: 'Last 30 days', revenue: 0, orders: 0 }
  }, [stats, revenueRange])

  const activeAverageOrderValue =
    activeRevenue.orders > 0 ? activeRevenue.revenue / activeRevenue.orders : 0

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A live view of catalogue activity, payments, and realized revenue."
        action={
          <Link to="/admin/products" className="btn-admin">
            <IconPlus className="w-4 h-4" />
            Add Product
          </Link>
        }
      />

      {!configured && (
        <Alert tone="warn">
          Supabase isn&rsquo;t connected yet, so there&rsquo;s nothing to count. This page
          queries live counts as soon as it is.
        </Alert>
      )}

      {error && configured && <Alert>{error}</Alert>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : statMeta.map((s) => (
              <StatCard
                key={s.key}
                icon={s.icon}
                label={s.label}
                hint={s.hint}
                tint={s.tint}
                value={stats?.[s.key] ?? 0}
              />
            ))}
      </div>

      <div className="mt-8 grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <section className="admin-card p-6">
          <div className="flex items-center gap-2 mb-1">
            <IconSparkle className="w-4 h-4 text-gold-dark" />
            <h2 className="text-lg font-display text-ink">Quick actions</h2>
          </div>
          <p className="text-sm text-ink-soft mb-5">Jump into the most common admin tasks.</p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {shortcuts.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group rounded-xl border border-ink/8 bg-ivory px-4 py-4
                           hover:border-maroon/25 hover:bg-white transition-all duration-150"
              >
                <span className="w-8 h-8 rounded-lg bg-maroon/10 text-maroon inline-flex items-center justify-center mb-3 group-hover:bg-maroon group-hover:text-ivory transition-colors duration-150">
                  {item.icon}
                </span>
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="text-xs text-ink-soft mt-1 leading-relaxed">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="admin-card p-6">
          <h2 className="text-lg font-display text-ink mb-1">Store snapshot</h2>
          <p className="text-sm text-ink-soft mb-5">
            {emptyStore
              ? 'Nothing in the catalogue yet — start by adding a category, then your first design.'
              : 'Core volume across the catalogue, customer base, and order flow.'}
          </p>
          <ul className="space-y-3">
            {[
              { label: 'Total designs', value: stats?.designs ?? 0 },
              { label: 'Total categories', value: stats?.categories ?? 0 },
              { label: 'Total customers', value: stats?.users ?? 0 },
              { label: 'Total orders', value: stats?.orders ?? 0 },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between text-sm border-b border-ink/5 last:border-0 pb-3 last:pb-0"
              >
                <span className="text-ink-soft">{item.label}</span>
                <span className="font-semibold tabular-nums text-ink">
                  {loading ? '—' : item.value}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <article className="admin-card p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <IconSparkle className="w-4 h-4 text-gold-dark" />
                <h2 className="text-xl font-display text-ink">Revenue</h2>
              </div>
              <p className="text-sm text-ink-soft">
                Realized revenue from paid orders only, with flexible time filtering.
              </p>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {revenueRangeFilters.map((filter) => {
                const active = revenueRange === filter.value
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setRevenueRange(filter.value)}
                    className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 ${
                      active
                        ? 'bg-maroon text-ivory shadow-sm'
                        : 'bg-white text-ink-soft border border-ink/10 hover:border-ink/20 hover:text-ink'
                    }`}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>
          </div>

          {loading ? (
            <div className="mt-6 animate-pulse">
              <div className="h-3 w-32 bg-ink/10 rounded" />
              <div className="h-12 w-48 bg-ink/10 rounded mt-4" />
              <div className="grid sm:grid-cols-3 gap-3 mt-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-ink/8 bg-ivory p-4">
                    <div className="h-3 w-20 bg-ink/10 rounded" />
                    <div className="h-7 w-16 bg-ink/10 rounded mt-3" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">
                  {activeRevenue.label}
                </p>
                <p className="mt-3 font-display text-4xl md:text-5xl leading-none tracking-tight text-maroon tabular-nums">
                  {formatMoney(activeRevenue.revenue)}
                </p>
                <p className="mt-3 text-sm text-ink-soft">
                  {activeRevenue.orders} paid order{activeRevenue.orders === 1 ? '' : 's'} in this period
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 mt-6">
                <div className="rounded-xl border border-ink/8 bg-ivory p-4">
                  <p className="text-xs uppercase tracking-wide text-ink-soft">Orders</p>
                  <p className="mt-3 text-2xl font-display tabular-nums text-ink">
                    {activeRevenue.orders}
                  </p>
                  <p className="mt-2 text-xs text-ink-soft">Successful orders in the selected range</p>
                </div>
                <div className="rounded-xl border border-ink/8 bg-ivory p-4">
                  <p className="text-xs uppercase tracking-wide text-ink-soft">Avg order value</p>
                  <p className="mt-3 text-2xl font-display tabular-nums text-ink">
                    {formatMoney(activeAverageOrderValue)}
                  </p>
                  <p className="mt-2 text-xs text-ink-soft">Average per paid order in this range</p>
                </div>
                <div className="rounded-xl border border-ink/8 bg-ivory p-4">
                  <p className="text-xs uppercase tracking-wide text-ink-soft">All-time revenue</p>
                  <p className="mt-3 text-2xl font-display tabular-nums text-teal">
                    {formatMoney(stats?.totalRevenue ?? 0)}
                  </p>
                  <p className="mt-2 text-xs text-ink-soft">Reference point for store growth</p>
                </div>
              </div>
            </>
          )}
        </article>

        <article className="admin-card p-6">
          <h2 className="text-lg font-display text-ink mb-1">Payment health</h2>
          <p className="text-sm text-ink-soft mb-5">
            {emptyStore
              ? 'No activity yet — payment analytics will appear once customers start ordering.'
              : 'A quick read on successful, pending, and failed payment flow.'}
          </p>
          <ul className="space-y-3">
            {[
              {
                label: 'Paid orders',
                value: stats?.paidCount ?? 0,
                tone: 'text-teal',
              },
              {
                label: 'Pending payments',
                value: stats?.pendingCount ?? 0,
                tone: 'text-gold-dark',
              },
              {
                label: 'Pending value',
                value: formatMoney(stats?.pendingRevenue ?? 0),
                tone: 'text-gold-dark',
              },
              {
                label: 'Failed payments',
                value: stats?.failedCount ?? 0,
                tone: 'text-maroon',
              },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between text-sm border-b border-ink/5 last:border-0 pb-3 last:pb-0"
              >
                <span className="text-ink-soft">{item.label}</span>
                <span className={`font-semibold tabular-nums ${item.tone}`}>
                  {loading ? '—' : item.value}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h2 className="text-xl font-display text-ink">Revenue insights</h2>
            <p className="text-sm text-ink-soft">
              Fast business context without crowding the dashboard with duplicate revenue cards.
            </p>
          </div>
          {!loading && (
            <p className="text-xs text-ink-soft">
              {stats?.paidOrdersToday ?? 0} paid today · {stats?.paidOrdersWeek ?? 0} this week ·{' '}
              {stats?.paidOrdersMonth ?? 0} this month
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <StatSkeleton key={`rev-${i}`} />)
            : [
                {
                  label: 'Today revenue',
                  value: formatMoney(stats?.todayRevenue ?? 0),
                  hint: 'Paid orders created today',
                  tint: 'maroon',
                },
                {
                  label: 'This week',
                  value: formatMoney(stats?.weekRevenue ?? 0),
                  hint: 'Paid orders since Monday',
                  tint: 'teal',
                },
                {
                  label: 'This month',
                  value: formatMoney(stats?.monthRevenue ?? 0),
                  hint: 'Calendar month performance',
                  tint: 'gold',
                },
              ].map((item) => (
                <StatCard
                  key={item.label}
                  icon={<IconOrders className="w-5 h-5" />}
                  label={item.label}
                  hint={item.hint}
                  tint={item.tint}
                  value={item.value}
                />
              ))}
        </div>
      </section>

      <section className="mt-8 grid lg:grid-cols-[1.15fr_0.85fr] gap-4">
        <article className="admin-card p-6">
          <h2 className="text-lg font-display text-ink mb-1">Revenue cadence</h2>
          <p className="text-sm text-ink-soft mb-5">
            Short-term revenue checkpoints to help you read momentum across the store.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-ink/8 bg-ivory p-4 animate-pulse">
                    <div className="h-3 w-24 bg-ink/10 rounded" />
                    <div className="h-7 w-20 bg-ink/10 rounded mt-3" />
                    <div className="h-3 w-32 bg-ink/5 rounded mt-3" />
                  </div>
                ))
              : [
                  {
                    key: 'todayRevenue',
                    label: 'Today revenue',
                    value: formatMoney(stats?.todayRevenue ?? 0),
                    hint: `${stats?.paidOrdersToday ?? 0} paid order${(stats?.paidOrdersToday ?? 0) === 1 ? '' : 's'} today`,
                    tone: 'text-maroon',
                  },
                  {
                    key: 'weekRevenue',
                    label: 'This week',
                    value: formatMoney(stats?.weekRevenue ?? 0),
                    hint: `${stats?.paidOrdersWeek ?? 0} paid order${(stats?.paidOrdersWeek ?? 0) === 1 ? '' : 's'} this week`,
                    tone: 'text-teal',
                  },
                  {
                    key: 'monthRevenue',
                    label: 'This month',
                    value: formatMoney(stats?.monthRevenue ?? 0),
                    hint: `${stats?.paidOrdersMonth ?? 0} paid order${(stats?.paidOrdersMonth ?? 0) === 1 ? '' : 's'} this month`,
                    tone: 'text-gold-dark',
                  },
                  {
                    key: 'averageOrderValue',
                    label: 'Average order value',
                    value: formatMoney(stats?.averageOrderValue ?? 0),
                    hint: 'Across all paid orders',
                    tone: 'text-ink',
                  },
                ].map((item) => (
                  <div key={item.key} className="rounded-xl border border-ink/8 bg-ivory p-4">
                    <p className="text-xs uppercase tracking-wider text-ink-soft">{item.label}</p>
                    <p className={`mt-3 text-2xl font-display tabular-nums ${item.tone}`}>{item.value}</p>
                    <p className="mt-2 text-xs text-ink-soft">{item.hint}</p>
                  </div>
                ))}
          </div>
        </article>

        <article className="admin-card p-6">
          <h2 className="text-lg font-display text-ink mb-1">Store summary</h2>
          <p className="text-sm text-ink-soft mb-5">
            Combined volume across catalogue, customers, and current payment activity.
          </p>
          <ul className="space-y-3">
            {[
              { label: 'Total designs', value: stats?.designs ?? 0 },
              { label: 'Total categories', value: stats?.categories ?? 0 },
              { label: 'Total customers', value: stats?.users ?? 0 },
              { label: 'Total orders', value: stats?.orders ?? 0 },
              { label: 'Orders created today', value: stats?.totalOrdersToday ?? 0 },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between text-sm border-b border-ink/5 last:border-0 pb-3 last:pb-0"
              >
                <span className="text-ink-soft">{item.label}</span>
                <span className="font-semibold tabular-nums text-ink">{loading ? '—' : item.value}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  )
}
