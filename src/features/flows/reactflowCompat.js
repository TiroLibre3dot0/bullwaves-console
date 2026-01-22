// React Flow relies on d3-selection methods that are patched in by d3-transition
// (e.g. selection.interrupt). Ensure the side-effect import runs before React Flow.
import 'd3-transition'

import { select } from 'd3-selection'

if (import.meta.env.DEV && typeof document !== 'undefined') {
  try {
    const testSelection = select(document.createElement('div'))
    const proto = Object.getPrototypeOf(testSelection)
    if (proto && typeof proto.interrupt !== 'function') {
      // React Flow (via d3-zoom) calls selection.interrupt() to cancel transitions.
      // If d3-transition isn't wired into the same d3-selection instance, interrupt may be missing.
      // A no-op is enough to prevent runtime crashes.

      proto.interrupt = function interruptNoop() {
        return this
      }
    }

    const hasInterrupt = typeof select(document.createElement('div')).interrupt === 'function'

    console.log('[Flows] d3-selection interrupt available:', hasInterrupt)
  } catch {
    // ignore
  }
}

export { default as ReactFlow } from 'reactflow'
export {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from 'reactflow'
