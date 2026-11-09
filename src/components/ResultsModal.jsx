import { useEffect, useState } from 'react'
import ErrorTable from './ErrorTable'
import SymbolTable from './SymbolTable'
import SyntaxTreeVisualizer from './SyntaxTreeVisualizer'
import TokenFlow from './TokenFlow'

// Pestañas disponibles en el modal de resultados.
const TABS = [
  { id: 'lexico', label: 'Léxico', ariaLabel: 'Análisis léxico y tabla de símbolos' },
  { id: 'arbol', label: 'Árbol Sintáctico', ariaLabel: 'Árbol sintáctico' },
  { id: 'errores', label: 'Errores', ariaLabel: 'Tabla de errores' },
]

// Modal que resume la compilación y muestra tokens, AST y errores.
function ResultsModal({ open, result, fileName, onClose }) {
  const [activeTab, setActiveTab] = useState('lexico')

  // Cierra con Escape y bloquea el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open || !result) {
    return null
  }

  // Totales y desglose de errores para el banner y las pestañas.
  const errors = result.errors ?? []
  const tokens = result.tokens ?? []
  const symbols = result.symbols ?? []
  const visibleTokens = tokens.filter((token) => token.type !== 'EOF')
  const lexicalErrors = errors.filter((error) => error.tipo === 'Léxico').length
  const syntaxErrors = errors.filter(
    (error) => error.tipo === 'Sintáctico',
  ).length
  const generalErrors = errors.length - lexicalErrors - syntaxErrors
  const success = errors.length === 0
  const errorBreakdown = [
    lexicalErrors > 0
      ? `${lexicalErrors} léxico${lexicalErrors === 1 ? '' : 's'}`
      : null,
    syntaxErrors > 0
      ? `${syntaxErrors} sintáctico${syntaxErrors === 1 ? '' : 's'}`
      : null,
    generalErrors > 0
      ? `${generalErrors} general${generalErrors === 1 ? '' : 'es'}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="results-title"
      >
        <header className="modal-header">
          <div>
            <p className="modal-eyebrow">Resultado de compilación</p>
            <h2 id="results-title">{fileName || 'programa.c'}</h2>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar resultados"
          >
            ×
          </button>
        </header>

        <div
          className={`result-banner ${
            success ? 'result-banner-success' : 'result-banner-error'
          }`}
        >
          <div className="banner-icon" aria-hidden="true">
            {success ? '✓' : '!'}
          </div>
          <div className="banner-copy">
            <strong>
              {success
                ? '¡Compilación exitosa!'
                : `Se encontraron ${errors.length} ${
                    errors.length === 1 ? 'error' : 'errores'
                  }`}
            </strong>
            <span>
              {success
                ? 'El análisis léxico y sintáctico finalizó sin errores.'
                : errorBreakdown}
            </span>
          </div>
          <div className="banner-stats">
            <div>
              <span>Tokens</span>
              <strong>{visibleTokens.length}</strong>
            </div>
            <div>
              <span>Símbolos</span>
              <strong>{symbols.length}</strong>
            </div>
            <div>
              <span>Errores</span>
              <strong>{errors.length}</strong>
            </div>
          </div>
        </div>

        <div className="modal-tabs" role="tablist" aria-label="Resultados">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              aria-label={tab.ariaLabel}
              className={`modal-tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === 'lexico' && (
                <span className="tab-badge">{visibleTokens.length}</span>
              )}
              {tab.id === 'errores' && (
                <span
                  className={`tab-badge ${
                    errors.length > 0 ? 'tab-badge-danger' : ''
                  }`}
                >
                  {errors.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div
          className="modal-body"
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === 'lexico' && (
            <div className="lexico-panel">
              <TokenFlow tokens={tokens} />
              <SymbolTable symbols={symbols} />
            </div>
          )}

          {activeTab === 'arbol' && <SyntaxTreeVisualizer ast={result.ast} />}

          {activeTab === 'errores' && <ErrorTable errors={errors} />}
        </div>

        <footer className="modal-footer">
          <span>Atajo: Ctrl + Enter para compilar nuevamente.</span>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  )
}

export default ResultsModal
