import { supabase } from './supabaseClient.js'
import { mockCategories, mockDesigns } from '../data/mockCatalog.js'

/**
 * Every function here checks `supabase` first and runs the real query
 * shape you'd want against your schema; when it's null (no env vars
 * yet) it falls back to the mock catalog so Phase 3 pages are fully
 * browsable today. Swapping in real credentials requires no page
 * changes — only this file's fallback branches become dead code.
 */

export async function fetchCategories() {
  if (supabase) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) return { categories: [], error: error.message }
    return { categories: data, error: null }
  }
  return { categories: [...mockCategories].sort((a, b) => a.sort_order - b.sort_order), error: null }
}

export async function fetchCategoryBySlug(slug) {
  if (supabase) {
    const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).single()
    if (error) return { category: null, error: error.message }
    return { category: data, error: null }
  }
  return { category: mockCategories.find((c) => c.slug === slug) ?? null, error: null }
}

/**
 * filters: { categorySlug, format, minPrice, maxPrice, query }
 * All optional. `query` matches against name/description/tags.
 */
export async function fetchDesigns(filters = {}) {
  const { categorySlug, format, minPrice, maxPrice, query } = filters

  if (supabase) {
    let q = supabase.from('designs').select('*, categories!inner(slug, name)').eq('is_active', true)
    if (categorySlug) q = q.eq('categories.slug', categorySlug)
    if (format) q = q.eq('file_format', format)
    if (minPrice != null) q = q.gte('price', minPrice)
    if (maxPrice != null) q = q.lte('price', maxPrice)
    if (query) q = q.ilike('name', `%${query}%`)
    const { data, error } = await q
    if (error) return { designs: [], error: error.message }
    return { designs: data, error: null }
  }

  let results = mockDesigns.filter((d) => d.is_active)
  if (categorySlug) results = results.filter((d) => d.category_slug === categorySlug)
  if (format) results = results.filter((d) => d.file_format === format)
  if (minPrice != null) results = results.filter((d) => d.price >= minPrice)
  if (maxPrice != null) results = results.filter((d) => d.price <= maxPrice)
  if (query) {
    const q = query.toLowerCase()
    results = results.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.tags?.some((t) => t.toLowerCase().includes(q)),
    )
  }
  return { designs: results, error: null }
}

export async function fetchDesignBySlug(slug) {
  if (supabase) {
    const { data, error } = await supabase
      .from('designs')
      .select('*, categories(name, slug)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    if (error) return { design: null, error: error.message }
    return { design: data, error: null }
  }
  const design = mockDesigns.find((d) => d.slug === slug && d.is_active) ?? null
  return { design, error: null }
}

// Kept in one place so Categories/Designs filter UI and any admin form
// (Phase 5) reference the same list rather than duplicating it.
export const FILE_FORMATS = ['DST', 'PES', 'EXP', 'JEF']
