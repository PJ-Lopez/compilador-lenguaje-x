// Barra superior con las acciones principales del compilador.
function Toolbar({ fileName, onNew, onOpen, onSave, onCompile }) {
  return (
    <header className="toolbar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          C
        </div>
        <div className="brand-copy">
          <h1>Compilador Web - Lenguaje C (Mini-C) | UMES</h1>
          <p className="brand-subtitle">
            <span className="status-dot" aria-hidden="true" />
            {fileName || 'programa.c'}
            <span className="brand-separator">·</span>
            Facultad de Ingeniería · UMES · Análisis léxico y sintáctico
          </p>
        </div>
      </div>

      <nav className="toolbar-actions" aria-label="Acciones del compilador">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onNew}
          title="Crear un documento nuevo en Lenguaje C (Mini-C)"
        >
          Nuevo
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onOpen}
          title="Abrir archivo fuente (.c, .x o .txt)"
        >
          Abrir (.c / .x)
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onSave}
          title="Guardar archivo .c por defecto; conserva .x"
        >
          Guardar (.c / .x)
        </button>
        <button
          type="button"
          className="btn btn-compile"
          onClick={onCompile}
          title="Compilar y analizar el código Mini-C"
        >
          COMPILAR
        </button>
      </nav>
    </header>
  )
}

export default Toolbar
