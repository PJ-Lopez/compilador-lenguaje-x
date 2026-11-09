function Toolbar({ fileName, onNew, onOpen, onSave, onCompile }) {
  return (
    <header className="toolbar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          X
        </div>
        <div className="brand-copy">
          <h1>Compilador Lenguaje X - UMES</h1>
          <p className="brand-subtitle">
            <span className="status-dot" aria-hidden="true" />
            {fileName || 'programa.x'}
            <span className="brand-separator">·</span>
            Análisis léxico, sintáctico y árbol AST
          </p>
        </div>
      </div>

      <nav className="toolbar-actions" aria-label="Acciones del compilador">
        <button type="button" className="btn btn-ghost" onClick={onNew}>
          Nuevo
        </button>
        <button type="button" className="btn btn-ghost" onClick={onOpen}>
          Abrir (.x)
        </button>
        <button type="button" className="btn btn-ghost" onClick={onSave}>
          Guardar (.x)
        </button>
        <button type="button" className="btn btn-compile" onClick={onCompile}>
          COMPILAR
        </button>
      </nav>
    </header>
  )
}

export default Toolbar
