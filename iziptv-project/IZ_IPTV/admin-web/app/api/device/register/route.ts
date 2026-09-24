import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'
import { success, error, ErrorCodes } from '@/lib/response'

const schema = z.object({
  deviceId: z.string().min(1).max(128),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  androidVersion: z.string().optional(),
  appVersion: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req)
    if (!auth) {
      return error(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401)
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return error(ErrorCodes.VALIDATION_ERROR, 'Invalid data', 400)
    }

    const { deviceId, model, manufacturer, androidVersion, appVersion } = parsed.data

    let device = await prisma.device.findUnique({ where: { deviceId } })

    if (device) {
      if (device.userId && device.userId !== auth.user.id) {
        return error(ErrorCodes.DEVICE_NOT_AUTHORIZED, 'Device belongs to another account', 403)
      }
      device = await prisma.device.update({
        where: { id: device.id },
        data: {
          userId: auth.user.id,
          model: model || device.model,
          manufacturer: manufacturer || device.manufacturer,
          androidVersion: androidVersion || device.androidVersion,
          appVersion: appVersion || device.appVersion,
          lastSeenAt: new Date(),
          lastIp: req.headers.get('x-forwarded-for') || undefined,
        },
      })
    } else {
      const activeCount = await prisma.device.count({
        where: {
          userId: auth.user.id,
          status: { in: ['ACTIVE', 'PENDING'] },
        },
      })
      const sub = await prisma.subscription.findFirst({
        where: { userId: auth.user.id, status: 'ACTIVE' },
      })
      const limit = sub?.deviceLimit || auth.user.deviceLimit
      if (activeCount >= limit) {
        return error(ErrorCodes.DEVICE_LIMIT_EXCEEDED, `Device limit (${limit}) reached`, 403)
      }

      device = await prisma.device.create({
        data: {
          deviceId,
          userId: auth.user.id,
          model,
          manufacturer,
          androidVersion,
          appVersion,
          status: activeCount === 0 ? 'ACTIVE' : 'PENDING',
          lastSeenAt: new Date(),
          lastIp: req.headers.get('x-forwarded-for') || undefined,
        },
      })
    }

    return success({
      deviceId: device.deviceId,
      status: device.status,
      model: device.model,
    })
  } catch (e) {
    console.error('Device register error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
