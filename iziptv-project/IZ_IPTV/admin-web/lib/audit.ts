import { prisma } from './prisma'

export async function logAudit(params: {
  adminId?: string
  action: string
  targetType?: string
  targetId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata || undefined,
        ipAddress: params.ipAddress,
      },
    })
  } catch (e) {
    console.error('Audit log failed:', e)
  }
}
