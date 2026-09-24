'use client'

import { useEffect, useState } from 'react'

interface DeviceRow {
  id: string
  deviceId: string
  user: { id: string; username: string; fullName: string } | null
  model: string | null
  androidVersion: string | null
  appVersion: string | null
  status: string
  lastSeenAt: string | null
  firstSeenAt: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  function load() {
    const token = localStorage.getItem('admin_token')
    fetch('/api/admin/devices', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setDevices(j.data.devices)
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [])

  async function action(deviceId: string, act: string) {
    setMsg('')
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/devices', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, action: act }),
    })
    const j = await res.json()
    if (j.success) {
      setMsg(`Device ${act} OK`)
      load()
    } else {
      setMsg(j.error?.message || 'Failed')
    }
  }

  if (loading) return <div className="text-slate-400 animate-pulse">Loading devices…</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Devices</h1>
      {msg && <div className="mb-4 text-sm text-sky-400">{msg}</div>}

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50 text-slate-400 text-left">
            <tr>
              <th className="px-4 py-3">Device ID</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">App Ver</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Seen</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                <td className="px-4 py-3 font-mono text-xs">{d.deviceId.slice(0, 16)}…</td>
                <td className="px-4 py-3">{d.user?.username || '—'}</td>
                <td className="px-4 py-3">{d.model || '—'}</td>
                <td className="px-4 py-3">{d.appVersion || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    d.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                    d.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>{d.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {d.status !== 'ACTIVE' && (
                      <button onClick={() => action(d.deviceId, 'activate')} className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400 hover:bg-green-500/30">Activate</button>
                    )}
                    {d.status === 'ACTIVE' && (
                      <button onClick={() => action(d.deviceId, 'deactivate')} className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">Deactivate</button>
                    )}
                    <button onClick={() => action(d.deviceId, 'block')} className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">Block</button>
                    <button onClick={() => action(d.deviceId, 'unbind')} className="px-2 py-0.5 text-xs rounded bg-slate-500/20 text-slate-400 hover:bg-slate-500/30">Unbind</button>
                    <button onClick={() => action(d.deviceId, 'logout')} className="px-2 py-0.5 text-xs rounded bg-slate-500/20 text-slate-400 hover:bg-slate-500/30">Logout</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
