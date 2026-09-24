import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'
import { success, error, ErrorCodes } from '@/lib/response'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req)
    if (!auth) {
      return error(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401)
    }

    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get('deviceId')

    if (!deviceId) {
      return error(ErrorCodes.VALIDATION_ERROR, 'deviceId required', 400)
    }

    const device = await prisma.device.findUnique({ where: { deviceId } })
    if (!device) {
      return error(ErrorCodes.NOT_FOUND, 'Device not found', 404)
    }

    return success({
      deviceId: device.deviceId,
      status: device.status,
      model: device.model,
      appVersion: device.appVersion,
      lastSeenAt: device.lastSeenAt?.toISOString(),
    })
  } catch (e) {
    console.error('Device status error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}

export async function POST(req: NextRequest) {
  // Heartbeat
  try {
    const auth = await getAuthFromRequest(req)
    if (!auth || !auth.device) {
      return error(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401)
    }

    await prisma.device.update({
      where: { id: auth.device.id },
      data: {
        lastSeenAt: new Date(),
        lastIp: req.headers.get('x-forwarded-for') || undefined,
      },
    })

    return success({ ok: true, serverTime: new Date().toISOString() })
  } catch (e) {
    console.error('Heartbeat error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
