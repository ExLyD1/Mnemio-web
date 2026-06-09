# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:22-slim AS build
WORKDIR /app

# Backend URL the production /api/** proxy forwards to. Baked at build time
# (Railway supplies it from the service variable of the same name). Leaving it
# unset falls back to the dev backend, which won't exist in prod — so set it.
ARG NUXT_API_PROXY_TARGET=http://127.0.0.1:3001
ENV NUXT_API_PROXY_TARGET=$NUXT_API_PROXY_TARGET

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Nitro's node-server listens on $PORT (Railway injects it) on host 0.0.0.0.
# .output is fully self-contained — no node_modules needed at runtime.
COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
