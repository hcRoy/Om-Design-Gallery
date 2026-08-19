import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/Modal.jsx'
import Seo from '../../components/Seo.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { slugify } from '../../lib/slugify.js'
import { fetchCategories, FILE_FORMATS } from '../../lib/catalog.js'
import {
  fetchAllDesigns,
  createDesign,
  updateDesign,
  deleteDesign,
  uploadProductImage,
  uploadDesignFile,
} from '../../lib/admin.js'
import PageHeader from '../../components/admin/PageHeader.jsx'
import SearchBar from '../../components/admin/SearchBar.jsx'
import Badge from '../../components/admin/Badge.jsx'
import EmptyState from '../../components/admin/EmptyState.jsx'
import Alert from '../../components/admin/Alert.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import FileDropzone from '../../components/admin/FileDropzone.jsx'
import { Field, Toggle, FormSection } from '../../components/admin/FormControls.jsx'
import { AdminTable, RowActions } from '../../components/admin/AdminTable.jsx'
import { TableSkeleton } from '../../components/admin/Skeleton.jsx'
import { IconPlus, IconPackage, IconImage } from '../../components/admin/icons.jsx'

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  category_id: '',
  file_format: FILE_FORMATS[0],
  stitch_count: '',
  size_mm: '',
  tags: '',
  is_featured: false,
  is_active: true,
  thumbnail_url: '',
  design_file_url: '',
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
]

const tableColumns = [
  { key: 'product', label: 'Product' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price' },
  { key: 'format', label: 'Format' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

export default function Products() {
  const { showToast } = useToast()
  const [designs, setDesigns] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [slugTouched, setSlugTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [fileUploading, setFileUploading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    fetchAllDesigns().then(({ designs: d, error: err }) => {
      setDesigns(d)
      setError(err ?? '')
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
    fetchCategories().then(({ categories: c }) => setCategories(c))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return designs.filter((d) => {
      if (statusFilter === 'active' && !d.is_active) return false
      if (statusFilter === 'draft' && d.is_active) return false
      if (!q) return true
      const hay = [d.name, d.slug, d.categories?.name, d.file_format, ...(d.tags ?? [])]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [designs, query, statusFilter])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setSlugTouched(false)
    setFieldErrors({})
    setModalOpen(true)
  }

  const openEdit = (d) => {
    setEditingId(d.id)
    setForm({
      name: d.name,
      slug: d.slug,
      description: d.description ?? '',
      price: d.price ?? '',
      category_id: d.category_id ?? '',
      file_format: d.file_format ?? FILE_FORMATS[0],
      stitch_count: d.stitch_count ?? '',
      size_mm: d.size_mm ?? '',
      tags: (d.tags ?? []).join(', '),
      is_featured: !!d.is_featured,
      is_active: d.is_active !== false,
      thumbnail_url: d.thumbnail_url ?? '',
      design_file_url: d.design_file_url ?? '',
    })
    setSlugTouched(true)
    setFieldErrors({})
    setModalOpen(true)
  }

  const handleNameChange = (e) => {
    const name = e.target.value
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }))
    if (fieldErrors.name) setFieldErrors((err) => ({ ...err, name: undefined }))
  }

  const handleImageUpload = async (file) => {
    if (!file) return
    setImageUploading(true)
    const { url, error: err } = await uploadProductImage(file)
    setImageUploading(false)
    if (err) {
      setError(err)
      showToast(err, { type: 'error' })
      return
    }
    setForm((f) => ({ ...f, thumbnail_url: url }))
  }

  const handleDesignFileUpload = async (file) => {
    if (!file) return
    setFileUploading(true)
    const { path, error: err } = await uploadDesignFile(file)
    setFileUploading(false)
    if (err) {
      setError(err)
      showToast(err, { type: 'error' })
      return
    }
    setForm((f) => ({ ...f, design_file_url: path }))
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.slug.trim()) next.slug = 'Slug is required'
    if (form.price === '' || Number.isNaN(Number(form.price))) next.price = 'Enter a valid price'
    return next
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = validate()
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    setError('')
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description,
      price: Number(form.price) || 0,
      category_id: form.category_id || null,
      file_format: form.file_format,
      stitch_count: form.stitch_count ? Number(form.stitch_count) : null,
      size_mm: form.size_mm,
      tags: form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      is_featured: form.is_featured,
      is_active: form.is_active,
      thumbnail_url: form.thumbnail_url || null,
      design_file_url: form.design_file_url || null,
    }
    const { error: err } = editingId
      ? await updateDesign(editingId, payload)
      : await createDesign(payload)
    setSaving(false)
    if (err) {
      setError(err)
      showToast(err, { type: 'error' })
      return
    }
    setModalOpen(false)
    showToast(editingId ? 'Product updated.' : 'Product created.', { type: 'success' })
    load()
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    const { error: err } = await deleteDesign(pendingDelete.id)
    setDeleting(false)
    if (err) {
      setError(err)
      showToast(err, { type: 'error' })
    } else {
      showToast('Product deleted.', { type: 'info' })
      load()
    }
    setPendingDelete(null)
  }

  const designFileName = form.design_file_url
    ? String(form.design_file_url).split('/').pop()
    : ''

  return (
    <div>
      <Seo title="Products" noIndex />
      <PageHeader
        title="Products"
        description={`${designs.length} design${designs.length === 1 ? '' : 's'} in the catalogue.`}
        action={
          <button onClick={openCreate} className="btn-admin">
            <IconPlus className="w-4 h-4" />
            Add Product
          </button>
        }
      />

      {error && <Alert>{error}</Alert>}

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search by name, slug, category, or tag…"
        filters={STATUS_FILTERS}
        activeFilter={statusFilter}
        onFilter={setStatusFilter}
      />

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : designs.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconPackage className="w-7 h-7" />}
            title="No products yet"
            description="Add your first embroidery design to start building the catalogue."
            action={
              <button onClick={openCreate} className="btn-admin">
                <IconPlus className="w-4 h-4" />
                Add Product
              </button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconPackage className="w-7 h-7" />}
            title="No matches"
            description="Try a different search or clear the status filter."
          />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <AdminTable columns={tableColumns}>
              {filtered.map((d) => (
                <tr
                  key={d.id}
                  className="hover:bg-sand/40 transition-colors duration-150"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg bg-sand overflow-hidden shrink-0 ring-1 ring-ink/8">
                        {d.thumbnail_url ? (
                          <img
                            src={d.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink-soft/40">
                            <IconImage className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate">{d.name}</p>
                        <p className="text-xs text-ink-soft truncate">{d.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{d.categories?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-ink tabular-nums">₹{d.price}</td>
                  <td className="px-5 py-3">
                    <Badge variant="format">{d.file_format}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={d.is_active ? 'active' : 'draft'}>
                        {d.is_active ? 'Active' : 'Draft'}
                      </Badge>
                      {d.is_featured && <Badge variant="featured">Featured</Badge>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <RowActions
                      onEdit={() => openEdit(d)}
                      onDelete={() => setPendingDelete(d)}
                    />
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((d) => (
              <article key={d.id} className="admin-card p-4">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-lg bg-sand overflow-hidden shrink-0 ring-1 ring-ink/8">
                    {d.thumbnail_url ? (
                      <img src={d.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-soft/40">
                        <IconImage className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink truncate">{d.name}</p>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {d.categories?.name ?? 'Uncategorised'} · ₹{d.price}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant={d.is_active ? 'active' : 'draft'}>
                        {d.is_active ? 'Active' : 'Draft'}
                      </Badge>
                      <Badge variant="format">{d.file_format}</Badge>
                    </div>
                  </div>
                  <RowActions
                    onEdit={() => openEdit(d)}
                    onDelete={() => setPendingDelete(d)}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Product' : 'Add Product'}
        description={
          editingId
            ? 'Update catalogue details, media, and visibility.'
            : 'Add a design to the catalogue. Fields marked required must be filled in.'
        }
        size="xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-ghost"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={saving || imageUploading || fileUploading}
              className="btn-admin"
            >
              {saving ? 'Saving…' : 'Save Product'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="space-y-7">
          <FormSection title="Basic information">
            <Field label="Name" htmlFor="product-name" error={fieldErrors.name}>
              <input
                id="product-name"
                value={form.name}
                onChange={handleNameChange}
                className="admin-input"
              />
            </Field>
            <Field label="Slug" htmlFor="product-slug" error={fieldErrors.slug} hint="Used in the public URL.">
              <input
                id="product-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setForm((f) => ({ ...f, slug: e.target.value }))
                  if (fieldErrors.slug) setFieldErrors((err) => ({ ...err, slug: undefined }))
                }}
                className="admin-input"
              />
            </Field>
            <Field label="Description" htmlFor="product-desc">
              <textarea
                id="product-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="admin-input resize-none"
              />
            </Field>
          </FormSection>

          <FormSection title="Pricing & specs">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Price (₹)" htmlFor="product-price" error={fieldErrors.price}>
                <input
                  id="product-price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, price: e.target.value }))
                    if (fieldErrors.price) setFieldErrors((err) => ({ ...err, price: undefined }))
                  }}
                  className="admin-input"
                />
              </Field>
              <Field label="Category" htmlFor="product-category">
                <select
                  id="product-category"
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                  className="admin-select"
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Format" htmlFor="product-format">
                <select
                  id="product-format"
                  value={form.file_format}
                  onChange={(e) => setForm((f) => ({ ...f, file_format: e.target.value }))}
                  className="admin-select"
                >
                  {FILE_FORMATS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </Field>
              <Field label="Stitch count" htmlFor="product-stitches">
                <input
                  id="product-stitches"
                  type="number"
                  min="0"
                  value={form.stitch_count}
                  onChange={(e) => setForm((f) => ({ ...f, stitch_count: e.target.value }))}
                  className="admin-input"
                />
              </Field>
              <Field label="Size (mm)" htmlFor="product-size">
                <input
                  id="product-size"
                  placeholder="320 x 90"
                  value={form.size_mm}
                  onChange={(e) => setForm((f) => ({ ...f, size_mm: e.target.value }))}
                  className="admin-input"
                />
              </Field>
            </div>
            <Field label="Tags" htmlFor="product-tags" hint="Comma separated, e.g. floral, border, festive">
              <input
                id="product-tags"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                className="admin-input"
              />
            </Field>
          </FormSection>

          <FormSection title="Media" description="Images are public; design files stay in the private bucket.">
            <FileDropzone
              kind="image"
              accept="image/*"
              label="Product image"
              hint="JPG, PNG, or WebP"
              uploading={imageUploading}
              previewUrl={form.thumbnail_url}
              fileLabel={form.thumbnail_url ? 'Image attached' : ''}
              onFile={handleImageUpload}
              disabled={saving}
            />
            <FileDropzone
              kind="file"
              label="Design file"
              hint="DST / PES / EXP / JEF — stored privately"
              uploading={fileUploading}
              fileLabel={designFileName}
              onFile={handleDesignFileUpload}
              disabled={saving}
            />
          </FormSection>

          <FormSection title="Visibility">
            <div className="grid sm:grid-cols-2 gap-5">
              <Toggle
                checked={form.is_featured}
                onChange={(v) => setForm((f) => ({ ...f, is_featured: v }))}
                label="Featured"
                description="Highlight this design on the storefront."
              />
              <Toggle
                checked={form.is_active}
                onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                label="Active"
                description="Visible in the public catalogue."
              />
            </div>
          </FormSection>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => !deleting && setPendingDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete product"
        description={
          pendingDelete
            ? `Delete “${pendingDelete.name}”? This can’t be undone.`
            : ''
        }
        confirmLabel="Delete product"
      />
    </div>
  )
}
