# Build stage
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/chess-engine/package.json ./packages/chess-engine/

RUN pnpm install --frozen-lockfile

COPY apps/web ./apps/web
COPY packages/chess-engine ./packages/chess-engine

RUN pnpm --filter @mandalorian-chess/chess-engine build
RUN pnpm --filter @mandalorian-chess/web build

# Serve stage with nginx
FROM nginx:alpine AS runtime
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
