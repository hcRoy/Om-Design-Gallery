import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import Card from '../components/Card.jsx'
import WishlistButton from '../components/WishlistButton.jsx'
import Seo from '../components/Seo.jsx'
import { stripHtml } from '../lib/html.js'
import { fetchCategories, fetchDesigns, fetchSubcategories, FILE_FORMATS } from '../lib/catalog.js'

/**
 * Filters live in the URL (?category=&subcategory=&format=&min=&max=&q=)
 * rather than component state, so a filtered view is shareable/bookmarkable
 * and category / subcategory cards can link straight into a pre-filtered
 * result.
 */
export default function Designs() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const categorySlug = params.get('category') || ''
  const subcategorySlug = params.get('subcategory') || ''
  const format = params.get('format') || ''
  const minPrice = params.get('min') || ''
  const maxPrice = params.get('max') || ''
  const query = params.get('q') || ''

  const [searchInput, setSearchInput] = useState(query)

  useEffect(() => {
    fetchCategories().then(({ categories: c }) => setCategories(c))
  }, [])

  useEffect(() => {
    if (!categorySlug) {
      setSubcategories([])
      return
    }
    fetchSubcategories(categorySlug).then(({ subcategories: s }) => setSubcategories(s))
  }, [categorySlug])

  useEffect(() => {
    setLoading(true)
    fetchDesigns({
      categorySlug: categorySlug || undefined,
      subcategorySlug: subcategorySlug || undefined,
      format: format || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      query: query || undefined,
    }).then(({ designs: d }) => {
      setDesigns(d)
      setLoading(false)
    })
  }, [categorySlug, subcategorySlug, format, minPrice, maxPrice, query])

  const updateParam = useCallback(
    (key, value) => {
      const next = new URLSearchParams(params)
      if (value) next.set(key, value)
      else next.delete(key)
      setParams(next, { replace: true })
    },
    [params, setParams],
  )

  const setCategory = (slug) => {
    const next = new URLSearchParams(params)
    if (slug) next.set('category', slug)
    else next.delete('category')
    next.delete('subcategory')
    setParams(next, { replace: true })
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateParam('q', searchInput)
  }

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug),
    [categories, categorySlug],
  )

  const activeSubcategory = useMemo(
    () => subcategories.find((s) => s.slug === subcategorySlug),
    [subcategories, subcategorySlug],
  )

  const clearFilters = () => {
    setParams({}, { replace: true })
    setSearchInput('')
  }

  const hasActiveFilters =
    categorySlug || subcategorySlug || format || minPrice || maxPrice || query

  const heading = activeSubcategory?.name || activeCategory?.name || 'All designs'
  const seoDescription =
    activeSubcategory?.description ||
    activeCategory?.description ||
    'Search and filter the full embroidery design catalogue by category, subcategory, price and machine file format.'

  return (
    <>
      <Seo title={heading === 'All designs' ? 'All Designs' : heading} description={seoDescription} />
      <section className="bg-ivory px-6 pt-16 pb-10 md:pt-20 md:pb-12">
        <div className="max-w-6xl mx-auto">
          <p className="eyebrow text-gold-dark">
            {activeCategory || activeSubcategory ? 'Collection' : 'Full catalogue'}
          </p>
          <h1 className="text-3xl md:text-5xl mt-3">{heading}</h1>
          {(activeSubcategory?.description || activeCategory?.description) && (
            <p className="text-ink-soft mt-3 max-w-xl leading-relaxed">
              {activeSubcategory?.description || activeCategory?.description}
            </p>
          )}
          {!activeCategory && !activeSubcategory && (
            <p className="text-ink-soft mt-3 max-w-xl leading-relaxed">
              Search and filter by category, subcategory, price and machine file format.
            </p>
          )}

          <form onSubmit={handleSearchSubmit} className="mt-7 flex gap-3 max-w-lg">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search designs by name or motif…"
              aria-label="Search designs"
              className="flex-1 border border-ink/15 rounded-sm px-4 py-2.5 text-sm bg-white
                         focus:outline-none focus:border-maroon"
            />
            <button type="submit" className="btn-primary !px-5">
              Search
            </button>
          </form>
          <div className="mt-8 h-px bg-gold/30" />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-[220px_1fr] gap-10">
        <aside>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="md:hidden w-full btn-outline mb-4 !py-2.5"
            aria-expanded={filtersOpen}
          >
            {filtersOpen ? 'Hide filters' : 'Show filters'}
          </button>

          <div className={`${filtersOpen ? 'block' : 'hidden'} md:block space-y-8`}>
            <div>
              <p className="eyebrow text-[11px] mb-3">Category</p>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setCategory('')}
                    aria-pressed={!categorySlug}
                    className={`text-sm ${!categorySlug ? 'text-maroon font-semibold' : 'text-ink-soft hover:text-maroon'}`}
                  >
                    All categories
                  </button>
                </li>
                {categories.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setCategory(c.slug)}
                      aria-pressed={categorySlug === c.slug}
                      className={`text-sm ${categorySlug === c.slug ? 'text-maroon font-semibold' : 'text-ink-soft hover:text-maroon'}`}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {categorySlug && subcategories.length > 0 && (
              <div>
                <p className="eyebrow text-[11px] mb-3">Subcategory</p>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => updateParam('subcategory', '')}
                      aria-pressed={!subcategorySlug}
                      className={`text-sm ${!subcategorySlug ? 'text-maroon font-semibold' : 'text-ink-soft hover:text-maroon'}`}
                    >
                      All in category
                    </button>
                  </li>
                  {subcategories.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => updateParam('subcategory', s.slug)}
                        aria-pressed={subcategorySlug === s.slug}
                        className={`text-sm ${subcategorySlug === s.slug ? 'text-maroon font-semibold' : 'text-ink-soft hover:text-maroon'}`}
                      >
                        {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="eyebrow text-[11px] mb-3">File format</p>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => updateParam('format', '')}
                    aria-pressed={!format}
                    className={`text-sm ${!format ? 'text-maroon font-semibold' : 'text-ink-soft hover:text-maroon'}`}
                  >
                    All formats
                  </button>
                </li>
                {FILE_FORMATS.map((f) => (
                  <li key={f}>
                    <button
                      onClick={() => updateParam('format', f)}
                      aria-pressed={format === f}
                      className={`text-sm ${format === f ? 'text-maroon font-semibold' : 'text-ink-soft hover:text-maroon'}`}
                    >
                      {f}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="eyebrow text-[11px] mb-3">Price range (₹)</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => updateParam('min', e.target.value)}
                  placeholder="Min"
                  aria-label="Minimum price"
                  className="w-full border border-ink/15 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon"
                />
                <span className="text-ink-soft">–</span>
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => updateParam('max', e.target.value)}
                  placeholder="Max"
                  aria-label="Maximum price"
                  className="w-full border border-ink/15 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-maroon underline underline-offset-4"
              >
                Clear all filters
              </button>
            )}
          </div>
        </aside>

        <div>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-sand rounded-sm animate-pulse" />
              ))}
            </div>
          ) : designs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-ink-soft">No designs match those filters.</p>
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-maroon underline underline-offset-4"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-ink-soft mb-6">
                {designs.length} {designs.length === 1 ? 'design' : 'designs'}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {designs.map((d) => (
                  <Card
                    key={d.id}
                    to={`/designs/${d.slug}`}
                    image={d.thumbnail_url}
                    imageAlt={d.name}
                    eyebrow={d.file_format}
                    title={d.name}
                    description={stripHtml(d.description)}
                    footer={<p className="font-semibold text-maroon">₹{d.price}</p>}
                    topRight={
                      <WishlistButton
                        designId={d.id}
                        variant="icon"
                        redirectPath={`${location.pathname}${location.search}`}
                      />
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
