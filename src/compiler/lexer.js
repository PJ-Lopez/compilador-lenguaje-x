const KEYWORDS = {
  while: 'WHILE',
  if: 'IF',
  else: 'ELSE',
  int: 'INT',
  float: 'FLOAT',
  print: 'PRINT',
}

const DISPLAY = {
  ID: '<ID>',
  ASIG: '<ASIG>',
  PLUS: '<+>',
  MINUS: '<->',
  STAR: '<*>',
  SLASH: '</>',
  OP_REL: '<OP_REL>',
  AGR: '<AGR>',
  LLAV_IZQ: '<LLAV_IZQ>',
  LLAV_DER: '<LLAV_DER>',
  TERM: '<TERM>',
  WHILE: '<WHILE>',
  IF: '<IF>',
  ELSE: '<ELSE>',
  INT: '<INT>',
  FLOAT: '<FLOAT>',
  PRINT: '<PRINT>',
  EOF: '<EOF>',
}

const SINGLE_CHAR_TOKENS = {
  '=': 'ASIG',
  '+': 'PLUS',
  '-': 'MINUS',
  '*': 'STAR',
  '/': 'SLASH',
  '(': 'AGR',
  ')': 'AGR',
  '{': 'LLAV_IZQ',
  '}': 'LLAV_DER',
  ';': 'TERM',
}

const RELATIONAL = ['<=', '>=', '==', '!=', '<', '>']

const IDENTIFIER_RE = /[A-Za-z_][A-Za-z0-9_]*/y
const NUMBER_RE = /\d+(?:\.\d+)?/y
const RELATIONAL_RE = /<=|>=|==|!=|<|>/y

function buildLineIndex(source) {
  return source.split(/\r?\n/)
}

export function tokenize(source = '') {
  const tokens = []
  const errors = []
  const symbols = []
  const symbolMap = new Map()
  const lines = buildLineIndex(source)
  let index = 0
  let line = 1
  let column = 1

  const currentSentence = () => (lines[line - 1] || '').trim()

  const pushToken = (type, lexeme, value, startLine, startColumn) => {
    tokens.push({
      type,
      lexeme,
      value,
      line: startLine,
      column: startColumn,
      display: type === 'NUM' ? `<NUM>.${lexeme}` : DISPLAY[type],
    })
  }

  const registerSymbol = (name, symbolLine, symbolColumn) => {
    const existing = symbolMap.get(name)
    if (existing) {
      existing.ocurrencias += 1
      return
    }
    const symbol = {
      nombre: name,
      tipo: 'desconocido',
      valor: '—',
      linea: symbolLine,
      columna: symbolColumn,
      ocurrencias: 1,
    }
    symbolMap.set(name, symbol)
    symbols.push(symbol)
  }

  const advanceText = (text) => {
    for (const char of text) {
      if (char === '\n') {
        line += 1
        column = 1
      } else {
        column += 1
      }
    }
    index += text.length
  }

  while (index < source.length) {
    const char = source[index]

    if (char === '\n') {
      advanceText(char)
      continue
    }

    if (char === ' ' || char === '\t' || char === '\r') {
      advanceText(char)
      continue
    }

    const startLine = line
    const startColumn = column

    IDENTIFIER_RE.lastIndex = index
    const identifierMatch = IDENTIFIER_RE.exec(source)
    if (identifierMatch) {
      const lexeme = identifierMatch[0]
      const keywordType = KEYWORDS[lexeme]
      if (keywordType) {
        pushToken(keywordType, lexeme, lexeme, startLine, startColumn)
      } else {
        pushToken('ID', lexeme, lexeme, startLine, startColumn)
        registerSymbol(lexeme, startLine, startColumn)
      }
      advanceText(lexeme)
      continue
    }

    NUMBER_RE.lastIndex = index
    const numberMatch = NUMBER_RE.exec(source)
    if (numberMatch) {
      const lexeme = numberMatch[0]
      pushToken('NUM', lexeme, Number(lexeme), startLine, startColumn)
      advanceText(lexeme)
      continue
    }

    RELATIONAL_RE.lastIndex = index
    const relationalMatch = RELATIONAL_RE.exec(source)
    if (relationalMatch) {
      const lexeme = relationalMatch[0]
      if (RELATIONAL.includes(lexeme)) {
        pushToken('OP_REL', lexeme, lexeme, startLine, startColumn)
        advanceText(lexeme)
        continue
      }
    }

    const singleType = SINGLE_CHAR_TOKENS[char]
    if (singleType) {
      pushToken(singleType, char, char, startLine, startColumn)
      advanceText(char)
      continue
    }

    errors.push({
      tipo: 'Léxico',
      fila: startLine,
      columna: startColumn,
      caracter: char,
      sentencia: currentSentence(),
      descripcion: `Carácter no reconocido: '${char}'.`,
    })
    advanceText(char)
  }

  tokens.push({
    type: 'EOF',
    lexeme: 'EOF',
    value: null,
    line,
    column,
    display: DISPLAY.EOF,
  })

  return { tokens, symbols, errors }
}
