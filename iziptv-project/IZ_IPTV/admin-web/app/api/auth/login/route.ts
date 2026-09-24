import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  verifyPassword,
  createAccessToken,
  createRefreshToken,
} from '@/lib/auth'
import { success, error, ErrorCodes } from '@/lib/response'

const loginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(128),
  deviceId: z.string().min(1).max(128),
  deviceInfo: z
    .object({
      model: z.string().optional(),
      manufacturer: z.string().optional(),
      androidVersion: z.string().optional(),
      appVersion: z.string().optional(),
    })
    .optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return error(ErrorCodes.VALIDATION_ERROR, 'Invalid login data', 400, parsed.error.flatten())
    }

    const { username, password, deviceId, deviceInfo } = parsed.data

    // Rate limiting check (simple in-memory style - use Redis in production)
    // For production, implement proper rate limiting with Vercel KV or Upstash

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { expiryDate: 'desc' },
          take: 1,
        },
        devices: true,
      },
    })

    if (!user) {
      return error(ErrorCodes.INVALID_CREDENTIALS, 'Invalid username or password', 401)
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return error(ErrorCodes.INVALID_CREDENTIALS, 'Invalid username or password', 401)
    }

    // Account status checks
    if (user.status === 'INACTIVE') {
      return error(ErrorCodes.ACCOUNT_INACTIVE, 'Your account is inactive. Contact your ISP.', 403)
    }
    if (user.status === 'SUSPENDED') {
      return error(ErrorCodes.ACCOUNT_SUSPENDED, 'Your account has been suspended.', 403)
    }
    if (user.status === 'BLOCKED') {
      return error(ErrorCodes.ACCOUNT_BLOCKED, 'Your account has been blocked.', 403)
    }
    if (user.status === 'EXPIRED') {
      return error(ErrorCodes.ACCOUNT_EXPIRED, 'Your account has expired.', 403)
    }

    // Subscription check
    const subscription = user.subscriptions[0]
    if (!subscription) {
      return error(ErrorCodes.SUBSCRIPTION_EXPIRED, 'No active subscription found.', 403)
    }
    if (subscription.expiryDate < new Date()) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'EXPIRED' },
      })
      return error(ErrorCodes.SUBSCRIPTION_EXPIRED, 'Your subscription has expired.', 403)
    }
    if (subscription.status === 'SUSPENDED') {
      return error(ErrorCodes.SUBSCRIPTION_SUSPENDED, 'Your subscription is suspended.', 403)
    }

    // Device handling
    let device = await prisma.device.findUnique({ where: { deviceId } })

    if (device) {
      if (device.status === 'BLOCKED') {
        return error(ErrorCodes.DEVICE_BLOCKED, 'This device has been blocked.', 403)
      }
      if (device.userId && device.userId !== user.id) {
        return error(
          ErrorCodes.DEVICE_NOT_AUTHORIZED,
          'This device is registered to another account.',
          403
        )
      }
      if (device.status === 'INACTIVE') {
        return error(ErrorCodes.DEVICE_NOT_AUTHORIZED, 'This device is not authorized. Contact your ISP.', 403)
      }
    } else {
      // New device - check device limit
      const activeDevices = user.devices.filter(
        (d) => d.status === 'ACTIVE' || d.status === 'PENDING'
      )
      const limit = subscription.deviceLimit || user.deviceLimit
      if (activeDevices.length >= limit) {
        return error(
          ErrorCodes.DEVICE_LIMIT_EXCEEDED,
          `Device limit reached (${limit}). Unbind a device from Admin or contact support.`,
          403
        )
      }

      device = await prisma.device.create({
        data: {
          deviceId,
          userId: user.id,
          model: deviceInfo?.model,
          manufacturer: deviceInfo?.manufacturer,
          androidVersion: deviceInfo?.androidVersion,
          appVersion: deviceInfo?.appVersion,
          status: 'PENDING', // Admin must activate, or auto-activate if first device
          lastSeenAt: new Date(),
          lastIp: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        },
      })

      // Auto-activate if this is the first device and limit allows
      if (activeDevices.length === 0) {
        device = await prisma.device.update({
          where: { id: device.id },
          data: { status: 'ACTIVE' },
        })
      }
    }

    // If device is still PENDING, reject until admin activates
    if (device.status === 'PENDING') {
      return error(
        ErrorCodes.DEVICE_NOT_AUTHORIZED,
        'Device pending activation. Contact your ISP administrator.',
        403
      )
    }

    // Update device last seen
    await prisma.device.update({
      where: { id: device.id },
      data: {
        lastSeenAt: new Date(),
        lastIp: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        appVersion: deviceInfo?.appVersion || device.appVersion,
        userId: user.id,
      },
    })

    // Create session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        deviceId: device.id,
        accessToken: 'pending',
        refreshToken: 'pending',
        expiresAt,
        refreshExpiresAt,
      },
    })

    const accessToken = await createAccessToken({
      userId: user.id,
      sessionId: session.id,
      deviceId: device.deviceId,
    })
    const refreshToken = await createRefreshToken({
      userId: user.id,
      sessionId: session.id,
    })

    await prisma.session.update({
      where: { id: session.id },
      data: { accessToken, refreshToken },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return success({
      accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        status: user.status,
      },
      subscription: {
        planName: subscription.planName,
        expiryDate: subscription.expiryDate.toISOString(),
        status: subscription.status,
        deviceLimit: subscription.deviceLimit,
      },
      device: {
        deviceId: device.deviceId,
        status: device.status,
      },
    })
  } catch (e) {
    console.error('Login error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
