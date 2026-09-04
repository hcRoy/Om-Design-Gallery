import { useEffect, useMemo, useState } from "react";
import Modal from "../../components/Modal.jsx";
import Pagination from "../../components/Pagination.jsx";
import Seo from "../../components/Seo.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useAdminFormModal } from "../../hooks/useAdminFormModal.js";
import { useClientPagination } from "../../hooks/useClientPagination.js";
import {
  fetchAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
} from "../../lib/admin.js";
import PageHeader from "../../components/admin/PageHeader.jsx";
import SearchBar from "../../components/admin/SearchBar.jsx";
import Badge from "../../components/admin/Badge.jsx";
import EmptyState from "../../components/admin/EmptyState.jsx";
import Alert from "../../components/admin/Alert.jsx";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";
import {
  Field,
  Toggle,
  FormSection,
} from "../../components/admin/FormControls.jsx";
import { AdminTable, ActionsCell, RowActions } from "../../components/admin/AdminTable.jsx";
import { TableSkeleton } from "../../components/admin/Skeleton.jsx";
import { IconPlus, IconTag } from "../../components/admin/icons.jsx";

const emptyForm = {
  code: "",
  discount_percentage: "",
  starts_at: "",
  ends_at: "",
  min_order_amount: "",
  usage_limit: "",
  is_active: true,
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "auto", label: "Automatic" },
  { value: "coded", label: "Coded" },
];

const tableColumns = [
  { key: "code", label: "Code" },
  { key: "discount", label: "Discount" },
  { key: "window", label: "Window" },
  { key: "usage", label: "Usage" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", align: "right" },
];

function toLocalInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatWindow(offer) {
  if (!offer.starts_at && !offer.ends_at) return "Always";
  const start = offer.starts_at
    ? new Date(offer.starts_at).toLocaleDateString("en-IN")
    : "—";
  const end = offer.ends_at
    ? new Date(offer.ends_at).toLocaleDateString("en-IN")
    : "—";
  return `${start} → ${end}`;
}

export default function Offers() {
  const { showToast } = useToast();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
  } = useAdminFormModal("offers", { emptyForm });
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    fetchAllOffers().then(({ offers: rows, error: err }) => {
      setOffers(rows);
      setError(err ?? "");
      setLoading(false);
    });
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offers.filter((o) => {
      if (statusFilter === "active" && !o.is_active) return false;
      if (statusFilter === "inactive" && o.is_active) return false;
      if (statusFilter === "auto" && o.code) return false;
      if (statusFilter === "coded" && !o.code) return false;
      if (!q) return true;
      return [o.code, String(o.discount_percentage)]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [offers, query, statusFilter]);

  const { pageItems, page, setPage, pageSize, setPageSize, total } =
    useClientPagination(filtered, {
      resetKey: `${query}|${statusFilter}`,
    });

  const openEdit = (offer) => {
    openEditModal(offer.id, {
      code: offer.code ?? "",
      discount_percentage: offer.discount_percentage ?? "",
      starts_at: toLocalInput(offer.starts_at),
      ends_at: toLocalInput(offer.ends_at),
      min_order_amount: offer.min_order_amount ?? "",
      usage_limit: offer.usage_limit ?? "",
      is_active: offer.is_active !== false,
    });
  };

  const validate = () => {
    const next = {};
    const pct = Number(form.discount_percentage);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      next.discount_percentage = "Enter a percentage between 0 and 100";
    }
    if (form.min_order_amount !== "" && Number(form.min_order_amount) < 0) {
      next.min_order_amount = "Minimum amount cannot be negative";
    }
    if (
      form.usage_limit !== "" &&
      (!Number.isInteger(Number(form.usage_limit)) ||
        Number(form.usage_limit) < 1)
    ) {
      next.usage_limit = "Usage limit must be a positive whole number";
    }
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    setError("");
    const payload = {
      code: form.code.trim() ? form.code.trim().toUpperCase() : null,
      discount_percentage: Number(form.discount_percentage),
      starts_at: fromLocalInput(form.starts_at),
      ends_at: fromLocalInput(form.ends_at),
      min_order_amount:
        form.min_order_amount === "" ? null : Number(form.min_order_amount),
      usage_limit: form.usage_limit === "" ? null : Number(form.usage_limit),
      is_active: form.is_active,
    };

    const { error: err } = editingId
      ? await updateOffer(editingId, payload)
      : await createOffer(payload);

    setSaving(false);
    if (err) {
      setError(err);
      showToast(err, { type: "error" });
      return;
    }
    closeModal();
    showToast(editingId ? "Offer updated." : "Offer created.", {
      type: "success",
    });
    load();
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const { error: err } = await deleteOffer(pendingDelete.id);
    setDeleting(false);
    if (err) {
      setError(err);
      showToast(err, { type: "error" });
    } else {
      showToast("Offer deleted.", { type: "info" });
      load();
    }
    setPendingDelete(null);
  };

  return (
    <div>
      <Seo title="Offers" noIndex />
      <PageHeader
        title="Offers"
        description={`${offers.length} checkout discount${offers.length === 1 ? "" : "s"} — applied to payment total, not catalog prices.`}
        action={
          <button onClick={openCreate} className="btn-admin">
            <IconPlus className="w-4 h-4" />
            Add Offer
          </button>
        }
      />

      {error && <Alert>{error}</Alert>}

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search by code or discount…"
        filters={STATUS_FILTERS}
        activeFilter={statusFilter}
        onFilter={setStatusFilter}
      />

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : offers.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconTag className="w-7 h-7" />}
            title="No offers yet"
            description="Create a coded coupon or an automatic storewide discount for checkout."
            action={
              <button onClick={openCreate} className="btn-admin">
                <IconPlus className="w-4 h-4" />
                Add Offer
              </button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconTag className="w-7 h-7" />}
            title="No matches"
            description="Try a different search or filter."
          />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <AdminTable columns={tableColumns} minWidth={720}>
              {pageItems.map((offer) => (
                <tr
                  key={offer.id}
                  className="group hover:bg-sand/40 transition-colors duration-150"
                >
                  <td className="px-5 py-3.5">
                    {offer.code ? (
                      <code className="text-xs font-semibold bg-sand px-2 py-0.5 rounded-md whitespace-nowrap">
                        {offer.code}
                      </code>
                    ) : (
                      <Badge variant="featured">Automatic</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-semibold tabular-nums text-ink whitespace-nowrap">
                    {Number(offer.discount_percentage)}%
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft text-xs whitespace-nowrap">
                    {formatWindow(offer)}
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft tabular-nums whitespace-nowrap">
                    {offer.times_used}
                    {offer.usage_limit != null
                      ? ` / ${offer.usage_limit}`
                      : " / ∞"}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <Badge variant={offer.is_active ? "active" : "draft"}>
                      {offer.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <ActionsCell>
                    <RowActions
                      onEdit={() => openEdit(offer)}
                      onDelete={() => setPendingDelete(offer)}
                    />
                  </ActionsCell>
                </tr>
              ))}
            </AdminTable>
          </div>

          <div className="md:hidden space-y-3">
            {pageItems.map((offer) => (
              <article key={offer.id} className="admin-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {offer.code ? (
                      <code className="text-xs font-semibold bg-sand px-2 py-0.5 rounded-md">
                        {offer.code}
                      </code>
                    ) : (
                      <Badge variant="featured">Automatic</Badge>
                    )}
                    <p className="mt-2 font-semibold text-ink">
                      {Number(offer.discount_percentage)}% off
                    </p>
                    <p className="text-xs text-ink-soft mt-1">
                      {formatWindow(offer)}
                    </p>
                    <p className="text-xs text-ink-soft mt-1">
                      Used {offer.times_used}
                      {offer.usage_limit != null
                        ? ` / ${offer.usage_limit}`
                        : " / ∞"}
                    </p>
                  </div>
                  <RowActions
                    onEdit={() => openEdit(offer)}
                    onDelete={() => setPendingDelete(offer)}
                  />
                </div>
              </article>
            ))}
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit Offer" : "Add Offer"}
        description="Leave code empty for an automatic checkout discount. Discount applies to the payment total, not the catalog price."
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
              form="offer-form"
              disabled={saving}
              className="btn-admin"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Create offer"}
            </button>
          </>
        }
      >
        <form id="offer-form" onSubmit={handleSubmit} className="space-y-5">
          <FormSection
            title="Discount"
            description="Percentage off the checkout total."
          >
            <Field
              label="Coupon code (optional)"
              hint="Leave blank for automatic offers."
              error={fieldErrors.code}
              htmlFor="offer-code"
            >
              <input
                id="offer-code"
                className="admin-input"
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                placeholder="e.g. FESTIVE10"
              />
            </Field>
            <Field
              label="Discount percentage"
              error={fieldErrors.discount_percentage}
              htmlFor="offer-pct"
            >
              <input
                id="offer-pct"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                className="admin-input"
                value={form.discount_percentage}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    discount_percentage: e.target.value,
                  }))
                }
                required
              />
            </Field>
          </FormSection>

          <FormSection
            title="Rules"
            description="Optional timing, minimum spend, and usage cap."
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Starts at" htmlFor="offer-starts">
                <input
                  id="offer-starts"
                  type="datetime-local"
                  className="admin-input"
                  value={form.starts_at}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, starts_at: e.target.value }))
                  }
                />
              </Field>
              <Field label="Ends at" htmlFor="offer-ends">
                <input
                  id="offer-ends"
                  type="datetime-local"
                  className="admin-input"
                  value={form.ends_at}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ends_at: e.target.value }))
                  }
                />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="Min order amount (₹)"
                error={fieldErrors.min_order_amount}
                htmlFor="offer-min"
              >
                <input
                  id="offer-min"
                  type="number"
                  min="0"
                  step="0.01"
                  className="admin-input"
                  value={form.min_order_amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, min_order_amount: e.target.value }))
                  }
                  placeholder="No minimum"
                />
              </Field>
              <Field
                label="Usage limit"
                error={fieldErrors.usage_limit}
                htmlFor="offer-limit"
              >
                <input
                  id="offer-limit"
                  type="number"
                  min="1"
                  step="1"
                  className="admin-input"
                  value={form.usage_limit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, usage_limit: e.target.value }))
                  }
                  placeholder="Unlimited"
                />
              </Field>
            </div>
            <Toggle
              checked={form.is_active}
              onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              label="Active"
              description="Inactive offers never apply at checkout."
            />
          </FormSection>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => !deleting && setPendingDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete offer?"
        description={
          pendingDelete
            ? `Delete ${pendingDelete.code || "this automatic offer"}? Existing orders keep their recorded totals.`
            : ""
        }
        confirmLabel="Delete offer"
      />
    </div>
  );
}
