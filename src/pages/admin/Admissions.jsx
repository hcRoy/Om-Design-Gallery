import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../../components/Seo.jsx";
import Pagination from "../../components/Pagination.jsx";
import PageHeader from "../../components/admin/PageHeader.jsx";
import SearchBar from "../../components/admin/SearchBar.jsx";
import Badge from "../../components/admin/Badge.jsx";
import EmptyState from "../../components/admin/EmptyState.jsx";
import Alert from "../../components/admin/Alert.jsx";
import { AdminTable } from "../../components/admin/AdminTable.jsx";
import { TableSkeleton } from "../../components/admin/Skeleton.jsx";
import { IconFile } from "../../components/admin/icons.jsx";
import {
  fetchAllAdmissions,
  fetchAdmissionStatusCounts,
} from "../../lib/admin.js";
import { DEFAULT_PAGE_SIZE } from "../../lib/pagination.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";

function formatSubmitted(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusVariant(status) {
  if (status === "pending") return "pending";
  if (status === "reviewed") return "reviewed";
  if (status === "enrolled") return "enrolled";
  if (status === "rejected") return "rejected";
  return "draft";
}

const tableColumns = [
  { key: "form_number", label: "Form #" },
  { key: "student", label: "Student" },
  { key: "mobile", label: "Mobile" },
  { key: "submitted", label: "Submitted" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", align: "right" },
];

export default function Admissions() {
  const [admissions, setAdmissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    reviewed: 0,
    enrolled: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const debouncedQuery = useDebouncedValue(query);
  const hasFilters = Boolean(debouncedQuery.trim()) || statusFilter !== "all";

  useEffect(() => {
    fetchAdmissionStatusCounts().then(({ counts, error: err }) => {
      if (!err && counts) setStatusCounts(counts);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAllAdmissions({
      page,
      pageSize,
      query: debouncedQuery,
      status: statusFilter,
    }).then(({ admissions: rows, total: t, error: err }) => {
      setAdmissions(rows);
      setTotal(t);
      setError(err ?? "");
      setLoading(false);
    });
  }, [page, pageSize, debouncedQuery, statusFilter]);

  const statusFilters = useMemo(
    () => [
      { value: "all", label: `All (${statusCounts.all})` },
      { value: "pending", label: `Pending (${statusCounts.pending})` },
      { value: "reviewed", label: `Reviewed (${statusCounts.reviewed})` },
      { value: "enrolled", label: `Enrolled (${statusCounts.enrolled})` },
      { value: "rejected", label: `Rejected (${statusCounts.rejected})` },
    ],
    [statusCounts],
  );

  const description =
    statusCounts.all === 0
      ? "Create a new admission when a student enrolls in class."
      : `${total} admission${total === 1 ? "" : "s"} shown${hasFilters ? " (filtered)" : ""}.`;

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setPage(1);
  };

  return (
    <div>
      <Seo title="Admissions" noIndex />
      <PageHeader
        title="Admissions"
        description={description}
        action={
          <Link
            to="/admin/admissions/new"
            className="btn-primary !text-xs !py-2.5"
          >
            New Admission
          </Link>
        }
      />

      {error && <Alert>{error}</Alert>}

      <SearchBar
        value={query}
        onChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        placeholder="Search by form #, name, mobile, or address…"
        filters={statusFilters}
        activeFilter={statusFilter}
        onFilter={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
      />

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : total === 0 && !hasFilters ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconFile className="w-7 h-7" />}
            title="No admissions yet"
            description="Use New admission to register a student and generate their form PDF."
            action={
              <Link
                to="/admin/admissions/new"
                className="btn-primary !text-xs !py-2"
              >
                New admission
              </Link>
            }
          />
        </div>
      ) : total === 0 ? (
        <div className="admin-card">
          <EmptyState
            icon={<IconFile className="w-7 h-7" />}
            title="No matching applications"
            description="Try a different search term or clear the status filter."
            action={
              <button
                type="button"
                className="btn-secondary !text-xs !py-2"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            }
          />
        </div>
      ) : (
        <>
          <AdminTable columns={tableColumns}>
            {admissions.map((row) => (
              <tr
                key={row.id}
                className="border-b border-ink/5 hover:bg-sand/40 transition-colors"
              >
                <td className="px-4 py-3.5 text-sm font-bold tabular-nums text-maroon">
                  {row.form_number ?? "—"}
                </td>
                <td className="px-4 py-3.5">
                  <Link
                    to={`/admin/admissions/${row.id}`}
                    className="text-sm font-semibold text-ink hover:text-maroon transition-colors"
                  >
                    {row.student_name}
                  </Link>
                  {row.preferred_language && (
                    <span className="block text-[11px] text-ink-soft mt-0.5 uppercase tracking-wide">
                      {row.preferred_language === "en" ? "English" : "ગુજરાતી"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-sm tabular-nums">
                  {row.student_mobile}
                </td>
                <td className="px-4 py-3.5 text-sm text-ink-soft">
                  {formatSubmitted(row.submitted_at)}
                </td>
                <td className="px-4 py-3.5">
                  <Badge variant={statusVariant(row.status)}>
                    {row.status}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Link
                    to={`/admin/admissions/${row.id}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-maroon hover:underline"
                  >
                    Open
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeWidth="2"
                        strokeLinecap="round"
                        d="M9 18l6-6-6-6"
                      />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </AdminTable>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}
    </div>
  );
}
