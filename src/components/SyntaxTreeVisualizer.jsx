import { useEffect, useRef } from 'react'
import { Network } from 'vis-network/standalone'
import 'vis-network/styles/vis-network.css'

// Configuración visual y de interacción del grafo jerárquico.
const NETWORK_OPTIONS = {
  layout: {
    hierarchical: {
      enabled: true,
      direction: 'UD',
      sortMethod: 'directed',
      levelSeparation: 110,
      nodeSpacing: 180,
      treeSpacing: 220,
      blockShifting: true,
      edgeMinimization: true,
      parentCentralization: true,
    },
  },
  physics: {
    enabled: false,
  },
  interaction: {
    hover: true,
    dragNodes: true,
    dragView: true,
    zoomView: true,
    navigationButtons: true,
    keyboard: true,
    tooltipDelay: 200,
  },
  nodes: {
    shape: 'box',
    margin: { top: 12, bottom: 12, left: 18, right: 18 },
    widthConstraint: { maximum: 240 },
    font: {
      color: '#2f2d28',
      face: 'ui-monospace, Consolas, monospace',
      size: 13,
    },
    borderWidth: 1.5,
    shadow: {
      enabled: true,
      color: 'rgba(92, 81, 58, 0.16)',
      size: 8,
      x: 0,
      y: 3,
    },
  },
  edges: {
    arrows: {
      to: { enabled: true, scaleFactor: 0.7 },
    },
    color: {
      color: '#b3aa96',
      highlight: '#2f6f4f',
      hover: '#2f6f4f',
    },
    width: 1.5,
    smooth: {
      enabled: true,
      type: 'cubicBezier',
      forceDirection: 'vertical',
      roundness: 0.45,
    },
  },
  groups: {
    program: {
      color: { background: '#dbe8f4', border: '#5b87ad' },
    },
    declaration: {
      color: { background: '#dfeee2', border: '#4f8a67' },
    },
    statement: {
      color: { background: '#daeeee', border: '#3d8181' },
    },
    control: {
      color: { background: '#f6e8cd', border: '#b98a3e' },
    },
    block: {
      color: { background: '#e9e2f2', border: '#7d6a99' },
    },
    expression: {
      color: { background: '#f3e2e1', border: '#a96a63' },
    },
    literal: {
      color: { background: '#e3efe0', border: '#6a8f4e' },
    },
    identifier: {
      color: { background: '#ece9e0', border: '#9a927f' },
    },
  },
}

// Convierte cada nodo del AST en una etiqueta y un grupo visual.
function describeNode(node) {
  switch (node.type) {
    case 'Program':
      return { label: 'Programa', group: 'program' }
    case 'Declaration':
      return {
        label: `Declaración\n${node.dataType} ${node.name}`,
        group: 'declaration',
      }
    case 'Assignment':
      return { label: `Asignación\n${node.name} =`, group: 'statement' }
    case 'If':
      return { label: 'Si (if)', group: 'control' }
    case 'While':
      return { label: 'Mientras (while)', group: 'control' }
    case 'Print':
      return { label: 'Imprimir (print)', group: 'statement' }
    case 'Block':
      return { label: 'Bloque { }', group: 'block' }
    case 'Binary':
      return { label: `Operador\n${node.operator}`, group: 'expression' }
    case 'Unary':
      return { label: `Unario\n${node.operator}`, group: 'expression' }
    case 'Literal':
      return {
        label: `Número\n${node.raw ?? node.value}`,
        group: 'literal',
      }
    case 'Identifier':
      return { label: `Identificador\n${node.name}`, group: 'identifier' }
    default:
      return { label: node.type, group: 'statement' }
  }
}

// Recorre el AST y genera los nodos y aristas de vis-network.
function buildGraph(ast) {
  const nodes = []
  const edges = []
  let nextId = 0

  const visit = (node, parentId = null) => {
    if (!node) {
      return
    }

    const currentId = String(nextId)
    nextId += 1

    const { label, group } = describeNode(node)
    nodes.push({
      id: currentId,
      label,
      group,
      title: `${node.type} · línea ${node.line ?? '—'}`,
    })

    if (parentId !== null) {
      edges.push({ from: parentId, to: currentId })
    }

    switch (node.type) {
      case 'Program':
      case 'Block':
        node.body.forEach((child) => visit(child, currentId))
        break
      case 'Declaration':
        visit(node.init, currentId)
        break
      case 'Assignment':
        visit(node.value, currentId)
        break
      case 'If':
        visit(node.test, currentId)
        visit(node.consequent, currentId)
        visit(node.alternate, currentId)
        break
      case 'While':
        visit(node.test, currentId)
        visit(node.body, currentId)
        break
      case 'Print':
        visit(node.value, currentId)
        break
      case 'Binary':
        visit(node.left, currentId)
        visit(node.right, currentId)
        break
      case 'Unary':
        visit(node.operand, currentId)
        break
      default:
        break
    }
  }

  visit(ast)

  return { nodes, edges }
}

// Renderiza el AST interactivo y ajusta la vista al montar.
function SyntaxTreeVisualizer({ ast }) {
  const containerRef = useRef(null)
  const networkRef = useRef(null)

  // Crea la red, la ajusta al contenedor y libera recursos al desmontar.
  useEffect(() => {
    const container = containerRef.current
    if (!container || !ast) {
      return undefined
    }

    const { nodes, edges } = buildGraph(ast)
    const network = new Network(container, { nodes, edges }, NETWORK_OPTIONS)
    networkRef.current = network

    const fitGraph = () => network.fit({ animation: false })
    const frame = window.requestAnimationFrame(fitGraph)

    const observer = new ResizeObserver(() => {
      if (networkRef.current) {
        networkRef.current.redraw()
      }
    })
    observer.observe(container)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      network.destroy()
      networkRef.current = null
    }
  }, [ast])

  if (!ast) {
    return (
      <div className="empty-state">
        <strong>No hay árbol sintáctico disponible.</strong>
        <span>Corrige los errores y vuelve a compilar para generarlo.</span>
      </div>
    )
  }

  return (
    <div className="tree-panel">
      <div className="tree-hint">
        Arrastra los nodos para reorganizarlos · Usa la rueda para hacer zoom ·
        Los botones inferiores permiten navegar el árbol.
      </div>
      <div className="tree-canvas" ref={containerRef} />
    </div>
  )
}

export default SyntaxTreeVisualizer
