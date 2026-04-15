import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Ask AI', to: '/qa' },
  { label: 'Chat History', to: '/history' },
]

const linkClass = ({ isActive }) =>
  [
    'rounded-full px-4 py-2 text-sm font-semibold transition',
    isActive
      ? 'bg-blue-600 text-white shadow-soft'
      : 'text-slate-200 hover:bg-slate-800 hover:text-white',
  ].join(' ')

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-gray-700 bg-gray-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <NavLink to="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-2 py-1.5">
            <img src="/bookiq-logo.svg" alt="BookIQ" className="h-8 w-auto" />
          </div>
          <span className="hidden text-xs text-slate-400 group-hover:text-slate-300 sm:inline">
            AI-Powered Book Intelligence
          </span>
        </NavLink>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-200 hover:bg-slate-800 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {open ? (
        <nav className="border-t border-slate-800 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  )
}
