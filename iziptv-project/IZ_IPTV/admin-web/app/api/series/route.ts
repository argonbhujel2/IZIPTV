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
    const search = searchParams.get('search')
    const id = searchParams.get('id')

    if (id) {
      const series = await prisma.series.findUnique({
        where: { id, enabled: true },
        include: {
          seasons: {
            where: { enabled: true },
            orderBy: { seasonNumber: 'asc' },
            include: {
              episodes: {
                where: { enabled: true },
                orderBy: { episodeNumber: 'asc' },
              },
            },
          },
        },
      })
      if (!series) {
        return error(ErrorCodes.NOT_FOUND, 'Series not found', 404)
      }
      return success({
        id: series.id,
        title: series.title,
        description: series.description,
        posterUrl: series.posterUrl,
        backdropUrl: series.backdropUrl,
        genre: series.genre,
        year: series.year,
        featured: series.featured,
        seasons: series.seasons.map((s) => ({
          id: s.id,
          seasonNumber: s.seasonNumber,
          title: s.title,
          posterUrl: s.posterUrl,
          episodes: s.episodes.map((e) => ({
            id: e.id,
            episodeNumber: e.episodeNumber,
            title: e.title,
            description: e.description,
            thumbnailUrl: e.thumbnailUrl,
            streamUrl: e.streamUrl,
            duration: e.duration,
          })),
        })),
      })
    }

    const seriesList = await prisma.series.findMany({
      where: {
        enabled: true,
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      include: {
        _count: { select: { seasons: true } },
      },
    })

    return success(
      seriesList.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        posterUrl: s.posterUrl,
        backdropUrl: s.backdropUrl,
        genre: s.genre,
        year: s.year,
        featured: s.featured,
        seasonCount: s._count.seasons,
      }))
    )
  } catch (e) {
    console.error('Series error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
