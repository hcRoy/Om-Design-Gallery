import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/Modal.jsx'
import Seo from '../../components/Seo.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { slugify } from '../../lib/slugify.js'
import {
  fetchAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../lib/admin.js'
import PageHeader from '../../components/admin/PageHeader.jsx'
import SearchBar from '../../components/admin/SearchBar.jsx'
import EmptyState from '../../components/admin/EmptyState.jsx'
import Alert from '../../components/admin/Alert.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import { Field, FormSection } from '../../components/admin/FormControls.jsx'
import { AdminTable, RowActions } from '../../components/admin/AdminTable.jsx'
import { TableSkeleton } from '../../components/admin/Skeleton.jsx'
import { IconPlus, IconFolder } from '../../components/admin/icons.jsx'

const emptyForm = { name: '', slug: '', description: '', sort_order: 0 }

const tableColumns = [
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'sort', label: 'Sort' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

export default function Categories() {
  const { showToast } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    fetchAllCategories().then(({ categories: c, error: err }) => {
      setCategories(c)
      setError(err ?? '')
      setLoading(false)
    })
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return categories
    return categories.filter((c) =>
      [c.name, c.slug, c.description].join(' ').toLowerCase().includes(q),
    )
  }, [categories, query])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setSlugTouched(false)
    setFieldErrors({})
    setModalOpen(true)
  }

  const openEdit = (cat) => {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      sort_order: cat.sort_order ?? 0,
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

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.slug.trim()) next.slug = 'Slug is required'
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
      sort_order: Number(form.sort_order) || 0,
    }
    const { error: err } = editingId
      ? await updateCategory(editingId, payload)
      : await createCategory(payload)
    setSaving(false)
    if (err) {
      setError(err)
      showToast(err, { type: 'error' })
      return
    }
    setModalOpen(false)
    showToast(editingId ? 'Category updated.' : 'Category created.', { type: 'success' })
    load()
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    const { error: err } = await deleteCategory(pendingDelete.id)
    setDeleting(false)
    if (err) {
      setError(err)
      showToast(err, { type: 'error' })
    } else {
      showToast('Category deleted.', { type: 'info' })
      load()
    }
    setPendingDelete(null)
  }

  return (
    <div>
      <Seo title="Categories" noIndex />
      <PageHeader
        title="Categories"
        description={`${categories.length} categor${categories.length === 1 ? 'y' : 'ies'} organising the catalogue.`}
        action={
          <button onClick={openCreate} className="btn-admin">
            <IconPlus className="w-4 h-4" />
            Add Category
          </button>
        }
      />

      {error && <Alert>{error}</Alert>}

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search categories…"
      />

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : categories.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconFolder className="w-7 h-7" />}
            title="No categories yet"
            description="Create a category so products can be grouped on the storefront."
            action={
              <button onClick={openCreate} className="btn-admin">
                <IconPlus className="w-4 h-4" />
                Add Category
              </button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconFolder className="w-7 h-7" />}
            title="No matches"
            description="Try a different search term."
          />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <AdminTable columns={tableColumns} minWidth={560}>
              {filtered.map((cat) => (
                <tr
                  key={cat.id}
                  className="hover:bg-sand/40 transition-colors duration-150"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-ink">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-ink-soft mt-0.5 line-clamp-1">{cat.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="text-xs text-ink-soft bg-sand px-2 py-0.5 rounded-md">
                      {cat.slug}
                    </code>
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft tabular-nums">{cat.sort_order}</td>
                  <td className="px-5 py-3.5">
                    <RowActions
                      onEdit={() => openEdit(cat)}
                      onDelete={() => setPendingDelete(cat)}
                    />
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((cat) => (
              <article key={cat.id} className="admin-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{cat.name}</p>
                    <p className="text-xs text-ink-soft mt-0.5">{cat.slug} · sort {cat.sort_order}</p>
                  </div>
                  <RowActions
                    onEdit={() => openEdit(cat)}
                    onDelete={() => setPendingDelete(cat)}
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
        title={editingId ? 'Edit Category' : 'Add Category'}
        description="Name and slug are required. Sort order controls catalogue order."
        size="md"
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
              form="category-form"
              disabled={saving}
              className="btn-admin"
            >
              {saving ? 'Saving…' : 'Save Category'}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-6">
          <FormSection title="Details">
            <Field label="Name" htmlFor="cat-name" error={fieldErrors.name}>
              <input
                id="cat-name"
                value={form.name}
                onChange={handleNameChange}
                className="admin-input"
              />
            </Field>
            <Field label="Slug" htmlFor="cat-slug" error={fieldErrors.slug}>
              <input
                id="cat-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setForm((f) => ({ ...f, slug: e.target.value }))
                  if (fieldErrors.slug) setFieldErrors((err) => ({ ...err, slug: undefined }))
                }}
                className="admin-input"
              />
            </Field>
            <Field label="Description" htmlFor="cat-desc">
              <textarea
                id="cat-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="admin-input resize-none"
              />
            </Field>
            <Field label="Sort order" htmlFor="cat-sort" hint="Lower numbers appear first.">
              <input
                id="cat-sort"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                className="admin-input max-w-[8rem]"
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
        title="Delete category"
        description={
          pendingDelete
            ? `Delete “${pendingDelete.name}”? This can’t be undone.`
            : ''
        }
        confirmLabel="Delete category"
      />
    </div>
  )
}
