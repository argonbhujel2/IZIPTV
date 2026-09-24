import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyRefreshToken, createAccessToken, createRefreshToken } from '@/lib/auth'
import { success, error, ErrorCodes } from '@/lib/response'

const schema = z.object({
  refreshToken: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return error(ErrorCodes.VALIDATION_ERROR, 'Invalid request', 400)
    }

    const payload = await verifyRefreshToken(parsed.data.refreshToken)
    if (!payload) {
      return error(ErrorCodes.TOKEN_INVALID, 'Invalid refresh token', 401)
    }

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: true, device: true },
    })

    if (!session || session.refreshToken !== parsed.data.refreshToken) {
      return error(ErrorCodes.TOKEN_INVALID, 'Invalid session', 401)
    }

    if (session.refreshExpiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } })
      return error(ErrorCodes.TOKEN_EXPIRED, 'Refresh token expired. Please login again.', 401)
    }

    if (session.user.status !== 'ACTIVE') {
      return error(ErrorCodes.ACCOUNT_INACTIVE, 'Account is not active', 403)
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const accessToken = await createAccessToken({
      userId: session.userId,
      sessionId: session.id,
      deviceId: session.device?.deviceId,
    })
    const refreshToken = await createRefreshToken({
      userId: session.userId,
      sessionId: session.id,
    })

    await prisma.session.update({
      where: { id: session.id },
      data: { accessToken, refreshToken, expiresAt, refreshExpiresAt },
    })

    return success({
      accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (e) {
    console.error('Refresh error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
