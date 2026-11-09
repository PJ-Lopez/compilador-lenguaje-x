import { useRef, useState } from 'react'
import CodeEditor from './components/CodeEditor'
import ResultsModal from './components/ResultsModal'
import Toolbar from './components/Toolbar'
import { tokenize } from './compiler/lexer'
import { parse } from './compiler/parser'
import { SAMPLE_CODE } from './compiler/sampleCode'
import './App.css'

const DEFAULT_FILE_NAME = 'programa.c'
const SOURCE_EXTENSION_RE = /\.(c|x)$/i

// Conserva .c/.x y usa .c por defecto para archivos de texto.
function toSourceFileName(name) {
  const trimmed = (name || DEFAULT_FILE_NAME).trim()
  if (!trimmed) {
    return DEFAULT_FILE_NAME
  }
  if (SOURCE_EXTENSION_RE.test(trimmed)) {
    return trimmed
  }
  const base = trimmed.replace(/\.txt$/i, '')
  return `${base || 'programa'}.c`
}

function App() {
  // Estado del documento, archivo actual y resultado de la compilación.
  const [code, setCode] = useState(SAMPLE_CODE)
  const [fileName, setFileName] = useState(DEFAULT_FILE_NAME)
  const [result, setResult] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const fileInputRef = useRef(null)

  // Limpia el editor y reinicia el resultado actual.
  const handleNew = () => {
    if (
      code.trim() &&
      !window.confirm(
        '¿Deseas crear un documento nuevo? Se perderán los cambios no guardados.',
      )
    ) {
      return
    }

    setCode('')
    setFileName(DEFAULT_FILE_NAME)
    setResult(null)
    setIsModalOpen(false)
  }

  // Abre el selector de archivos .c / .x / .txt.
  const handleOpen = () => {
    fileInputRef.current?.click()
  }

  // Carga el contenido del archivo seleccionado con FileReader.
  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      setCode(String(loadEvent.target?.result ?? ''))
      setFileName(file.name || DEFAULT_FILE_NAME)
      setResult(null)
      setIsModalOpen(false)
    }
    reader.readAsText(file, 'UTF-8')
    event.target.value = ''
  }

  // Descarga el código como .c por defecto, conservando .c/.x.
  const handleSave = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const downloadName = toSourceFileName(fileName)

    const link = document.createElement('a')
    link.href = url
    link.download = downloadName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  // Ejecuta lexer y parser, y abre el modal con los resultados.
  const handleCompile = () => {
    if (!code.trim()) {
      setResult({
        tokens: [],
        symbols: [],
        ast: null,
        errors: [
          {
            tipo: 'General',
            fila: 1,
            columna: 1,
            sentencia: '',
            descripcion:
              'El editor está vacío. Escribe o abre un archivo .c / .x antes de compilar.',
          },
        ],
      })
      setIsModalOpen(true)
      return
    }

    const lexerResult = tokenize(code)
    const parserResult = parse(
      lexerResult.tokens,
      lexerResult.symbols,
      code,
    )

    setResult({
      tokens: lexerResult.tokens,
      symbols: parserResult.symbols,
      ast: parserResult.ast,
      errors: [...lexerResult.errors, ...parserResult.errors],
    })
    setIsModalOpen(true)
  }

  return (
    <div className="app-shell">
      <Toolbar
        fileName={fileName}
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onCompile={handleCompile}
      />

      <main className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="workspace-eyebrow">
              Editor de código · Lenguaje C (Mini-C)
            </p>
            <h2>
              {fileName || DEFAULT_FILE_NAME}
              <span className="extension-badge">.c / .x</span>
            </h2>
          </div>
          <div className="workspace-meta">
            <span className="meta-pill">Descenso recursivo</span>
            <span className="meta-pill">Modo pánico</span>
          </div>
        </div>

        <CodeEditor
          value={code}
          onChange={setCode}
          onCompile={handleCompile}
        />

        <p className="editor-hint">
          Mini-C soporta declaraciones <code>int</code> / <code>float</code>,
          asignaciones, <code>if/else</code>, <code>while</code>,{' '}
          <code>print</code>, operadores aritméticos y relacionales. Abre o
          guarda archivos <code>.c</code> / <code>.x</code> y presiona{' '}
          <strong>COMPILAR</strong> para analizar el código.
        </p>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept=".c,.x,.txt"
        className="hidden-input"
        onChange={handleFileChange}
      />

      <ResultsModal
        open={isModalOpen}
        result={result}
        fileName={fileName}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default App
