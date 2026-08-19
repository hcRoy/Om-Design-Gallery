import Tooltip from './Tooltip.jsx'
import { IconPencil, IconTrash } from './icons.jsx'

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
                  className={`px-5 py-3 text-[11px] font-semibold tracking-wider uppercase text-ink-soft ${
                    col.align === 'right' ? 'text-right' : ''
                  } ${col.className ?? ''}`}
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
