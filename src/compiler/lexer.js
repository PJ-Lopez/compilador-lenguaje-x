// Analizador léxico del subconjunto didáctico Mini-C (C estructurado + print).
// Reconoce palabras reservadas, identificadores, números, operadores y delimitadores.
// Palabras reservadas de Mini-C y su token asociado.
const KEYWORDS = {
  while: 'WHILE',
  if: 'IF',
  else: 'ELSE',
  int: 'INT',
  float: 'FLOAT',
  print: 'PRINT',
}

// Representación oficial de cada token para la salida del analizador.
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

// Tokens que se reconocen con un único carácter.
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

// Expresiones regulares "sticky" que reconocen tokens desde la posición actual.
const IDENTIFIER_RE = /[A-Za-z_][A-Za-z0-9_]*/y
const NUMBER_RE = /\d+(?:\.\d+)?/y
const RELATIONAL_RE = /<=|>=|==|!=|<|>/y

// Divide el código en líneas para reportar la sentencia de cada error.
function buildLineIndex(source) {
  return source.split(/\r?\n/)
}

// Recorre el código y devuelve tokens, tabla de símbolos y errores léxicos.
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

  // Agrega un token con su ubicación y formato de visualización.
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

  // Registra un identificador nuevo o incrementa sus ocurrencias.
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

  // Actualiza índice, fila y columna según el texto consumido.
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

    // Un carácter desconocido se reporta y se omite para continuar el análisis.
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

  // Token centinela que indica el final del flujo al parser.
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
