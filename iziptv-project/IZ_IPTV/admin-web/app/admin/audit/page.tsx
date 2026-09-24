'use client'
export default function Page() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>
      <p className="text-slate-400">Admin actions are recorded in audit_logs table. Query via Prisma for production log viewer.</p>
    </div>
  )
}
