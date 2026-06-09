import SidebarPanel from './SidebarPanel'

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-[260px] min-h-screen bg-dark-sidebar flex-col shrink-0">
      <SidebarPanel />
    </aside>
  )
}
