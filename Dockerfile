# -----------------------
# Base
# -----------------------
FROM node:20-bullseye AS base

WORKDIR /app
RUN corepack enable

# -----------------------
# Dependencies
# -----------------------
FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# -----------------------
# Build
# -----------------------
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY .env.production .env

ENV NODE_ENV=production

RUN pnpm prisma generate
RUN pnpm run build

# -----------------------
# Runtime
# -----------------------
FROM node:20-bullseye AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g pm2

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/ecosystem.config.cjs ./ecosystem.config.cjs
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

COPY entrypoint.sh ./entrypoint.sh
EXPOSE 3000
CMD ["./entrypoint.sh"]
