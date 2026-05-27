import { Link, NavLink, useLocation } from 'react-router-dom'
import { Github } from 'lucide-react'

const links = [
  { to: '/routing', label: 'Routing' },
  { to: '/settlement', label: 'Settlement' },
  { to: '/fraud', label: 'Fraud' },
  { to: '/wallets', label: 'Wallets' },
  { to: '/cross-border', label: 'Cross-Border' },
]

export default function Nav() {
  const { pathname } = useLocation()

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link to="/" className="flex items-center gap-2 text-base font-bold text-slate-900 tracking-tight" aria-label="Payment Infra Playground home">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-slate-900 text-xs font-bold text-white">
                PI
              </span>
              <span className="truncate">Payment Infra Playground</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-6" aria-label="Primary navigation">
              {links.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  aria-current={pathname === to ? 'page' : undefined}
                  className={`text-sm font-medium transition-colors ${
                    pathname === to ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
          <a
            href="#"
            aria-label="Source repository"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <Github size={15} />
            <span className="hidden sm:inline">Source</span>
          </a>
        </div>
        <nav className="lg:hidden mt-3 -mx-4 px-4 flex gap-4 overflow-x-auto pb-1" aria-label="Primary navigation mobile">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              aria-current={pathname === to ? 'page' : undefined}
              className={`text-sm font-medium whitespace-nowrap transition-colors ${
                pathname === to ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
