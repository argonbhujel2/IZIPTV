'use client'

import React, { useEffect, useState, type FormEvent } from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

interface Channel {
  id: string
  name: string
  logoUrl: string | null
  streamUrl: string
  number: number | null
  enabled: boolean
  sortOrder: number
  category: { name: string } | null
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', streamUrl: '', number: '', sortOrder: '0' })
  const [msg, setMsg] = useState('')

  function load() {
    const token = localStorage.getItem('admin_token')
    fetch('/api/admin/channels', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => { if (j.success) setChannels(j.data) })
  }

  useEffect(() => { load() }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/channels', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        streamUrl: form.streamUrl,
        number: form.number ? parseInt(form.number) : null,
        sortOrder: parseInt(form.sortOrder) || 0,
        enabled: true,
      }),
    })
    const j = await res.json()
    if (j.success) {
      setShowCreate(false)
      setForm({ name: '', streamUrl: '', number: '', sortOrder: '0' })
      load()
      setMsg('Channel created')
    } else setMsg(j.error?.message || 'Failed')
  }

  async function toggle(id: string, enabled: boolean) {
    const token = localStorage.getItem('admin_token')
    await fetch('/api/admin/channels', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, enabled: !enabled }),
    })
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this channel?')) return
    const token = localStorage.getItem('admin_token')
    await fetch(`/api/admin/channels?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Channels</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 rounded-lg bg-sky-500 text-slate-950 font-medium text-sm">
          {showCreate ? 'Cancel' : '+ Add Channel'}
        </button>
      </div>
      {msg && <div className="mb-4 text-sm text-sky-400">{msg}</div>}

      {showCreate && (
        <form onSubmit={create} className="mb-6 bg-slate-900 border border-slate-700 rounded-xl p-5 grid grid-cols-2 gap-4">
          <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none" />
          <input placeholder="Stream URL (HLS/DASH)" required value={form.streamUrl} onChange={(e) => setForm({ ...form, streamUrl: e.target.value })} className="px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none" />
          <input placeholder="Channel Number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none" />
          <input placeholder="Sort Order" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none" />
          <button type="submit" className="col-span-2 py-2 rounded-lg bg-sky-500 text-slate-950 font-medium">Create</button>
        </form>
      )}

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50 text-slate-400 text-left">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Enabled</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((c) => (
              <tr key={c.id} className="border-t border-slate-800">
                <td className="px-4 py-3">{c.number ?? '—'}</td>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-slate-400">{c.category?.name || '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(c.id, c.enabled)} className={`px-2 py-0.5 rounded text-xs ${c.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {c.enabled ? 'ON' : 'OFF'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => remove(c.id)} className="text-xs text-red-400 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
