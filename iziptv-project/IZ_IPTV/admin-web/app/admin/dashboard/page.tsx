'use client'

import { useEffect, useState } from 'react'

interface DashboardData {
  users: { total: number; active: number; inactive: number }
  subscriptions: { expired: number; expiringSoon: number }
  devices: { total: number; active: number; blocked: number; online: number }
  content: { channels: number; activeChannels: number; movies: number; series: number }
  app: { latestVersion: string; minimumSupportedVersion: string; maintenanceMode: boolean }
  serverStatus: string
}

function Card({ title, value, sub, color }: { title: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${color || 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    fetch('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setData(j.data)
        else setError(j.error?.message || 'Failed to load')
      })
      .catch(() => setError('Network error'))
  }, [])

  if (error) {
    return <div className="text-red-400">{error}</div>
  }
  if (!data) {
    return <div className="text-slate-400 animate-pulse">Loading dashboard…</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">IZ_IPTV Platform Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              data.serverStatus === 'online' ? 'bg-green-400' : 'bg-red-400'
            }`}
          />
          <span className="text-sm text-slate-400">
            Server: {data.serverStatus}
          </span>
          {data.app.maintenanceMode && (
            <span className="ml-3 px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Maintenance Mode
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card title="Total Users" value={data.users.total} sub={`${data.users.active} active`} color="text-sky-400" />
        <Card title="Active Devices" value={data.devices.active} sub={`${data.devices.online} online now`} color="text-green-400" />
        <Card title="Expiring Soon" value={data.subscriptions.expiringSoon} sub="Within 7 days" color="text-amber-400" />
        <Card title="Active Channels" value={data.content.activeChannels} sub={`${data.content.movies} movies · ${data.content.series} series`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Users</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Active</span><span>{data.users.active}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Inactive</span><span>{data.users.inactive}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Expired subs</span><span>{data.subscriptions.expired}</span></div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Devices</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Total</span><span>{data.devices.total}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Active</span><span>{data.devices.active}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Blocked</span><span>{data.devices.blocked}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Online</span><span className="text-green-400">{data.devices.online}</span></div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h3 className="font-semibold mb-3">App Version</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Latest</span><span>{data.app.latestVersion}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Minimum</span><span>{data.app.minimumSupportedVersion}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
