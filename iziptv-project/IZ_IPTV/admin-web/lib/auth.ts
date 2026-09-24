import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars'
)
const ADMIN_SESSION_SECRET = new TextEncoder().encode(
  process.env.ADMIN_SESSION_SECRET || 'admin-dev-secret-change-in-production'
)

const ACCESS_TOKEN_EXPIRY = '24h'
const REFRESH_TOKEN_EXPIRY = '30d'
const ADMIN_TOKEN_EXPIRY = '8h'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createAccessToken(payload: {
  userId: string
  sessionId: string
  deviceId?: string
}): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

export async function createRefreshToken(payload: {
  userId: string
  sessionId: string
}): Promise<string> {
  return new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

export async function createAdminToken(payload: {
  adminId: string
  role: string
}): Promise<string> {
  return new SignJWT({ ...payload, type: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ADMIN_TOKEN_EXPIRY)
    .sign(ADMIN_SESSION_SECRET)
}

export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload.type !== 'access') return null
    return payload as { userId: string; sessionId: string; deviceId?: string; type: string }
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload.type !== 'refresh') return null
    return payload as { userId: string; sessionId: string; type: string }
  } catch {
    return null
  }
}

export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, ADMIN_SESSION_SECRET)
    if (payload.type !== 'admin') return null
    return payload as { adminId: string; role: string; type: string }
  } catch {
    return null
  }
}

export async function getAuthFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const payload = await verifyAccessToken(token)
  if (!payload) return null

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: { user: true, device: true },
  })
  if (!session || session.expiresAt < new Date()) return null
  if (session.accessToken !== token) return null

  return { session, user: session.user, device: session.device, payload }
}

export async function getAdminFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    const cookieStore = await cookies()
    token = cookieStore.get('admin_token')?.value || null
  }
  if (!token) return null

  const payload = await verifyAdminToken(token)
  if (!payload) return null

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.adminId },
  })
  if (!admin || !admin.enabled) return null

  return { admin, payload }
}

export function generateDeviceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'iztv-'
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function checkAdminPermission(
  role: string,
  required: ('SUPER_ADMIN' | 'ADMIN' | 'CONTENT_MANAGER' | 'SUPPORT')[]
): boolean {
  const hierarchy: Record<string, number> = {
    SUPER_ADMIN: 4,
    ADMIN: 3,
    CONTENT_MANAGER: 2,
    SUPPORT: 1,
  }
  const userLevel = hierarchy[role] || 0
  return required.some((r) => userLevel >= (hierarchy[r] || 0))
}
