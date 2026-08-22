import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/Modal.jsx'
import Seo from '../../components/Seo.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useAdminFormModal } from '../../hooks/useAdminFormModal.js'
import {
  fetchAllCarouselSlides,
  createCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide,
  uploadProductImage,
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
import { IconPlus, IconImage } from '../../components/admin/icons.jsx'

const emptyForm = {
  title: '',
  subtitle: '',
  image_url: '',
  link_url: '',
  sort_order: 0,
  is_active: true,
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const tableColumns = [
  { key: 'slide', label: 'Slide' },
  { key: 'link', label: 'Link' },
  { key: 'sort', label: 'Sort' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

export default function CarouselSlides() {
  const { showToast } = useToast()
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const {
    modalOpen,
    closeModal,
    openCreate,
    openEdit: openEditModal,
    editingId,
    form,
    setForm,
    fieldErrors,
    setFieldErrors,
  } = useAdminFormModal('carousel', { emptyForm })
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)

  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    fetchAllCarouselSlides().then(({ slides: rows, error: err }) => {
      setSlides(rows)
      setError(err ?? '')
      setLoading(false)
    })
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return slides.filter((s) => {
      if (statusFilter === 'active' && !s.is_active) return false
      if (statusFilter === 'inactive' && s.is_active) return false
      if (!q) return true
      return [s.title, s.subtitle, s.link_url].join(' ').toLowerCase().includes(q)
    })
  }, [slides, query, statusFilter])

  const openEdit = (slide) => {
    openEditModal(slide.id, {
      title: slide.title ?? '',
      subtitle: slide.subtitle ?? '',
      image_url: slide.image_url ?? '',
      link_url: slide.link_url ?? '',
      sort_order: slide.sort_order ?? 0,
      is_active: slide.is_active !== false,
    })
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
    setForm((f) => ({ ...f, image_url: url }))
    if (fieldErrors.image_url) setFieldErrors((e) => ({ ...e, image_url: undefined }))
  }

  const validate = () => {
    const next = {}
    if (!form.image_url.trim()) next.image_url = 'An image is required'
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
      title: form.title.trim() || null,
      subtitle: form.subtitle.trim() || null,
      image_url: form.image_url,
      link_url: form.link_url.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    }
    const { error: err } = editingId
      ? await updateCarouselSlide(editingId, payload)
      : await createCarouselSlide(payload)
    setSaving(false)
    if (err) {
      setError(err)
      showToast(err, { type: 'error' })
      return
    }
    closeModal()
    showToast(editingId ? 'Slide updated.' : 'Slide created.', { type: 'success' })
    load()
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    const { error: err } = await deleteCarouselSlide(pendingDelete.id)
    setDeleting(false)
    if (err) {
      setError(err)
      showToast(err, { type: 'error' })
    } else {
      showToast('Slide deleted.', { type: 'info' })
      load()
    }
    setPendingDelete(null)
  }

  return (
    <div>
      <Seo title="Carousel" noIndex />
      <PageHeader
        title="Homepage carousel"
        description={`${slides.length} slide${slides.length === 1 ? '' : 's'} — active slides appear on the home hero.`}
        action={
          <button onClick={openCreate} className="btn-admin">
            <IconPlus className="w-4 h-4" />
            Add Slide
          </button>
        }
      />

      {error && <Alert>{error}</Alert>}

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search slides…"
        filters={STATUS_FILTERS}
        activeFilter={statusFilter}
        onFilter={setStatusFilter}
      />

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : slides.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconImage className="w-7 h-7" />}
            title="No carousel slides"
            description="Add slides to replace the default homepage hero. Leave empty to keep the static hero."
            action={
              <button onClick={openCreate} className="btn-admin">
                <IconPlus className="w-4 h-4" />
                Add Slide
              </button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconImage className="w-7 h-7" />}
            title="No matches"
            description="Try a different search or status filter."
          />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <AdminTable columns={tableColumns} minWidth={640}>
              {filtered.map((slide) => (
                <tr key={slide.id} className="hover:bg-sand/40 transition-colors duration-150">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-16 h-10 rounded-lg bg-sand overflow-hidden shrink-0 ring-1 ring-ink/8">
                        {slide.image_url ? (
                          <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate">{slide.title || 'Untitled slide'}</p>
                        {slide.subtitle && (
                          <p className="text-xs text-ink-soft truncate">{slide.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-soft truncate max-w-[180px]">
                    {slide.link_url || '—'}
                  </td>
                  <td className="px-5 py-3 text-ink-soft tabular-nums">{slide.sort_order}</td>
                  <td className="px-5 py-3">
                    <Badge variant={slide.is_active ? 'active' : 'draft'}>
                      {slide.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <RowActions
                      onEdit={() => openEdit(slide)}
                      onDelete={() => setPendingDelete(slide)}
                    />
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((slide) => (
              <article key={slide.id} className="admin-card p-4">
                <div className="flex gap-3">
                  <div className="w-20 h-14 rounded-lg bg-sand overflow-hidden shrink-0">
                    {slide.image_url ? (
                      <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink truncate">{slide.title || 'Untitled'}</p>
                    <p className="text-xs text-ink-soft mt-0.5">Sort {slide.sort_order}</p>
                    <Badge variant={slide.is_active ? 'active' : 'draft'} className="mt-2">
                      {slide.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <RowActions
                    onEdit={() => openEdit(slide)}
                    onDelete={() => setPendingDelete(slide)}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit slide' : 'Add slide'}
        description="Active slides rotate on the homepage hero. Leave title empty for image-only slides."
        size="lg"
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn-ghost" disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              form="carousel-form"
              disabled={saving || imageUploading}
              className="btn-admin"
            >
              {saving ? 'Saving…' : 'Save slide'}
            </button>
          </>
        }
      >
        <form id="carousel-form" onSubmit={handleSubmit} className="space-y-5">
          <FormSection title="Media">
            <FileDropzone
              kind="image"
              accept="image/*"
              label="Slide image"
              hint="Full-bleed hero image — JPG, PNG, or WebP"
              uploading={imageUploading}
              previewUrl={form.image_url}
              fileLabel={form.image_url ? 'Image attached' : ''}
              onFile={handleImageUpload}
              disabled={saving}
            />
            {fieldErrors.image_url && (
              <p className="text-xs text-maroon mt-1">{fieldErrors.image_url}</p>
            )}
          </FormSection>

          <FormSection title="Copy & link">
            <Field label="Title" htmlFor="slide-title" hint="Optional">
              <input
                id="slide-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="admin-input"
              />
            </Field>
            <Field label="Subtitle" htmlFor="slide-subtitle" hint="Optional">
              <input
                id="slide-subtitle"
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                className="admin-input"
              />
            </Field>
            <Field label="Link URL" htmlFor="slide-link" hint="Optional — e.g. /designs or /categories/bridal-borders">
              <input
                id="slide-link"
                value={form.link_url}
                onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                className="admin-input"
                placeholder="/designs"
              />
            </Field>
            <Field label="Sort order" htmlFor="slide-sort">
              <input
                id="slide-sort"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                className="admin-input"
              />
            </Field>
            <Toggle
              checked={form.is_active}
              onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              label="Active"
              description="Show this slide on the homepage."
            />
          </FormSection>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => !deleting && setPendingDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete slide"
        description={
          pendingDelete
            ? `Delete “${pendingDelete.title || 'this slide'}”? This can’t be undone.`
            : ''
        }
        confirmLabel="Delete slide"
      />
    </div>
  )
}
