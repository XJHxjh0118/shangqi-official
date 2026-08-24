# ---- build ----
FROM node:20-alpine AS build-stage

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

ARG BUILD_MODE=production
ARG VITE_API_BASE_URL=/car
ARG VITE_PUBLIC_PATH=/
ARG VITE_ROUTER_HISTORY=hash
ARG VITE_CDN=false
ARG VITE_COMPRESSION=none

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_PUBLIC_PATH=$VITE_PUBLIC_PATH \
    VITE_ROUTER_HISTORY=$VITE_ROUTER_HISTORY \
    VITE_CDN=$VITE_CDN \
    VITE_COMPRESSION=$VITE_COMPRESSION

COPY .npmrc package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN if [ "$BUILD_MODE" = "staging" ] || [ "$BUILD_MODE" = "test" ]; then \
      pnpm build:staging; \
    else \
      pnpm build; \
    fi

# ---- runtime ----
FROM nginx:stable-alpine AS production-stage

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
