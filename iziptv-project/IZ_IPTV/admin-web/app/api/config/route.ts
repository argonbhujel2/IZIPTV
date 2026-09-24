import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'
import { success, error, ErrorCodes } from '@/lib/response'

export async function GET(req: NextRequest) {
  try {
    // Config can be partially public, but full config requires auth for sensitive fields
    const auth = await getAuthFromRequest(req)

    let config = await prisma.appConfig.findUnique({ where: { id: 'default' } })
    if (!config) {
      config = await prisma.appConfig.create({
        data: { id: 'default' },
      })
    }

    if (config.maintenanceMode && !auth) {
      return error(ErrorCodes.MAINTENANCE_MODE, config.maintenanceMessage || 'Service temporarily unavailable.', 503)
    }

    const banners = await prisma.banner.findMany({
      where: {
        enabled: true,
        OR: [
          { startsAt: null, endsAt: null },
          { startsAt: { lte: new Date() }, endsAt: null },
          { startsAt: null, endsAt: { gte: new Date() } },
          { startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    })

    const apps = await prisma.app.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
    })

    return success({
      appName: config.appName,
      logoUrl: config.logoUrl,
      homeBackgroundUrl: config.homeBackgroundEnabled ? config.homeBackgroundUrl : null,
      homeBackgroundEnabled: config.homeBackgroundEnabled,
      maintenanceMode: config.maintenanceMode,
      maintenanceMessage: config.maintenanceMessage,
      liveTvEnabled: config.liveTvEnabled,
      moviesEnabled: config.moviesEnabled,
      seriesEnabled: config.seriesEnabled,
      appsEnabled: config.appsEnabled,
      youtubeEnabled: config.youtubeEnabled,
      netflixEnabled: config.netflixEnabled,
      latestVersion: config.latestVersion,
      minimumSupportedVersion: config.minimumSupportedVersion,
      updateUrl: config.updateUrl,
      releaseNotes: config.releaseNotes,
      forceUpdate: config.forceUpdate,
      banners: banners.map((b) => ({
        id: b.id,
        title: b.title,
        description: b.description,
        imageUrl: b.imageUrl,
        action: b.action,
        actionValue: b.actionValue,
      })),
      apps: apps.map((a) => ({
        id: a.id,
        name: a.name,
        packageName: a.packageName,
        iconUrl: a.iconUrl,
        homeVisible: a.homeVisible,
      })),
    })
  } catch (e) {
    console.error('Config error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
