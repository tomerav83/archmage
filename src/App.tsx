import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { DiagramCanvas } from './DiagramCanvas'
import { ElementRack } from './ElementRack'

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="diagram-editor">
        <DiagramCanvas />
        <ElementRack />
      </div>
    </ReactFlowProvider>
  )
}
