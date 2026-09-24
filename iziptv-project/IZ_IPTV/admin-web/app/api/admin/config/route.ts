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

    let config = await prisma.appConfig.findUnique({ where: { id: 'default' } })
    if (!config) {
      config = await prisma.appConfig.create({ data: { id: 'default' } })
    }

    return success(config)
  } catch (e) {
    console.error('Admin config get error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}

const updateSchema = z.object({
  appName: z.string().optional(),
  logoUrl: z.string().url().nullable().optional(),
  homeBackgroundUrl: z.string().url().nullable().optional(),
  homeBackgroundEnabled: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().nullable().optional(),
  liveTvEnabled: z.boolean().optional(),
  moviesEnabled: z.boolean().optional(),
  seriesEnabled: z.boolean().optional(),
  appsEnabled: z.boolean().optional(),
  youtubeEnabled: z.boolean().optional(),
  netflixEnabled: z.boolean().optional(),
  latestVersion: z.string().optional(),
  minimumSupportedVersion: z.string().optional(),
  updateUrl: z.string().url().nullable().optional(),
  releaseNotes: z.string().nullable().optional(),
  forceUpdate: z.boolean().optional(),
})

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAdminFromRequest(req)
    if (!auth) return error(ErrorCodes.UNAUTHORIZED, 'Admin auth required', 401)
    if (!checkAdminPermission(auth.admin.role, ['SUPER_ADMIN', 'ADMIN'])) {
      return error(ErrorCodes.FORBIDDEN, 'Insufficient permissions', 403)
    }

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return error(ErrorCodes.VALIDATION_ERROR, 'Invalid data', 400, parsed.error.flatten())
    }

    const config = await prisma.appConfig.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...parsed.data },
      update: parsed.data,
    })

    await logAudit({
      adminId: auth.admin.id,
      action: 'CONFIG_UPDATED',
      targetType: 'app_config',
      targetId: 'default',
      metadata: parsed.data as Record<string, unknown>,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    })

    return success(config)
  } catch (e) {
    console.error('Admin config update error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
