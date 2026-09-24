'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const nav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/devices', label: 'Devices', icon: '📺' },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: '📋' },
  { href: '/admin/channels', label: 'Channels', icon: '📡' },
  { href: '/admin/categories', label: 'Categories', icon: '📁' },
  { href: '/admin/movies', label: 'Movies', icon: '🎬' },
  { href: '/admin/series', label: 'Series', icon: '📺' },
  { href: '/admin/home', label: 'Home Config', icon: '🏠' },
  { href: '/admin/banners', label: 'Banners', icon: '🖼️' },
  { href: '/admin/apps', label: 'Apps', icon: '📱' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  { href: '/admin/audit', label: 'Audit Logs', icon: '📝' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  function logout() {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    document.cookie = 'admin_token=; Max-Age=0; path=/'
    router.push('/auth/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-700 flex flex-col">
      <div className="p-5 border-b border-slate-700">
        <h1 className="text-xl font-bold text-sky-400">IZ_IPTV</h1>
        <p className="text-xs text-slate-500 mt-0.5">Admin Panel</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition ${
                active
                  ? 'bg-sky-500/10 text-sky-400 border-r-2 border-sky-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="w-full py-2 text-sm text-slate-400 hover:text-red-400 transition"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
