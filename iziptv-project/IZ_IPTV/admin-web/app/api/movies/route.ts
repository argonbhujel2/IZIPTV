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
    const genre = searchParams.get('genre')
    const featured = searchParams.get('featured')

    const movies = await prisma.movie.findMany({
      where: {
        enabled: true,
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
        ...(genre ? { genre: { contains: genre, mode: 'insensitive' } } : {}),
        ...(featured === 'true' ? { featured: true } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    })

    return success(
      movies.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        posterUrl: m.posterUrl,
        backdropUrl: m.backdropUrl,
        genre: m.genre,
        year: m.year,
        duration: m.duration,
        rating: m.rating,
        streamUrl: m.streamUrl,
        trailerUrl: m.trailerUrl,
        featured: m.featured,
      }))
    )
  } catch (e) {
    console.error('Movies error:', e)
    return error(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
  }
}
