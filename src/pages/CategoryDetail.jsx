import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Section from '../components/Section.jsx'
import CategoryCard from '../components/CategoryCard.jsx'
import Seo from '../components/Seo.jsx'
import { fetchCategoryBySlug, fetchSubcategories } from '../lib/catalog.js'

export default function CategoryDetail() {
  const { slug } = useParams()
  const [category, setCategory] = useState(null)
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setNotFound(false)
    Promise.all([fetchCategoryBySlug(slug), fetchSubcategories(slug)]).then(
      ([{ category: cat }, { subcategories: subs }]) => {
        if (!active) return
        if (!cat) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setCategory(cat)
        setSubcategories(subs)
        setLoading(false)
      },
    )
    return () => {
      active = false
    }
  }, [slug])

  if (loading) {
    return (
      <Section tone="ivory" className="!pt-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-square bg-sand rounded-lg animate-pulse" />
          ))}
        </div>
      </Section>
    )
  }

  if (notFound || !category) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl mb-3">Category not found</h1>
        <Link to="/categories" className="btn-primary">
          Browse categories
        </Link>
      </div>
    )
  }

  return (
    <>
      <Seo
        title={category.name}
        description={
          category.description ??
          `Browse ${category.name} embroidery designs and subcategories from Om Design & Classes.`
        }
      />
      <section className="bg-ivory px-6 pt-16 pb-10 md:pt-20 md:pb-12">
        <div className="max-w-6xl mx-auto">
          <nav className="text-xs text-ink-soft mb-6 flex gap-2" aria-label="Breadcrumb">
            <Link to="/categories" className="hover:text-maroon">
              Categories
            </Link>
            <span>/</span>
            <span className="text-ink">{category.name}</span>
          </nav>
          <p className="eyebrow text-gold-dark">Collection</p>
          <h1 className="text-4xl md:text-5xl mt-3">{category.name}</h1>
          {category.description && (
            <p className="mt-4 text-ink-soft max-w-xl leading-relaxed">{category.description}</p>
          )}
          <div className="mt-8 h-px bg-gold/30" />
        </div>
      </section>

      <Section tone="ivory" className="!pt-6">
        {subcategories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-ink-soft mb-6">
              No subcategories yet — browse all designs in this category.
            </p>
            <Link to={`/designs?category=${category.slug}`} className="btn-primary">
              View designs
            </Link>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {subcategories.map((sub) => (
                <CategoryCard
                  key={sub.id}
                  to={`/designs?category=${category.slug}&subcategory=${sub.slug}`}
                  name={sub.name}
                  description={sub.description}
                  image={sub.image_url}
                />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                to={`/designs?category=${category.slug}`}
                className="text-maroon font-semibold text-sm underline underline-offset-4"
              >
                Or view all {category.name} designs
              </Link>
            </div>
          </>
        )}
      </Section>
    </>
  )
}
