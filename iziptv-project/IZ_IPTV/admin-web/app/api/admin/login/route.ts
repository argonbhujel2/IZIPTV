import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createAdminToken } from '@/lib/auth'
import { success, error, ErrorCodes } from '@/lib/response'
import { logAudit } from '@/lib/audit'

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return error(ErrorCodes.VALIDATION_ERROR, 'Invalid credentials format', 400)
    }

    const admin = await prisma.adminUser.findUnique({
      where: { username: parsed.data.username.toLowerCase() },
    })

    if (!admin || !admin.enabled) {
      return error(ErrorCodes.INVALID_CREDENTIALS, 'Invalid username or password', 401)
    }

    const valid = await verifyPassword(parsed.data.password, admin.passwordHash)
    if (!valid) {
      return error(ErrorCodes.INVALID_CREDENTIALS, 'Invalid username or password', 401)
    }

    const token = await createAdminToken({ adminId: admin.id, role: admin.role })

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    })

    await logAudit({
      adminId: admin.id,
      action: 'ADMIN_LOGIN',
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    })

    const response = success({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName,
        role: admin.role,
      },
    })

    // Also set cookie for browser sessions
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60,
      path: '/',
    })

    return response
  } catch (e) {
    console.error('Admin login error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
