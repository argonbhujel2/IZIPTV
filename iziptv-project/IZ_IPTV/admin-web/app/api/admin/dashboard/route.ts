import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'
import { success, error, ErrorCodes } from '@/lib/response'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminFromRequest(req)
    if (!auth) {
      return error(ErrorCodes.UNAUTHORIZED, 'Admin authentication required', 401)
    }

    const now = new Date()
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      expiredSubs,
      totalDevices,
      activeDevices,
      blockedDevices,
      onlineDevices,
      totalChannels,
      activeChannels,
      totalMovies,
      totalSeries,
      expiringSoon,
      config,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: { in: ['INACTIVE', 'SUSPENDED', 'BLOCKED'] } } }),
      prisma.subscription.count({ where: { status: 'EXPIRED' } }),
      prisma.device.count(),
      prisma.device.count({ where: { status: 'ACTIVE' } }),
      prisma.device.count({ where: { status: 'BLOCKED' } }),
      prisma.device.count({ where: { status: 'ACTIVE', lastSeenAt: { gte: fiveMinutesAgo } } }),
      prisma.channel.count(),
      prisma.channel.count({ where: { enabled: true } }),
      prisma.movie.count({ where: { enabled: true } }),
      prisma.series.count({ where: { enabled: true } }),
      prisma.subscription.count({
        where: { status: 'ACTIVE', expiryDate: { lte: sevenDays, gte: now } },
      }),
      prisma.appConfig.findUnique({ where: { id: 'default' } }),
    ])

    return success({
      users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers },
      subscriptions: { expired: expiredSubs, expiringSoon },
      devices: {
        total: totalDevices,
        active: activeDevices,
        blocked: blockedDevices,
        online: onlineDevices,
      },
      content: {
        channels: totalChannels,
        activeChannels,
        movies: totalMovies,
        series: totalSeries,
      },
      app: {
        latestVersion: config?.latestVersion || '1.0.0',
        minimumSupportedVersion: config?.minimumSupportedVersion || '1.0.0',
        maintenanceMode: config?.maintenanceMode || false,
      },
      serverStatus: 'online',
    })
  } catch (e) {
    console.error('Dashboard error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
