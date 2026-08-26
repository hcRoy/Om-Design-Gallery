import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/Modal.jsx'
import Seo from '../../components/Seo.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useAdminFormModal } from '../../hooks/useAdminFormModal.js'
import {
  fetchAllDesignTypes,
  createDesignType,
  updateDesignType,
  deleteDesignType,
} from '../../lib/admin.js'
import PageHeader from '../../components/admin/PageHeader.jsx'
import SearchBar from '../../components/admin/SearchBar.jsx'
import Badge from '../../components/admin/Badge.jsx'
import EmptyState from '../../components/admin/EmptyState.jsx'
import Alert from '../../components/admin/Alert.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import { Field, Toggle, FormSection } from '../../components/admin/FormControls.jsx'
import { AdminTable, ActionsCell, RowActions } from '../../components/admin/AdminTable.jsx'
import { TableSkeleton } from '../../components/admin/Skeleton.jsx'
import { IconPlus, IconShapes } from '../../components/admin/icons.jsx'

const emptyForm = {
  name: '',
  is_active: true,
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const tableColumns = [
  { key: 'type', label: 'Design type' },
  { key: 'created', label: 'Created at' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function DesignTypes() {
  const { showToast } = useToast()
  const [rows, setRows] = useState([])
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
  } = useAdminFormModal('design-types', { emptyForm })

  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    fetchAllDesignTypes().then(({ designTypes, error: err }) => {
      setRows(designTypes)
      setError(err ?? '')
      setLoading(false)
    })
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (statusFilter === 'active' && !row.is_active) return false
      if (statusFilter === 'inactive' && row.is_active) return false
      if (!q) return true
      return String(row.name || '')
        .toLowerCase()
        .includes(q)
    })
  }, [rows, query, statusFilter])

  const openEdit = (row) => {
    openEditModal(row.id, {
      name: row.name ?? '',
      is_active: row.is_active !== false,
    })
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Design type is required'
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
      name: form.name.trim(),
      is_active: !!form.is_active,
    }
    const { error: err } = editingId
      ? await updateDesignType(editingId, payload)
      : await createDesignType(payload)
    setSaving(false)
    if (err) {
      const message =
        /duplicate|unique/i.test(err)
          ? 'A design type with this name already exists.'
          : err
      setError(message)
      showToast(message, { type: 'error' })
      return
    }
    closeModal()
    showToast(editingId ? 'Design type updated.' : 'Design type created.', {
      type: 'success',
    })
    load()
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    const { error: err } = await deleteDesignType(pendingDelete.id)
    setDeleting(false)
    if (err) {
      setError(err)
      showToast(err, { type: 'error' })
    } else {
      showToast('Design type deleted. Products using it were cleared.', {
        type: 'info',
      })
      load()
    }
    setPendingDelete(null)
  }

  return (
    <div>
      <Seo title="Design Types" noIndex />
      <PageHeader
        title="Design Types"
        description={`${rows.length} type${rows.length === 1 ? '' : 's'} available for products.`}
        action={
          <button type="button" onClick={() => openCreate()} className="btn-admin">
            <IconPlus className="w-4 h-4" />
            Add Design Type
          </button>
        }
      />

      {error && <Alert>{error}</Alert>}

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search design types…"
        filters={STATUS_FILTERS}
        activeFilter={statusFilter}
        onFilter={setStatusFilter}
      />

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : rows.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconShapes className="w-7 h-7" />}
            title="No design types yet"
            description="Add types like Border, Motif or Jaal so products can be classified."
            action={
              <button type="button" onClick={() => openCreate()} className="btn-admin">
                <IconPlus className="w-4 h-4" />
                Add Design Type
              </button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconShapes className="w-7 h-7" />}
            title="No matches"
            description="Try a different search or status filter."
          />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <AdminTable columns={tableColumns} minWidth={560}>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="group hover:bg-sand/40 transition-colors duration-150"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-ink truncate max-w-[16rem]" title={row.name}>
                      {row.name}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft whitespace-nowrap">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <Badge variant={row.is_active ? 'active' : 'draft'}>
                      {row.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <ActionsCell>
                    <RowActions
                      onEdit={() => openEdit(row)}
                      onDelete={() => setPendingDelete(row)}
                    />
                  </ActionsCell>
                </tr>
              ))}
            </AdminTable>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((row) => (
              <article key={row.id} className="admin-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">{row.name}</p>
                    <p className="text-xs text-ink-soft mt-0.5">{formatDate(row.created_at)}</p>
                    <div className="mt-2">
                      <Badge variant={row.is_active ? 'active' : 'draft'}>
                        {row.is_active ? 'Active' : 'Inactive'}
                      </Badge>
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
        title={editingId ? 'Edit Design Type' : 'Add Design Type'}
        description="Design types appear on the product form and the customer design page."
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="btn-ghost"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="design-type-form"
              disabled={saving}
              className="btn-admin"
            >
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create type'}
            </button>
          </>
        }
      >
        <form id="design-type-form" onSubmit={handleSubmit} className="space-y-5">
          <FormSection title="Details">
            <Field
              label="Design type"
              htmlFor="design-type-name"
              error={fieldErrors.name}
              hint="Shown on the storefront design page."
            >
              <input
                id="design-type-name"
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }))
                  if (fieldErrors.name) setFieldErrors((err) => ({ ...err, name: undefined }))
                }}
                className="admin-input"
                placeholder="e.g. Border, Motif, Jaal"
                autoFocus
              />
            </Field>
            <Toggle
              checked={form.is_active}
              onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              label="Active"
              description="Inactive types stay on existing products but are hidden from new selections."
            />
          </FormSection>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => !deleting && setPendingDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete design type"
        description={
          pendingDelete
            ? `Delete “${pendingDelete.name}”? Products using this type will have the field cleared.`
            : ''
        }
        confirmLabel="Delete type"
      />
    </div>
  )
}
