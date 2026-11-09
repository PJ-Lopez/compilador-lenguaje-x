import { useEffect, useRef } from 'react'
import { Network } from 'vis-network/standalone'
import 'vis-network/styles/vis-network.css'

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
      color: '#f8fafc',
      face: 'ui-monospace, Consolas, monospace',
      size: 13,
    },
    borderWidth: 2,
    shadow: {
      enabled: true,
      color: 'rgba(2, 6, 23, 0.45)',
      size: 10,
      x: 0,
      y: 4,
    },
  },
  edges: {
    arrows: {
      to: { enabled: true, scaleFactor: 0.7 },
    },
    color: {
      color: '#475569',
      highlight: '#22d3ee',
      hover: '#22d3ee',
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
      color: { background: '#1d4ed8', border: '#60a5fa' },
    },
    declaration: {
      color: { background: '#047857', border: '#34d399' },
    },
    statement: {
      color: { background: '#0e7490', border: '#22d3ee' },
    },
    control: {
      color: { background: '#b45309', border: '#fbbf24' },
    },
    block: {
      color: { background: '#4c1d95', border: '#a78bfa' },
    },
    expression: {
      color: { background: '#7e22ce', border: '#c084fc' },
    },
    literal: {
      color: { background: '#0f766e', border: '#2dd4bf' },
    },
    identifier: {
      color: { background: '#334155', border: '#94a3b8' },
    },
  },
}

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

function SyntaxTreeVisualizer({ ast }) {
  const containerRef = useRef(null)
  const networkRef = useRef(null)

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
