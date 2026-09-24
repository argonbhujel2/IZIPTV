/**
 * IZ_IPTV Database Seed
 * Run: npx tsx prisma/seed.ts
 * Or: npm run db:seed (from admin-web with DATABASE_URL set)
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding IZ_IPTV database...')

  // Super Admin
  const adminHash = await bcrypt.hash('Admin@IZ2026!', 12)
  const admin = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminHash,
      fullName: 'IZ Super Admin',
      email: 'admin@iziptv.local',
      role: 'SUPER_ADMIN',
    },
  })
  console.log('Admin created:', admin.username)

  // Demo subscriber
  const userHash = await bcrypt.hash('demo1234', 12)
  const user = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      passwordHash: userHash,
      fullName: 'Demo Subscriber',
      phone: '+9779800000000',
      status: 'ACTIVE',
      deviceLimit: 2,
      subscriptions: {
        create: {
          planName: 'Premium',
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          deviceLimit: 2,
        },
      },
    },
  })
  console.log('Demo user created:', user.username)

  // App Config
  await prisma.appConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      appName: 'IZ_IPTV',
      homeBackgroundEnabled: true,
      maintenanceMode: false,
      liveTvEnabled: true,
      moviesEnabled: true,
      seriesEnabled: true,
      appsEnabled: true,
      youtubeEnabled: true,
      netflixEnabled: true,
      latestVersion: '1.0.0',
      minimumSupportedVersion: '1.0.0',
      forceUpdate: false,
    },
  })
  console.log('App config created')

  // Categories
  const categories = [
    { name: 'News', slug: 'news', sortOrder: 1 },
    { name: 'Sports', slug: 'sports', sortOrder: 2 },
    { name: 'Entertainment', slug: 'entertainment', sortOrder: 3 },
    { name: 'Kids', slug: 'kids', sortOrder: 4 },
    { name: 'Music', slug: 'music', sortOrder: 5 },
    { name: 'International', slug: 'international', sortOrder: 6 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }
  console.log('Categories created')

  const newsCat = await prisma.category.findUnique({ where: { slug: 'news' } })
  const sportsCat = await prisma.category.findUnique({ where: { slug: 'sports' } })
  const intlCat = await prisma.category.findUnique({ where: { slug: 'international' } })

  // Free/public test channels (legal open streams for development)
  // These are example public domain / freely available streams for testing only.
  // Replace with licensed ISP streams in production.
  const channels = [
    {
      name: 'Big Buck Bunny (Demo)',
      streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      categoryId: intlCat?.id,
      number: 1,
      sortOrder: 1,
      description: 'Demo HLS stream for testing playback',
    },
    {
      name: 'Sintel (Demo)',
      streamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
      categoryId: intlCat?.id,
      number: 2,
      sortOrder: 2,
      description: 'Open movie demo stream',
    },
    {
      name: 'Tears of Steel (Demo)',
      streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      categoryId: intlCat?.id,
      number: 3,
      sortOrder: 3,
      description: 'Demo adaptive stream',
    },
  ]

  for (const ch of channels) {
    const existing = await prisma.channel.findFirst({ where: { name: ch.name } })
    if (!existing) {
      await prisma.channel.create({ data: ch })
    }
  }
  console.log('Demo channels created')

  // Apps
  const apps = [
    { name: 'YouTube', packageName: 'com.google.android.youtube.tv', homeVisible: true, sortOrder: 1 },
    { name: 'Netflix', packageName: 'com.netflix.ninja', homeVisible: true, sortOrder: 2 },
    { name: 'Settings', packageName: 'com.android.tv.settings', homeVisible: false, sortOrder: 99 },
  ]

  for (const app of apps) {
    await prisma.app.upsert({
      where: { packageName: app.packageName },
      update: {},
      create: app,
    })
  }
  console.log('Apps created')

  // Sample movie
  const existingMovie = await prisma.movie.findFirst({ where: { title: 'Big Buck Bunny' } })
  if (!existingMovie) {
    await prisma.movie.create({
      data: {
        title: 'Big Buck Bunny',
        description: 'A large and lovable rabbit deals with three tiny bullies.',
        genre: 'Animation',
        year: 2008,
        duration: 10,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        featured: true,
        enabled: true,
        sortOrder: 1,
      },
    })
  }
  console.log('Sample movie created')

  console.log('\n✅ Seed complete!')
  console.log('─────────────────────────────')
  console.log('Admin login:  admin / Admin@IZ2026!')
  console.log('TV login:     demo  / demo1234')
  console.log('─────────────────────────────')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
