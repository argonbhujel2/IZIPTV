'use client'

import { useEffect, useState } from 'react'

export default function HomeConfigPage() {
  const [config, setConfig] = useState<Record<string, unknown>>({})
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    fetch('/api/admin/config', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setConfig(j.data)
        setLoading(false)
      })
  }, [])

  async function save() {
    setMsg('')
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/config', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    const j = await res.json()
    setMsg(j.success ? 'Configuration published' : j.error?.message || 'Failed')
  }

  if (loading) return <div className="text-slate-400 animate-pulse">Loading…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Home Configuration</h1>
        <button onClick={save} className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium text-sm">
          Publish
        </button>
      </div>
      {msg && <div className="mb-4 text-sm text-sky-400">{msg}</div>}

      <div className="space-y-6 max-w-2xl">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">Branding</h3>
          <div>
            <label className="text-sm text-slate-400">App Name</label>
            <input
              value={(config.appName as string) || ''}
              onChange={(e) => setConfig({ ...config, appName: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">Logo URL</label>
            <input
              value={(config.logoUrl as string) || ''}
              onChange={(e) => setConfig({ ...config, logoUrl: e.target.value || null })}
              className="mt-1 w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none"
              placeholder="https://cdn.example.com/logo.png"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">Home Background URL</label>
            <input
              value={(config.homeBackgroundUrl as string) || ''}
              onChange={(e) => setConfig({ ...config, homeBackgroundUrl: e.target.value || null })}
              className="mt-1 w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none"
              placeholder="https://cdn.example.com/bg.jpg"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!config.homeBackgroundEnabled}
              onChange={(e) => setConfig({ ...config, homeBackgroundEnabled: e.target.checked })}
            />
            Background enabled
          </label>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">Sections</h3>
          {(['liveTvEnabled', 'moviesEnabled', 'seriesEnabled', 'appsEnabled', 'youtubeEnabled', 'netflixEnabled'] as const).map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!config[key]}
                onChange={(e) => setConfig({ ...config, [key]: e.target.checked })}
              />
              {key.replace('Enabled', '')}
            </label>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">Maintenance</h3>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!config.maintenanceMode}
              onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
            />
            Maintenance mode
          </label>
          <div>
            <label className="text-sm text-slate-400">Message</label>
            <textarea
              value={(config.maintenanceMessage as string) || ''}
              onChange={(e) => setConfig({ ...config, maintenanceMessage: e.target.value || null })}
              className="mt-1 w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none"
              rows={2}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">OTA / Version</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">Latest Version</label>
              <input
                value={(config.latestVersion as string) || ''}
                onChange={(e) => setConfig({ ...config, latestVersion: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Minimum Version</label>
              <input
                value={(config.minimumSupportedVersion as string) || ''}
                onChange={(e) => setConfig({ ...config, minimumSupportedVersion: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400">Update APK URL</label>
            <input
              value={(config.updateUrl as string) || ''}
              onChange={(e) => setConfig({ ...config, updateUrl: e.target.value || null })}
              className="mt-1 w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!config.forceUpdate}
              onChange={(e) => setConfig({ ...config, forceUpdate: e.target.checked })}
            />
            Force update
          </label>
        </div>
      </div>
    </div>
  )
}
