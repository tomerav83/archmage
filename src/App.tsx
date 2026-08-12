import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { DiagramCanvas } from './DiagramCanvas'
import { ElementSidebar } from './ElementSidebar'

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="diagram-editor">
        <ElementSidebar />
        <DiagramCanvas />
      </div>
    </ReactFlowProvider>
  )
}
