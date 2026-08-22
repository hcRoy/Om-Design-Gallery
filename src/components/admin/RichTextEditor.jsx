import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { useEffect, useRef, useState } from 'react'

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Icon({ children, className = 'w-[18px] h-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      {children}
    </svg>
  )
}

const icons = {
  bold: (
    <Icon>
      <path d="M6 4h8a4 4 0 0 1 0 8H6z" />
      <path d="M6 12h9a4 4 0 0 1 0 8H6z" />
    </Icon>
  ),
  italic: (
    <Icon>
      <path d="M19 4h-9M14 20H5M15 4 9 20" />
    </Icon>
  ),
  underline: (
    <Icon>
      <path d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16" />
    </Icon>
  ),
  strike: (
    <Icon>
      <path d="M16 4H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H8M4 12h16" />
    </Icon>
  ),
  bulletList: (
    <Icon>
      <path d="M9 6h12M9 12h12M9 18h12" />
      <circle cx="4" cy="6" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.25" fill="currentColor" stroke="none" />
    </Icon>
  ),
  orderedList: (
    <Icon>
      <path d="M10 6h11M10 12h11M10 18h11" />
      <path d="M4 6h1v4M4 10h2M5 18H4v-4l-1 1" />
    </Icon>
  ),
  link: (
    <Icon>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Icon>
  ),
  unlink: (
    <Icon>
      <path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" />
      <path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" />
      <path d="m8 8 8 8" />
    </Icon>
  ),
  image: (
    <Icon>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </Icon>
  ),
  alignLeft: (
    <Icon>
      <path d="M3 6h18M3 12h12M3 18h16" />
    </Icon>
  ),
  alignCenter: (
    <Icon>
      <path d="M3 6h18M6 12h12M4 18h16" />
    </Icon>
  ),
  alignRight: (
    <Icon>
      <path d="M3 6h18M9 12h12M7 18h16" />
    </Icon>
  ),
  undo: (
    <Icon>
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </Icon>
  ),
  redo: (
    <Icon>
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </Icon>
  ),
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-ink/10 mx-0.5 shrink-0" aria-hidden="true" />
}

function ToolbarButton({ active, disabled, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150
        ${active ? 'bg-maroon/12 text-maroon' : 'text-ink-soft hover:bg-ink/[0.06] hover:text-ink'}
        disabled:opacity-35 disabled:pointer-events-none`}
    >
      {children}
    </button>
  )
}

function InlinePrompt({ open, title, placeholder, initial = '', onApply, onClose }) {
  const inputRef = useRef(null)
  const [value, setValue] = useState(initial)

  useEffect(() => {
    if (open) {
      setValue(initial)
      const id = window.setTimeout(() => inputRef.current?.focus(), 0)
      return () => window.clearTimeout(id)
    }
    return undefined
  }, [open, initial])

  if (!open) return null

  const submit = (e) => {
    e.preventDefault()
    onApply(value.trim())
  }

  return (
    <div className="px-3 py-2.5 border-b border-ink/10 bg-sand/30 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-ink-soft shrink-0">{title}</span>
      <form onSubmit={submit} className="flex flex-1 min-w-[200px] items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 admin-input !py-1.5 !text-xs !rounded-lg"
        />
        <button type="submit" className="btn-admin !px-3 !py-1.5 !text-xs !rounded-lg">
          Apply
        </button>
        <button type="button" onClick={onClose} className="btn-ghost !px-3 !py-1.5 !text-xs !rounded-lg">
          Cancel
        </button>
      </form>
    </div>
  )
}

function headingValue(editor) {
  if (editor.isActive('heading', { level: 2 })) return 'h2'
  if (editor.isActive('heading', { level: 3 })) return 'h3'
  return 'p'
}

export default function RichTextEditor({ value, onChange, placeholder = 'Write a product description…' }) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ allowBase64: false }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose-editor tiptap-editor',
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.isEmpty ? '' : ed.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const next = value || ''
    if (next !== current && next !== (editor.isEmpty ? '' : current)) {
      editor.commands.setContent(next, false)
    }
  }, [value, editor])

  if (!editor) {
    return (
      <div className="rte-shell">
        <div className="rte-toolbar animate-pulse bg-sand/50 h-11" />
        <div className="rte-body min-h-[180px] bg-sand/20" />
      </div>
    )
  }

  const applyHeading = (level) => {
    if (level === 'p') {
      editor.chain().focus().setParagraph().run()
    } else if (level === 'h2') {
      editor.chain().focus().setHeading({ level: 2 }).run()
    } else {
      editor.chain().focus().setHeading({ level: 3 }).run()
    }
  }

  const applyLink = (url) => {
    setLinkOpen(false)
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const applyImage = (url) => {
    setImageOpen(false)
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }

  const linkHref = editor.getAttributes('link').href || ''

  return (
    <div className="rte-shell">
      <div className="rte-toolbar" role="toolbar" aria-label="Formatting">
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
          <select
            value={headingValue(editor)}
            onChange={(e) => applyHeading(e.target.value)}
            aria-label="Text style"
            className="rte-heading-select"
          >
            <option value="p">Paragraph</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>

          <ToolbarDivider />

          <ToolbarButton
            label="Bold"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            {icons.bold}
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            {icons.italic}
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            {icons.underline}
          </ToolbarButton>
          <ToolbarButton
            label="Strikethrough"
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            {icons.strike}
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            label="Bullet list"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            {icons.bulletList}
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            {icons.orderedList}
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            label={editor.isActive('link') ? 'Edit link' : 'Insert link'}
            active={editor.isActive('link') || linkOpen}
            onClick={() => {
              setImageOpen(false)
              setLinkOpen((v) => !v)
            }}
          >
            {icons.link}
          </ToolbarButton>
          {editor.isActive('link') && (
            <ToolbarButton
              label="Remove link"
              onClick={() => editor.chain().focus().unsetLink().run()}
            >
              {icons.unlink}
            </ToolbarButton>
          )}
          <ToolbarButton
            label="Insert image"
            active={imageOpen}
            onClick={() => {
              setLinkOpen(false)
              setImageOpen((v) => !v)
            }}
          >
            {icons.image}
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            label="Align left"
            active={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            {icons.alignLeft}
          </ToolbarButton>
          <ToolbarButton
            label="Align center"
            active={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            {icons.alignCenter}
          </ToolbarButton>
          <ToolbarButton
            label="Align right"
            active={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            {icons.alignRight}
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            label="Undo"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            {icons.undo}
          </ToolbarButton>
          <ToolbarButton
            label="Redo"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            {icons.redo}
          </ToolbarButton>
        </div>
      </div>

      <InlinePrompt
        open={linkOpen}
        title="Link URL"
        placeholder="https://example.com"
        initial={linkHref}
        onApply={applyLink}
        onClose={() => setLinkOpen(false)}
      />
      <InlinePrompt
        open={imageOpen}
        title="Image URL"
        placeholder="https://…/image.jpg"
        initial=""
        onApply={applyImage}
        onClose={() => setImageOpen(false)}
      />

      <div className="rte-body">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
