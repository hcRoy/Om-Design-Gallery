import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_PREFIX = 'admin-modal:'

function readDraft(key) {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeDraft(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify(data))
  } catch {
    /* quota / private mode — ignore */
  }
}

function clearDraft(key) {
  sessionStorage.removeItem(key)
}

/**
 * Keeps admin create/edit modal state across tab switches and brief
 * remounts by persisting an open draft to sessionStorage.
 *
 * @param {string} scope — unique key per admin page, e.g. 'products'
 * @param {{ emptyForm: object }} options
 */
export function useAdminFormModal(scope, { emptyForm }) {
  const storageKey = `${STORAGE_PREFIX}${scope}`
  const hydratedRef = useRef(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [slugTouched, setSlugTouched] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  // Restore draft once on mount (survives component remount).
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    const draft = readDraft(storageKey)
    if (!draft?.modalOpen) return
    setModalOpen(true)
    setEditingId(draft.editingId ?? null)
    setForm(draft.form ?? emptyForm)
    setSlugTouched(!!draft.slugTouched)
  }, [storageKey, emptyForm])

  // Persist while modal is open.
  useEffect(() => {
    if (!modalOpen) return
    writeDraft(storageKey, { modalOpen: true, editingId, form, slugTouched })
  }, [modalOpen, editingId, form, slugTouched, storageKey])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    clearDraft(storageKey)
  }, [storageKey])

  const openCreate = useCallback(
    (formPatch = {}) => {
      setEditingId(null)
      setForm({ ...emptyForm, ...formPatch })
      setSlugTouched(false)
      setFieldErrors({})
      setModalOpen(true)
    },
    [emptyForm],
  )

  const openEdit = useCallback(
    (id, formValues, { slugTouched: touched = true } = {}) => {
      setEditingId(id)
      setForm(formValues)
      setSlugTouched(touched)
      setFieldErrors({})
      setModalOpen(true)
    },
    [],
  )

  const clearModalDraft = useCallback(() => {
    clearDraft(storageKey)
  }, [storageKey])

  return {
    modalOpen,
    setModalOpen,
    closeModal,
    openCreate,
    openEdit,
    clearModalDraft,
    editingId,
    setEditingId,
    form,
    setForm,
    slugTouched,
    setSlugTouched,
    fieldErrors,
    setFieldErrors,
  }
}
