'use client'

import { useEffect, useState } from 'react'

interface UserRow {
  id: string
  username: string
  fullName: string
  status: string
  deviceLimit: number
  lastLoginAt: string | null
  subscription: { planName: string; expiryDate: string; status: string } | null
  deviceCount: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: '',
    phone: '',
    deviceLimit: 2,
    planName: 'Standard',
    expiryDate: '',
  })
  const [msg, setMsg] = useState('')

  function load() {
    const token = localStorage.getItem('admin_token')
    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setUsers(j.data.users)
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [])

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const j = await res.json()
    if (j.success) {
      setShowCreate(false)
      setForm({ username: '', password: '', fullName: '', phone: '', deviceLimit: 2, planName: 'Standard', expiryDate: '' })
      load()
      setMsg('User created')
    } else {
      setMsg(j.error?.message || 'Failed')
    }
  }

  if (loading) return <div className="text-slate-400 animate-pulse">Loading users…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium text-sm"
        >
          {showCreate ? 'Cancel' : '+ Create User'}
        </button>
      </div>

      {msg && <div className="mb-4 text-sm text-sky-400">{msg}</div>}

      {showCreate && (
        <form onSubmit={createUser} className="mb-6 bg-slate-900 border border-slate-700 rounded-xl p-5 grid grid-cols-2 gap-4">
          <input placeholder="Username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none" />
          <input placeholder="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none" />
          <input placeholder="Full Name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none" />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none" />
          <input placeholder="Device Limit" type="number" min={1} max={10} value={form.deviceLimit} onChange={(e) => setForm({ ...form, deviceLimit: +e.target.value })} className="px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none" />
          <input placeholder="Expiry Date (YYYY-MM-DD)" required type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none" />
          <button type="submit" className="col-span-2 py-2 rounded-lg bg-sky-500 text-slate-950 font-medium">Create</button>
        </form>
      )}

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50 text-slate-400 text-left">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Subscription</th>
              <th className="px-4 py-3">Devices</th>
              <th className="px-4 py-3">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">{u.fullName}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    u.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>{u.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {u.subscription
                    ? `${u.subscription.planName} · ${new Date(u.subscription.expiryDate).toLocaleDateString()}`
                    : '—'}
                </td>
                <td className="px-4 py-3">{u.deviceCount}/{u.deviceLimit}</td>
                <td className="px-4 py-3 text-slate-400">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
