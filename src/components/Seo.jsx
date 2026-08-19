import { useEffect } from 'react'

const SITE_NAME = 'Om Design & Classes'

function setMeta(name, content, attr = 'name') {
  if (!content) return
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

/**
 * Sets document.title + meta description/OG tags per page. Deliberately
 * dependency-free (no react-helmet) since these are the only two tags
 * that matter here — a heavier head-management library isn't worth the
 * bundle cost for this. `noIndex` is used on /admin/* and account pages,
 * which shouldn't show up in search results.
 */
export default function Seo({ title, description, noIndex = false }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
    document.title = fullTitle
    if (description) {
      setMeta('description', description)
      setMeta('og:description', description, 'property')
    }
    setMeta('og:title', fullTitle, 'property')
    setMeta('og:site_name', SITE_NAME, 'property')
    setMeta('og:image', `${window.location.origin}/logo.png`, 'property')
    setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow')
  }, [title, description, noIndex])

  return null
}
