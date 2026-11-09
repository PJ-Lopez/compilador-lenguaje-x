function SymbolTable({ symbols = [] }) {
  return (
    <div className="table-section">
      <div className="section-heading">
        <h3>Tabla de símbolos</h3>
        <span className="count-badge">{symbols.length} identificadores</span>
      </div>

      {symbols.length === 0 ? (
        <div className="empty-state empty-state-compact">
          <strong>Sin identificadores registrados.</strong>
          <span>Declara variables para poblar la tabla de símbolos.</span>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Línea</th>
                <th>Ocurrencias</th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((symbol, index) => (
                <tr key={symbol.nombre}>
                  <td className="cell-index">{index + 1}</td>
                  <td className="cell-name">{symbol.nombre}</td>
                  <td>
                    <span className={`type-pill type-${symbol.tipo}`}>
                      {symbol.tipo}
                    </span>
                  </td>
                  <td className="cell-value">{symbol.valor}</td>
                  <td>{symbol.linea}</td>
                  <td>{symbol.ocurrencias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default SymbolTable
