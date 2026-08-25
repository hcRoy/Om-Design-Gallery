import Tooltip from './Tooltip.jsx'
import { IconPencil, IconTrash } from './icons.jsx'

const STICKY_ACTIONS =
  'sticky right-0 z-10 bg-white group-hover:bg-sand/40 transition-colors duration-150 shadow-[-12px_0_16px_-14px_rgba(26,20,18,0.18)]'
const STICKY_ACTIONS_HEAD =
  'sticky right-0 z-20 bg-sand/50 shadow-[-12px_0_16px_-14px_rgba(26,20,18,0.12)]'

function isActionsColumn(col) {
  return col.sticky === 'right' || col.key === 'actions'
}

/**
 * Admin data table with natural column sizing.
 * Mark a column with key "actions" (or sticky: "right") to pin it while
 * the rest of the table scrolls horizontally — no table-fixed distortion.
 */
export function AdminTable({ columns, children, minWidth = 720 }) {
  return (
    <div className="admin-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead>
            <tr className="text-left bg-sand/50 border-b border-ink/8">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-5 py-3 text-[11px] font-semibold tracking-wider uppercase text-ink-soft whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : ''
                  } ${isActionsColumn(col) ? STICKY_ACTIONS_HEAD : ''} ${col.className ?? ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">{children}</tbody>
        </table>
      </div>
    </div>
  )
}

/** Pin edit/delete (or Access) to the right edge while other columns scroll. */
export function ActionsCell({ children, className = '' }) {
  return <td className={`px-5 py-3.5 ${STICKY_ACTIONS} ${className}`}>{children}</td>
}

export function RowActions({ onEdit, onDelete, editLabel = 'Edit', deleteLabel = 'Delete' }) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onEdit && (
        <Tooltip label={editLabel}>
          <button
            type="button"
            onClick={onEdit}
            aria-label={editLabel}
            className="w-8 h-8 rounded-lg text-ink-soft hover:text-maroon hover:bg-maroon/8
                       inline-flex items-center justify-center transition-colors duration-150"
          >
            <IconPencil className="w-4 h-4" />
          </button>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip label={deleteLabel}>
          <button
            type="button"
            onClick={onDelete}
            aria-label={deleteLabel}
            className="w-8 h-8 rounded-lg text-ink-soft hover:text-maroon hover:bg-maroon/8
                       inline-flex items-center justify-center transition-colors duration-150"
          >
            <IconTrash className="w-4 h-4" />
          </button>
        </Tooltip>
      )}
    </div>
  )
}
