import React from 'react'
import { ReactFlow, Background, Controls } from './reactflowCompat'
import 'reactflow/dist/style.css'

import { nodes as retentionNodes, edges as retentionEdges } from '../../flows/retentionFlow'

import StateNode from './nodes/StateNode'
import DecisionNode from './nodes/DecisionNode'
import OutcomeNode from './nodes/OutcomeNode'
import CommunicationNode from './nodes/CommunicationNode'
import ContainerNode from './nodes/ContainerNode'
import BadgeEdge from './edges/BadgeEdge'

const nodeTypes = {
  container: ContainerNode,
  state: StateNode,
  decision: DecisionNode,
  outcome: OutcomeNode,
  communication: CommunicationNode,
}

const edgeTypes = {
  badge: BadgeEdge,
}

export default function FlowDiagram({
  nodes = retentionNodes,
  edges = retentionEdges,
  onNavigateFlow,
}) {
  return (
    <div style={{ width: '100%', height: 760 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.14 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        onNodeClick={(e, node) => {
          const target = node?.data?.linkToFlow
          if (!target || typeof onNavigateFlow !== 'function') return
          e.preventDefault()
          e.stopPropagation()
          onNavigateFlow(target)
        }}
        defaultEdgeOptions={{
          type: 'step',
          style: { stroke: 'rgba(148,163,184,0.85)', strokeWidth: 1.6 },
          markerEnd: {
            type: 'arrowclosed',
            width: 18,
            height: 18,
            color: 'rgba(226,232,240,0.85)',
          },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <Background color="rgba(148,163,184,0.14)" gap={18} />
      </ReactFlow>
    </div>
  )
}
