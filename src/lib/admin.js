import { supabase } from './supabaseClient.js'

const NOT_CONFIGURED_ERROR =
  'Supabase isn\u2019t connected yet — admin actions will start working once it is.'

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfWeek(date = new Date()) {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const next = new Date(date)
  next.setDate(date.getDate() + diff)
  next.setHours(0, 0, 0, 0)
  return next
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfRollingDays(days, date = new Date()) {
  const next = new Date(date)
  next.setDate(next.getDate() - (days - 1))
  next.setHours(0, 0, 0, 0)
  return next
}

function sumAmounts(rows) {
  return rows.reduce((sum, row) => sum + Number(row.amount || 0), 0)
}

function countSince(rows, startDate) {
  return rows.filter((row) => new Date(row.created_at) >= startDate).length
}

function buildRevenueStats(orderRows) {
  const now = new Date()
  const paid = orderRows.filter((row) => row.status === 'paid')
  const pending = orderRows.filter((row) => row.status === 'pending')
  const failed = orderRows.filter((row) => row.status === 'failed')

  const todayStart = startOfDay(now)
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)
  const rolling7Start = startOfRollingDays(7, now)
  const rolling30Start = startOfRollingDays(30, now)
  const rolling90Start = startOfRollingDays(90, now)

  const paidToday = paid.filter((row) => new Date(row.created_at) >= todayStart)
  const paidThisWeek = paid.filter((row) => new Date(row.created_at) >= weekStart)
  const paidThisMonth = paid.filter((row) => new Date(row.created_at) >= monthStart)
  const paid7d = paid.filter((row) => new Date(row.created_at) >= rolling7Start)
  const paid30d = paid.filter((row) => new Date(row.created_at) >= rolling30Start)
  const paid90d = paid.filter((row) => new Date(row.created_at) >= rolling90Start)

  const paidRevenue = sumAmounts(paid)
  const pendingRevenue = sumAmounts(pending)

  return {
    todayRevenue: sumAmounts(paidToday),
    weekRevenue: sumAmounts(paidThisWeek),
    monthRevenue: sumAmounts(paidThisMonth),
    totalRevenue: paidRevenue,
    paidOrdersToday: paidToday.length,
    paidOrdersWeek: paidThisWeek.length,
    paidOrdersMonth: paidThisMonth.length,
    averageOrderValue: paid.length ? paidRevenue / paid.length : 0,
    pendingCount: pending.length,
    pendingRevenue,
    paidCount: paid.length,
    failedCount: failed.length,
    totalOrdersToday: countSince(orderRows, todayStart),
    revenueRanges: {
      '7d': {
        label: 'Last 7 days',
        revenue: sumAmounts(paid7d),
        orders: paid7d.length,
      },
      '30d': {
        label: 'Last 30 days',
        revenue: sumAmounts(paid30d),
        orders: paid30d.length,
      },
      '90d': {
        label: 'Last 90 days',
        revenue: sumAmounts(paid90d),
        orders: paid90d.length,
      },
      month: {
        label: 'This month',
        revenue: sumAmounts(paidThisMonth),
        orders: paidThisMonth.length,
      },
      all: {
        label: 'All time',
        revenue: paidRevenue,
        orders: paid.length,
      },
    },
  }
}

/**
 * Unlike catalog.js and wishlist.js, there's no mock-data fallback here.
 * /admin is only reachable with a real session AND role='admin' (see
 * AdminRoute), so there's no way to exercise these functions without
 * Supabase connected in the first place — a fallback would be dead code.
 */

// ---------- Dashboard ----------

export async function fetchDashboardStats() {
  if (!supabase) return { stats: null, error: NOT_CONFIGURED_ERROR }
  const [designs, categories, users, ordersCount, ordersData] = await Promise.all([
    supabase.from('designs').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('amount, status, created_at'),
  ])
  const firstError = [designs, categories, users, ordersCount, ordersData].find((r) => r.error)?.error
  if (firstError) return { stats: null, error: firstError.message }

  const revenue = buildRevenueStats(ordersData.data ?? [])

  return {
    stats: {
      designs: designs.count ?? 0,
      categories: categories.count ?? 0,
      users: users.count ?? 0,
      orders: ordersCount.count ?? 0,
      ...revenue,
    },
    error: null,
  }
}

export async function fetchOrdersAdmin() {
  if (!supabase) return { orders: [], error: NOT_CONFIGURED_ERROR }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      amount,
      status,
      created_at,
      razorpay_order_id,
      profiles:user_id (
        full_name,
        phone,
        email
      ),
      designs:design_id (
        id,
        name,
        slug
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return { orders: [], error: error.message }
  return { orders: data ?? [], error: null }
}

// ---------- Categories ----------

export async function fetchAllCategories() {
  if (!supabase) return { categories: [], error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase.from('categories').select('*').order('sort_order')
  if (error) return { categories: [], error: error.message }
  return { categories: data, error: null }
}

export async function createCategory(payload) {
  if (!supabase) return { category: null, error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase.from('categories').insert(payload).select().single()
  return { category: data ?? null, error: error?.message ?? null }
}

export async function updateCategory(id, payload) {
  if (!supabase) return { category: null, error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select().single()
  return { category: data ?? null, error: error?.message ?? null }
}

export async function deleteCategory(id) {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR }
  const { error } = await supabase.from('categories').delete().eq('id', id)
  return { error: error?.message ?? null }
}

// ---------- Subcategories ----------

export async function fetchAllSubcategories() {
  if (!supabase) return { subcategories: [], error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase
    .from('subcategories')
    .select('*, categories(id, name, slug)')
    .order('sort_order', { ascending: true })
  if (error) return { subcategories: [], error: error.message }
  return { subcategories: data ?? [], error: null }
}

export async function createSubcategory(payload) {
  if (!supabase) return { subcategory: null, error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase.from('subcategories').insert(payload).select().single()
  return { subcategory: data ?? null, error: error?.message ?? null }
}

export async function updateSubcategory(id, payload) {
  if (!supabase) return { subcategory: null, error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase.from('subcategories').update(payload).eq('id', id).select().single()
  return { subcategory: data ?? null, error: error?.message ?? null }
}

export async function deleteSubcategory(id) {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR }
  const { error } = await supabase.from('subcategories').delete().eq('id', id)
  return { error: error?.message ?? null }
}

// ---------- Carousel slides ----------

export async function fetchAllCarouselSlides() {
  if (!supabase) return { slides: [], error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase
    .from('carousel_slides')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) return { slides: [], error: error.message }
  return { slides: data ?? [], error: null }
}

export async function createCarouselSlide(payload) {
  if (!supabase) return { slide: null, error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase.from('carousel_slides').insert(payload).select().single()
  return { slide: data ?? null, error: error?.message ?? null }
}

export async function updateCarouselSlide(id, payload) {
  if (!supabase) return { slide: null, error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase.from('carousel_slides').update(payload).eq('id', id).select().single()
  return { slide: data ?? null, error: error?.message ?? null }
}

export async function deleteCarouselSlide(id) {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR }
  const { error } = await supabase.from('carousel_slides').delete().eq('id', id)
  return { error: error?.message ?? null }
}

// ---------- Offers ----------

export async function fetchAllOffers() {
  if (!supabase) return { offers: [], error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return { offers: [], error: error.message }
  return { offers: data ?? [], error: null }
}

export async function createOffer(payload) {
  if (!supabase) return { offer: null, error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase.from('offers').insert(payload).select().single()
  return { offer: data ?? null, error: error?.message ?? null }
}

export async function updateOffer(id, payload) {
  if (!supabase) return { offer: null, error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase.from('offers').update(payload).eq('id', id).select().single()
  return { offer: data ?? null, error: error?.message ?? null }
}

export async function deleteOffer(id) {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR }
  const { error } = await supabase.from('offers').delete().eq('id', id)
  return { error: error?.message ?? null }
}

// ---------- Products (designs) ----------

/**
 * Admin sees every design regardless of `is_active`, unlike the public
 * catalog (`fetchDesigns` in catalog.js), which filters to active-only.
 */
export async function fetchAllDesigns() {
  if (!supabase) return { designs: [], error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase
    .from('designs')
    .select('*, categories(name), subcategories(name, slug, category_id)')
    .order('created_at', { ascending: false })
  if (error) return { designs: [], error: error.message }
  return { designs: data, error: null }
}

export async function createDesign(payload) {
  if (!supabase) return { design: null, error: NOT_CONFIGURED_ERROR }
  // design_id is assigned by a DB trigger — never send it from the client
  const { design_id: _omit, ...safe } = payload
  const { data, error } = await supabase.from('designs').insert(safe).select().single()
  return { design: data ?? null, error: error?.message ?? null }
}

export async function updateDesign(id, payload) {
  if (!supabase) return { design: null, error: NOT_CONFIGURED_ERROR }
  // design_id is immutable; strip it so updates cannot attempt a change
  const { design_id: _omit, ...safe } = payload
  const { data, error } = await supabase.from('designs').update(safe).eq('id', id).select().single()
  return { design: data ?? null, error: error?.message ?? null }
}

export async function deleteDesign(id) {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR }
  const { error } = await supabase.from('designs').delete().eq('id', id)
  return { error: error?.message ?? null }
}

export async function uploadProductImage(file) {
  if (!supabase) return { url: null, error: NOT_CONFIGURED_ERROR }
  const path = `${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('product-images').upload(path, file)
  if (error) return { url: null, error: error.message }
  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

/**
 * `design-files` is a private bucket, so upload only returns a storage
 * path, not a public URL — there's no customer-download flow yet (that
 * depends on checkout, which is still a Buy Now stub), so signed-URL
 * generation on demand is a follow-up rather than something to build
 * speculatively here.
 */
export async function uploadDesignFile(file) {
  if (!supabase) return { path: null, error: NOT_CONFIGURED_ERROR }
  const path = `${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('design-files').upload(path, file)
  if (error) return { path: null, error: error.message }
  return { path, error: null }
}

// ---------- Users ----------

export async function fetchUsers() {
  if (!supabase) return { users: [], error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return { users: [], error: error.message }
  return { users: data, error: null }
}

export async function updateUserRole(userId, role) {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR }
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  return { error: error?.message ?? null }
}

export async function creditUserWallet(targetUserId, amount, note, accessToken) {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR }
  try {
    const { callEdgeFunction } = await import('./razorpay.js')
    const data = await callEdgeFunction(
      'admin-credit-wallet',
      {
        target_user_id: targetUserId,
        amount: Number(amount),
        note: note || null,
      },
      accessToken,
    )
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to credit wallet' }
  }
}
