const STATEMENT_STARTERS = new Set([
  'INT',
  'FLOAT',
  'IF',
  'WHILE',
  'PRINT',
  'ID',
  'LLAV_IZQ',
])

const SYNCHRONIZATION_BOUNDARIES = new Set([
  ...STATEMENT_STARTERS,
  'LLAV_DER',
  'ELSE',
])

class Parser {
  constructor(tokens, symbols = [], source = '') {
    this.tokens = tokens
    this.current = 0
    this.symbols = symbols
    this.symbolMap = new Map(symbols.map((symbol) => [symbol.nombre, symbol]))
    this.sourceLines = source.split(/\r?\n/)
    this.errors = []
  }

  parse() {
    const body = []

    while (!this.isAtEnd()) {
      const before = this.current
      const statement = this.statement()
      if (statement) {
        body.push(statement)
      }
      if (this.current === before) {
        this.advance()
      }
    }

    return {
      ast: {
        type: 'Program',
        body,
        line: 1,
      },
      errors: this.errors,
      symbols: this.symbols,
    }
  }

  statement() {
    if (this.check('TERM')) {
      this.advance()
      return null
    }

    if (this.match('INT', 'FLOAT')) {
      return this.declaration(this.previous())
    }

    if (this.check('WHILE')) {
      return this.whileStatement()
    }

    if (this.check('IF')) {
      return this.ifStatement()
    }

    if (this.check('PRINT')) {
      return this.printStatement()
    }

    if (this.check('LLAV_IZQ')) {
      return this.block()
    }

    if (this.check('ID')) {
      return this.assignment()
    }

    if (this.check('LLAV_DER')) {
      this.errorAt(
        this.advance(),
        "Llave de cierre '}' sin un bloque de apertura.",
      )
      return null
    }

    this.errorAt(
      this.peek(),
      `No se reconoce el inicio de una sentencia: '${this.peek().lexeme}'.`,
    )
    this.synchronize()
    return null
  }

  declaration(typeToken) {
    const dataType = typeToken.type === 'INT' ? 'int' : 'float'
    const nameToken = this.consume(
      'ID',
      `Se esperaba un identificador después de '${typeToken.lexeme}'.`,
    )

    if (!nameToken) {
      this.synchronize()
      return null
    }

    this.updateSymbolType(nameToken.lexeme, dataType)

    let init = null
    if (this.match('ASIG')) {
      init = this.expression()
      if (init && init.type === 'Literal' && init.valueType === 'num') {
        this.updateSymbolValue(nameToken.lexeme, init.value)
      }
    }

    this.finishStatement(`la declaración de '${nameToken.lexeme}'`)

    return {
      type: 'Declaration',
      dataType,
      name: nameToken.lexeme,
      init,
      line: typeToken.line,
    }
  }

  assignment() {
    const nameToken = this.advance()

    if (!this.match('ASIG')) {
      this.errorAt(
        this.peek(),
        `Se esperaba '=' después del identificador '${nameToken.lexeme}'.`,
      )
      this.synchronize()
      return null
    }

    const value = this.expression()
    if (value && value.type === 'Literal' && value.valueType === 'num') {
      this.updateSymbolValue(nameToken.lexeme, value.value)
    }

    this.finishStatement(`la asignación de '${nameToken.lexeme}'`)

    return {
      type: 'Assignment',
      name: nameToken.lexeme,
      value,
      line: nameToken.line,
    }
  }

  ifStatement() {
    const ifToken = this.advance()

    this.consumeParen('(', "Se esperaba '(' después de 'if'.")
    const test = this.expression()
    this.consumeParen(')', "Se esperaba ')' después de la condición del 'if'.")

    const consequent = this.statement()
    let alternate = null

    if (this.match('ELSE')) {
      alternate = this.statement()
    }

    return {
      type: 'If',
      test,
      consequent,
      alternate,
      line: ifToken.line,
    }
  }

  whileStatement() {
    const whileToken = this.advance()

    this.consumeParen('(', "Se esperaba '(' después de 'while'.")
    const test = this.expression()
    this.consumeParen(')', "Se esperaba ')' después de la condición del 'while'.")

    const body = this.statement()

    return {
      type: 'While',
      test,
      body,
      line: whileToken.line,
    }
  }

  printStatement() {
    const printToken = this.advance()
    let value

    if (this.check('AGR') && this.peek().value === '(') {
      this.advance()
      value = this.expression()
      this.consumeParen(')', "Se esperaba ')' después de la expresión de 'print'.")
    } else {
      value = this.expression()
    }

    this.finishStatement("la sentencia 'print'")

    return {
      type: 'Print',
      value,
      line: printToken.line,
    }
  }

  block() {
    const openToken = this.advance()
    const body = []

    while (!this.isAtEnd() && !this.check('LLAV_DER')) {
      const before = this.current
      const statement = this.statement()
      if (statement) {
        body.push(statement)
      }
      if (this.current === before) {
        this.advance()
      }
    }

    if (!this.match('LLAV_DER')) {
      this.errorAt(
        this.peek(),
        "Se esperaba '}' para cerrar el bloque.",
      )
    }

    return {
      type: 'Block',
      body,
      line: openToken.line,
    }
  }

  expression() {
    return this.equality()
  }

  equality() {
    let expression = this.relational()
    let operator = this.matchRelational(['==', '!='])

    while (operator) {
      const right = this.relational()
      expression = {
        type: 'Binary',
        operator: operator.value,
        left: expression,
        right,
        line: operator.line,
      }
      operator = this.matchRelational(['==', '!='])
    }

    return expression
  }

  relational() {
    let expression = this.additive()
    let operator = this.matchRelational(['<', '>', '<=', '>='])

    while (operator) {
      const right = this.additive()
      expression = {
        type: 'Binary',
        operator: operator.value,
        left: expression,
        right,
        line: operator.line,
      }
      operator = this.matchRelational(['<', '>', '<=', '>='])
    }

    return expression
  }

  additive() {
    let expression = this.multiplicative()

    while (this.match('PLUS', 'MINUS')) {
      const operator = this.previous()
      const right = this.multiplicative()
      expression = {
        type: 'Binary',
        operator: operator.value,
        left: expression,
        right,
        line: operator.line,
      }
    }

    return expression
  }

  multiplicative() {
    let expression = this.unary()

    while (this.match('STAR', 'SLASH')) {
      const operator = this.previous()
      const right = this.unary()
      expression = {
        type: 'Binary',
        operator: operator.value,
        left: expression,
        right,
        line: operator.line,
      }
    }

    return expression
  }

  unary() {
    if (this.match('MINUS', 'PLUS')) {
      const operator = this.previous()
      return {
        type: 'Unary',
        operator: operator.value,
        operand: this.unary(),
        line: operator.line,
      }
    }

    return this.primary()
  }

  primary() {
    if (this.match('NUM')) {
      const token = this.previous()
      return {
        type: 'Literal',
        valueType: 'num',
        value: token.value,
        raw: token.lexeme,
        line: token.line,
      }
    }

    if (this.match('ID')) {
      const token = this.previous()
      return {
        type: 'Identifier',
        name: token.lexeme,
        line: token.line,
      }
    }

    if (this.check('AGR') && this.peek().value === '(') {
      this.advance()
      const expression = this.expression()
      this.consumeParen(')', "Se esperaba ')' para cerrar la agrupación.")
      return expression
    }

    this.errorAt(
      this.peek(),
      `Se esperaba una expresión (número, identificador o paréntesis); se encontró '${this.peek().lexeme}'.`,
    )

    return {
      type: 'Literal',
      valueType: 'error',
      value: '?',
      raw: '?',
      line: this.peek().line,
    }
  }

  matchRelational(operators) {
    if (this.check('OP_REL') && operators.includes(this.peek().value)) {
      return this.advance()
    }
    return null
  }

  consumeParen(value, message) {
    if (this.check('AGR') && this.peek().value === value) {
      return this.advance()
    }
    this.errorAt(this.peek(), message)
    return null
  }

  finishStatement(context) {
    if (this.match('TERM')) {
      return true
    }

    this.errorAt(this.peek(), `Se esperaba ';' al final de ${context}.`)

    if (
      !STATEMENT_STARTERS.has(this.peek().type) &&
      this.peek().type !== 'LLAV_DER'
    ) {
      this.synchronize()
    }

    return false
  }

  synchronize() {
    if (this.isAtEnd() || SYNCHRONIZATION_BOUNDARIES.has(this.peek().type)) {
      return
    }

    this.advance()

    while (!this.isAtEnd()) {
      if (this.previous().type === 'TERM') {
        return
      }
      if (SYNCHRONIZATION_BOUNDARIES.has(this.peek().type)) {
        return
      }
      this.advance()
    }
  }

  updateSymbolType(name, type) {
    const symbol = this.symbolMap.get(name)
    if (symbol) {
      symbol.tipo = type
    }
  }

  updateSymbolValue(name, value) {
    const symbol = this.symbolMap.get(name)
    if (symbol) {
      symbol.valor = String(value)
    }
  }

  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }
    return false
  }

  consume(type, message) {
    if (this.check(type)) {
      return this.advance()
    }
    this.errorAt(this.peek(), message)
    return null
  }

  check(type) {
    return this.peek().type === type
  }

  advance() {
    if (!this.isAtEnd()) {
      this.current += 1
    }
    return this.previous()
  }

  isAtEnd() {
    return this.peek().type === 'EOF'
  }

  peek(offset = 0) {
    return this.tokens[Math.min(this.current + offset, this.tokens.length - 1)]
  }

  previous() {
    return this.tokens[Math.max(this.current - 1, 0)]
  }

  errorAt(token, description) {
    this.errors.push({
      tipo: 'Sintáctico',
      fila: token.line,
      columna: token.column,
      sentencia: (this.sourceLines[token.line - 1] || '').trim(),
      descripcion: description,
    })
  }
}

export function parse(tokens, symbols = [], source = '') {
  const parser = new Parser(tokens, symbols, source)
  return parser.parse()
}
