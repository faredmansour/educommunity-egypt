# EduCommunity Egypt — Backend API

Node.js + Express + MongoDB backend for EduCommunity Egypt. The current implementation uses controllers, services, validators, JWT access/refresh tokens, Socket.IO, Redis-ready realtime infrastructure, and Cloudinary-backed uploads.

## Current stack

- Node.js 20
- Express
- MongoDB / Mongoose
- JWT access token (15m) + refresh token (7d)
- bcryptjs
- Socket.IO
- Redis-ready Socket.IO adapter path for horizontal scaling
- Cloudinary + Multer

## Security defaults

- Public registration cannot create admin/supervisor accounts.
- National ID is not collected by the public demo flow.
- Uploads require extension + MIME allowlisting and are capped at 25 MB.
- Local upload filenames are randomized.
- Passwords are never returned in JSON serialization.

## Run locally

```bash
npm install
cp .env.example .env
npm test
npm run dev
```

API: `http://localhost:5000`

Health: `GET /api/v1/health`

## Demo seed

```bash
npm run seed
```

Seed data is synthetic and intended only for local demonstration.

## Socket.IO scaling

A ready integration is implemented in `src/config/socket.js`. For multi-instance ECS deployments, install the optional packages:

```bash
npm install @socket.io/redis-adapter redis
```

Then enable:

```env
SOCKET_REDIS_ADAPTER=true
REDIS_URL=rediss://...
```

For a single local instance, leave the adapter disabled.

## Main API groups

- `/api/v1/auth` — registration, login, refresh, profile
- `/api/v1/materials` — educational materials + approval workflow
- `/api/v1/lessons` — online lessons
- `/api/v1/chat` — message history and uploads
- `/api/v1/teachers` — teacher discovery and ratings
- `/api/v1/shifts` — teacher shifts
- `/api/v1/attendance` — teacher attendance
- `/api/v1/posts` — community posts/comments
- `/api/v1/challenges` — challenges/submissions
- `/api/v1/rewards` — rewards
- `/api/v1/leaderboard` — rankings
- `/api/v1/admin` — admin operations
