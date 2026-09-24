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

    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')

    const channels = await prisma.channel.findMany({
      where: {
        enabled: true,
        ...(categoryId ? { categoryId } : {}),
        ...(search
          ? { name: { contains: search, mode: 'insensitive' } }
          : {}),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { number: 'asc' }, { name: 'asc' }],
    })

    return success(
      channels.map((c) => ({
        id: c.id,
        name: c.name,
        logoUrl: c.logoUrl,
        streamUrl: c.streamUrl,
        number: c.number,
        description: c.description,
        category: c.category,
        sortOrder: c.sortOrder,
      }))
    )
  } catch (e) {
    console.error('Channels error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
