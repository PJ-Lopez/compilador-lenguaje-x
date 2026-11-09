function ErrorTable({ errors = [] }) {
  if (errors.length === 0) {
    return (
      <div className="empty-state empty-state-success">
        <strong>No se encontraron errores.</strong>
        <span>El análisis léxico y sintáctico finalizó correctamente.</span>
      </div>
    )
  }

  const sortedErrors = [...errors].sort(
    (left, right) =>
      left.fila - right.fila || (left.columna ?? 0) - (right.columna ?? 0),
  )

  return (
    <div className="table-section">
      <div className="section-heading">
        <h3>Tabla de errores</h3>
        <span className="count-badge count-badge-danger">
          {errors.length} errores
        </span>
      </div>
      <div className="table-scroll">
        <table className="data-table error-table">
          <thead>
            <tr>
              <th>Fila</th>
              <th>Sentencia</th>
              <th>Descripción</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {sortedErrors.map((error, index) => (
              <tr key={`${error.fila}-${error.columna}-${index}`}>
                <td className="cell-line">
                  {error.fila}
                  {error.columna ? (
                    <span className="cell-column">col. {error.columna}</span>
                  ) : null}
                </td>
                <td>
                  <code className="sentence-code">
                    {error.sentencia || '—'}
                  </code>
                </td>
                <td>{error.descripcion}</td>
                <td>
                  <span
                    className={`error-type ${
                      error.tipo === 'Léxico'
                        ? 'error-type-lexical'
                        : error.tipo === 'Sintáctico'
                          ? 'error-type-syntax'
                          : 'error-type-general'
                    }`}
                  >
                    {error.tipo}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ErrorTable
