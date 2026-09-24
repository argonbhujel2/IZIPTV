import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest, hashPassword, checkAdminPermission } from '@/lib/auth'
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
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscriptions: { orderBy: { expiryDate: 'desc' }, take: 1 },
          devices: { select: { id: true, deviceId: true, status: true, model: true, lastSeenAt: true } },
          _count: { select: { devices: true, sessions: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    return success({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        phone: u.phone,
        status: u.status,
        deviceLimit: u.deviceLimit,
        lastLoginAt: u.lastLoginAt?.toISOString(),
        createdAt: u.createdAt.toISOString(),
        subscription: u.subscriptions[0]
          ? {
              planName: u.subscriptions[0].planName,
              expiryDate: u.subscriptions[0].expiryDate.toISOString(),
              status: u.subscriptions[0].status,
            }
          : null,
        devices: u.devices,
        deviceCount: u._count.devices,
        sessionCount: u._count.sessions,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (e) {
    console.error('Admin users list error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}

const createSchema = z.object({
  username: z.string().min(3).max(64),
  password: z.string().min(6).max(128),
  fullName: z.string().min(1).max(128),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  deviceLimit: z.number().int().min(1).max(10).default(2),
  planName: z.string().default('Standard'),
  expiryDate: z.string(), // ISO date
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED']).default('ACTIVE'),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminFromRequest(req)
    if (!auth) return error(ErrorCodes.UNAUTHORIZED, 'Admin auth required', 401)
    if (!checkAdminPermission(auth.admin.role, ['SUPER_ADMIN', 'ADMIN'])) {
      return error(ErrorCodes.FORBIDDEN, 'Insufficient permissions', 403)
    }

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return error(ErrorCodes.VALIDATION_ERROR, 'Invalid data', 400, parsed.error.flatten())
    }

    const existing = await prisma.user.findUnique({
      where: { username: parsed.data.username.toLowerCase() },
    })
    if (existing) {
      return error(ErrorCodes.CONFLICT, 'Username already exists', 409)
    }

    const passwordHash = await hashPassword(parsed.data.password)

    const user = await prisma.user.create({
      data: {
        username: parsed.data.username.toLowerCase(),
        passwordHash,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        deviceLimit: parsed.data.deviceLimit,
        status: parsed.data.status,
        subscriptions: {
          create: {
            planName: parsed.data.planName,
            expiryDate: new Date(parsed.data.expiryDate),
            status: 'ACTIVE',
            deviceLimit: parsed.data.deviceLimit,
          },
        },
      },
      include: { subscriptions: true },
    })

    await logAudit({
      adminId: auth.admin.id,
      action: 'USER_CREATED',
      targetType: 'user',
      targetId: user.id,
      metadata: { username: user.username },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    })

    return success(
      {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        status: user.status,
      },
      201
    )
  } catch (e) {
    console.error('Admin create user error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
