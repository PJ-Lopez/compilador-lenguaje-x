const DETAIL_TYPES = new Set(['ID', 'OP_REL', 'AGR', 'LLAV_IZQ', 'LLAV_DER'])

function TokenFlow({ tokens = [] }) {
  const visibleTokens = tokens.filter((token) => token.type !== 'EOF')

  if (visibleTokens.length === 0) {
    return (
      <div className="empty-state">
        <strong>No se generaron tokens.</strong>
        <span>Escribe código en el editor para analizarlo.</span>
      </div>
    )
  }

  return (
    <div className="token-flow-wrapper">
      <div className="section-heading">
        <h3>Flujo de tokens</h3>
        <span className="count-badge">{visibleTokens.length} tokens</span>
      </div>
      <div className="token-flow">
        {visibleTokens.map((token, index) => (
          <span
            className={`token-chip token-${token.type.toLowerCase()}`}
            key={`${token.type}-${token.line}-${token.column}-${index}`}
            title={`Línea ${token.line}, columna ${token.column}`}
          >
            <span className="token-tag">{token.display}</span>
            {DETAIL_TYPES.has(token.type) && (
              <span className="token-detail">{token.lexeme}</span>
            )}
            <span className="token-line">L{token.line}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default TokenFlow
