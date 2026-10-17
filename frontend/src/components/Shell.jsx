import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const links = [['/', '⌂', 'Workspace'], ['/memory', '◈', 'Memory'], ['/graph', '⌘', 'Graph'], ['/decisions', '◇', 'Decisions'], ['/tasks', '✓', 'Tasks']]

export default function Shell({ projects, project, setProject, onNewProject }) {
  const navigate = useNavigate()
  return <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
    <aside className="flex w-full flex-col border-b border-slate-200 bg-white p-4 md:fixed md:inset-y-0 md:w-64 md:border-b-0 md:border-r md:p-5">
      <button className="mb-8 flex items-center gap-2 px-2 text-left font-display text-xl font-bold" onClick={() => navigate('/')}><span className="text-blue-600">◈</span> FounderOS</button>
      <label className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Project</label>
      <select className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500" value={project?.id || ''} onChange={(event) => setProject(projects.find((item) => item.id === event.target.value) || null)}><option value="">Select a project</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <button className="mb-7 rounded-lg border border-dashed border-blue-300 bg-blue-50 px-3 py-2 text-left text-sm font-semibold text-blue-700" onClick={onNewProject}>＋ New project</button>
      <nav className="space-y-1">{links.map(([to, icon, label]) => <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><span className="w-5 text-center">{icon}</span>{label}</NavLink>)}</nav>
      <div className="mt-auto hidden rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs md:block"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />FalkorDB connected<p className="mt-1 pl-4 text-[10px] text-slate-400">Shared graph memory</p></div>
    </aside>
    <main className="min-w-0 flex-1 md:ml-64"><header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-8"><div className="text-sm font-semibold">FounderOS <span className="px-2 text-slate-300">/</span><span className="text-slate-500">{project?.name || 'Workspace'}</span></div><div className="flex items-center gap-3"><span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:inline">Graph memory live</span><span className="grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">DF</span></div></header><div className="mx-auto max-w-7xl p-5 md:p-8"><Outlet /></div></main>
  </div>
}
