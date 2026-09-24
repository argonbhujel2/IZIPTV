import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest, checkAdminPermission } from '@/lib/auth'
import { success, error, ErrorCodes } from '@/lib/response'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminFromRequest(req)
    if (!auth) return error(ErrorCodes.UNAUTHORIZED, 'Admin auth required', 401)
    if (!checkAdminPermission(auth.admin.role, ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'])) {
      return error(ErrorCodes.FORBIDDEN, 'Insufficient permissions', 403)
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (userId) where.userId = userId

    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { lastSeenAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, fullName: true } },
        },
      }),
      prisma.device.count({ where }),
    ])

    return success({
      devices: devices.map((d) => ({
        id: d.id,
        deviceId: d.deviceId,
        user: d.user,
        model: d.model,
        manufacturer: d.manufacturer,
        androidVersion: d.androidVersion,
        appVersion: d.appVersion,
        status: d.status,
        lastSeenAt: d.lastSeenAt?.toISOString(),
        lastIp: d.lastIp,
        firstSeenAt: d.firstSeenAt.toISOString(),
        createdAt: d.createdAt.toISOString(),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (e) {
    console.error('Admin devices error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}

const actionSchema = z.object({
  deviceId: z.string(),
  action: z.enum(['activate', 'deactivate', 'block', 'unblock', 'unbind', 'logout']),
  userId: z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAdminFromRequest(req)
    if (!auth) return error(ErrorCodes.UNAUTHORIZED, 'Admin auth required', 401)
    if (!checkAdminPermission(auth.admin.role, ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'])) {
      return error(ErrorCodes.FORBIDDEN, 'Insufficient permissions', 403)
    }

    const body = await req.json()
    const parsed = actionSchema.safeParse(body)
    if (!parsed.success) {
      return error(ErrorCodes.VALIDATION_ERROR, 'Invalid data', 400)
    }

    const device = await prisma.device.findUnique({ where: { deviceId: parsed.data.deviceId } })
    if (!device) {
      return error(ErrorCodes.NOT_FOUND, 'Device not found', 404)
    }

    const { action } = parsed.data

    switch (action) {
      case 'activate':
        await prisma.device.update({
          where: { id: device.id },
          data: { status: 'ACTIVE', userId: parsed.data.userId || device.userId },
        })
        break
      case 'deactivate':
        await prisma.device.update({
          where: { id: device.id },
          data: { status: 'INACTIVE' },
        })
        break
      case 'block':
        await prisma.device.update({
          where: { id: device.id },
          data: { status: 'BLOCKED' },
        })
        await prisma.session.deleteMany({ where: { deviceId: device.id } })
        break
      case 'unblock':
        await prisma.device.update({
          where: { id: device.id },
          data: { status: 'ACTIVE' },
        })
        break
      case 'unbind':
        await prisma.device.update({
          where: { id: device.id },
          data: { userId: null, status: 'PENDING' },
        })
        await prisma.session.deleteMany({ where: { deviceId: device.id } })
        break
      case 'logout':
        await prisma.session.deleteMany({ where: { deviceId: device.id } })
        break
    }

    await logAudit({
      adminId: auth.admin.id,
      action: `DEVICE_${action.toUpperCase()}`,
      targetType: 'device',
      targetId: device.id,
      metadata: { deviceId: device.deviceId, action },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    })

    return success({ message: `Device ${action} successful` })
  } catch (e) {
    console.error('Admin device action error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
