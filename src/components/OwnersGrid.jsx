import { OWNERS } from '../data/studio.js'

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function OwnerPhoto({ owner }) {
  if (owner.photo) {
    return (
      <img
        src={owner.photo}
        alt=""
        className="w-full aspect-square object-cover bg-sand"
      />
    )
  }

  return (
    <div
      className="w-full aspect-square bg-sand flex items-center justify-center"
      aria-hidden="true"
    >
      <span className="font-display text-3xl text-maroon/70">{initials(owner.name)}</span>
    </div>
  )
}

export default function OwnersGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {OWNERS.map((owner) => (
        <article
          key={owner.slug}
          className="bg-white rounded-lg overflow-hidden shadow-card border border-ink/5 text-center"
        >
          <div className="overflow-hidden">
            <OwnerPhoto owner={owner} />
          </div>
          <div className="px-3 py-4">
            <h3 className="font-display text-lg leading-snug text-ink">{owner.name}</h3>
          </div>
        </article>
      ))}
    </div>
  )
}
