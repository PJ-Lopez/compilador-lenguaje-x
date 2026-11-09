import { useRef, useState } from 'react'

// Editor de código con numeración de líneas, cursor y atajos de teclado.
function CodeEditor({ value, onChange, onCompile }) {
  const textareaRef = useRef(null)
  const gutterRef = useRef(null)
  const [cursor, setCursor] = useState({ line: 1, column: 1 })

  const lines = value.split('\n')
  const lineCount = Math.max(lines.length, 1)
  const lineNumbers = Array.from({ length: lineCount }, (_, index) => index + 1)
  const displayLine = Math.min(cursor.line, lineCount)
  const displayColumn = Math.min(
    cursor.column,
    (lines[displayLine - 1]?.length ?? 0) + 1,
  )

  // Mantiene sincronizada la numeración con el scroll del textarea.
  const syncScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  // Calcula la fila y la columna a partir de la posición del cursor.
  const updateCursor = (text) => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }
    const content = text ?? textarea.value
    const position = textarea.selectionStart ?? 0
    const lines = content.slice(0, position).split('\n')
    setCursor({
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    })
  }

  const handleChange = (event) => {
    const nextValue = event.target.value
    onChange(nextValue)
    updateCursor(nextValue)
  }

  // Inserta espacios con Tab y compila con Ctrl/Cmd + Enter.
  const handleKeyDown = (event) => {
    if (event.key === 'Tab') {
      event.preventDefault()
      const textarea = event.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const nextValue = `${textarea.value.slice(0, start)}  ${textarea.value.slice(end)}`
      onChange(nextValue)
      window.requestAnimationFrame(() => {
        textarea.selectionStart = start + 2
        textarea.selectionEnd = start + 2
        updateCursor(nextValue)
      })
      return
    }

    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      onCompile?.()
    }
  }

  return (
    <section
      className="editor-shell"
      aria-label="Editor de código Lenguaje C (Mini-C)"
    >
      <div className="editor-gutter" ref={gutterRef} aria-hidden="true">
        {lineNumbers.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={value}
        onChange={handleChange}
        onScroll={syncScroll}
        onKeyDown={handleKeyDown}
        onKeyUp={() => updateCursor()}
        onClick={() => updateCursor()}
        onSelect={() => updateCursor()}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        aria-label="Código fuente en Lenguaje C (Mini-C)"
        placeholder="Escribe aquí tu programa en Lenguaje C (Mini-C)..."
      />

      <div className="editor-status">
        <span>
          Ln {displayLine}, Col {displayColumn}
        </span>
        <span>{lineCount} líneas</span>
        <span>Lenguaje C (Mini-C) · UMES</span>
      </div>
    </section>
  )
}

export default CodeEditor
