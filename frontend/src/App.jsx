import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ChatWorkspace from './components/ChatWorkspace'
import GraphPage from './components/GraphPage'
import MemoryPage from './components/MemoryPage'
import ProjectGate from './components/ProjectGate'
import ProjectModal from './components/ProjectModal'
import RecordsPage from './components/RecordsPage'
import Shell from './components/Shell'
import { api } from './lib/api'

function RoutedWorkspace({ project, onCreateProject }) {
  if (!project) return <ProjectGate onCreate={onCreateProject} />
  return <Routes>
    <Route path="/" element={<ChatWorkspace key={project.id} project={project} />} />
    <Route path="/memory" element={<MemoryPage project={project} />} />
    <Route path="/graph" element={<GraphPage project={project} />} />
    <Route path="/decisions" element={<RecordsPage project={project} type="decision" title="Decisions & provenance" />} />
    <Route path="/tasks" element={<RecordsPage project={project} type="task" title="Task board" />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

function App() {
  const [projects, setProjects] = useState([]); const [project, setProject] = useState(null); const [modal, setModal] = useState(false); const [error, setError] = useState('')
  useEffect(() => { api('/projects').then((items) => { setProjects(items); setProject(items[0] || null) }).catch((err) => setError(err.message)) }, [])
  async function createProject(payload) { try { const item = await api('/projects', { method: 'POST', body: JSON.stringify(payload) }); setProjects((items) => [...items, item]); setProject(item); setModal(false); setError('') } catch (err) { setError(err.message) } }
  return <BrowserRouter><Routes><Route element={<Shell projects={projects} project={project} setProject={setProject} onNewProject={() => setModal(true)} />}><Route path="*" element={<><>{error && <div className="mb-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}</><RoutedWorkspace project={project} onCreateProject={() => setModal(true)} /></>} /></Route></Routes>{modal && <ProjectModal onClose={() => setModal(false)} onSubmit={createProject} />}</BrowserRouter>
}

export default App
