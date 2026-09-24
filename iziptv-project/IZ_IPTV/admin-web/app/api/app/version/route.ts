import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success, error, ErrorCodes } from '@/lib/response'

export async function GET(req: NextRequest) {
  try {
    let config = await prisma.appConfig.findUnique({ where: { id: 'default' } })
    if (!config) {
      config = await prisma.appConfig.create({ data: { id: 'default' } })
    }

    return success({
      latestVersion: config.latestVersion,
      minimumSupportedVersion: config.minimumSupportedVersion,
      updateUrl: config.updateUrl,
      releaseNotes: config.releaseNotes,
      forceUpdate: config.forceUpdate,
    })
  } catch (e) {
    console.error('Version error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
