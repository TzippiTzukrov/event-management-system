import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <div dir="rtl">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
