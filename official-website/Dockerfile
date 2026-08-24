# ---- build ----
FROM node:20-alpine AS builder

WORKDIR /app

ARG NUXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NUXT_PUBLIC_API_BASE=http://localhost:3001/api
ARG NUXT_IMAGE_DOMAINS=localhost,127.0.0.1

ENV NUXT_PUBLIC_SITE_URL=$NUXT_PUBLIC_SITE_URL \
    NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE \
    NUXT_IMAGE_DOMAINS=$NUXT_IMAGE_DOMAINS \
    NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000

COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
