import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'
import { success, error, ErrorCodes } from '@/lib/response'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req)
    if (!auth) {
      return error(ErrorCodes.UNAUTHORIZED, 'Not authenticated', 401)
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId: auth.user.id, status: 'ACTIVE' },
      orderBy: { expiryDate: 'desc' },
    })

    if (!subscription || subscription.expiryDate < new Date()) {
      return error(ErrorCodes.SUBSCRIPTION_EXPIRED, 'Subscription expired', 403)
    }

    if (auth.device && auth.device.status !== 'ACTIVE') {
      return error(ErrorCodes.DEVICE_NOT_AUTHORIZED, 'Device not authorized', 403)
    }

    // Heartbeat - update last seen
    if (auth.device) {
      await prisma.device.update({
        where: { id: auth.device.id },
        data: { lastSeenAt: new Date() },
      })
    }

    return success({
      user: {
        id: auth.user.id,
        username: auth.user.username,
        fullName: auth.user.fullName,
        status: auth.user.status,
      },
      subscription: {
        planName: subscription.planName,
        expiryDate: subscription.expiryDate.toISOString(),
        status: subscription.status,
        deviceLimit: subscription.deviceLimit,
      },
      device: auth.device
        ? {
            deviceId: auth.device.deviceId,
            status: auth.device.status,
            model: auth.device.model,
          }
        : null,
    })
  } catch (e) {
    console.error('Session error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
