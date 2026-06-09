import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import MobileMenu from '../components/MobileMenu'

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-dark">
      <Sidebar />
      <MobileMenu
        open={mobileMenuOpen}
        onOpen={() => setMobileMenuOpen(true)}
        onClose={() => setMobileMenuOpen(false)}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
