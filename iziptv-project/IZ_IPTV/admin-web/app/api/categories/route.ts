import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'
import { success, error, ErrorCodes } from '@/lib/response'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req)
    if (!auth) {
      return error(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401)
    }

    const categories = await prisma.category.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { channels: { where: { enabled: true } } } },
      },
    })

    return success(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        iconUrl: c.iconUrl,
        channelCount: c._count.channels,
        sortOrder: c.sortOrder,
      }))
    )
  } catch (e) {
    console.error('Categories error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
