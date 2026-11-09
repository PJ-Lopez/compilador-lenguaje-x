import { useRef, useState } from 'react'
import CodeEditor from './components/CodeEditor'
import ResultsModal from './components/ResultsModal'
import Toolbar from './components/Toolbar'
import { tokenize } from './compiler/lexer'
import { parse } from './compiler/parser'
import { SAMPLE_CODE } from './compiler/sampleCode'
import './App.css'

function App() {
  const [code, setCode] = useState(SAMPLE_CODE)
  const [fileName, setFileName] = useState('programa.x')
  const [result, setResult] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const fileInputRef = useRef(null)

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
    setFileName('programa.x')
    setResult(null)
    setIsModalOpen(false)
  }

  const handleOpen = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      setCode(String(loadEvent.target?.result ?? ''))
      setFileName(file.name || 'programa.x')
      setResult(null)
      setIsModalOpen(false)
    }
    reader.readAsText(file, 'UTF-8')
    event.target.value = ''
  }

  const handleSave = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const normalizedName = fileName || 'programa.x'
    const downloadName = normalizedName.toLowerCase().endsWith('.x')
      ? normalizedName
      : `${normalizedName}.x`

    const link = document.createElement('a')
    link.href = url
    link.download = downloadName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

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
              'El editor está vacío. Escribe o abre un archivo .x antes de compilar.',
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
            <p className="workspace-eyebrow">Editor de código</p>
            <h2>
              {fileName || 'programa.x'}
              <span className="extension-badge">.x</span>
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
          Soporta declaraciones <code>int</code> / <code>float</code>,
          asignaciones, <code>if/else</code>, <code>while</code>,{' '}
          <code>print</code>, operadores aritméticos y relacionales. Presiona{' '}
          <strong>COMPILAR</strong> para analizar el código.
        </p>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept=".x,text/plain"
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
