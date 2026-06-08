# Deployment Guide

## Environment Variables

### API (`apps/api`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` or `development` |
| `PORT` | No | Server port (default: 3001) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | Min 32-char random string |
| `JWT_ACCESS_EXPIRES_IN` | No | Access token TTL in seconds (default: 3600) |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh token TTL in seconds (default: 604800) |
| `CORS_ORIGIN` | Yes (prod) | Comma-separated allowed origins |

### Web (`apps/web`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | API base URL |
| `VITE_WS_URL` | Yes | WebSocket URL |

## Recommended Platforms

### Frontend (Vercel)

1. Connect your GitHub repo to Vercel
2. Set root directory: `apps/web`
3. Build command: `cd ../.. && pnpm turbo build --filter=@mandalorian-chess/web`
4. Output directory: `dist`
5. Set `VITE_API_URL` and `VITE_WS_URL` environment variables

### Backend (Railway / Render)

1. Connect your GitHub repo
2. Set build command: `pnpm install && pnpm turbo build --filter=@mandalorian-chess/api`
3. Set start command: `node apps/api/dist/server.js`
4. Add PostgreSQL and Redis services
5. Set all required environment variables

### Database (Supabase / Railway Postgres)

After provisioning:
```bash
DATABASE_URL=<your-url> npx prisma migrate deploy
```

## Docker Deployment

```bash
# Build and push API image
docker build -f apps/api/Dockerfile -t mandalorian-chess-api .
docker push your-registry/mandalorian-chess-api

# Build and push web image
docker build -f apps/web/Dockerfile \
  --build-arg VITE_API_URL=https://api.yourdomain.com \
  --build-arg VITE_WS_URL=wss://api.yourdomain.com \
  -t mandalorian-chess-web .
docker push your-registry/mandalorian-chess-web
```

## Health Checks

- API: `GET /health` → `{ "status": "ok", "uptime": ... }`
- Web: `GET /` → 200 (nginx serving index.html)
