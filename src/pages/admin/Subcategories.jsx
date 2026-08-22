import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/Modal.jsx'
import Seo from '../../components/Seo.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useAdminFormModal } from '../../hooks/useAdminFormModal.js'
import { slugify } from '../../lib/slugify.js'
import {
  fetchAllCategories,
  fetchAllSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  uploadProductImage,
} from '../../lib/admin.js'
import PageHeader from '../../components/admin/PageHeader.jsx'
import SearchBar from '../../components/admin/SearchBar.jsx'
import EmptyState from '../../components/admin/EmptyState.jsx'
import Alert from '../../components/admin/Alert.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import FileDropzone from '../../components/admin/FileDropzone.jsx'
import { Field, FormSection } from '../../components/admin/FormControls.jsx'
import { AdminTable, RowActions } from '../../components/admin/AdminTable.jsx'
import { TableSkeleton } from '../../components/admin/Skeleton.jsx'
import { IconPlus, IconLayers, IconImage } from '../../components/admin/icons.jsx'

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  category_id: '',
  sort_order: 0,
  image_url: '',
}

const tableColumns = [
  { key: 'subcategory', label: 'Subcategory' },
  { key: 'category', label: 'Category' },
  { key: 'slug', label: 'Slug' },
  { key: 'sort', label: 'Sort' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

export default function Subcategories() {
  const { showToast } = useToast()
  const [subcategories, setSubcategories] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const {
    modalOpen,
    closeModal,
    openCreate: openCreateModal,
    openEdit: openEditModal,
    editingId,
    form,
    setForm,
    slugTouched,
    setSlugTouched,
    fieldErrors,
    setFieldErrors,
  } = useAdminFormModal('subcategories', { emptyForm })
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)

  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([fetchAllSubcategories(), fetchAllCategories()]).then(
      ([{ subcategories: rows, error: err }, { categories: cats }]) => {
        setSubcategories(rows)
        setCategories(cats)
        setError(err ?? '')
        setLoading(false)
      },
    )
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return subcategories
    return subcategories.filter((s) =>
      [s.name, s.slug, s.description, s.categories?.name].join(' ').toLowerCase().includes(q),
    )
  }, [subcategories, query])

  const openCreate = () => {
    openCreateModal({ category_id: categories[0]?.id ?? '' })
  }

  const openEdit = (row) => {
    openEditModal(
      row.id,
      {
        name: row.name,
        slug: row.slug,
        description: row.description ?? '',
        category_id: row.category_id ?? '',
        sort_order: row.sort_order ?? 0,
        image_url: row.image_url ?? '',
      },
      { slugTouched: true },
    )
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
    setForm((f) => ({ ...f, image_url: url }))
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.slug.trim()) next.slug = 'Slug is required'
    if (!form.category_id) next.category_id = 'Category is required'
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
      category_id: form.category_id,
      sort_order: Number(form.sort_order) || 0,
      image_url: form.image_url || null,
    }
    const { error: err } = editingId
      ? await updateSubcategory(editingId, payload)
      : await createSubcategory(payload)
    setSaving(false)
    if (err) {
      setError(err)
      showToast(err, { type: 'error' })
      return
    }
    closeModal()
    showToast(editingId ? 'Subcategory updated.' : 'Subcategory created.', { type: 'success' })
    load()
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    const { error: err } = await deleteSubcategory(pendingDelete.id)
    setDeleting(false)
    if (err) {
      setError(err)
      showToast(err, { type: 'error' })
    } else {
      showToast('Subcategory deleted.', { type: 'info' })
      load()
    }
    setPendingDelete(null)
  }

  return (
    <div>
      <Seo title="Subcategories" noIndex />
      <PageHeader
        title="Subcategories"
        description={`${subcategories.length} subcategor${subcategories.length === 1 ? 'y' : 'ies'} nested under categories.`}
        action={
          <button onClick={openCreate} className="btn-admin" disabled={!categories.length}>
            <IconPlus className="w-4 h-4" />
            Add Subcategory
          </button>
        }
      />

      {error && <Alert>{error}</Alert>}

      {!categories.length && !loading && (
        <Alert>Create at least one category before adding subcategories.</Alert>
      )}

      <SearchBar value={query} onChange={setQuery} placeholder="Search subcategories…" />

      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : subcategories.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconLayers className="w-7 h-7" />}
            title="No subcategories yet"
            description="Nest subcategories under a category so shoppers can browse more precisely."
            action={
              categories.length ? (
                <button onClick={openCreate} className="btn-admin">
                  <IconPlus className="w-4 h-4" />
                  Add Subcategory
                </button>
              ) : null
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconLayers className="w-7 h-7" />}
            title="No matches"
            description="Try a different search term."
          />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <AdminTable columns={tableColumns} minWidth={640}>
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-sand/40 transition-colors duration-150">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg bg-sand overflow-hidden shrink-0 ring-1 ring-ink/8">
                        {row.image_url ? (
                          <img src={row.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink-soft/40">
                            <IconImage className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{row.name}</p>
                        {row.description && (
                          <p className="text-xs text-ink-soft mt-0.5 line-clamp-1">{row.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{row.categories?.name ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <code className="text-xs text-ink-soft bg-sand px-2 py-0.5 rounded-md">
                      {row.slug}
                    </code>
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft tabular-nums">{row.sort_order}</td>
                  <td className="px-5 py-3.5">
                    <RowActions
                      onEdit={() => openEdit(row)}
                      onDelete={() => setPendingDelete(row)}
                    />
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((row) => (
              <article key={row.id} className="admin-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-sand overflow-hidden shrink-0 ring-1 ring-ink/8">
                      {row.image_url ? (
                        <img src={row.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-soft/40">
                          <IconImage className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{row.name}</p>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {row.categories?.name ?? '—'} · {row.slug}
                      </p>
                    </div>
                  </div>
                  <RowActions
                    onEdit={() => openEdit(row)}
                    onDelete={() => setPendingDelete(row)}
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
        title={editingId ? 'Edit Subcategory' : 'Add Subcategory'}
        description="Subcategories nest under a parent category. Add a cover image for the storefront card."
        size="lg"
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn-ghost" disabled={saving || imageUploading}>
              Cancel
            </button>
            <button type="submit" form="subcategory-form" disabled={saving || imageUploading} className="btn-admin">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="subcategory-form" onSubmit={handleSubmit} className="space-y-5">
          <FormSection title="Cover image" description="Shown when browsing subcategories under a category. Square works best.">
            <FileDropzone
              kind="image"
              accept="image/*"
              label="Subcategory image"
              hint="JPG, PNG, or WebP — optional"
              uploading={imageUploading}
              previewUrl={form.image_url}
              fileLabel={form.image_url ? 'Image attached' : ''}
              onFile={handleImageUpload}
              disabled={saving}
            />
            {form.image_url && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, image_url: '' }))}
                className="text-xs font-semibold text-maroon hover:underline mt-2"
              >
                Remove image
              </button>
            )}
          </FormSection>

          <FormSection title="Details">
            <Field label="Parent category" htmlFor="sub-category" error={fieldErrors.category_id}>
              <select
                id="sub-category"
                value={form.category_id}
                onChange={(e) => {
                  setForm((f) => ({ ...f, category_id: e.target.value }))
                  if (fieldErrors.category_id) setFieldErrors((err) => ({ ...err, category_id: undefined }))
                }}
                className="admin-select"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Name" htmlFor="sub-name" error={fieldErrors.name}>
              <input id="sub-name" value={form.name} onChange={handleNameChange} className="admin-input" />
            </Field>
            <Field label="Slug" htmlFor="sub-slug" error={fieldErrors.slug}>
              <input
                id="sub-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setForm((f) => ({ ...f, slug: e.target.value }))
                  if (fieldErrors.slug) setFieldErrors((err) => ({ ...err, slug: undefined }))
                }}
                className="admin-input"
              />
            </Field>
            <Field label="Description" htmlFor="sub-desc">
              <textarea
                id="sub-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="admin-input resize-none"
              />
            </Field>
            <Field label="Sort order" htmlFor="sub-sort">
              <input
                id="sub-sort"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                className="admin-input"
              />
            </Field>
          </FormSection>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => !deleting && setPendingDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete subcategory"
        description={
          pendingDelete
            ? `Delete “${pendingDelete.name}”? Products using it will keep their category but lose this subcategory.`
            : ''
        }
        confirmLabel="Delete subcategory"
      />
    </div>
  )
}
