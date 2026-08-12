import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// the app frame loads before the features, so their styles land on top of it
import './styles.css'
import { Editor } from '@/app/editor'

const root = document.getElementById('root')
if (!root) throw new Error('index.html is missing <div id="root">')

createRoot(root).render(
  <StrictMode>
    <Editor />
  </StrictMode>,
)
