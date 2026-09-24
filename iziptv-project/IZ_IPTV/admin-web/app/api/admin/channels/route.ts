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

    const channels = await prisma.channel.findMany({
      include: { category: true },
      orderBy: [{ sortOrder: 'asc' }, { number: 'asc' }],
    })

    return success(channels)
  } catch (e) {
    console.error('Admin channels error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().url().optional().nullable(),
  streamUrl: z.string().url(),
  categoryId: z.string().optional().nullable(),
  number: z.number().int().optional().nullable(),
  description: z.string().optional().nullable(),
  enabled: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminFromRequest(req)
    if (!auth) return error(ErrorCodes.UNAUTHORIZED, 'Admin auth required', 401)
    if (!checkAdminPermission(auth.admin.role, ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'])) {
      return error(ErrorCodes.FORBIDDEN, 'Insufficient permissions', 403)
    }

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return error(ErrorCodes.VALIDATION_ERROR, 'Invalid data', 400, parsed.error.flatten())
    }

    const channel = await prisma.channel.create({ data: parsed.data })

    await logAudit({
      adminId: auth.admin.id,
      action: 'CHANNEL_CREATED',
      targetType: 'channel',
      targetId: channel.id,
      metadata: { name: channel.name },
    })

    return success(channel, 201)
  } catch (e) {
    console.error('Admin create channel error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAdminFromRequest(req)
    if (!auth) return error(ErrorCodes.UNAUTHORIZED, 'Admin auth required', 401)
    if (!checkAdminPermission(auth.admin.role, ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'])) {
      return error(ErrorCodes.FORBIDDEN, 'Insufficient permissions', 403)
    }

    const body = await req.json()
    const { id, ...data } = body
    if (!id) return error(ErrorCodes.VALIDATION_ERROR, 'id required', 400)

    const channel = await prisma.channel.update({
      where: { id },
      data,
    })

    await logAudit({
      adminId: auth.admin.id,
      action: 'CHANNEL_UPDATED',
      targetType: 'channel',
      targetId: id,
    })

    return success(channel)
  } catch (e) {
    console.error('Admin update channel error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAdminFromRequest(req)
    if (!auth) return error(ErrorCodes.UNAUTHORIZED, 'Admin auth required', 401)
    if (!checkAdminPermission(auth.admin.role, ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'])) {
      return error(ErrorCodes.FORBIDDEN, 'Insufficient permissions', 403)
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return error(ErrorCodes.VALIDATION_ERROR, 'id required', 400)

    await prisma.channel.delete({ where: { id } })

    await logAudit({
      adminId: auth.admin.id,
      action: 'CHANNEL_DELETED',
      targetType: 'channel',
      targetId: id,
    })

    return success({ message: 'Channel deleted' })
  } catch (e) {
    console.error('Admin delete channel error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
