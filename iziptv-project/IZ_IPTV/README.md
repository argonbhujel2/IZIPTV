# IZ_IPTV — Commercial ISP Android TV Platform

Production-ready foundation for an ISP-managed Android TV IPTV ecosystem.

```
Admin Panel (Next.js)  ──HTTPS──►  Vercel API (Next.js + Prisma)  ──►  Neon PostgreSQL
IZ_IPTV APK (Kotlin)   ──HTTPS──►  same Vercel API
```

---

## Contents

| Path | Description |
|------|-------------|
| `admin-web/` | Next.js Admin Panel + REST API (deploy to Vercel) |
| `admin-web/prisma/` | Prisma schema + seed |
| `android-tv/` | Kotlin Android TV application |
| `.env.example` | Environment variable template |
| `docs/` | Additional documentation |

---

## 1. Neon PostgreSQL Setup

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the connection strings:
   - `DATABASE_URL` (pooled)
   - `DIRECT_URL` (direct, for migrations)
3. Add them to `admin-web/.env.local` (see `.env.example`).

```bash
cd admin-web
cp ../.env.example .env.local
# Edit .env.local with real values
npm install
npx prisma db push
npm run db:seed
```

**Seed credentials:**

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `Admin@IZ2026!` |
| TV User | `demo` | `demo1234` |

Change these immediately in production.

---

## 2. Vercel Deployment (API + Admin)

1. Push the repo to GitHub.
2. Import `admin-web` as a Vercel project (root directory: `admin-web`).
3. Set environment variables in Vercel:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET` (32+ random chars)
   - `ADMIN_SESSION_SECRET` (32+ random chars)
   - `CORS_ORIGIN` (optional)
4. Deploy. Prisma generate runs on build.
5. After first deploy, run migrations if needed:
   ```bash
   npx prisma migrate deploy
   ```
   Or use `db push` from a machine with `DATABASE_URL` set.

Admin panel: `https://your-app.vercel.app/auth/login`  
API base: `https://your-app.vercel.app/api/...`

---

## 3. Android TV Build

### Prerequisites
- Android Studio Hedgehog+ / JDK 17
- Android TV emulator or physical device (API 28+)

### Configure API URL

In `android-tv/app/build.gradle.kts`:

```kotlin
buildConfigField("String", "API_BASE_URL", "\"https://your-app.vercel.app\"")
```

Debug default points to `http://10.0.2.2:3000` (emulator → host localhost).

### Build

```bash
cd android-tv
# Open in Android Studio, or:
./gradlew assembleDebug   # after generating wrapper
```

Install on device/emulator. Use Leanback launcher.

### First login flow
1. Splash → network check → session restore or Login
2. Username / Password (mandatory — no guest mode)
3. Device registration + limit enforcement
4. Subscription validation
5. Welcome + Home (Live TV / Movies / Series / YouTube / Netflix / Settings)

---

## 4. API Overview

### Subscriber (Bearer token after login)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login + device bind |
| POST | `/api/auth/logout` | End session |
| POST | `/api/auth/refresh` | Refresh tokens |
| GET | `/api/auth/session` | Validate session |
| GET | `/api/config` | Remote config, banners, apps |
| GET | `/api/channels` | Live channels |
| GET | `/api/categories` | Categories |
| GET | `/api/movies` | Movies |
| GET | `/api/series` | Series (+ `?id=` for detail) |
| GET | `/api/app/version` | OTA version info |
| POST | `/api/device/register` | Register device |
| GET/POST | `/api/device/status` | Status / heartbeat |

### Admin (Bearer admin token)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/dashboard` | Stats |
| GET/POST | `/api/admin/users` | List / create users |
| GET/PATCH | `/api/admin/devices` | List / activate/block/unbind |
| GET/PATCH | `/api/admin/config` | Home + OTA config |
| GET/POST/PATCH/DELETE | `/api/admin/channels` | Channel CRUD |

Response format:

```json
{ "success": true, "data": { } }
{ "success": false, "error": { "code": "SUBSCRIPTION_EXPIRED", "message": "..." } }
```

---

## 5. Security Checklist (Production)

- [ ] Strong unique `JWT_SECRET` and `ADMIN_SESSION_SECRET`
- [ ] Neon credentials only in Vercel env (never in APK)
- [ ] HTTPS only (Vercel default)
- [ ] Change seed admin/demo passwords
- [ ] Enable R8 on Android release builds
- [ ] Restrict CORS to known admin origins
- [ ] Rate-limit login endpoints (e.g. Upstash Redis)
- [ ] Object storage/CDN for images (do not store blobs in Postgres)
- [ ] Audit logs reviewed periodically
- [ ] Device activation policy (auto first device vs admin approval)
- [ ] Licensed stream sources only (replace demo HLS URLs)

---

## 6. Important Deployment Notes

### YouTube / Netflix
- Pre-install official apps via **device/firmware provisioning**.
- IZ_IPTV only **detects package presence** and **launches** them.
- Does **not** embed or silently install proprietary apps.

### Play Store
- Not shown in IZ_IPTV UI by design.

### EPG
- Not required in this version.

### Streams
- Seed includes legal public demo HLS/MP4 streams for testing.
- Replace with ISP-licensed streams in Admin → Channels.

### Home background
- Set URL in Admin → Home Config → Publish.
- App fetches via `GET /api/config` and can cache locally.

### OTA
- Configure `latestVersion`, `minimumSupportedVersion`, `updateUrl`, `forceUpdate` in Home Config.
- App checks `GET /api/app/version`. Silent install is **not** performed by the APK without platform support.

---

## 7. Local Development Quick Start

```bash
# Terminal 1 — API + Admin
cd admin-web
cp ../.env.example .env.local   # fill Neon URLs + secrets
npm install
npx prisma db push
npm run db:seed
npm run dev                     # http://localhost:3000

# Terminal 2 — Android
# Open android-tv in Android Studio
# Set API_BASE_URL to http://10.0.2.2:3000 for emulator
# Run on TV emulator / device
```

Admin: http://localhost:3000/auth/login  
Login: `admin` / `Admin@IZ2026!`

TV app: `demo` / `demo1234`

---

## 8. Architecture Summary

- **Auth**: bcrypt password hashes, JWT access + refresh tokens, server-side session rows
- **Devices**: App-generated persistent `deviceId`, admin activate/block/unbind, concurrent limit
- **Subscriptions**: Expiry enforced on login and session check
- **Roles**: SUPER_ADMIN, ADMIN, CONTENT_MANAGER, SUPPORT (server-side)
- **Remote config**: Home background, sections, maintenance, OTA, apps
- **Player**: Media3 ExoPlayer — HLS / DASH / MP4, retry, buffer UI

This is a maintainable commercial foundation. Extend admin CRUD UIs, add image upload to R2/S3, and wire production stream providers as needed.
