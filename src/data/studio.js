/**
 * Single source of studio details so Contact, Footer, and maps links
 * stay in sync.
 *
 * Owner photos: add a file under `public/owners/` then set `photo`,
 * e.g. photo: '/owners/nilesh-sutariya.jpg'
 */
export const STUDIO = {
  name: 'Om Design & Classes',
  phoneDisplay: '+91 88664 01539',
  phoneTel: '+918866401539',
  email: 'omdesigngallery111@gmail.com',
  addressLines: [
    '1st Floor Bhagvati Ras',
    'Ghanshyam Nagar, L.H. Road',
    'Varachha, Surat',
  ],
  mapsQuery: '1st Floor Bhagvati Ras, Ghanshyam Nagar, L.H. Road, Varachha, Surat',
}

STUDIO.mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STUDIO.mapsQuery)}`
STUDIO.mapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(STUDIO.mapsQuery)}&output=embed`

export const OWNERS = [
  { name: 'Nilesh Sutariya', slug: 'nilesh-sutariya', photo: null },
  { name: 'Bhavesh Mangukiya', slug: 'bhavesh-mangukiya', photo: null },
  { name: 'Bhavdip Sutariya', slug: 'bhavdip-sutariya', photo: null },
  { name: 'Ajay Sutariya', slug: 'ajay-sutariya', photo: null },
]

export const LOGO_SRC = '/logo.png'
